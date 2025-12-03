import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../constants/theme';
import { CircularProgress } from '../components/CircularProgress';
import { useStore } from '../store/useStore';

const { height } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();
  const { user, hasCompletedOnboarding, sessionRestored } = useStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait for session restoration before navigating
    if (!sessionRestored) {
      return;
    }

    // Navigate based on user state
    const timer = setTimeout(() => {
      if (user) {
        if (hasCompletedOnboarding) {
          router.replace('/circle-matching');
        } else {
          router.replace('/welcome');
        }
      } else {
        router.replace('/auth-choice');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, hasCompletedOnboarding, sessionRestored]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <CircularProgress size={250} />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Aura</Text>
          <Text style={styles.tagline}>Where voices find solace</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Anonymous • Voice-First • Safe</Text>
        </View>
      </Animated.View>
    </View>
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
  titleContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.violetGlow,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.mutedWhite,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.gray,
    letterSpacing: 1,
  },
});
