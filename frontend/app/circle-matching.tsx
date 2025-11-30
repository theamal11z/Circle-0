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

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatusText('Matching you with voices...');

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatusText('Creating your circle...');

      // Ensure we're authenticated (required by Firestore rules)
      if (!auth.currentUser) {
        await signInAnonymous();
      }

      const uid = auth.currentUser?.uid || user?.id || 'anonymous';
      const circlesRef = collection(firestore, 'circles');
      const q = query(circlesRef, where('participants', 'array-contains', uid), where('status', '==', 'active'));
      const snapshot = await getDocs(q);

      let circleDoc: any = null;
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        circleDoc = { _id: docSnap.id, circleId: docSnap.id, ...(docSnap.data() as any) };
      } else {
        const newDoc = await addDoc(circlesRef, {
          circleId: '',
          day: 1,
          status: 'active',
          participants: [uid],
          createdAt: serverTimestamp(),
        });
        circleDoc = { _id: newDoc.id, circleId: newDoc.id, day: 1, status: 'active', participants: [uid], createdAt: new Date().toISOString() };
      }

      setCurrentCircle(circleDoc);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/circle');
    } catch (error) {
      console.error('Error joining circle:', error);
      setTimeout(() => {
        router.replace('/circle');
      }, 1000);
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
