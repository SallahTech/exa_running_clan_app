/**
 * Reminders are scheduled on the phone, so they work without a server: one, 12
 * hours before each run the member has joined. Rebuilt whenever those runs change.
 *
 * Alerts about changes and comments come from the `notify` function, which reaches
 * this device through the token registered here. Getting a token needs an EAS
 * project and a development build; until then it fails quietly and reminders still
 * work.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { language, t } from '../i18n';
import * as api from './api';
import { dayFull, timeOfDay } from './format';
import type { RunSummary } from './types';

const REMINDER_LEAD_MS = 12 * 60 * 60 * 1000;
const native = Platform.OS !== 'web';

if (native) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let savedToken: string | null = null;

/** Asks only when `ask` is set, so the prompt appears at a moment that explains it. */
export async function notificationsAllowed(ask: boolean): Promise<boolean> {
  if (!native) return false;
  try {
    const now = await Notifications.getPermissionsAsync();
    if (now.granted) return true;
    if (!ask || !now.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function registerForPush(): Promise<void> {
  if (!native) return;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    savedToken = data;
    await api.savePushToken(data, Platform.OS, language());
  } catch {
    // No EAS project yet, or offline. Reminders don't depend on this.
  }
}

export async function unregisterFromPush(): Promise<void> {
  if (!savedToken) return;
  await api.deletePushToken(savedToken).catch(() => undefined);
  savedToken = null;
}

export async function syncRunReminders(runs: RunSummary[], enabled: boolean): Promise<void> {
  if (!native) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    for (const run of runs) {
      if (run.my_rsvp?.state !== 'going' || run.status === 'cancelled') continue;

      const date = new Date(new Date(run.starts_at).getTime() - REMINDER_LEAD_MS);
      if (date.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t('notif.title', { title: run.title }),
          body: t('notif.body', {
            day: dayFull(run.starts_at),
            time: timeOfDay(run.starts_at),
            place: run.meet_point,
          }),
          data: { url: '/' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  } catch {
    // A reminder is a nicety; never let it break the app.
  }
}
