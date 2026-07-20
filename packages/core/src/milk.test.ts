import { describe, expect, it } from 'vitest';

import {
  availableEntries,
  daysOfStash,
  formatVolume,
  type MilkEntryLike,
  nextToUse,
  pastWindow,
  stashTotals,
} from './milk';

const bag = (over: Partial<MilkEntryLike> & Pick<MilkEntryLike, 'pumped_at'>): MilkEntryLike => ({
  volume_ml: 120,
  storage: 'fridge',
  ...over,
});

const NOW = new Date('2026-07-20T12:00:00.000Z');

describe('availableEntries', () => {
  it('drops used and discarded milk', () => {
    const entries = [
      bag({ id: 'a', pumped_at: '2026-07-20T06:00:00.000Z' }),
      bag({ id: 'b', pumped_at: '2026-07-20T07:00:00.000Z', used_at: '2026-07-20T09:00:00.000Z' }),
      bag({ id: 'c', pumped_at: '2026-07-20T08:00:00.000Z', discarded: true }),
    ];
    expect(availableEntries(entries).map((e) => e.id)).toEqual(['a']);
  });
});

describe('stashTotals', () => {
  it('splits totals by storage location', () => {
    const entries = [
      bag({ pumped_at: '2026-07-20T06:00:00.000Z', volume_ml: 120 }),
      bag({ pumped_at: '2026-07-20T07:00:00.000Z', volume_ml: 90, storage: 'freezer' }),
      bag({ pumped_at: '2026-07-20T08:00:00.000Z', volume_ml: 150, storage: 'freezer' }),
    ];
    expect(stashTotals(entries)).toEqual({ fridgeMl: 120, freezerMl: 240, totalMl: 360, count: 3 });
  });

  it('ignores used milk and non-positive volumes', () => {
    const entries = [
      bag({ pumped_at: '2026-07-20T06:00:00.000Z', volume_ml: 120, used_at: '2026-07-20T09:00:00.000Z' }),
      bag({ pumped_at: '2026-07-20T07:00:00.000Z', volume_ml: 0 }),
      bag({ pumped_at: '2026-07-20T08:00:00.000Z', volume_ml: 60 }),
    ];
    expect(stashTotals(entries)).toEqual({ fridgeMl: 60, freezerMl: 0, totalMl: 60, count: 1 });
  });

  it('is all zeroes for an empty stash', () => {
    expect(stashTotals([])).toEqual({ fridgeMl: 0, freezerMl: 0, totalMl: 0, count: 0 });
  });
});

describe('nextToUse', () => {
  it('picks the oldest available milk', () => {
    const entries = [
      bag({ id: 'new', pumped_at: '2026-07-20T09:00:00.000Z' }),
      bag({ id: 'old', pumped_at: '2026-07-18T09:00:00.000Z' }),
    ];
    expect(nextToUse(entries)?.id).toBe('old');
  });

  it('skips milk already used', () => {
    const entries = [
      bag({ id: 'old', pumped_at: '2026-07-18T09:00:00.000Z', used_at: '2026-07-19T00:00:00.000Z' }),
      bag({ id: 'next', pumped_at: '2026-07-19T09:00:00.000Z' }),
    ];
    expect(nextToUse(entries)?.id).toBe('next');
  });

  it('breaks a tie toward the fridge', () => {
    const entries = [
      bag({ id: 'frozen', pumped_at: '2026-07-19T09:00:00.000Z', storage: 'freezer' }),
      bag({ id: 'chilled', pumped_at: '2026-07-19T09:00:00.000Z', storage: 'fridge' }),
    ];
    expect(nextToUse(entries)?.id).toBe('chilled');
  });

  it('is null when nothing is available', () => {
    expect(nextToUse([])).toBeNull();
  });
});

describe('pastWindow', () => {
  const entries = [
    bag({ id: 'fresh', pumped_at: '2026-07-20T08:00:00.000Z' }), // 4h old
    bag({ id: 'old-fridge', pumped_at: '2026-07-18T08:00:00.000Z' }), // 52h old
    bag({ id: 'frozen', pumped_at: '2026-04-01T08:00:00.000Z', storage: 'freezer' }),
  ];

  it('uses the caregivers own window per location', () => {
    expect(pastWindow(entries, { fridge: 24, freezer: null }, NOW).map((e) => e.id)).toEqual(['old-fridge']);
  });

  it('tracks nothing when no window was given', () => {
    expect(pastWindow(entries, {}, NOW)).toEqual([]);
    expect(pastWindow(entries, { fridge: 0, freezer: 0 }, NOW)).toEqual([]);
  });

  it('applies the freezer window separately', () => {
    const ids = pastWindow(entries, { fridge: 96, freezer: 24 * 30 }, NOW).map((e) => e.id);
    expect(ids).toEqual(['frozen']);
  });
});

describe('formatVolume', () => {
  it('switches to litres once the stash is large', () => {
    expect(formatVolume(540)).toBe('540 ml');
    expect(formatVolume(1200)).toBe('1.2 L');
    expect(formatVolume(0)).toBe('0 ml');
    expect(formatVolume(-5)).toBe('0 ml');
  });
});

describe('daysOfStash', () => {
  it('divides the stash by daily intake', () => {
    expect(daysOfStash(1500, 750)).toBe(2);
  });

  it('is null without a usable intake', () => {
    expect(daysOfStash(1500, 0)).toBeNull();
    expect(daysOfStash(1500, Number.NaN)).toBeNull();
  });
});
