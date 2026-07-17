/**
 * Sleep intelligence — pure, on-device, and free (the feature Huckleberry
 * charges for). A suggested next-sleep *window* (a range, never a hard time)
 * from age-appropriate wake windows blended with the baby's own recent rhythm.
 *
 * This is guidance drawn from the baby's patterns and general pediatric sleep
 * norms — NOT medical advice, and every baby differs. The UI says so.
 */
import { type EventLike } from './events';

/** Age-banded wake windows (minutes awake before the next sleep). */
type WakeBand = { maxWeeks: number; minMinutes: number; maxMinutes: number };
const WAKE_WINDOWS: WakeBand[] = [
  { maxWeeks: 6, minMinutes: 35, maxMinutes: 60 },
  { maxWeeks: 12, minMinutes: 60, maxMinutes: 90 },
  { maxWeeks: 17, minMinutes: 75, maxMinutes: 120 }, // ~3–4 months
  { maxWeeks: 30, minMinutes: 120, maxMinutes: 180 }, // ~4–7 months
  { maxWeeks: 43, minMinutes: 150, maxMinutes: 210 }, // ~7–10 months
  { maxWeeks: 60, minMinutes: 180, maxMinutes: 240 }, // ~10–14 months
  { maxWeeks: Infinity, minMinutes: 240, maxMinutes: 360 },
];

/** Whole weeks between a date-of-birth and `now` (0 if dob is in the future). */
export function ageInWeeks(dob: string, now: Date): number {
  const ms = now.getTime() - new Date(dob).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 3600 * 1000)));
}

/** The wake window for a given age in weeks. */
export function wakeWindowForAge(weeks: number): { minMinutes: number; maxMinutes: number } {
  const band = WAKE_WINDOWS.find((b) => weeks <= b.maxWeeks) ?? WAKE_WINDOWS[WAKE_WINDOWS.length - 1]!;
  return { minMinutes: band.minMinutes, maxMinutes: band.maxMinutes };
}

/**
 * Average awake duration (minutes) between the baby's recent completed sleeps —
 * the personalization signal. Null when there isn't enough history.
 */
export function trailingAverageWakeMinutes(sleeps: EventLike[], sample = 6): number | null {
  const completed = sleeps
    .filter((e) => e.type === 'sleep' && e.ended_at)
    .sort((a, b) => a.started_at.localeCompare(b.started_at));
  if (completed.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < completed.length; i++) {
    const prevEnd = new Date(completed[i - 1]!.ended_at as string).getTime();
    const nextStart = new Date(completed[i]!.started_at).getTime();
    const mins = (nextStart - prevEnd) / 60000;
    if (mins > 0 && mins < 12 * 60) gaps.push(mins); // ignore overnight / bad data
  }
  if (gaps.length === 0) return null;
  const recent = gaps.slice(-sample);
  return recent.reduce((s, g) => s + g, 0) / recent.length;
}

export type SleepPrediction = {
  /** Earliest suggested sleep time. */
  start: Date;
  /** Latest suggested sleep time. */
  end: Date;
  /** Whether the baby's own rhythm informed the window, or just age baseline. */
  source: 'baseline' | 'personalized';
  ageWeeks: number | null;
};

/**
 * Suggested next-sleep window. Returns null when the baby is currently asleep or
 * there is no wake time to predict from.
 */
export function predictNextSleep(opts: {
  dob: string | null;
  recentSleeps: EventLike[];
  now: Date;
}): SleepPrediction | null {
  const { dob, recentSleeps, now } = opts;

  const asleep = recentSleeps.some((e) => e.type === 'sleep' && e.ended_at == null);
  if (asleep) return null;

  const lastSleep = recentSleeps
    .filter((e) => e.type === 'sleep' && e.ended_at)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  if (!lastSleep?.ended_at) return null;
  const wokeAt = new Date(lastSleep.ended_at).getTime();

  const ageWeeks = dob ? ageInWeeks(dob, now) : null;
  const base = wakeWindowForAge(ageWeeks ?? 8);
  const personal = trailingAverageWakeMinutes(recentSleeps);

  let minMinutes = base.minMinutes;
  let maxMinutes = base.maxMinutes;
  if (personal != null) {
    // Blend the age baseline with the baby's own average, keeping a range.
    const baseMid = (base.minMinutes + base.maxMinutes) / 2;
    const center = 0.5 * baseMid + 0.5 * personal;
    const halfSpread = (base.maxMinutes - base.minMinutes) / 2;
    minMinutes = Math.max(20, Math.round(center - halfSpread));
    maxMinutes = Math.round(center + halfSpread);
  }

  return {
    start: new Date(wokeAt + minMinutes * 60000),
    end: new Date(wokeAt + maxMinutes * 60000),
    source: personal != null ? 'personalized' : 'baseline',
    ageWeeks,
  };
}
