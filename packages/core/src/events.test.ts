import { describe, expect, it } from 'vitest';

import {
  computeDurationSeconds,
  defaultBottleMl,
  elapsedSeconds,
  type EventLike,
  formatClockTime,
  formatDuration,
  isEndAfterStart,
  minutesAgo,
  nextBreastSide,
  startTimedEvent,
  stopTimedEvent,
  summarizeEvent,
} from './events';

const feed = (side: string | null, startedAt: string): EventLike => ({
  type: 'breast',
  started_at: startedAt,
  breast_side: side,
});
const bottle = (ml: number | null, startedAt: string): EventLike => ({
  type: 'bottle',
  started_at: startedAt,
  amount_ml: ml,
});

describe('time helpers', () => {
  it('computes whole-second durations, clamped at 0', () => {
    expect(computeDurationSeconds('2026-07-09T10:00:00Z', '2026-07-09T10:18:30Z')).toBe(1110);
    expect(computeDurationSeconds('2026-07-09T10:00:00Z', '2026-07-09T09:00:00Z')).toBe(0);
  });

  it('elapsedSeconds measures from start to now', () => {
    const now = new Date('2026-07-09T10:05:00Z');
    expect(elapsedSeconds('2026-07-09T10:00:00Z', now)).toBe(300);
  });

  it('validates end after start', () => {
    expect(isEndAfterStart('2026-07-09T10:00:00Z', '2026-07-09T10:01:00Z')).toBe(true);
    expect(isEndAfterStart('2026-07-09T10:00:00Z', '2026-07-09T10:00:00Z')).toBe(true);
    expect(isEndAfterStart('2026-07-09T10:00:00Z', '2026-07-09T09:59:00Z')).toBe(false);
  });

  it('minutesAgo subtracts from now', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    expect(minutesAgo(now, 15)).toBe('2026-07-09T09:45:00.000Z');
    expect(minutesAgo(now, 0)).toBe('2026-07-09T10:00:00.000Z');
  });

  it('formats durations compactly', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(18 * 60)).toBe('18 min');
    expect(formatDuration(100 * 60)).toBe('1h 40m');
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats the clock in 12-hour time', () => {
    expect(formatClockTime(new Date(2026, 6, 9, 14, 14))).toBe('2:14 pm');
    expect(formatClockTime(new Date(2026, 6, 9, 0, 5))).toBe('12:05 am');
    expect(formatClockTime(new Date(2026, 6, 9, 12, 0))).toBe('12:00 pm');
  });
});

describe('timed events', () => {
  it('starts an open-ended timer', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const e = startTimedEvent('sleep', now);
    expect(e).toMatchObject({ type: 'sleep', started_at: now.toISOString(), ended_at: null });
  });

  it('carries breast side when starting a feed', () => {
    const e = startTimedEvent('breast', new Date('2026-07-09T10:00:00Z'), { breastSide: 'left' });
    expect(e.breast_side).toBe('left');
  });

  it('stops a timer with a derived duration', () => {
    const stop = stopTimedEvent({ started_at: '2026-07-09T10:00:00Z' }, new Date('2026-07-09T10:20:00Z'));
    expect(stop).toEqual({ ended_at: '2026-07-09T10:20:00.000Z', duration_seconds: 1200 });
  });
});

describe('nextBreastSide', () => {
  it('defaults to left with no history', () => {
    expect(nextBreastSide([])).toBe('left');
  });

  it('returns the opposite of the last side', () => {
    expect(nextBreastSide([feed('left', '2026-07-09T10:00:00Z')])).toBe('right');
    expect(nextBreastSide([feed('right', '2026-07-09T10:00:00Z')])).toBe('left');
  });

  it('uses the most recent feed regardless of array order', () => {
    const feeds = [feed('left', '2026-07-09T08:00:00Z'), feed('right', '2026-07-09T11:00:00Z')];
    expect(nextBreastSide(feeds)).toBe('left'); // last was right
  });

  it('ignores non-breast and both-side feeds, defaulting to left', () => {
    expect(nextBreastSide([feed('both', '2026-07-09T10:00:00Z')])).toBe('left');
    expect(nextBreastSide([bottle(90, '2026-07-09T10:00:00Z')])).toBe('left');
  });
});

