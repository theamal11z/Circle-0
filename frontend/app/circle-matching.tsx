import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { colors, typography, spacing } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { useStore } from '../store/useStore';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

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

      // Call backend to join/create circle
      const response = await fetch(`${BACKEND_URL}/api/circles/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
        }),
      });

      const circle = await response.json();
      setCurrentCircle(circle);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.replace('/circle');
    } catch (error) {
      console.error('Error joining circle:', error);
      // Continue to circle anyway for demo
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
