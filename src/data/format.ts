/**
 * Formatting. Every number in the UI is stored as metres or seconds and turned
 * into a string exactly here, so "24.6 KM" and "4:55 /km" can't drift between
 * screens.
 *
 * Everything user-facing is Cyprus local time. A member on a work trip should
 * still see the clan's Wednesday, so the club timezone is passed explicitly rather
 * than falling back to the device's.
 */

import { intlLocale, t, upper } from '../i18n';

export const CLUB_TZ = 'Asia/Nicosia';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

// ---------------------------------------------------------------- distance & time

/** 8200 → "8.2", 24600 → "24.6". */
export function km(distanceM: number, digits = 1): string {
  return (distanceM / 1000).toFixed(digits);
}

/** 8200 → "8.2 km". */
export function kmLabel(distanceM: number, digits = 1): string {
  return `${km(distanceM, digits)} km`;
}

/** 148000 → "148" — whole kilometres for the leaderboard and totals. */
export function kmWhole(distanceM: number): string {
  return String(Math.round(distanceM / 1000));
}

/** 7860 → "2:11" (hours:minutes) — the "MOVING" stat. */
export function movingTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${pad(m)}`;
}

/** 295 → "4:55 /km". */
export function pace(secondsPerKm: number | null): string {
  if (!secondsPerKm || !Number.isFinite(secondsPerKm)) return '—';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${pad(s)} /km`;
}

// ---------------------------------------------------------------- dates

const format = (iso: string, opts: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat(intlLocale(), { timeZone: CLUB_TZ, ...opts }).format(new Date(iso));

// Each field is formatted on its own: formatToParts on iOS's JavaScript engine
// comes back without the weekday and month, which left dates blank on phones.

/** "TUESDAY" */
export function dayFull(iso: string): string {
  return upper(format(iso, { weekday: 'long' }));
}

/** "TUE" */
export function dayShort(iso: string): string {
  return upper(format(iso, { weekday: 'short' }));
}

/** "19:30" in club time. */
export function timeOfDay(iso: string): string {
  const pad2 = (o: Intl.DateTimeFormatOptions) => pad(Number(format(iso, o).replace(/\D/g, '')));
  return `${pad2({ hour: 'numeric', hourCycle: 'h23' })}:${pad2({ minute: 'numeric' })}`;
}

/** "15 MAR" — the right-aligned race date. */
export function raceDate(isoDate: string): string {
  const iso = `${isoDate}T12:00:00Z`;
  return `${pad(Number(format(iso, { day: 'numeric' }).replace(/\D/g, '')))} ${upper(format(iso, { month: 'short' }))}`;
}

/** "MAR 2024" — "SINCE MAR 2024" on the profile. */
export function monthYear(iso: string): string {
  return `${upper(format(iso, { month: 'short' }))} ${format(iso, { year: 'numeric' }).replace(/\D/g, '')}`;
}

/** "AUGUST" — the Stats screen title. */
export function monthName(date = new Date()): string {
  return upper(
    new Intl.DateTimeFormat(intlLocale(), { timeZone: CLUB_TZ, month: 'long' }).format(date),
  );
}

/** Feed timestamps: "2h", "Yesterday", "Saturday", then the date. */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);

  if (mins < 1) return t('common.justNow');
  if (mins < 60) return t('common.minutesAgo', { n: mins });

  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('common.hoursAgo', { n: hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return t('common.yesterday');
  if (days < 7) return format(iso, { weekday: 'long' });

  return `${format(iso, { day: 'numeric' }).replace(/\D/g, '')} ${format(iso, { month: 'short' })}`;
}

// ---------------------------------------------------------------- countdown

export interface Countdown {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * Zero-padded DD HH MM SS to the given instant. The Home hero recomputes this
 * every second.
 */
export function countdownTo(iso: string, now = Date.now()): Countdown {
  let s = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));

  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  s -= minutes * 60;

  return { days: pad(days), hours: pad(hours), minutes: pad(minutes), seconds: pad(s) };
}

/** "12h 48m" — the sign-in screen's "Tuesday track starts in …". */
export function untilShort(iso: string, now = Date.now()): string {
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}
