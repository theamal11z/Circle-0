import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { auth, firestore } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Settings() {
  const router = useRouter();
  const { user, reset, settings, updateSettings } = useStore();

  const handleToggleAnonymous = (value: boolean) => {
    updateSettings({ anonymousMode: value });
  };

  const handleToggleAudioRetention = (value: boolean) => {
    updateSettings({ audioRetention: value });
  };

  const handleSignOut = () => {
    reset();
    router.replace('/' as any);
  };

  const handleReportContent = () => {
    Alert.alert(
      'Report Content',
      'What would you like to report?',
      [
        {
          text: 'Inappropriate Voice Message',
          onPress: () => submitReport('inappropriate_message'),
        },
        {
          text: 'Harassment or Bullying',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Spam or Scam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Other',
          onPress: () => submitReport('other'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (type: string) => {
    try {
      // Submit to Firestore reports collection
      const reportData = {
        reportType: type,
        reportedBy: user?.id || auth.currentUser?.uid || 'anonymous',
        circleId: null, // Could be set if reporting from a specific circle
        messageId: null, // Could be set if reporting a specific message
        createdAt: serverTimestamp(),
        status: 'pending',
        reviewed: false,
      };

      await addDoc(collection(firestore, 'reports'), reportData);

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review your report.'
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleRequestData = () => {
    Alert.alert(
      'Request My Data',
      'We will prepare a copy of your data and send it to you. This may take up to 30 days.',
      [
        {
          text: 'Confirm Request',
          onPress: async () => {
            try {
              // In production, this would create a data export request
              await new Promise(resolve => setTimeout(resolve, 500));
              Alert.alert(
                'Request Received',
                'Your data export request has been submitted. You will be notified when it\'s ready.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to submit request. Please try again.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your voice messages and data will be permanently deleted.',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Type DELETE to confirm account deletion',
      [
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              // In production, this would:
              // 1. Delete user data from Firestore
              // 2. Delete audio files from Storage/RTDB
              // 3. Delete Firebase Auth account
              await reset();
              Alert.alert(
                'Account Deleted',
                'Your account has been permanently deleted.',
                [{ text: 'OK', onPress: () => router.replace('/' as any) }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={24} color={colors.violetGlow} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>{user?.anonymousId?.slice(0, 12) || 'Anonymous'}...</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Anonymous Mode</Text>
                <Text style={styles.settingDescription}>Hide all personal identifiers</Text>
              </View>
              <Switch
                value={settings.anonymousMode}
                onValueChange={handleToggleAnonymous}
                trackColor={{ false: colors.gray, true: colors.violetGlow }}
                thumbColor={colors.mutedWhite}
              />
            </View>

            <View style={[styles.settingRow, styles.borderTop]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Audio Retention</Text>
                <Text style={styles.settingDescription}>Keep voice messages for 30 days</Text>
              </View>
              <Switch
                value={settings.audioRetention}
                onValueChange={handleToggleAudioRetention}
                trackColor={{ false: colors.gray, true: colors.violetGlow }}
                thumbColor={colors.mutedWhite}
              />
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionCard} onPress={handleReportContent}>
            <Ionicons name="flag-outline" size={24} color={colors.warmOrange} />
            <Text style={styles.actionText}>Report Content</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleRequestData}>
            <Ionicons name="document-outline" size={24} color={colors.calmBlue} />
            <Text style={styles.actionText}>Request My Data</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={24} color={colors.warmOrange} />
            <Text style={styles.actionText}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Aura is a safe space for anonymous voice connection. Your privacy is our priority.
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightBlack,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.mutedWhite,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.gray,
  },
  infoValue: {
    ...typography.body,
    color: colors.mutedWhite,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    color: colors.mutedWhite,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.gray,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionText: {
    ...typography.body,
    color: colors.mutedWhite,
    flex: 1,
    marginLeft: spacing.md,
  },
  aboutText: {
    ...typography.body,
    color: colors.gray,
    lineHeight: 22,
  },
  signOutButton: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signOutText: {
    ...typography.body,
    color: colors.warmOrange,
    fontWeight: '600',
  },
});