describe('defaultBottleMl', () => {
  it('returns null with no history', () => {
    expect(defaultBottleMl([])).toBeNull();
    expect(defaultBottleMl([feed('left', '2026-07-09T10:00:00Z')])).toBeNull();
  });

  it('returns the single value rounded to 5ml', () => {
    expect(defaultBottleMl([bottle(92, '2026-07-09T10:00:00Z')])).toBe(90);
  });

  it('takes the median of recent bottles', () => {
    const bottles = [
      bottle(60, '2026-07-09T08:00:00Z'),
      bottle(90, '2026-07-09T09:00:00Z'),
      bottle(120, '2026-07-09T10:00:00Z'),
    ];
    expect(defaultBottleMl(bottles)).toBe(90);
  });

  it('averages the two middle values for an even count', () => {
    const bottles = [
      bottle(80, '2026-07-09T08:00:00Z'),
      bottle(100, '2026-07-09T09:00:00Z'),
    ];
    expect(defaultBottleMl(bottles)).toBe(90);
  });

  it('only samples the most recent N', () => {
    const bottles = Array.from({ length: 12 }, (_, i) =>
      bottle(i < 2 ? 10 : 100, `2026-07-09T${i.toString().padStart(2, '0')}:00:00Z`),
    );
    // The two oldest (10ml) fall outside the 10-sample window → median stays 100.
    expect(defaultBottleMl(bottles)).toBe(100);
  });
});

describe('summarizeEvent', () => {
  it('summarizes a completed breast feed', () => {
    expect(
      summarizeEvent({ type: 'breast', started_at: 'x', breast_side: 'left', duration_seconds: 1080 }),
    ).toBe('Left breast · 18 min');
  });

  it('marks a running feed as in progress', () => {
    expect(summarizeEvent({ type: 'breast', started_at: 'x', breast_side: 'right', ended_at: null })).toBe(
      'Right breast · in progress',
    );
  });

  it('summarizes diapers, bottles, sleep, and pump', () => {
    expect(summarizeEvent({ type: 'diaper', started_at: 'x', diaper_contents: 'wet' })).toBe('Wet diaper');
    expect(
      summarizeEvent({ type: 'bottle', started_at: 'x', amount_ml: 90, data: { contents: 'breast_milk' } }),
    ).toBe('90 ml · breast milk');
    expect(summarizeEvent({ type: 'sleep', started_at: 'x', duration_seconds: 6000 })).toBe('Slept 1h 40m');
    expect(
      summarizeEvent({ type: 'pump', started_at: 'x', amount_ml: 120, duration_seconds: 900 }),
    ).toBe('Pumped · 120 ml');
  });

  it('reads type-specific data for growth and medication', () => {
    expect(summarizeEvent({ type: 'growth', started_at: 'x', data: { weight_g: 4200 } })).toBe('Weight 4.20 kg');
    expect(summarizeEvent({ type: 'medication', started_at: 'x', data: { name: 'Vitamin D' } })).toBe(
      'Medication · Vitamin D',
    );
  });

  it('marks a bare timed event (no end, no duration) as in progress', () => {
    expect(summarizeEvent({ type: 'breast', started_at: 'x' })).toBe('Breast · in progress');
  });

  it('falls back gracefully with missing fields', () => {
    // Completed feed with no side recorded.
    expect(summarizeEvent({ type: 'breast', started_at: 'x', duration_seconds: 600 })).toBe('Breast · 10 min');
    expect(summarizeEvent({ type: 'note', started_at: 'x', note: 'Fussy after feed' })).toBe('Fussy after feed');
  });
});
