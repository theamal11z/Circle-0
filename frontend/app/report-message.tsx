import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';
import { auth, firestore } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportMessage() {
    const router = useRouter();
    const { messageId, circleId, segmentIndex } = useLocalSearchParams();
    const { user } = useStore();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportReasons = [
        { id: 'inappropriate', label: 'Inappropriate Content', icon: 'warning' as const },
        { id: 'harassment', label: 'Harassment or Bullying', icon: 'alert-circle' as const },
        { id: 'spam', label: 'Spam or Scam', icon: 'ban' as const },
        { id: 'threatening', label: 'Threatening Behavior', icon: 'shield' as const },
        { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
    ];

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert('Select a reason', 'Please select a reason for reporting this message.');
            return;
        }

        try {
            setIsSubmitting(true);

            const reportData = {
                reportType: selectedReason,
                reportedBy: user?.id || auth.currentUser?.uid || 'anonymous',
                circleId: circleId || null,
                messageId: messageId || null,
                segmentIndex: segmentIndex ? parseInt(segmentIndex as string) : null,
                additionalInfo: additionalInfo.trim() || null,
                createdAt: serverTimestamp(),
                status: 'pending',
                reviewed: false,
            };

            await addDoc(collection(firestore, 'reports'), reportData);

            Alert.alert(
                'Report Submitted',
                'Thank you for helping keep our community safe. We will review your report and take appropriate action.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.mutedWhite} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Message</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.calmBlue} />
                    <Text style={styles.infoText}>
                        Your report is anonymous and helps us maintain a safe community. We take all reports seriously.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Why are you reporting this?</Text>

                {reportReasons.map((reason) => (
                    <TouchableOpacity
                        key={reason.id}
                        style={[
                            styles.reasonCard,
                            selectedReason === reason.id && styles.reasonCardSelected,
                        ]}
                        onPress={() => setSelectedReason(reason.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.reasonIcon}>
                            <Ionicons
                                name={reason.icon}
                                size={24}
                                color={selectedReason === reason.id ? colors.violetGlow : colors.gray}
                            />
                        </View>
                        <Text
                            style={[
                                styles.reasonLabel,
                                selectedReason === reason.id && styles.reasonLabelSelected,
                            ]}
                        >
                            {reason.label}
                        </Text>
                        {selectedReason === reason.id && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.violetGlow} />
                        )}
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Additional Information (Optional)</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Provide any additional context..."
                    placeholderTextColor={colors.gray}
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                />
                <Text style={styles.charCount}>{additionalInfo.length}/500</Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title={isSubmitting ? 'Submitting...' : 'Submit Report'}
                    onPress={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
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
    infoBox: {
        flexDirection: 'row',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    infoText: {
        ...typography.body,
        fontSize: 14,
        color: colors.gray,
        flex: 1,
        marginLeft: spacing.sm,
        lineHeight: 20,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.mutedWhite,
        marginBottom: spacing.md,
        marginTop: spacing.lg,
    },
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    reasonCardSelected: {
        borderColor: colors.violetGlow,
        backgroundColor: colors.violetGlow + '10',
    },
    reasonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.midnightBlack,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    reasonLabel: {
        ...typography.body,
        color: colors.gray,
        flex: 1,
    },
    reasonLabelSelected: {
        color: colors.mutedWhite,
        fontWeight: '600',
    },
    textInput: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        color: colors.mutedWhite,
        ...typography.body,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    charCount: {
        ...typography.caption,
        color: colors.gray,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
});
