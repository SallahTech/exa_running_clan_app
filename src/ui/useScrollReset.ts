/**
 * Returns a ref for a tab screen's ScrollView that puts it back at the top
 * whenever the screen gains focus.
 *
 * The five tabs are top-level destinations and each one re-enters with the
 * `scin` animation, so arriving mid-content reads as a glitch rather than as
 * resumed state. It is also not always the user's own scrolling being restored:
 * the tab screens stay mounted, and on web the browser can leave a screen
 * offset before it has ever been looked at.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import type { ScrollView } from 'react-native';

export function useScrollReset() {
  const ref = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      ref.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return ref;
}
