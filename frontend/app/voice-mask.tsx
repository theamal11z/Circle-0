import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio as AVAudio } from 'expo-av';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { colors, typography, spacing } from '../constants/theme';
import { Button } from '../components/Button';
import { useStore } from '../store/useStore';

type VoiceMask = 'raw' | 'soft-echo' | 'warm-blur' | 'deep-calm' | 'synthetic-whisper';

interface MaskOption {
    id: VoiceMask;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const maskOptions: MaskOption[] = [
    {
        id: 'raw',
        label: 'Raw',
        description: 'Your natural voice, unfiltered',
        icon: 'mic',
        color: colors.violetGlow,
    },
    {
        id: 'soft-echo',
        label: 'Soft Echo',
        description: 'Gentle reverb for subtle anonymity',
        icon: 'radio-outline',
        color: colors.calmBlue,
    },
    {
        id: 'warm-blur',
        label: 'Warm Blur',
        description: 'Smoothed tones with warmth',
        icon: 'water-outline',
        color: colors.warmOrange,
    },
    {
        id: 'deep-calm',
        label: 'Deep Calm',
        description: 'Lower pitch, calming presence',
        icon: 'moon-outline',
        color: colors.deepIndigo,
    },
    {
        id: 'synthetic-whisper',
        label: 'Synthetic Whisper',
        description: 'Maximum anonymity with AI voice',
        icon: 'shield-checkmark',
        color: colors.violetGlow,
    },
];

export default function VoiceMask() {
    const router = useRouter();
    const { setVoiceMask, completeOnboarding } = useStore();
    const [selectedMask, setSelectedMask] = useState<VoiceMask>('raw');
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const soundRef = useRef<AVAudio.Sound | null>(null);

    const handleMaskSelect = (maskId: VoiceMask) => {
        setSelectedMask(maskId);
        // Clear any previous recording when changing mask
        if (recordedUri) {
            setRecordedUri(null);
        }
    };

    const startRecording = async () => {
        try {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (!status.granted) {
                Alert.alert('Permission required', 'Microphone access is needed to preview your voice.');
                return;
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });

            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const stopRecording = async () => {
        try {
            await audioRecorder.stop();
            const uri = audioRecorder.uri;
            if (uri) {
                setRecordedUri(uri);
            }
            setIsRecording(false);
        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Error', 'Failed to stop recording');
            setIsRecording(false);
        }
    };

    const playPreview = async () => {
        try {
            if (!recordedUri) return;

            // Stop if already playing
            if (isPlaying && soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setIsPlaying(false);
                return;
            }

            // TODO: Apply voice mask filter here based on selectedMask
            // For now, we'll play the raw audio
            // In production, you'd apply audio effects before playback

            const { sound } = await AVAudio.Sound.createAsync({ uri: recordedUri });
            soundRef.current = sound;
            setIsPlaying(true);

            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (!status.isLoaded) return;
                if ((status as any).didJustFinish) {
                    soundRef.current?.unloadAsync();
                    soundRef.current = null;
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error('Error playing preview:', error);
            setIsPlaying(false);
        }
    };

    const handleContinue = async () => {
        setVoiceMask(selectedMask);
        await completeOnboarding();
        router.replace('/circle-matching');
    };

    const handleSkip = async () => {
        setVoiceMask('raw');
        await completeOnboarding();
        router.replace('/circle-matching');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Choose a Voice Mask</Text>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>
                    Optional filters to preserve identity while keeping emotional nuance.
                </Text>

                {/* Mask Options */}
                <View style={styles.masksContainer}>
                    {maskOptions.map((mask) => (
                        <TouchableOpacity
                            key={mask.id}
                            style={[
                                styles.maskCard,
                                selectedMask === mask.id && styles.maskCardSelected,
                            ]}
                            onPress={() => handleMaskSelect(mask.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.maskIcon, { backgroundColor: mask.color + '20' }]}>
                                <Ionicons name={mask.icon} size={32} color={mask.color} />
                            </View>
                            <View style={styles.maskInfo}>
                                <Text style={styles.maskLabel}>{mask.label}</Text>
                                <Text style={styles.maskDescription}>{mask.description}</Text>
                            </View>
                            {selectedMask === mask.id && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.violetGlow} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Preview Section */}
                <View style={styles.previewSection}>
                    <Text style={styles.previewTitle}>Test Your Voice</Text>
                    <Text style={styles.previewDescription}>
                        Record a short message to hear how your selected mask sounds
                    </Text>

                    <View style={styles.previewControls}>
                        <TouchableOpacity
                            style={[
                                styles.recordButton,
                                isRecording && styles.recordButtonActive,
                            ]}
                            onPress={isRecording ? stopRecording : startRecording}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isRecording ? 'stop' : 'mic'}
                                size={32}
                                color={colors.mutedWhite}
                            />
                        </TouchableOpacity>

                        {recordedUri && (
                            <TouchableOpacity
                                style={[styles.playButton, isPlaying && styles.playButtonActive]}
                                onPress={playPreview}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={isPlaying ? 'pause' : 'play'}
                                    size={28}
                                    color={colors.mutedWhite}
                                />
                                <Text style={styles.playButtonText}>
                                    {isPlaying ? 'Stop' : 'Preview'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingText}>Recording...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
                    <Text style={styles.infoText}>
                        Voice masks are applied on your device before upload. You can change this anytime in settings.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button title="Continue" onPress={handleContinue} />
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
    skipText: {
        ...typography.body,
        color: colors.gray,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    description: {
        ...typography.body,
        color: colors.gray,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    masksContainer: {
        marginBottom: spacing.xl,
    },
    maskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    maskCardSelected: {
        borderColor: colors.violetGlow,
        backgroundColor: colors.violetGlow + '10',
    },
    maskIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    maskInfo: {
        flex: 1,
    },
    maskLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.mutedWhite,
        marginBottom: 4,
    },
    maskDescription: {
        ...typography.caption,
        color: colors.gray,
        lineHeight: 18,
    },
    previewSection: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    previewTitle: {
        ...typography.h3,
        color: colors.mutedWhite,
        marginBottom: spacing.xs,
    },
    previewDescription: {
        ...typography.caption,
        color: colors.gray,
        marginBottom: spacing.lg,
    },
    previewControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.violetGlow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButtonActive: {
        backgroundColor: colors.warmOrange,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.calmBlue,
        borderRadius: 12,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    playButtonActive: {
        backgroundColor: colors.warmOrange,
    },
    playButtonText: {
        ...typography.body,
        color: colors.mutedWhite,
        fontWeight: '600',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.warmOrange,
        marginRight: spacing.sm,
    },
    recordingText: {
        ...typography.body,
        color: colors.warmOrange,
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
