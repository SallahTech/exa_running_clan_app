/**
 * Supabase client.
 *
 * Session storage: SecureStore on device (tokens are credentials, and
 * AsyncStorage is plain text on disk), AsyncStorage on web where SecureStore
 * has no implementation. SecureStore rejects values over 2048 bytes, so the
 * session is chunked.
 *
 * Configure with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY —
 * see .env.example. The anon key is safe to ship; every table is behind RLS.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** False until the project is pointed at a Supabase instance. */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const CHUNK = 1800;

/** SecureStore caps values at 2048 bytes; a Supabase session exceeds that. */
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(`${key}.0`);
    if (head === null) return null;

    let out = head;
    for (let i = 1; ; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) break;
      out += part;
    }
    return out;
  },

  async setItem(key: string, value: string): Promise<void> {
    await secureStorage.removeItem(key);
    for (let i = 0; i * CHUNK < value.length; i += 1) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
  },

  async removeItem(key: string): Promise<void> {
    for (let i = 0; ; i += 1) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part === null) break;
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  },
};

const storage = Platform.OS === 'web' ? AsyncStorage : secureStorage;

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'anon-key-not-set',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      // No URL to parse in a native app; on web expo-router owns the URL.
      detectSessionInUrl: false,
    },
  },
);

// Refresh tokens only while the app is in front — a background timer on a phone
// wakes the radio for nothing.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
