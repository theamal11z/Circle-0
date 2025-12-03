import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio as AVAudio } from 'expo-av';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { database } from '../config/firebase';
import { ref as dbRef, get as dbGet, child as dbChild } from 'firebase/database';
import * as FileSystem from 'expo-file-system';

export default function ListenLater() {
    const router = useRouter();
    const { messages, user } = useStore();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const soundRef = useRef<AVAudio.Sound | null>(null);

    // Filter messages to show only other members' messages
    const otherMessages = messages.filter((m) => m.authorId !== user?.id);

    const playMessage = async (message: any) => {
        try {
            // Toggle stop if already playing this message
            if (playingId === message._id && soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setPlayingId(null);
                return;
            }

            // Stop any currently playing sound
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            let sourceUri: string | null = null;
            const audioPath = message.rtdbPath || message.audioUrl;

            if (audioPath?.startsWith('http')) {
                sourceUri = audioPath;
            } else if (audioPath) {
                // Fetch from RTDB
                const snap = await dbGet(dbChild(dbRef(database), audioPath));
                if (!snap.exists()) throw new Error('Audio not found');
                const { content } = snap.val() || {};
                if (!content) throw new Error('Invalid audio data');

                const FS: any = FileSystem as any;
                const baseDir = FS.cacheDirectory || FS.documentDirectory || '';
                const tmpPath = `${baseDir}msg-${Date.now()}.m4a`;
                await FileSystem.writeAsStringAsync(tmpPath, content, { encoding: 'base64' as any });
                sourceUri = tmpPath;
            }

            if (!sourceUri) {
                Alert.alert('Error', 'Could not load audio');
                return;
            }

            const { sound } = await AVAudio.Sound.createAsync({ uri: sourceUri });
            soundRef.current = sound;
            setPlayingId(message._id);

            await sound.playAsync();

            sound.setOnPlaybackStatusUpdate((status) => {
                if (!status.isLoaded) return;
                if ((status as any).didJustFinish) {
                    setPlayingId(null);
                    soundRef.current?.unloadAsync();
                    soundRef.current = null;
                }
            });
        } catch (error) {
            console.error('Error playing message:', error);
            Alert.alert('Playback Error', 'Could not play this message');
            setPlayingId(null);
        }
    };

    // Group messages by segment
    const messagesBySegment = otherMessages.reduce((acc, msg) => {
        const key = msg.segmentIndex;
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
    }, {} as Record<number, typeof otherMessages>);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Listen Later</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {otherMessages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="headset-outline" size={64} color={colors.gray} />
                        <Text style={styles.emptyText}>
                            No messages to listen to yet. Check back when your circle members share their voices.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>
                            {otherMessages.length} {otherMessages.length === 1 ? 'Message' : 'Messages'}
                        </Text>

                        {Object.entries(messagesBySegment)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([segmentIndex, msgs]) => (
                                <View key={segmentIndex} style={styles.segmentSection}>
                                    <View style={styles.segmentHeader}>
                                        <Ionicons name="mic" size={20} color={colors.violetGlow} />
                                        <Text style={styles.segmentTitle}>Voice {parseInt(segmentIndex) + 1}</Text>
                                        <Text style={styles.segmentCount}>{msgs.length}</Text>
                                    </View>

                                    {msgs.map((message) => (
                                        <TouchableOpacity
                                            key={message._id}
                                            style={styles.messageCard}
                                            onPress={() => playMessage(message)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.waveVisualization}>
                                                {Array.from({ length: 16 }).map((_, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.wavebar,
                                                            {
                                                                height: Math.random() * 30 + 10,
                                                                backgroundColor:
                                                                    playingId === message._id ? colors.warmOrange : colors.violetGlow,
                                                            },
                                                        ]}
                                                    />
                                                ))}
                                            </View>

                                            <View style={styles.messageInfo}>
                                                <Text style={styles.messageDuration}>
                                                    {Math.floor(message.durationMs / 1000)}s
                                                </Text>
                                                <Ionicons
                                                    name={playingId === message._id ? 'pause-circle' : 'play-circle'}
                                                    size={32}
                                                    color={playingId === message._id ? colors.warmOrange : colors.violetGlow}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                    </>
                )}

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.calmBlue} />
                    <Text style={styles.infoText}>
                        Messages are organized by voice. Tap any message to play it.
                    </Text>
                </View>
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
    sectionTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.gray,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        fontSize: 12,
    },
    segmentSection: {
        marginBottom: spacing.lg,
    },
    segmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.sm,
        marginBottom: spacing.sm,
    },
    segmentTitle: {
        ...typography.body,
        fontWeight: '600',
        color: colors.mutedWhite,
        marginLeft: spacing.sm,
        flex: 1,
    },
    segmentCount: {
        ...typography.caption,
        color: colors.gray,
        backgroundColor: colors.midnightBlack,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 8,
    },
    messageCard: {
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
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
        color: colors.gray,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xxl * 2,
    },
    emptyText: {
        ...typography.body,
        color: colors.gray,
        textAlign: 'center',
        marginTop: spacing.lg,
        lineHeight: 24,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: colors.deepIndigo,
        borderRadius: 12,
        padding: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    infoText: {
        ...typography.caption,
        color: colors.gray,
        flex: 1,
        marginLeft: spacing.sm,
        lineHeight: 18,
    },
});
