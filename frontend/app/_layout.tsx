import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { colors } from '../constants/theme';
import { auth, signInAnonymous } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStore, loadOnboardingStatus, loadUserSession, loadVoiceMask, loadUserSettings } from '../store/useStore';

export default function RootLayout() {
  const { setUser } = useStore();

  React.useEffect(() => {
    // Load saved session and onboarding status
    const initializeApp = async () => {
      await Promise.all([
        loadOnboardingStatus(),
        loadVoiceMask(),
        loadUserSettings(),
      ]);
      const savedUser = await loadUserSession();

      // Set up Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          // Update store with Firebase user if not already set
          if (!savedUser || savedUser.id !== fbUser.uid) {
            setUser({
              id: fbUser.uid,
              anonymousId: fbUser.uid,
              createdAt: new Date().toISOString(),
            });
          }
        } else if (!savedUser) {
          // Only sign in anonymously if no saved session exists
          signInAnonymous().catch(() => { });
        }
      });

      return unsubscribe;
    };

    const unsubscribePromise = initializeApp();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
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
        <Stack.Screen name="voice-mask" />
        <Stack.Screen name="circle-matching" />
        <Stack.Screen name="circle" />
        <Stack.Screen name="voice-chamber" />
        <Stack.Screen name="listen-later" />
        <Stack.Screen name="my-slice" />
        <Stack.Screen name="voting" />
        <Stack.Screen name="end-of-cycle" />
        <Stack.Screen name="report-message" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
