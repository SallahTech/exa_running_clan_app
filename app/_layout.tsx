/**
 * Root layout: fonts, providers, and the guard that decides whether a launch
 * lands in the app or in the auth flow.
 */

import {
  Archivo_400Regular,
  Archivo_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/state/AuthProvider';
import { ClanProvider } from '@/state/ClanProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';
import { I18nProvider, useI18n } from '@/i18n';

void SplashScreen.preventAutoHideAsync();

// Signup creates the session before these screens finish, so the guard must not
// redirect away from them. `done` leads into the app itself.
const FINISHES_SIGNED_IN = ['register', 'done', 'reset-password'];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ClanProvider>
              <Remounted />
            </ClanProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

/** A language change rebuilds the screens, so every string is read again. */
function Remounted() {
  const { lang } = useI18n();
  return <Root key={lang} />;
}

function Root() {
  const { session, loading, recovering } = useAuth();
  const { palette, scheme } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (session && recovering && segments[1] !== 'reset-password') {
      router.replace('/(auth)/reset-password');
      return;
    }

    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuth && !FINISHES_SIGNED_IN.includes(segments[1] ?? '')) {
      router.replace('/(tabs)');
    }

    void SplashScreen.hideAsync();
  }, [session, loading, recovering, segments, router]);

  // Tapping a notification goes where it points.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') router.navigate(url as never);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }}>
      {/* Auth screens are always black, so their bar content is always light. */}
      <StatusBar style={segments[0] === '(auth)' ? 'light' : scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.paper },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        {/* Pushed over the tabs — the tab bar is fixed at five in the design. */}
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="compose" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="log-run" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="manage-run" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="add-race" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}
