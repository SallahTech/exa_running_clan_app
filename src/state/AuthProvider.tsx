/**
 * Auth session. Wraps supabase-js so screens deal in `signIn` / `register`
 * rather than in tokens, and so the routing guard in app/_layout.tsx has one
 * boolean to switch on.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { isConfigured, supabase } from '../data/supabase';
import type { PaceGroup } from '../data/types';
import * as Linking from 'expo-linking';
import { unregisterFromPush } from '../data/notifications';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  paceGroup: PaceGroup;
  days: { wed: boolean; sun: boolean };
}

interface AuthValue {
  /** Signed in from a password reset link; must choose a new password. */
  recovering: boolean;
  finishRecovery: () => void;
  session: Session | null;
  /** True until the persisted session has been read back from storage. */
  loading: boolean;
  /** False when EXPO_PUBLIC_SUPABASE_* are unset — the app shows setup help. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  // Links in confirmation and reset emails come back carrying the session.
  useEffect(() => {
    if (!isConfigured) return;

    const consume = (url: string | null) => {
      const hash = url?.split('#')[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const access = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (!access || !refresh) return;
      if (params.get('type') === 'recovery') setRecovering(true);
      void supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    };

    void Linking.getInitialURL().then(consume);
    const sub = Linking.addEventListener('url', ({ url }) => consume(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const days = (['wed', 'sun'] as const).filter((d) => input.days[d]);

    // full_name, pace_group and default_days ride in on the signup metadata; the
    // on_auth_user_created trigger reads them straight into the member row, so a
    // new member never exists without a roster entry.
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo: Linking.createURL('/'),
        data: {
          full_name: input.fullName.trim(),
          pace_group: input.paceGroup,
          default_days: days,
        },
      },
    });
    if (error) throw new Error(error.message);

    // With email confirmation on, there is no session until the link is tapped.
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await unregisterFromPush();
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/reset-password'),
    });
    if (error) throw new Error(error.message);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      configured: isConfigured,
      signIn,
      register,
      signOut,
      resetPassword,
      recovering,
      finishRecovery: () => setRecovering(false),
    }),
    [session, loading, recovering, signIn, register, signOut, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
