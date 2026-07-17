/**
 * @baby-bean/core — pure, unit-tested business logic.
 *
 * Everything that computes lives here: timer math, wake-window predictions,
 * growth percentiles, formatting. UI never computes; it renders. Keep this
 * package free of React, Expo, and Supabase imports.
 *
 * This scaffold ships only a trivial symbol to prove workspace wiring and the
 * test pipeline. Real helpers arrive in P1-1 (event logic) and later phases.
 */

export { isLightColor, mixHex, withAlpha } from './color';
export {
  type BreastSide,
  computeDurationSeconds,
  defaultBottleMl,
  type DiaperContents,
  elapsedSeconds,
  type EventLike,
  type EventType,
  formatClockTime,
  formatDuration,
  formatStopwatch,
  isEndAfterStart,
  minutesAgo,
  nextBreastSide,
  startTimedEvent,
  type StartTimedOpts,
  stopTimedEvent,
  summarizeEvent,
} from './events';
export { dayBounds, type DaySummary, summarizeRange } from './insights';
export {
  ageInWeeks,
  predictNextSleep,
  type SleepPrediction,
  trailingAverageWakeMinutes,
  wakeWindowForAge,
} from './sleep';

/** Product name, exported so the app can prove it imports from core. */
export const APP_NAME = 'Baby Bean' as const;

/** Clamp `n` into the inclusive range [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  if (min > max) throw new Error('clamp: min must be <= max');
  return Math.min(Math.max(n, min), max);
}
