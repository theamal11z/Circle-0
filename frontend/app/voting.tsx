import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { auth, firestore } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type VoteChoice = 'stay' | 'break' | 'emerge';

interface VoteOption {
    id: VoteChoice;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const voteOptions: VoteOption[] = [
    {
        id: 'stay',
        label: 'Stay',
        description: 'Continue another week together',
        icon: 'refresh-circle',
        color: colors.calmBlue,
    },
    {
        id: 'break',
        label: 'Break',
        description: 'Dissolve the circle',
        icon: 'close-circle',
        color: colors.warmOrange,
    },
    {
        id: 'emerge',
        label: 'Emerge',
        description: 'Select a voice to carry as memory',
        icon: 'star',
        color: colors.violetGlow,
    },
];

export default function Voting() {
    const router = useRouter();
    const { currentCircle, user, messages } = useStore();
    const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
    const [selectedEmergeTarget, setSelectedEmergeTarget] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const day = currentCircle?.day || 7;

    // Get unique authors from messages (excluding current user)
    const otherMembers = messages
        .filter((m) => m.authorId !== user?.id)
        .reduce((acc, m) => {
            if (!acc.find((a) => a.authorId === m.authorId)) {
                acc.push({
                    authorId: m.authorId,
                    segmentIndex: m.segmentIndex,
                    messageCount: messages.filter((msg) => msg.authorId === m.authorId).length,
                });
            }
            return acc;
        }, [] as Array<{ authorId: string; segmentIndex: number; messageCount: number }>);

    const handleVoteSelect = (voteId: VoteChoice) => {
        setSelectedVote(voteId);
        if (voteId !== 'emerge') {
            setSelectedEmergeTarget(null);
        }
    };

    const handleSubmitVote = async () => {
        if (!selectedVote) {
            Alert.alert('No selection', 'Please choose an option before submitting.');
            return;
        }

        if (selectedVote === 'emerge' && !selectedEmergeTarget) {
            Alert.alert('Select a voice', 'Please select which voice you want to carry forward.');
            return;
        }

        try {
            setIsSubmitting(true);

            const voteData = {
                circleId: currentCircle?._id || 'unknown',
                userId: user?.id || auth.currentUser?.uid || 'anonymous',
                choice: selectedVote,
                emergeTarget: selectedEmergeTarget || null,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(firestore, 'votes'), voteData);

            Alert.alert(
                'Vote Submitted',
                'Your vote has been recorded. The circle will close when all members have voted.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/circle' as any),
                    },
                ]
            );
        } catch (error) {
            console.error('Error submitting vote:', error);
            Alert.alert('Error', 'Failed to submit your vote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ritual — Day {day}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleSection}>
                    <Ionicons name="moon" size={64} color={colors.violetGlow} />
                    <Text style={styles.title}>Decide Together</Text>
                    <Text style={styles.subtitle}>
                        Your 7-day circle is coming to an end. Choose how you'd like to close this chapter.
                    </Text>
                </View>

                {/* Vote Options */}
                <View style={styles.optionsContainer}>
                    {voteOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionCard,
                                selectedVote === option.id && styles.optionCardSelected,
                            ]}
                            onPress={() => handleVoteSelect(option.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                                <Ionicons name={option.icon} size={40} color={option.color} />
                            </View>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionLabel}>{option.label}</Text>
                                <Text style={styles.optionDescription}>{option.description}</Text>
                            </View>
                            {selectedVote === option.id && (
                                <Ionicons name="checkmark-circle" size={28} color={option.color} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Emerge Target Selection */}
                {selectedVote === 'emerge' && (
                    <View style={styles.emergeSection}>
                        <Text style={styles.emergeSectionTitle}>Select a Voice to Remember</Text>
                        <Text style={styles.emergeSectionDescription}>
                            Choose which member's voice resonated most with you
                        </Text>

                        <View style={styles.membersContainer}>
                            {otherMembers.map((member, index) => (
                                <TouchableOpacity
                                    key={member.authorId}
                                    style={[
                                        styles.memberCard,
                                        selectedEmergeTarget === member.authorId && styles.memberCardSelected,
                                    ]}
                                    onPress={() => setSelectedEmergeTarget(member.authorId)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.memberIcon}>
                                        <Ionicons name="mic" size={24} color={colors.violetGlow} />
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberLabel}>Voice {member.segmentIndex + 1}</Text>
                                        <Text style={styles.memberMeta}>{member.messageCount} messages</Text>
                                    </View>
                                    {selectedEmergeTarget === member.authorId && (
                                        <Ionicons name="star" size={24} color={colors.violetGlow} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
                    <Text style={styles.infoText}>
                        All members must vote before the circle closes. Your choice is anonymous.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title={isSubmitting ? 'Submitting...' : 'Submit Vote'}
                    onPress={handleSubmitVote}
                    disabled={!selectedVote || isSubmitting}
                />
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
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h1,
        color: colors.mutedWhite,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.body,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 24,
    },
    optionsContainer: {
        marginBottom: spacing.xl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        borderColor: colors.violetGlow,
        backgroundColor: colors.violetGlow + '10',
    },
    optionIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    optionInfo: {
        flex: 1,
    },
    optionLabel: {
        ...typography.h3,
        color: colors.mutedWhite,
        marginBottom: 4,
    },
    optionDescription: {
        ...typography.body,
        fontSize: 14,
        color: colors.gray,
        lineHeight: 20,
    },
    emergeSection: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    emergeSectionTitle: {
        ...typography.h3,
        color: colors.mutedWhite,
        marginBottom: spacing.xs,
    },
    emergeSectionDescription: {
        ...typography.caption,
        color: colors.gray,
        marginBottom: spacing.md,
    },
    membersContainer: {
        marginTop: spacing.sm,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.midnightBlack,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    memberCardSelected: {
        borderColor: colors.violetGlow,
        backgroundColor: colors.violetGlow + '10',
    },
    memberIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.violetGlow + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    memberInfo: {
        flex: 1,
    },
    memberLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.mutedWhite,
    },
    memberMeta: {
        ...typography.caption,
        color: colors.gray,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    infoText: {
        ...typography.caption,
        color: colors.gray,
        flex: 1,
        marginLeft: spacing.sm,
        lineHeight: 18,
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
});
