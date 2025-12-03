import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

interface UploadRetryBannerProps {
    retryCount: number;
    maxRetries: number;
    onRetry: () => void;
    onCancel: () => void;
}

export function UploadRetryBanner({ retryCount, maxRetries, onRetry, onCancel }: UploadRetryBannerProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.warmOrange} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Upload Failed</Text>
                    <Text style={styles.message}>
                        Retrying... (Attempt {retryCount}/{maxRetries})
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.button} onPress={onCancel}>
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={onRetry}>
                    <Text style={[styles.buttonText, styles.retryButtonText]}>Retry Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.warmOrange,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    textContainer: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    title: {
        ...typography.body,
        fontWeight: '600',
        color: colors.mutedWhite,
        marginBottom: 2,
    },
    message: {
        ...typography.caption,
        color: colors.gray,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    button: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    retryButton: {
        backgroundColor: colors.violetGlow,
    },
    buttonText: {
        ...typography.caption,
        color: colors.gray,
        fontWeight: '600',
    },
    retryButtonText: {
        color: colors.mutedWhite,
    },
});
