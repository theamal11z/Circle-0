import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { useStore } from '../store/useStore';
import { auth, firestore, signInAnonymous } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CircleMatching() {
  const router = useRouter();
  const { user, setCurrentCircle, setLoading } = useStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [statusText, setStatusText] = useState('Finding a balanced group...');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    joinCircle();
  }, []);

  const joinCircle = async () => {
    try {
      setLoading(true);
      setStatusText('Finding a balanced group...');

      // Ensure we're authenticated
      if (!auth.currentUser) {
        await signInAnonymous();
      }

      const uid = auth.currentUser?.uid || user?.id || 'anonymous';
      const circlesRef = collection(firestore, 'circles');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 1: Check if user is already in an active circle
      const userCirclesQuery = query(
        circlesRef,
        where('participants', 'array-contains', uid),
        where('status', '==', 'active')
      );
      const userCirclesSnapshot = await getDocs(userCirclesQuery);

      if (!userCirclesSnapshot.empty) {
        // User already has an active circle
        const docSnap = userCirclesSnapshot.docs[0];
        const circleDoc = { _id: docSnap.id, circleId: docSnap.id, ...(docSnap.data() as any) };
        setCurrentCircle(circleDoc);
        setStatusText('Rejoining your circle...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.replace('/circle' as any);
        return;
      }

      setStatusText('Matching you with voices...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Look for circles that need more participants (less than 7)
      let joinedCircle: any = null;

      try {
        const availableCirclesQuery = query(
          circlesRef,
          where('status', '==', 'active')
        );
        const availableCirclesSnapshot = await getDocs(availableCirclesQuery);

        for (const doc of availableCirclesSnapshot.docs) {
          const circleData = doc.data();
          const participants = circleData.participants || [];

          // Join circles with less than 7 participants
          if (participants.length < 7 && !participants.includes(uid)) {
            // Update the circle with new participant
            const updatedParticipants = [...participants, uid];

            // In production, use a transaction to prevent race conditions
            // For now, we'll just create a new circle if this fails
            joinedCircle = {
              _id: doc.id,
              circleId: doc.id,
              ...circleData,
              participants: updatedParticipants,
            };
            break;
          }
        }
      } catch (err: any) {
        console.warn('Could not list circles (likely permission issue), creating new one:', err);
        // Fallback to creating a new circle if we can't list them
      }

      setStatusText('Creating your circle...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: If no available circle (or permission error), create a new one
      if (!joinedCircle) {
        const newCircleData = {
          circleId: `circle_${Date.now()}`,
          day: 1,
          status: 'active',
          participants: [uid],
          maxParticipants: 7,
          createdAt: serverTimestamp(),
          settings: {
            voiceMaskOptions: ['raw', 'soft-echo', 'warm-blur', 'deep-calm', 'synthetic-whisper'],
          },
        };

        const newDoc = await addDoc(circlesRef, newCircleData);
        joinedCircle = {
          _id: newDoc.id,
          ...newCircleData,
          createdAt: new Date().toISOString(),
        };
      }

      setCurrentCircle(joinedCircle);
      setStatusText('Welcome to your circle!');
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.replace('/circle' as any);
    } catch (error) {
      console.error('Error joining circle:', error);
      setStatusText('Connection error. Retrying...');
      setTimeout(() => {
        router.replace('/circle' as any);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Entering your circle...</Text>
        <CircularProgress size={300} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.mutedWhite,
    marginBottom: spacing.xxl,
  },
  statusText: {
    ...typography.body,
    color: colors.gray,
    marginTop: spacing.xl,
  },
});
