import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'people-circle-outline' as const,
    color: colors.violetGlow,
    title: '7-day circles',
    description: 'Temporary, time-bounded groups for honest sharing.',
  },
  {
    icon: 'mic-outline' as const,
    color: colors.calmBlue,
    title: 'Voice first',
    description: 'No text, no images, no names — only voice.',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    color: colors.warmOrange,
    title: 'Closure ritual',
    description: 'Week ends with Stay / Break / Emerge vote.',
  },
];

export default function HowItWorks() {
  const router = useRouter();
  const { completeOnboarding } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/circle-matching');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.skipText} onPress={handleContinue}>
        Skip
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>How it works</Text>

        {slides.map((slide, index) => (
          <View key={index} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: slide.color + '20' }]}>
              <Ionicons name={slide.icon} size={48} color={slide.color} />
            </View>
            <Text style={styles.cardTitle}>{slide.title}</Text>
            <Text style={styles.cardDescription}>{slide.description}</Text>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={colors.calmBlue} />
          <Text style={styles.infoText}>
            Your voice is your identity. Share authentically in a safe, anonymous space.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
        <Button title="Get Started" onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightBlack,
  },
  skipText: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'right',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    ...typography.h1,
    color: colors.mutedWhite,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.mutedWhite,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardDescription: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.deepIndigo,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  infoText: {
    ...typography.body,
    fontSize: 14,
    color: colors.mutedWhite,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.violetGlow,
    width: 24,
  },
  inactiveDot: {
    backgroundColor: colors.gray,
  },
});
