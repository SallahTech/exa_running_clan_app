/**
 * Haptics for the three things a member commits to: an RSVP, a kudos, a pace
 * group. Nothing depends on them, so an unsupported device just stays silent.
 */

import * as Haptics from 'expo-haptics';

export const feedback = {
  selection: () => void Haptics.selectionAsync().catch(() => undefined),
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  success: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  error: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
};
