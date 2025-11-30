import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';
import { auth, storage, firestore, signInAnonymous } from '../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Audio as AVAudio } from 'expo-av';

export default function VoiceChamber() {
  const router = useRouter();
  const { segment } = useLocalSearchParams();
  const { currentCircle, user, messages, addMessage } = useStore();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const soundRef = useRef<AVAudio.Sound | null>(null);

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
        Alert.alert('Permission required', 'Microphone access is needed to record.');
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordingStart(Date.now());
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
        const durationMs = recordingStart ? Math.max(0, Date.now() - recordingStart) : 0;
        // Ensure authenticated
        if (!auth.currentUser) {
          await signInAnonymous();
        }
        const uid = auth.currentUser?.uid || user?.id || 'anonymous';
        const circleId = currentCircle?._id || 'unknown';

        // Convert file uri to Blob
        const res = await fetch(uri);
        const blob = await res.blob();

        // Upload to Firebase Storage
        const path = `circles/${circleId}/${uid}/${Date.now()}.m4a`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, blob, { contentType: 'audio/m4a' });
        const downloadUrl = await getDownloadURL(fileRef);

        // Write message metadata to Firestore
        const docRef = await addDoc(collection(firestore, 'messages'), {
          circleId,
          authorId: uid,
          segmentIndex,
          audioUrl: downloadUrl,
          durationMs,
          createdAt: serverTimestamp(),
        });

        // Optimistic update
        addMessage({
          _id: docRef.id,
          circleId,
          authorId: uid,
          segmentIndex,
          audioUrl: downloadUrl,
          durationMs,
          createdAt: new Date().toISOString(),
        } as any);

        Alert.alert('Success', 'Voice message sent!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playMessage = async (audioUrl: string) => {
    try {
      // Toggle stop
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }

      // Load and play
      const { sound } = await AVAudio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ((status as any).didJustFinish) {
          setIsPlaying(false);
          soundRef.current?.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Error playing message:', error);
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
            <TouchableOpacity
              key={message._id}
              style={styles.messageCard}
              onPress={() => playMessage(message.audioUrl)}
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

      {/* Recording Controls */}
      {isCurrentUser && (
        <View style={styles.recordingContainer}>
          <Text style={styles.hint}>
            Hold to speak • Release to send • Swipe down to cancel
          </Text>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recorderState.isRecording && styles.recordButtonActive,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.9}
          >
            <Ionicons
              name={recorderState.isRecording ? 'stop' : 'mic'}
              size={48}
              color={colors.mutedWhite}
            />
          </TouchableOpacity>
          {recorderState.isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}
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
  messageCard: {
    backgroundColor: colors.deepIndigo,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
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
});
