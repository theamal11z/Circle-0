import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { auth, firestore, database, signInAnonymous } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as dbRef, set as dbSet, get as dbGet, child as dbChild } from 'firebase/database';
import { Audio as AVAudio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { b2Service } from '../services/b2Service';

export default function VoiceChamber() {
  const router = useRouter();
  const { segment } = useLocalSearchParams();
  const { currentCircle, user, messages, addMessage, setMessages } = useStore();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const soundRef = useRef<AVAudio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [micGranted, setMicGranted] = useState<boolean>(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewDurationMs, setPreviewDurationMs] = useState<number>(0);
  const previewSoundRef = useRef<AVAudio.Sound | null>(null);

  const segmentIndex = parseInt(segment as string) || 0;
  const segmentMessages = messages.filter((m) => m.segmentIndex === segmentIndex);
  const isCurrentUser = segmentIndex === 0;

  useEffect(() => {
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setMicGranted(false);
        Alert.alert('Permission required', 'Microphone access is needed to record.');
        return;
      }
      setMicGranted(true);
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (isRecording || stopping) return;

      // Clear any previous preview
      if (previewUri) {
        await discardRecording();
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingStart(Date.now());
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording || stopping) return;
      setStopping(true);

      // Ensure minimum recording duration on Android
      if (recordingStart) {
        const elapsed = Date.now() - recordingStart;
        if (elapsed < 300) {
          await new Promise((r) => setTimeout(r, 300 - elapsed));
        }
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        Alert.alert('Error', 'Recording failed. Please try again.');
        return;
      }

      const durationMs = recordingStart ? Math.max(0, Date.now() - recordingStart) : 0;
      setPreviewUri(uri);
      setPreviewDurationMs(durationMs);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording error', 'Could not stop recording. Please try again.');
    } finally {
      setIsRecording(false);
      setStopping(false);
      setRecordingStart(null);
    }
  };

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const playPreview = async () => {
    try {
      if (!previewUri) return;

      // Stop if already playing
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
        setIsPlayingPreview(false);
        return;
      }

      const { sound } = await AVAudio.Sound.createAsync({ uri: previewUri });
      previewSoundRef.current = sound;
      setIsPlayingPreview(true);

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ((status as any).didJustFinish) {
          previewSoundRef.current?.unloadAsync();
          previewSoundRef.current = null;
          setIsPlayingPreview(false);
        }
      });
    } catch (e) {
      console.error('Preview play error', e);
      setIsPlayingPreview(false);
    }
  };

  const discardRecording = async () => {
    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
      if (previewUri) {
        // Best-effort delete temp file
        try { await FileSystem.deleteAsync(previewUri, { idempotent: true } as any); } catch { }
      }
    } finally {
      setPreviewUri(null);
      setPreviewDurationMs(0);
    }
  };

  const sendRecording = async () => {
    if (!previewUri || !currentCircle) return;

    const maxRetries = 3;
    let retryCount = 0;

    const attemptUpload = async (): Promise<boolean> => {
      try {
        // Ensure authenticated
        if (!auth.currentUser) {
          await signInAnonymous();
        }
        const uid = auth.currentUser?.uid || user?.id || 'anonymous';
        const circleId = currentCircle._id;

        // Create optimistic message for instant UI feedback
        const optimisticMessageId = `temp_${Date.now()}`;
        const optimisticMessage = {
          _id: optimisticMessageId,
          circleId,
          authorId: uid,
          segmentIndex,
          audioUrl: '', // Will be updated
          durationMs: previewDurationMs,
          createdAt: new Date().toISOString(),
          isPending: true,
        };

        // Add optimistic message to store immediately
        addMessage(optimisticMessage as any);

        // Upload to Backblaze B2
        const fileName = `circles/${circleId}/${uid}/${Date.now()}.m4a`;
        const downloadUrl = await b2Service.uploadFileFromUri(previewUri, fileName);

        console.log('Uploaded to B2:', downloadUrl);

        // Create Firestore document
        const docRef = await addDoc(collection(firestore, 'messages'), {
          circleId,
          authorId: uid,
          segmentIndex,
          audioUrl: downloadUrl, // Store the B2 URL
          durationMs: previewDurationMs,
          createdAt: serverTimestamp(),
        });

        // Update the optimistic message with real data
        const realMessage = {
          _id: docRef.id,
          circleId,
          authorId: uid,
          segmentIndex,
          audioUrl: downloadUrl,
          durationMs: previewDurationMs,
          createdAt: new Date().toISOString(),
        };

        // Replace optimistic message with real one
        setMessages(
          messages.map((m) => (m._id === optimisticMessageId ? realMessage : m)) as any
        );

        await discardRecording();
        Alert.alert('Sent', 'Voice message sent!');
        router.back();
        return true;
      } catch (e) {
        console.error(`Upload attempt ${retryCount + 1} failed:`, e);
        return false;
      }
    };

    // Retry logic with exponential backoff
    while (retryCount < maxRetries) {
      const success = await attemptUpload();

      if (success) {
        return;
      }

      retryCount++;

      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, retryCount - 1) * 1000;
        Alert.alert(
          'Upload Failed',
          `Retrying in ${delayMs / 1000} seconds... (Attempt ${retryCount}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // All retries failed
    Alert.alert(
      'Upload Failed',
      'Could not send your recording after multiple attempts. Please check your connection and try again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => sendRecording() },
      ]
    );
  };

  const playMessage = async (audioUrlOrRtdbPath: string) => {
    try {
      // Toggle stop
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }

      let sourceUri: string | null = null;
      if (audioUrlOrRtdbPath.startsWith('http')) {
        // B2 or Legacy storage URL
        sourceUri = audioUrlOrRtdbPath;
      } else {
        // Legacy: Fetch from RTDB, write temp file, and play
        const snap = await dbGet(dbChild(dbRef(database), audioUrlOrRtdbPath));
        if (!snap.exists()) throw new Error('Audio not found');
        const { content } = snap.val() || {};
        if (!content) throw new Error('Invalid audio data');
        const FS: any = FileSystem as any;
        const baseDir = FS.cacheDirectory || FS.documentDirectory || '';
        const tmpPath = `${baseDir}msg-${Date.now()}.m4a`;
        await FileSystem.writeAsStringAsync(tmpPath, content, { encoding: 'base64' });
        sourceUri = tmpPath;
      }

      const { sound } = await AVAudio.Sound.createAsync({ uri: sourceUri! });
      soundRef.current = sound;
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Playback failed:', error);
      Alert.alert('Error', 'Could not play message');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.mutedWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCurrentUser ? 'Your Slice' : `Slice ${segmentIndex + 1}`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        {segmentMessages.length > 0 ? (
          segmentMessages.map((message, index) => (
            <View key={message._id} style={styles.messageWrapper}>
              <TouchableOpacity
                style={styles.messageCard}
                onPress={() => playMessage((message as any).rtdbPath || (message as any).audioUrl)}
                activeOpacity={0.7}
              >
                <View style={styles.waveVisualization}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.wavebar,
                        { height: Math.random() * 40 + 10 },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageDuration}>
                    {Math.floor(message.durationMs / 1000)}s
                  </Text>
                  <Ionicons
                    name={isPlaying ? 'pause-circle' : 'play-circle'}
                    size={32}
                    color={colors.violetGlow}
                  />
                </View>
              </TouchableOpacity>
              {!isCurrentUser && (
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() =>
                    router.push(
                      `/report-message?messageId=${message._id}&circleId=${currentCircle?._id}&segmentIndex=${segmentIndex}` as any
                    )
                  }
                >
                  <Ionicons name="flag-outline" size={16} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="mic-off-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>
              {isCurrentUser
                ? 'No voice messages yet. Hold the button below to record.'
                : 'This member hasn\'t shared anything yet.'}
            </Text>
          </View>
        )}
      </View>

      {/* Recording Controls or Preview */}
      {isCurrentUser && !previewUri && (
        <View style={styles.recordingContainer}>
          <Text style={styles.hint}>
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </Text>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={toggleRecording}
            activeOpacity={0.7}
            disabled={stopping}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={48}
              color={colors.mutedWhite}
            />
          </TouchableOpacity>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                Recording... {recordingStart ? Math.floor((Date.now() - recordingStart) / 1000) : 0}s
              </Text>
            </View>
          )}
        </View>
      )}

      {isCurrentUser && previewUri && (
        <View style={styles.recordingContainer}>
          <Text style={styles.hint}>
            Preview your recording ({Math.floor(previewDurationMs / 1000)}s)
          </Text>
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={[styles.previewBtn, isPlayingPreview && styles.previewBtnActive]}
              onPress={playPreview}
            >
              <Ionicons
                name={isPlayingPreview ? 'pause' : 'play'}
                size={28}
                color={colors.mutedWhite}
              />
              <Text style={styles.previewBtnText}>
                {isPlayingPreview ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.sendBtn]}
              onPress={sendRecording}
            >
              <Ionicons name="send" size={28} color={colors.mutedWhite} />
              <Text style={styles.previewBtnText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.deleteBtn]}
              onPress={discardRecording}
            >
              <Ionicons name="trash" size={28} color={colors.mutedWhite} />
              <Text style={styles.previewBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messageWrapper: {
    marginBottom: spacing.md,
  },
  messageCard: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.md,
  },
  reportButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.midnightBlack,
    borderRadius: 12,
    padding: spacing.xs,
  },
  waveVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: spacing.sm,
  },
  wavebar: {
    width: 3,
    backgroundColor: colors.violetGlow,
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
  },
  emptyText: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 24,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.deepIndigo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  hint: {
    ...typography.caption,
    color: colors.gray,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.violetGlow,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    boxShadow: '0px 4px 8px rgba(143, 0, 255, 0.3)',
  },
  recordButtonActive: {
    backgroundColor: colors.warmOrange,
    transform: [{ scale: 1.1 }],
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  previewControls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  previewBtn: {
    flex: 1,
    backgroundColor: colors.violetGlow,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  previewBtnActive: {
    backgroundColor: colors.calmBlue,
  },
  sendBtn: {
    backgroundColor: colors.calmBlue,
  },
  deleteBtn: {
    backgroundColor: colors.warmOrange,
  },
  previewBtnText: {
    ...typography.caption,
    color: colors.mutedWhite,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});
