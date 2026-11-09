/**
 * Toast — §6 gap 9. The RSVP toggle is optimistic; when the write fails the
 * state rolls back, and a silent rollback is worse than no optimism at all.
 * This is the surface that says so.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '../theme/tokens';
import { Txt } from './Txt';

interface ToastValue {
  show: (message: string, tone?: 'error' | 'info') => void;
}

const ToastContext = createContext<ToastValue>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (text: string, tone: 'error' | 'info' = 'error') => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ text, tone });
      // accessibilityLiveRegion below is Android-only; iOS needs the announcement.
      AccessibilityInfo.announceForAccessibility(text);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished) setMsg(null);
          },
        );
      }, 3200);
    },
    [opacity],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.wrap, { opacity, bottom: insets.bottom + 76 }]}
        >
          <View
            style={[
              styles.toast,
              {
                backgroundColor: msg.tone === 'error' ? brand.accentDeep : '#0b0b0d',
                borderColor: 'rgba(255,255,255,0.22)',
              },
            ]}
          >
            <Txt role="button11" color="#ffffff">
              {msg.text}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'stretch' },
  toast: { paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1 },
});
