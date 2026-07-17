import { describe, expect, it } from 'vitest';

import { type EventLike } from './events';
import {
  ageInWeeks,
  predictNextSleep,
  trailingAverageWakeMinutes,
  wakeWindowForAge,
} from './sleep';

const sleep = (startedAt: string, endedAt: string | null): EventLike => ({
  type: 'sleep',
  started_at: startedAt,
  ended_at: endedAt,
});

describe('ageInWeeks', () => {
  it('counts whole weeks since dob', () => {
    expect(ageInWeeks('2026-06-01', new Date('2026-06-29T00:00:00Z'))).toBe(4);
  });
  it('clamps a future dob to 0', () => {
    expect(ageInWeeks('2026-12-01', new Date('2026-06-01T00:00:00Z'))).toBe(0);
  });
});

describe('wakeWindowForAge', () => {
  it('gives short windows for newborns and longer for older babies', () => {
    expect(wakeWindowForAge(2)).toEqual({ minMinutes: 35, maxMinutes: 60 });
    expect(wakeWindowForAge(10)).toEqual({ minMinutes: 60, maxMinutes: 90 });
    expect(wakeWindowForAge(200)).toEqual({ minMinutes: 240, maxMinutes: 360 });
  });
});

describe('trailingAverageWakeMinutes', () => {
  it('is null with fewer than two completed sleeps', () => {
    expect(trailingAverageWakeMinutes([])).toBeNull();
    expect(trailingAverageWakeMinutes([sleep('2026-07-16T08:00:00Z', '2026-07-16T09:00:00Z')])).toBeNull();
  });
  it('averages the awake gaps between consecutive sleeps', () => {
    const sleeps = [
      sleep('2026-07-16T08:00:00Z', '2026-07-16T09:00:00Z'),
      sleep('2026-07-16T10:00:00Z', '2026-07-16T11:00:00Z'), // 60 min awake after prev
      sleep('2026-07-16T13:00:00Z', '2026-07-16T14:00:00Z'), // 120 min awake after prev
    ];
    expect(trailingAverageWakeMinutes(sleeps)).toBe(90);
  });
});

describe('predictNextSleep', () => {
  const now = new Date('2026-07-16T12:00:00Z');

  it('returns null while the baby is asleep', () => {
    expect(
      predictNextSleep({ dob: '2026-06-01', recentSleeps: [sleep('2026-07-16T11:30:00Z', null)], now }),
    ).toBeNull();
  });

  it('returns null with no completed sleep to predict from', () => {
    expect(predictNextSleep({ dob: '2026-06-01', recentSleeps: [], now })).toBeNull();
  });

  it('uses the age baseline off the last wake time when history is thin', () => {
    // 6-week-old, woke at 11:30 → window is +35..+60 min → 12:05..12:30.
    const p = predictNextSleep({
      dob: '2026-06-04',
      recentSleeps: [sleep('2026-07-16T11:00:00Z', '2026-07-16T11:30:00Z')],
      now,
    });
    expect(p).not.toBeNull();
    expect(p!.source).toBe('baseline');
    expect(p!.start.toISOString()).toBe('2026-07-16T12:05:00.000Z');
    expect(p!.end.toISOString()).toBe('2026-07-16T12:30:00.000Z');
  });

  it('personalizes the window when there is enough rhythm', () => {
    const sleeps = [
      sleep('2026-07-16T07:00:00Z', '2026-07-16T08:00:00Z'),
      sleep('2026-07-16T09:00:00Z', '2026-07-16T10:00:00Z'),
      sleep('2026-07-16T11:00:00Z', '2026-07-16T11:30:00Z'),
    ];
    const p = predictNextSleep({ dob: '2026-06-04', recentSleeps: sleeps, now });
    expect(p!.source).toBe('personalized');
    // Window still starts after the last wake (11:30) and spans a real range.
    expect(p!.start.getTime()).toBeGreaterThan(new Date('2026-07-16T11:30:00Z').getTime());
    expect(p!.end.getTime()).toBeGreaterThan(p!.start.getTime());
  });
});
