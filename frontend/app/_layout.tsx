import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { colors } from '../constants/theme';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStore, loadOnboardingStatus } from '../store/useStore';

export default function RootLayout() {
  const { setUser } = useStore();

  React.useEffect(() => {
    loadOnboardingStatus();
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          anonymousId: fbUser.uid,
          createdAt: new Date().toISOString(),
        });
      }
    });
    return unsubscribe;
  }, [setUser]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.midnightBlack },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="auth-choice" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="how-it-works" />
        <Stack.Screen name="circle-matching" />
        <Stack.Screen name="circle" />
        <Stack.Screen name="voice-chamber" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
