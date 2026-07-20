import { describe, expect, it } from 'vitest';

import { type EventLike } from './events';
import { foodHistory, isNewFood } from './foods';

const solid = (at: string, data: Record<string, unknown>): EventLike => ({
  type: 'solids',
  started_at: at,
  data,
});

describe('foodHistory', () => {
  const events = [
    solid('2026-07-18T12:00:00.000Z', { food: 'Avocado' }),
    solid('2026-07-19T12:00:00.000Z', { food: 'Peanut', reaction: 'rash after' }),
    solid('2026-07-20T12:00:00.000Z', { food: 'avocado' }),
    solid('2026-07-20T13:00:00.000Z', {}),
    { type: 'bottle', started_at: '2026-07-20T14:00:00.000Z' } as EventLike,
  ];

  it('collapses a food to one row with first and last dates', () => {
    const rows = foodHistory(events);
    const avocado = rows.find((r) => r.food === 'Avocado');
    expect(avocado).toMatchObject({
      firstAt: '2026-07-18T12:00:00.000Z',
      lastAt: '2026-07-20T12:00:00.000Z',
      times: 2,
    });
  });

  it('orders by most recently offered', () => {
    expect(foodHistory(events).map((r) => r.food)).toEqual(['Avocado', 'Peanut']);
  });

  it('keeps the caregivers original spelling and collects reactions', () => {
    const peanut = foodHistory(events).find((r) => r.food === 'Peanut');
    expect(peanut?.reactions).toEqual(['rash after']);
  });

  it('skips solids logged without a food name', () => {
    expect(foodHistory(events)).toHaveLength(2);
  });
});

describe('isNewFood', () => {
  const events = [solid('2026-07-18T12:00:00.000Z', { food: 'Avocado' })];

  it('is false for a food already tried, regardless of casing', () => {
    expect(isNewFood(events, 'avocado')).toBe(false);
  });

  it('is true for an untried food', () => {
    expect(isNewFood(events, 'Banana')).toBe(true);
  });

  it('is false for an empty name', () => {
    expect(isNewFood(events, '  ')).toBe(false);
  });
});
