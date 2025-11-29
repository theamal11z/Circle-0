import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { signUpWithEmail } from '../config/firebase';
import { useStore } from '../store/useStore';

export default function SignUp() {
  const router = useRouter();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const user = await signUpWithEmail(email, password);
      setUser({
        id: user.uid,
        anonymousId: user.uid,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/welcome') },
      ]);
    } catch (error: any) {
      let errorMessage = 'Sign up failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Aura and start your journey</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={colors.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={colors.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
            <Text style={styles.infoText}>
              Your email is only used for account recovery. Your identity remains anonymous in circles.
            </Text>
          </View>

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
          />

          <View style={styles.signInPrompt}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Text style={styles.signInLink} onPress={() => router.replace('/login')}>
              Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightBlack,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.mutedWhite,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.gray,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.mutedWhite,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.deepIndigo,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.mutedWhite,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.deepIndigo,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.body,
    fontSize: 13,
    color: colors.mutedWhite,
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
