import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { useStore, loadOnboardingStatus } from '../store/useStore';
import { signInAnonymous } from '../config/firebase';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding, setUser } = useStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressText, setProgressText] = useState('Connecting you anonymously...');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Load onboarding status
    await loadOnboardingStatus();

    // Simulate connection
    setTimeout(() => {
      setProgressText('Entering your circle...');
    }, 1500);

    // Sign in anonymously
    try {
      const user = await signInAnonymous();
      setUser({
        id: user.uid,
        anonymousId: user.uid,
        createdAt: new Date().toISOString(),
      });

      // Navigate after 3 seconds
      setTimeout(() => {
        if (hasCompletedOnboarding) {
          router.replace('/circle-matching');
        } else {
          router.replace('/welcome');
        }
      }, 3000);
    } catch (error) {
      console.error('Auth error:', error);
      // Navigate anyway for demo purposes
      setTimeout(() => {
        router.replace('/welcome');
      }, 3000);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <CircularProgress size={300} />
        <View style={styles.textContainer}>
          <Text style={styles.connectingText}>{progressText}</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
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
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    width: 300,
  },
  connectingText: {
    ...typography.body,
    color: colors.mutedWhite,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.deepIndigo,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: colors.violetGlow,
  },
});
