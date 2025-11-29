import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { CircularProgress } from '../components/CircularProgress';
import { signInAnonymous } from '../config/firebase';
import { useStore } from '../store/useStore';

export default function AuthChoice() {
  const router = useRouter();
  const { setUser, setLoading } = useStore();
  const [isAnonymousLoading, setIsAnonymousLoading] = React.useState(false);

  const handleAnonymousSignIn = async () => {
    try {
      setIsAnonymousLoading(true);
      setLoading(true);
      
      try {
        const user = await signInAnonymous();
        setUser({
          id: user.uid,
          anonymousId: user.uid,
          createdAt: new Date().toISOString(),
        });
      } catch (firebaseError: any) {
        console.warn('Firebase auth not configured, using local auth:', firebaseError.message);
        // Fallback to local anonymous ID if Firebase auth fails
        const anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setUser({
          id: anonymousId,
          anonymousId: anonymousId,
          createdAt: new Date().toISOString(),
        });
      }
      
      router.replace('/welcome');
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setIsAnonymousLoading(false);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <CircularProgress size={180} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Aura</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to enter your circle
          </Text>

          <View style={styles.optionsContainer}>
            <View style={styles.optionCard}>
              <View style={styles.iconBadge}>
                <Ionicons name="finger-print" size={32} color={colors.violetGlow} />
              </View>
              <Text style={styles.optionTitle}>Anonymous Entry</Text>
              <Text style={styles.optionDescription}>
                No sign up required. Enter completely anonymously and start connecting through voice.
              </Text>
              <Button
                title="Continue Anonymously"
                onPress={handleAnonymousSignIn}
                loading={isAnonymousLoading}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.optionCard}>
              <View style={[styles.iconBadge, { backgroundColor: colors.calmBlue + '20' }]}>
                <Ionicons name="person-add" size={32} color={colors.calmBlue} />
              </View>
              <Text style={styles.optionTitle}>Create Account</Text>
              <Text style={styles.optionDescription}>
                Sign up with email to save your preferences and memories across devices.
              </Text>
              <Button
                title="Sign Up"
                onPress={() => router.push('/signup')}
                variant="secondary"
              />
            </View>

            <View style={styles.signInPrompt}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <Text style={styles.signInLink} onPress={() => router.push('/login')}>
                Sign In
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.mutedWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    marginTop: spacing.lg,
  },
  optionCard: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.violetGlow + '20',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    ...typography.h2,
    color: colors.mutedWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  optionDescription: {
    ...typography.body,
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.darkGray,
  },
  dividerText: {
    ...typography.caption,
    color: colors.gray,
    marginHorizontal: spacing.md,
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signInText: {
    ...typography.body,
    color: colors.gray,
  },
  signInLink: {
    ...typography.body,
    color: colors.violetGlow,
    fontWeight: '600',
  },
});
