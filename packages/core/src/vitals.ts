/**
 * Temperature records.
 *
 * Conversion and formatting only. No fever thresholds, no "this is high"
 * flagging — that is diagnosis, and Baby Bean is not a doctor (spec §1). The
 * app's job is to make the number easy to record and easy to read back to a
 * pediatrician over the phone.
 */

import { type EventLike } from './events';

export type TempUnit = 'c' | 'f';

/** Temperature fields kept in `events.data`. Stored in Celsius, always. */
export type TempData = {
  /** Canonical value in Celsius, so unit switching never loses precision. */
  temp_c?: number;
  /** How the caregiver entered it, so we can read it back the same way. */
  unit?: TempUnit;
  /** Where it was taken (armpit, forehead, rectal…) — free text, optional. */
  method?: string;
};

export function cToF(c: number): number {
  return c * 1.8 + 32;
}

export function fToC(f: number): number {
  return (f - 32) / 1.8;
}

/** "37.4 °C" / "99.3 °F" — one decimal, the precision a thermometer reports. */
export function formatTemp(celsius: number, unit: TempUnit = 'c'): string {
  const value = unit === 'f' ? cToF(celsius) : celsius;
  return `${value.toFixed(1)} °${unit === 'f' ? 'F' : 'C'}`;
}

/** The most recent temperature reading, or null. */
export function lastTemperature(events: readonly EventLike[]): EventLike | null {
  const sorted = events
    .filter((e) => e.type === 'temperature')
    .slice()
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
  return sorted[0] ?? null;
}
