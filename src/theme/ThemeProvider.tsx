/**
 * Theme context. Both skins exist, but the app opens dark regardless of the device:
 * the black auth flow should run straight on into it. Members can pick Light or
 * System from Settings.
 *
 * The choice is persisted: an appearance setting that resets on every launch
 * reads as a bug. It is stored locally rather than on the member row because it
 * is a property of this device, not of the person — the same member may well
 * want dark on a phone and light on a tablet.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type Palette, type Scheme } from './tokens';

export type Preference = Scheme | 'system';

const STORAGE_KEY = 'exaclan.appearance';

export const APPEARANCE_OPTIONS: { value: Preference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

interface ThemeValue {
  palette: Palette;
  scheme: Scheme;
  preference: Preference;
  setPreference: (p: Preference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function isPreference(v: string | null): v is Preference {
  return v === 'system' || v === 'light' || v === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<Preference>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => undefined);
  }, []);

  const setPreference = useCallback((next: Preference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme: Scheme =
      preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

    return { palette: palettes[scheme], scheme, preference, setPreference };
  }, [preference, system, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Shorthand for the common case — most components only need the colours. */
export function usePalette(): Palette {
  return useTheme().palette;
}
