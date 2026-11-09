/**
 * The system "Reduce Motion" setting. Read once at startup and kept current, so
 * an animation that starts on mount already knows the answer.
 */

import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let reduced = false;
const listeners = new Set<() => void>();

const publish = (next: boolean) => {
  reduced = next;
  listeners.forEach((l) => l());
};

void AccessibilityInfo.isReduceMotionEnabled().then(publish);
AccessibilityInfo.addEventListener('reduceMotionChanged', publish);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduced);
}
