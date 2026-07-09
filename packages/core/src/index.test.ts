import { describe, expect, it } from 'vitest';

import { APP_NAME, clamp } from './index';

describe('core scaffold', () => {
  it('exposes the product name', () => {
    expect(APP_NAME).toBe('Baby Bean');
  });

  describe('clamp', () => {
    it('returns the value when in range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps below the minimum', () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });

    it('clamps above the maximum', () => {
      expect(clamp(42, 0, 10)).toBe(10);
    });

    it('throws when min > max', () => {
      expect(() => clamp(1, 10, 0)).toThrow();
    });
  });
});
