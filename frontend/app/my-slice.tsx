import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { MessageCard } from '../components/MessageCard';

export default function MySlice() {
    const router = useRouter();
    const { user, messages, currentCircle } = useStore();
    const [myMessages, setMyMessages] = useState<any[]>([]);

    useEffect(() => {
        if (user && messages) {
            const filtered = messages
                .filter(m => m.authorId === user.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setMyMessages(filtered);
        }
    }, [user, messages]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Slice</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Stats Summary */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{myMessages.length}</Text>
                        <Text style={styles.statLabel}>Contributions</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{currentCircle?.day || 1}</Text>
                        <Text style={styles.statLabel}>Days Active</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Your Timeline</Text>

                {myMessages.length > 0 ? (
                    <View style={styles.timeline}>
                        {myMessages.map((msg, index) => (
                            <View key={msg._id} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <Text style={styles.dateText}>{formatDate(msg.createdAt)}</Text>
                                    <View style={styles.line} />
                                </View>
                                <View style={styles.timelineContent}>
                                    <MessageCard
                                        duration={msg.durationMs}
                                        isPending={msg.isPending}
                                        onPress={() => { }} // Playback handled in voice chamber for now
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="mic-outline" size={48} color={colors.gray} />
                        <Text style={styles.emptyText}>No contributions yet.</Text>
                        <Text style={styles.emptySubtext}>Share your voice to start your timeline.</Text>
                    </View>
                )}
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    statBox: {
        flex: 1,
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    statNumber: {
        ...typography.h1,
        color: colors.violetGlow,
        fontSize: 32,
    },
    statLabel: {
        ...typography.caption,
        color: colors.gray,
        marginTop: spacing.xs,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.mutedWhite,
        marginBottom: spacing.lg,
    },
    timeline: {
        paddingBottom: spacing.xl,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    timelineLeft: {
        width: 80,
        alignItems: 'center',
        marginRight: spacing.md,
    },
    dateText: {
        ...typography.caption,
        color: colors.gray,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: colors.deepIndigo,
        marginTop: spacing.xs,
    },
    timelineContent: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        ...typography.h3,
        color: colors.mutedWhite,
        marginTop: spacing.md,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.gray,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
});
