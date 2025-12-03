import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

interface MessageCardProps {
    duration: number;
    isPending?: boolean;
    onPress?: () => void;
}

export function MessageCard({ duration, isPending = false, onPress }: MessageCardProps) {
    return (
        <View style={[styles.container, isPending && styles.pendingContainer]}>
            <View style={styles.waveVisualization}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.wavebar,
                            {
                                height: Math.random() * 40 + 10,
                                backgroundColor: isPending ? colors.gray : colors.violetGlow,
                            },
                        ]}
                    />
                ))}
            </View>
            <View style={styles.messageInfo}>
                <Text style={[styles.messageDuration, isPending && styles.pendingText]}>
                    {Math.floor(duration / 1000)}s
                </Text>
                {isPending ? (
                    <ActivityIndicator size="small" color={colors.gray} />
                ) : (
                    <Ionicons name="play-circle" size={32} color={colors.violetGlow} />
                )}
            </View>
            {isPending && (
                <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Uploading...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.md,
        position: 'relative',
    },
    pendingContainer: {
        opacity: 0.6,
        borderWidth: 1,
        borderColor: colors.gray,
        borderStyle: 'dashed',
    },
    waveVisualization: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        marginBottom: spacing.sm,
    },
    wavebar: {
        width: 3,
        borderRadius: 2,
    },
    messageInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageDuration: {
        ...typography.body,
        color: colors.mutedWhite,
    },
    pendingText: {
        color: colors.gray,
    },
    pendingBadge: {
        position: 'absolute',
        top: spacing.xs,
        right: spacing.xs,
        backgroundColor: colors.midnightBlack,
        borderRadius: 8,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
    },
    pendingBadgeText: {
        ...typography.caption,
        fontSize: 10,
        color: colors.gray,
    },
});
