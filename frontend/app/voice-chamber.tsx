import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { colors, typography, spacing } from '../constants/theme';
import { useStore } from '../store/useStore';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function VoiceChamber() {
  const router = useRouter();
  const { segment } = useLocalSearchParams();
  const { currentCircle, user, messages } = useStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const segmentIndex = parseInt(segment as string) || 0;
  const segmentMessages = messages.filter((m) => m.segmentIndex === segmentIndex);
  const isCurrentUser = segmentIndex === 0;

  useEffect(() => {
    setupAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Here we would upload to Firebase Storage
        // For now, just show success
        Alert.alert('Success', 'Voice message recorded!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playMessage = async (messageId: string) => {
    try {
      if (isPlaying) {
        await sound?.stopAsync();
        setIsPlaying(false);
        return;
      }

      // Load and play audio
      // For demo purposes, we'll just show playing state
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 3000);
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
              onPress={() => playMessage(message._id)}
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
              isRecording && styles.recordButtonActive,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.9}
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
    shadowColor: colors.violetGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
