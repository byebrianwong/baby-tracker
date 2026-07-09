import { describe, expect, it } from 'vitest';

import { isLightColor, mixHex, withAlpha } from './color';

describe('mixHex', () => {
  it('returns the first color at ratio 1', () => {
    expect(mixHex('#E8A87C', '#FBF7F1', 1)).toBe('#e8a87c');
  });

  it('returns the second color at ratio 0', () => {
    expect(mixHex('#E8A87C', '#FBF7F1', 0)).toBe('#fbf7f1');
  });

  it('blends toward the base at a low ratio (soft tint)', () => {
    // 13% of feed apricot over day paper.
    expect(mixHex('#E8A87C', '#FBF7F1', 0.13)).toBe('#f9ede2');
  });

  it('supports 3-digit hex', () => {
    expect(mixHex('#fff', '#000', 0.5)).toBe('#808080');
  });

  it('clamps ratios outside 0–1', () => {
    expect(mixHex('#ffffff', '#000000', 2)).toBe('#ffffff');
    expect(mixHex('#ffffff', '#000000', -1)).toBe('#000000');
  });

  it('throws on invalid hex', () => {
    expect(() => mixHex('nope', '#000000', 0.5)).toThrow();
  });
});

describe('withAlpha', () => {
  it('produces an rgba string', () => {
    expect(withAlpha('#4F6D8F', 0.5)).toBe('rgba(79, 109, 143, 0.5)');
  });

  it('clamps alpha', () => {
    expect(withAlpha('#000000', 5)).toBe('rgba(0, 0, 0, 1)');
  });
});

describe('isLightColor', () => {
  it('treats white and light accents as light', () => {
    expect(isLightColor('#FFFFFF')).toBe(true);
    expect(isLightColor('#E8A87C')).toBe(true); // feed apricot
  });

  it('treats black and the dusk-blue primary as dark', () => {
    expect(isLightColor('#000000')).toBe(false);
    expect(isLightColor('#4F6D8F')).toBe(false);
  });
});
