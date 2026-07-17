import { describe, expect, it } from 'vitest';

import { type EventLike } from './events';
import { dayBounds, summarizeRange } from './insights';

const ev = (e: Partial<EventLike> & { type: string; started_at: string }): EventLike => e;

describe('summarizeRange', () => {
  const from = '2026-07-16T00:00:00Z';
  const to = '2026-07-17T00:00:00Z';

  it('counts feeds, volume, diapers, and sleep within the range', () => {
    const events: EventLike[] = [
      ev({ type: 'breast', started_at: '2026-07-16T08:00:00Z', duration_seconds: 600 }),
      ev({ type: 'bottle', started_at: '2026-07-16T10:00:00Z', amount_ml: 90 }),
      ev({ type: 'pump', started_at: '2026-07-16T11:00:00Z', amount_ml: 120 }),
      ev({ type: 'diaper', started_at: '2026-07-16T09:00:00Z', diaper_contents: 'wet' }),
      ev({ type: 'diaper', started_at: '2026-07-16T12:00:00Z', diaper_contents: 'dirty' }),
      ev({ type: 'sleep', started_at: '2026-07-16T13:00:00Z', duration_seconds: 3600 }),
      ev({ type: 'sleep', started_at: '2026-07-16T15:00:00Z', duration_seconds: 5400 }),
      // Out of range — excluded.
      ev({ type: 'breast', started_at: '2026-07-15T23:00:00Z', duration_seconds: 300 }),
    ];
    const s = summarizeRange(events, from, to);
    expect(s.feeds).toBe(2); // breast + bottle (pump is not a feed)
    expect(s.volumeMl).toBe(210); // 90 bottle + 120 pump
    expect(s.diapers).toBe(2);
    expect(s.diaperBreakdown).toEqual({ wet: 1, dirty: 1, mixed: 0, dry: 0 });
    expect(s.naps).toBe(2);
    expect(s.sleepSeconds).toBe(9000);
    expect(s.longestSleepSeconds).toBe(5400);
  });

  it('returns zeros for an empty range', () => {
    const s = summarizeRange([], from, to);
    expect(s).toMatchObject({ feeds: 0, volumeMl: 0, diapers: 0, sleepSeconds: 0, naps: 0 });
  });
});

describe('dayBounds', () => {
  it('spans exactly 24 hours', () => {
    const { fromISO, toISO } = dayBounds(new Date(2026, 6, 16, 14, 30));
    const span = new Date(toISO).getTime() - new Date(fromISO).getTime();
    expect(span).toBe(24 * 3600 * 1000);
  });
});
