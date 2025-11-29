import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';

export default function Settings() {
  const router = useRouter();
  const { user, reset } = useStore();
  const [audioRetention, setAudioRetention] = React.useState(true);
  const [anonymousMode, setAnonymousMode] = React.useState(true);

  const handleSignOut = () => {
    reset();
    router.replace('/');
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
                value={anonymousMode}
                onValueChange={setAnonymousMode}
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
                value={audioRetention}
                onValueChange={setAudioRetention}
                trackColor={{ false: colors.gray, true: colors.violetGlow }}
                thumbColor={colors.mutedWhite}
              />
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="flag-outline" size={24} color={colors.warmOrange} />
            <Text style={styles.actionText}>Report Content</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="document-outline" size={24} color={colors.calmBlue} />
            <Text style={styles.actionText}>Request My Data</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
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
