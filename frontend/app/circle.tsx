import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { auth, firestore, signInAnonymous } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BreathingWave } from '../components/BreathingWave';

export default function Circle() {
  const router = useRouter();
  const { currentCircle, user, messages, setMessages } = useStore();
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentCircle?._id) return;

    // Set up real-time listener for messages
    const setupMessageListener = async () => {
      try {
        setLoadError(null);
        setLoadingMessages(true);

        // Ensure authenticated before querying
        if (!auth.currentUser) {
          await signInAnonymous();
        }

        const messagesRef = collection(firestore, 'messages');
        const q = query(
          messagesRef,
          where('circleId', '==', currentCircle._id),
          orderBy('createdAt', 'asc')
        );

        // Real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((d) => ({ _id: d.id, ...(d.data() as any) }));
            setMessages(data as any);
            setLoadingMessages(false);
          },
          (error) => {
            console.error('Error in message listener:', error);
            setLoadError('Failed to sync messages');
            setLoadingMessages(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up message listener:', error);
        setLoadError('Failed to load messages');
        setLoadingMessages(false);
      }
    };

    const unsubscribePromise = setupMessageListener();

    // Cleanup listener on unmount
    return () => {
      unsubscribePromise.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [currentCircle?._id]);

  const segments = Array.from({ length: 7 }, (_, i) => i);
  const day = currentCircle?.day || 3;
  const isAlone = (currentCircle?.participants?.length || 0) <= 1;

  const handleSegmentPress = (index: number) => {
    setActiveSegment(index);
    router.push(`/voice-chamber?segment=${index}` as any);
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

  const dailyPrompts = [
    "What's one thing you're grateful for today?",
    "Describe a moment that made you smile recently.",
    "What's a challenge you overcame this week?",
    "Share a memory that brings you peace.",
    "What does 'home' feel like to you?",
    "If you could send a message to your younger self, what would it be?",
    "What are you looking forward to tomorrow?",
  ];

  const currentPrompt = dailyPrompts[(day - 1) % dailyPrompts.length];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Circle</Text>
        <TouchableOpacity onPress={() => router.push('/settings' as any)}>
          <Ionicons name="settings-outline" size={24} color={colors.mutedWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Day Badge */}
        <View style={styles.dayBadge}>
          <Text style={styles.dayNumber}>Day {day}</Text>
          <Text style={styles.dayLabel}>7 Day Cycle</Text>
        </View>

        {/* Daily Reflection Prompt */}
        <View style={styles.promptContainer}>
          <Text style={styles.promptLabel}>Daily Reflection</Text>
          <Text style={styles.promptText}>"{currentPrompt}"</Text>
        </View>

        {/* Circle Visualization */}
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            {segments.map((index) => {
              const angle = (360 / 7) * index;
              return renderSegment(index, angle);
            })}

            {/* Center content with breathing wave */}
            <View style={styles.centerContent}>
              <BreathingWave size={80} />
              <Text style={styles.membersCount}>{currentCircle?.participants?.length || 1} / 7 Members</Text>
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
          <Ionicons name="information-circle-outline" size={24} color={colors.calmBlue} />
          <Text style={styles.infoText}>
            {isAlone
              ? "Waiting for others to join. You'll be notified when your circle grows."
              : "New voices have joined. Listen to their stories and share your own."}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {day === 7 ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.votingButton]}
            onPress={() => router.push('/voting' as any)}
          >
            <Ionicons name="checkmark-circle" size={28} color={colors.mutedWhite} />
            <Text style={[styles.actionText, styles.votingText]}>Vote Now</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/my-slice' as any)}
            >
              <Ionicons name="time-outline" size={24} color={colors.mutedWhite} />
              <Text style={styles.actionText}>My Slice</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/listen-later' as any)}
            >
              <Ionicons name="bookmarks-outline" size={24} color={colors.mutedWhite} />
              <Text style={styles.actionText}>Listen Later</Text>
            </TouchableOpacity>
          </>
        )}
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
    paddingBottom: 100,
  },
  dayBadge: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  dayNumber: {
    ...typography.h1,
    color: colors.violetGlow,
    fontSize: 36,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  promptContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.deepIndigo + '80', // Semi-transparent
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.calmBlue,
  },
  promptLabel: {
    ...typography.caption,
    color: colors.calmBlue,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  promptText: {
    ...typography.body,
    color: colors.mutedWhite,
    fontStyle: 'italic',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 400,
    marginTop: spacing.md,
  },
  circle: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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
    marginHorizontal: spacing.lg,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.deepIndigo,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.midnightBlack,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...typography.caption,
    color: colors.mutedWhite,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.gray,
    opacity: 0.3,
    marginVertical: 8,
  },
  votingButton: {
    backgroundColor: colors.violetGlow,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  votingText: {
    ...typography.h3,
    color: colors.mutedWhite,
    marginTop: 0,
  },
});
