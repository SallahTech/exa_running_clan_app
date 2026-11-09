/**
 * Run-detail bottom sheet — 80% of screen height, a 46×4px grab
 * handle and a scrim. Dismisses on scrim tap, handle tap, drag-down or the
 * hardware back gesture.
 *
 * Motion is exactly as specified: translateY 104%→0 over 360ms
 * cubic-bezier(.2,.85,.25,1), with the scrim fading over 300ms.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { useReducedMotion } from './useReducedMotion';
import { t as translate } from '../i18n';

/** cubic-bezier(.2,.85,.25,1) */
const SHEET_EASING = Easing.bezier(0.2, 0.85, 0.25, 1);

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sticky footer — the RSVP button. Sits outside the scroll area. */
  footer?: React.ReactNode;
  accessibilityLabel?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  footer,
  accessibilityLabel,
}: BottomSheetProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const height = Math.round(Dimensions.get('window').height * 0.8);

  // 0 = fully open, 1 = fully hidden (104% of the sheet's own height)
  const t = useRef(new Animated.Value(1)).current;
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: open ? 0 : 1,
      duration: reduced ? 0 : open ? motion.sheet : motion.scrim,
      easing: SHEET_EASING,
      useNativeDriver: true,
    }).start();
  }, [open, t, reduced]);

  // Back gesture / hardware back closes the sheet rather than leaving the tab.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) drag.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        // A short flick or a quarter-sheet drag dismisses; anything less springs back.
        if (g.dy > height * 0.25 || g.vy > 0.8) {
          // Carry the dragged distance into the close animation, so the sheet
          // continues down from the finger instead of jumping back up first.
          t.setValue(Math.min(1, g.dy / (height * 1.04)));
          drag.setValue(0);
          onClose();
        } else {
          Animated.timing(drag, {
            toValue: 0,
            duration: 180,
            easing: SHEET_EASING,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const translateY = Animated.add(
    t.interpolate({ inputRange: [0, 1], outputRange: [0, height * 1.04] }),
    drag,
  );

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityViewIsModal={open}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: p.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={translate('common.dismiss')}
        />
      </Animated.View>

      <Animated.View
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.sheet,
          { height, backgroundColor: p.sheet, transform: [{ translateY }] },
        ]}
      >
        <View {...pan.panHandlers}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={translate('common.close')}
            style={styles.handleArea}
          >
            <View style={[styles.handle, { backgroundColor: p.raised }]} />
          </Pressable>
        </View>

        <View style={styles.body}>{children}</View>

        {footer ? (
          <View style={{ paddingBottom: Math.max(insets.bottom - 8, 0) }}>
            {footer}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  handleArea: { height: 44, paddingTop: 10, alignItems: 'center' },
  handle: { width: 46, height: 4 },
  body: { flex: 1 },
});
