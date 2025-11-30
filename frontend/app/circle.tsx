import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { auth, firestore, signInAnonymous } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function Circle() {
  const router = useRouter();
  const { currentCircle, user, messages, setMessages } = useStore();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (currentCircle) {
      loadMessages();
    }
  }, [currentCircle]);

  const loadMessages = async () => {
    try {
      setLoadError(null);
      setLoadingMessages(true);
      if (!currentCircle?._id) return;
      // Ensure authenticated before querying (rules require auth)
      if (!auth.currentUser) {
        await signInAnonymous();
      }
      const messagesRef = collection(firestore, 'messages');
      const q = query(
        messagesRef,
        where('circleId', '==', currentCircle._id),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ _id: d.id, ...(d.data() as any) }));
      setMessages(data as any);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoadError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const segments = Array.from({ length: 7 }, (_, i) => i);
  const day = currentCircle?.day || 3;

  const handleSegmentPress = (index: number) => {
    setActiveSegment(index);
    router.push(`/voice-chamber?segment=${index}`);
  };

  const renderSegment = (index: number, angle: number) => {
    const hasMessages = messages.some((m) => m.segmentIndex === index);
    const isCurrentUser = index === 0; // User is always at segment 0

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.segment,
          {
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -120 },
            ],
          },
        ]}
        onPress={() => handleSegmentPress(index)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.segmentInner,
            { transform: [{ rotate: `${-angle}deg` }] },
            isCurrentUser && styles.currentUserSegment,
          ]}
        >
          {hasMessages ? (
            <Ionicons
              name="mic"
              size={20}
              color={isCurrentUser ? colors.violetGlow : colors.calmBlue}
            />
          ) : (
            <Ionicons
              name="mic-off-outline"
              size={20}
              color={colors.gray}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Circle</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.mutedWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Day Badge */}
        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>Day {day}</Text>
          <Text style={styles.dayLabel}>7 Day Cycle</Text>
        </View>

        {/* Circle Visualization */}
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            {segments.map((index) => {
              const angle = (360 / 7) * index;
              return renderSegment(index, angle);
            })}

            {/* Center content */}
            <View style={styles.centerContent}>
              <Text style={styles.membersCount}>7 Members</Text>
              <View style={styles.waveIndicator}>
                <Ionicons name="radio-outline" size={32} color={colors.violetGlow} />
              </View>
              <Text style={styles.tapHint}>Tap a glowing light to listen</Text>
            </View>
          </View>
        </View>

        {/* Loading / Error */}
        {loadingMessages && (
          <View style={[styles.infoCard, { marginTop: spacing.lg }]}>
            <Ionicons name="refresh" size={20} color={colors.calmBlue} />
            <Text style={styles.infoText}>Loading messages…</Text>
          </View>
        )}
        {!!loadError && (
          <View style={[styles.infoCard, { marginTop: spacing.lg }]}> 
            <Ionicons name="warning-outline" size={20} color={colors.warmOrange} />
            <Text style={styles.infoText}>{loadError}</Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
          <Text style={styles.infoText}>
            Each voice represents a member. Share your thoughts by tapping your segment.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/voice-chamber?segment=0')}
        >
          <Ionicons name="mic" size={24} color={colors.violetGlow} />
          <Text style={styles.actionText}>My Slice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="headset-outline" size={24} color={colors.calmBlue} />
          <Text style={styles.actionText}>Listen Later</Text>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dayBadge: {
    alignSelf: 'center',
    backgroundColor: colors.deepIndigo,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.violetGlow,
  },
  dayNumber: {
    ...typography.h2,
    color: colors.warmOrange,
    textAlign: 'center',
  },
  dayLabel: {
    ...typography.caption,
    color: colors.gray,
    textAlign: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  circle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: colors.violetGlow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    width: 48,
    height: 48,
  },
  segmentInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.deepIndigo,
    borderWidth: 2,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserSegment: {
    borderColor: colors.violetGlow,
    backgroundColor: colors.violetGlow + '30',
  },
  centerContent: {
    alignItems: 'center',
  },
  membersCount: {
    ...typography.body,
    color: colors.mutedWhite,
    marginBottom: spacing.sm,
  },
  waveIndicator: {
    marginVertical: spacing.sm,
  },
  tapHint: {
    ...typography.caption,
    color: colors.gray,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.deepIndigo,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.deepIndigo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    color: colors.mutedWhite,
    marginTop: spacing.xs,
  },
});
