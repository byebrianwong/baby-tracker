/**
 * Expressed-milk stash (spec §6.7).
 *
 * The thing a pumping parent actually needs at 2am is one number: how much is
 * ready to use, and what should be used first. This module answers that from
 * the inventory, oldest-first (FIFO), with the totals split by where the bag
 * is stored.
 *
 * Storage-life guidance is NOT hardcoded here. Safe-storage windows vary by
 * source (CDC, ABM, the parent's own hospital) and by whether the milk was
 * previously frozen or already touched a baby's mouth — that is a pediatrician
 * conversation, not a constant in a tracker (spec §1). Callers pass the window
 * they were told to use; we only do the arithmetic.
 */

export type MilkStorage = 'fridge' | 'freezer';

/** A structural view of a stash entry — the DB row satisfies this. */
export type MilkEntryLike = {
  id?: string | null;
  volume_ml: number;
  pumped_at: string;
  storage: string;
  used_at?: string | null;
  discarded?: boolean | null;
};

export type StashTotals = {
  /** Millilitres available in the fridge. */
  fridgeMl: number;
  /** Millilitres available in the freezer. */
  freezerMl: number;
  /** Everything available, both locations. */
  totalMl: number;
  /** How many unused bags/bottles are on hand. */
  count: number;
};

/** Entries still on hand: not used, not discarded. */
export function availableEntries<T extends MilkEntryLike>(entries: readonly T[]): T[] {
  return entries.filter((e) => !e.used_at && !e.discarded);
}

/** Totals by storage location, over the entries still on hand. */
export function stashTotals(entries: readonly MilkEntryLike[]): StashTotals {
  let fridgeMl = 0;
  let freezerMl = 0;
  let count = 0;

  for (const e of availableEntries(entries)) {
    const ml = Number.isFinite(e.volume_ml) ? e.volume_ml : 0;
    if (ml <= 0) continue;
    if (e.storage === 'freezer') freezerMl += ml;
    else fridgeMl += ml;
    count += 1;
  }

  return { fridgeMl, freezerMl, totalMl: fridgeMl + freezerMl, count };
}

/**
 * What to use next: oldest milk first, so nothing quietly ages out. Ties break
 * on fridge before freezer — the fridge bag is the one with a clock on it.
 */
export function nextToUse<T extends MilkEntryLike>(entries: readonly T[]): T | null {
  const sorted = availableEntries(entries)
    .slice()
    .sort((a, b) => {
      const byAge = String(a.pumped_at).localeCompare(String(b.pumped_at));
      if (byAge !== 0) return byAge;
      if (a.storage === b.storage) return 0;
      return a.storage === 'fridge' ? -1 : 1;
    });
  return sorted[0] ?? null;
}

/**
 * Entries whose caregiver-supplied storage window has already elapsed at `now`.
 * Pass the window you were told to use — nothing is assumed. A window of null
 * or 0 means "don't track this", and returns nothing.
 */
export function pastWindow<T extends MilkEntryLike>(
  entries: readonly T[],
  windowHours: { fridge?: number | null; freezer?: number | null },
  now: Date,
): T[] {
  return availableEntries(entries).filter((e) => {
    const hours = e.storage === 'freezer' ? windowHours.freezer : windowHours.fridge;
    if (hours == null || hours <= 0) return false;
    const expiresMs = new Date(e.pumped_at).getTime() + hours * 3_600_000;
    return Number.isFinite(expiresMs) && expiresMs <= now.getTime();
  });
}

/** "540 ml" / "1.2 L" — the stash gets big enough that litres read easier. */
export function formatVolume(ml: number): string {
  const value = Math.max(0, Math.round(ml));
  if (value >= 1000) return `${(value / 1000).toFixed(1)} L`;
  return `${value} ml`;
}

/**
 * Roughly how long the stash covers, given recent daily intake. Returns null
 * when there is no intake to divide by — better to show nothing than a made-up
 * number.
 */
export function daysOfStash(totalMl: number, dailyIntakeMl: number): number | null {
  if (!Number.isFinite(dailyIntakeMl) || dailyIntakeMl <= 0) return null;
  return totalMl / dailyIntakeMl;
}
