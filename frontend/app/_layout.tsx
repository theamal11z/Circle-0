import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';

export default function RootLayout() {
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
