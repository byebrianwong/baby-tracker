/**
 * Tiny pure color helpers used by the theme layer to derive values from the
 * base token palette (e.g. category "-soft" tints). Kept here so the math is
 * unit-tested and UI only consumes the result.
 */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) {
    throw new Error(`mixHex: invalid hex color "${hex}"`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(n: number): string {
  return Math.round(n).toString(16).padStart(2, '0');
}

/**
 * Blend `a` over `b` by `ratio` (0 → all `b`, 1 → all `a`). Used to lay a
 * category accent over the theme's paper at ~13% for its soft tint.
 */
export function mixHex(a: string, b: string, ratio: number): string {
  const t = Math.min(Math.max(ratio, 0), 1);
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = ar * t + br * (1 - t);
  const g = ag * t + bg * (1 - t);
  const bl = ab * t + bb * (1 - t);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/** Return an `rgba(...)` string for a hex color at the given alpha (0–1). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  const a = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Perceived-brightness test (YIQ). Used to pick a readable text/ink color to
 * lay over a colored surface (e.g. a category-tinted Pebble).
 */
export function isLightColor(hex: string): boolean {
  const [r, g, b] = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
