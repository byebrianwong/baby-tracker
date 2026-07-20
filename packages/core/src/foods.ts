/**
 * Solids and food introduction.
 *
 * The useful thing a log can tell a parent starting solids is simply *what has
 * been tried, when it was first tried, and how often since* — the record you
 * bring to an allergist. We surface that history; we never label a food safe,
 * risky, or allergenic, and we never interpret a reaction (spec §1).
 */

import { type EventLike } from './events';

/** Solids fields kept in `events.data`. */
export type FoodData = {
  food?: string;
  /** Free-text observation the caregiver typed, e.g. "rash after". */
  reaction?: string;
};

export type FoodHistory = {
  /** The food as the caregiver first spelled it. */
  food: string;
  /** ISO timestamp of the first time it was offered. */
  firstAt: string;
  /** ISO timestamp of the most recent time it was offered. */
  lastAt: string;
  /** How many times it has been offered. */
  times: number;
  /** Every reaction note recorded against it, oldest first. */
  reactions: string[];
};

function foodKey(event: EventLike): string | null {
  const food = (event.data as FoodData | undefined)?.food;
  const trimmed = typeof food === 'string' ? food.trim() : '';
  return trimmed ? trimmed.toLowerCase() : null;
}

/**
 * One row per distinct food, most recently offered first. Foods logged without
 * a name are skipped — there is nothing to track.
 */
export function foodHistory(events: readonly EventLike[]): FoodHistory[] {
  const byKey = new Map<string, FoodHistory>();

  const chronological = events
    .filter((e) => e.type === 'solids')
    .slice()
    .sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));

  for (const e of chronological) {
    const key = foodKey(e);
    if (!key) continue;
    const data = e.data as FoodData;
    const at = e.started_at;
    const existing = byKey.get(key);

    if (existing) {
      existing.lastAt = at;
      existing.times += 1;
      if (data.reaction?.trim()) existing.reactions.push(data.reaction.trim());
    } else {
      byKey.set(key, {
        food: (data.food ?? '').trim(),
        firstAt: at,
        lastAt: at,
        times: 1,
        reactions: data.reaction?.trim() ? [data.reaction.trim()] : [],
      });
    }
  }

  return [...byKey.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/** True when this food has never been offered before — the "first taste" flag. */
export function isNewFood(events: readonly EventLike[], food: string): boolean {
  const key = food.trim().toLowerCase();
  if (!key) return false;
  return !events.some((e) => e.type === 'solids' && foodKey(e) === key);
}
