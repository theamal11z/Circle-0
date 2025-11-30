import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { CircularProgress } from '../components/CircularProgress';
import { useStore } from '../store/useStore';

export default function Welcome() {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  const handleContinue = async () => {
    await completeOnboarding();
    router.push('/how-it-works');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.push('/circle-matching');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <CircularProgress size={200} />
          <View style={styles.iconOverlay}>
            <Ionicons name="person-outline" size={48} color={colors.violetGlow} />
            <View style={styles.waveContainer}>
              <Ionicons name="radio-outline" size={24} color={colors.calmBlue} />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Aura</Text>
          <Text style={styles.subtitle}>
            Discover a safe space to share, listen, and connect through the power of your voice.
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureBadge}>
                <Ionicons name="mic-outline" size={24} color={colors.violetGlow} />
              </View>
              <Text style={styles.featureText}>Voice-first connection</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureBadge}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.calmBlue} />
              </View>
              <Text style={styles.featureText}>Completely anonymous</Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureBadge}>
                <Ionicons name="time-outline" size={24} color={colors.warmOrange} />
              </View>
              <Text style={styles.featureText}>7-day circles</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} />
        <Text style={styles.skipText} onPress={handleSkip}>
          Skip
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightBlack,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.xxl * 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    marginTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.mutedWhite,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginTop: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.deepIndigo,
    padding: spacing.md,
    borderRadius: 12,
  },
  featureBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    color: colors.mutedWhite,
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skipText: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
