import { describe, expect, it } from 'vitest';

import { type EventLike } from './events';
import { cToF, formatTemp, fToC, lastTemperature } from './vitals';

describe('temperature conversion', () => {
  it('round-trips between scales', () => {
    expect(cToF(37)).toBeCloseTo(98.6, 5);
    expect(fToC(98.6)).toBeCloseTo(37, 5);
    expect(fToC(cToF(38.2))).toBeCloseTo(38.2, 5);
  });

  it('handles zero and negatives', () => {
    expect(cToF(0)).toBe(32);
    expect(fToC(32)).toBe(0);
  });
});

describe('formatTemp', () => {
  it('renders one decimal in the requested scale', () => {
    expect(formatTemp(37.42)).toBe('37.4 °C');
    expect(formatTemp(37, 'f')).toBe('98.6 °F');
  });
});

describe('lastTemperature', () => {
  it('returns the most recent reading', () => {
    const events: EventLike[] = [
      { type: 'temperature', started_at: '2026-07-20T08:00:00.000Z', data: { temp_c: 37.1 } },
      { type: 'temperature', started_at: '2026-07-20T11:00:00.000Z', data: { temp_c: 38.0 } },
      { type: 'bottle', started_at: '2026-07-20T12:00:00.000Z' },
    ];
    expect(lastTemperature(events)?.started_at).toBe('2026-07-20T11:00:00.000Z');
  });

  it('is null with no readings', () => {
    expect(lastTemperature([])).toBeNull();
  });
});
