/**
 * "Add to calendar" as a link rather than a native module: expo-calendar does not
 * run in Expo Go, and this opens the same way on every phone.
 */

import { Linking } from 'react-native';

import type { RunSummary } from './types';

const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

export function addRunToCalendar(run: RunSummary) {
  const start = new Date(run.starts_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const q = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(`${run.title} · Exa Running Clan`)}`,
    `dates=${stamp(start)}/${stamp(end)}`,
    `location=${encodeURIComponent(run.meet_point)}`,
    `details=${encodeURIComponent(run.description)}`,
  ].join('&');

  void Linking.openURL(`https://calendar.google.com/calendar/render?${q}`).catch(() => undefined);
}
