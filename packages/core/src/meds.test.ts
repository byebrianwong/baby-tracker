import { describe, expect, it } from 'vitest';

import { type EventLike } from './events';
import { dosesInWindow, dosesOf, doseStatus, formatDose, medicationsGiven, medKey } from './meds';

const dose = (at: string, data: Record<string, unknown>): EventLike => ({
  type: 'medication',
  started_at: at,
  data,
});

const NOW = new Date('2026-07-20T12:00:00.000Z');

describe('medKey', () => {
  it('normalizes case and whitespace', () => {
    expect(medKey(dose('2026-07-20T08:00:00.000Z', { name: '  Tylenol ' }))).toBe('tylenol');
  });

  it('is null when no name was recorded', () => {
    expect(medKey(dose('2026-07-20T08:00:00.000Z', {}))).toBeNull();
    expect(medKey(dose('2026-07-20T08:00:00.000Z', { name: '   ' }))).toBeNull();
  });
});

describe('dosesOf', () => {
  const events = [
    dose('2026-07-20T06:00:00.000Z', { name: 'Tylenol' }),
    dose('2026-07-20T10:00:00.000Z', { name: 'tylenol' }),
    dose('2026-07-20T09:00:00.000Z', { name: 'Vitamin D' }),
    { type: 'bottle', started_at: '2026-07-20T11:00:00.000Z' } as EventLike,
  ];

  it('matches across casing and returns newest first', () => {
    const doses = dosesOf(events, 'TYLENOL');
    expect(doses).toHaveLength(2);
    expect(doses[0]?.started_at).toBe('2026-07-20T10:00:00.000Z');
  });

  it('ignores non-medication events and blank queries', () => {
    expect(dosesOf(events, 'bottle')).toHaveLength(0);
    expect(dosesOf(events, '  ')).toHaveLength(0);
  });
});

describe('medicationsGiven', () => {
  it('lists distinct names, most recently given first, in original spelling', () => {
    const events = [
      dose('2026-07-20T06:00:00.000Z', { name: 'Tylenol' }),
      dose('2026-07-20T09:00:00.000Z', { name: 'Vitamin D' }),
      dose('2026-07-20T10:00:00.000Z', { name: 'tylenol' }),
    ];
    expect(medicationsGiven(events)).toEqual(['tylenol', 'Vitamin D']);
  });
});

describe('dosesInWindow', () => {
  it('counts only doses inside the trailing window', () => {
    const events = [
      dose('2026-07-19T11:00:00.000Z', { name: 'Tylenol' }), // 25h ago
      dose('2026-07-20T02:00:00.000Z', { name: 'Tylenol' }), // 10h ago
      dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol' }), // 2h ago
    ];
    expect(dosesInWindow(events, 'Tylenol', 24, NOW)).toBe(2);
  });
});

describe('doseStatus', () => {
  it('reports history only when no interval is known', () => {
    const status = doseStatus({
      events: [dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol' })],
      name: 'Tylenol',
      now: NOW,
    });
    expect(status.lastAt).toBe('2026-07-20T10:00:00.000Z');
    expect(status.nextAt).toBeNull();
    expect(status.readyInSeconds).toBeNull();
    expect(status.countLast24h).toBe(1);
  });

  it('projects the next dose from the caregivers own interval', () => {
    const status = doseStatus({
      events: [dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol' })],
      name: 'Tylenol',
      minIntervalHours: 4,
      now: NOW,
    });
    expect(status.nextAt).toBe('2026-07-20T14:00:00.000Z');
    expect(status.readyInSeconds).toBe(7200);
  });

  it('falls back to the interval stored on the last dose', () => {
    const status = doseStatus({
      events: [dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol', min_interval_hours: 6 })],
      name: 'Tylenol',
      now: NOW,
    });
    expect(status.nextAt).toBe('2026-07-20T16:00:00.000Z');
    expect(status.intervalHours).toBe(6);
  });

  it('reports the interval it actually used, so the UI cannot contradict it', () => {
    // Caller passes nothing; the last dose remembers 6h. The status must say 6.
    const remembered = doseStatus({
      events: [dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol', min_interval_hours: 6 })],
      name: 'Tylenol',
      minIntervalHours: null,
      now: NOW,
    });
    expect(remembered.intervalHours).toBe(6);

    // An explicit caller interval wins over the remembered one.
    const explicit = doseStatus({
      events: [dose('2026-07-20T10:00:00.000Z', { name: 'Tylenol', min_interval_hours: 6 })],
      name: 'Tylenol',
      minIntervalHours: 4,
      now: NOW,
    });
    expect(explicit.intervalHours).toBe(4);
    expect(explicit.nextAt).toBe('2026-07-20T14:00:00.000Z');
  });

  it('clamps to zero once the interval has passed', () => {
    const status = doseStatus({
      events: [dose('2026-07-20T04:00:00.000Z', { name: 'Tylenol' })],
      name: 'Tylenol',
      minIntervalHours: 4,
      now: NOW,
    });
    expect(status.readyInSeconds).toBe(0);
  });

  it('is empty for a medication never given', () => {
    const status = doseStatus({ events: [], name: 'Tylenol', minIntervalHours: 4, now: NOW });
    expect(status).toEqual({
      lastAt: null,
      nextAt: null,
      readyInSeconds: null,
      intervalHours: 4,
      countLast24h: 0,
    });
  });
});

describe('formatDose', () => {
  it('renders amount plus unit, defaulting to ml', () => {
    expect(formatDose({ amount: 5, unit: 'ml' })).toBe('5 ml');
    expect(formatDose({ amount: 1, unit: 'drop' })).toBe('1 drop');
    expect(formatDose({ amount: 2.5 })).toBe('2.5 ml');
  });

  it('renders nothing when no amount was entered', () => {
    expect(formatDose({ unit: 'ml' })).toBe('');
    expect(formatDose(null)).toBe('');
  });
});
