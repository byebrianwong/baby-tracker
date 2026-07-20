/**
 * Medication dose history.
 *
 * "When was the last dose?" is the question a parent asks at 3am, and getting
 * it wrong is the one logging mistake that can actually hurt. So this module
 * answers it from the log and nothing else.
 *
 * Deliberately NOT here: dosage amounts, weight-based dosing, drug intervals,
 * or any other medical constant. Baby Bean is not a doctor (spec §1). The
 * minimum interval is whatever the caregiver entered from the label or their
 * pediatrician; we only do the arithmetic.
 */

import { type EventLike } from './events';

/** The medication-specific fields we keep in `events.data`. */
export type MedData = {
  name?: string;
  amount?: number;
  unit?: string;
  /** Minimum hours between doses, as told to the caregiver. Never inferred. */
  min_interval_hours?: number;
};

export type DoseStatus = {
  /** ISO timestamp of the most recent dose, or null if never given. */
  lastAt: string | null;
  /** Earliest ISO timestamp the caregiver's own interval allows, or null. */
  nextAt: string | null;
  /** Seconds until `nextAt`; 0 once due, null when no interval was recorded. */
  readyInSeconds: number | null;
  /**
   * The interval the projection actually used — the caller's, or the one
   * remembered from the last dose. Never guessed. UI must report *this*, not
   * whatever is in its own input, or the two disagree.
   */
  intervalHours: number | null;
  /** Doses of this medication in the trailing 24 hours. */
  countLast24h: number;
};

/** The medication name on an event, trimmed and lowercased for matching. */
export function medKey(event: EventLike): string | null {
  const name = (event.data as MedData | undefined)?.name;
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed ? trimmed.toLowerCase() : null;
}

/** Every dose of `name`, most recent first. Case- and whitespace-insensitive. */
export function dosesOf(events: readonly EventLike[], name: string): EventLike[] {
  const key = name.trim().toLowerCase();
  if (!key) return [];
  return events
    .filter((e) => e.type === 'medication' && medKey(e) === key)
    .slice()
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
}

/** Distinct medication names in the log, most recently given first. */
export function medicationsGiven(events: readonly EventLike[]): string[] {
  const seen = new Map<string, string>();
  const sorted = events
    .filter((e) => e.type === 'medication')
    .slice()
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)));
  for (const e of sorted) {
    const key = medKey(e);
    const label = (e.data as MedData | undefined)?.name?.trim();
    if (key && label && !seen.has(key)) seen.set(key, label);
  }
  return [...seen.values()];
}

/** Doses of `name` given in the trailing `hours` before `now`. */
export function dosesInWindow(
  events: readonly EventLike[],
  name: string,
  hours: number,
  now: Date,
): number {
  const cutoff = now.getTime() - hours * 3_600_000;
  return dosesOf(events, name).filter((e) => new Date(e.started_at).getTime() >= cutoff).length;
}

/**
 * Dose history for one medication. `minIntervalHours` comes from the caregiver
 * (the label, or their pediatrician) — pass null and we report history only,
 * with no timing guidance at all.
 */
export function doseStatus(args: {
  events: readonly EventLike[];
  name: string;
  minIntervalHours?: number | null;
  now: Date;
}): DoseStatus {
  const { events, name, now } = args;
  const doses = dosesOf(events, name);
  const last = doses[0] ?? null;
  const lastAt = last?.started_at ?? null;

  const interval =
    args.minIntervalHours ?? (last?.data as MedData | undefined)?.min_interval_hours ?? null;

  const usable = interval != null && interval > 0 ? interval : null;

  let nextAt: string | null = null;
  let readyInSeconds: number | null = null;
  if (lastAt && usable != null) {
    const nextMs = new Date(lastAt).getTime() + usable * 3_600_000;
    nextAt = new Date(nextMs).toISOString();
    readyInSeconds = Math.max(0, Math.round((nextMs - now.getTime()) / 1000));
  }

  return {
    lastAt,
    nextAt,
    readyInSeconds,
    intervalHours: usable,
    countLast24h: dosesInWindow(events, name, 24, now),
  };
}

/** "5 ml" / "1 drop" / "" — renders only what the caregiver actually entered. */
export function formatDose(data: MedData | undefined | null): string {
  if (!data || typeof data.amount !== 'number' || !Number.isFinite(data.amount)) return '';
  const unit = data.unit?.trim() || 'ml';
  return `${data.amount} ${unit}`;
}
