/**
 * Language. English and Turkish, following the phone unless the member picks one
 * in Settings. `t` is a plain function so it works in the store and in formatting
 * as well as in components; RootLayout remounts the screens when the language
 * changes, so nothing has to subscribe.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { en } from './en';
import { tr } from './tr';

export type Lang = 'en' | 'tr';
export type LanguagePreference = 'system' | Lang;
export type TKey = keyof typeof en;

const STORAGE_KEY = 'exaclan.language';

const deviceLanguage = (): Lang => (getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en');

let current: Lang = deviceLanguage();

export const language = (): Lang => current;
export const intlLocale = (): string => (current === 'tr' ? 'tr-TR' : 'en-GB');

export function t(key: TKey, vars?: Record<string, string | number>): string {
  const template = (current === 'tr' ? tr : en)[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
}

/** Turkish has a dotted capital İ, which plain uppercasing gets wrong. */
export const upper = (s: string): string => s.toLocaleUpperCase(intlLocale());
export const lower = (s: string): string => s.toLocaleLowerCase(intlLocale());

interface I18nValue {
  lang: Lang;
  preference: LanguagePreference;
  setPreference: (p: LanguagePreference) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'tr' || stored === 'system') setPreferenceState(stored);
      })
      .catch(() => undefined);
  }, []);

  const setPreference = useCallback((next: LanguagePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const lang: Lang = preference === 'system' ? deviceLanguage() : preference;
  current = lang;

  const value = useMemo(() => ({ lang, preference, setPreference }), [lang, preference, setPreference]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
