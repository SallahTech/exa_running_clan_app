/**
 * Auth stack. These four screens are always black with clan red — the logo's own
 * palette — regardless of the device's appearance setting, so the theme provider
 * is deliberately not consulted here.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="register" />
      <Stack.Screen name="done" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
