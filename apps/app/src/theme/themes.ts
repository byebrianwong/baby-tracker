import { tokens } from '@baby-bean/config';
import { mixHex } from '@baby-bean/core';

export type ThemeMode = 'day' | 'dark' | 'night';

type ColorSet = (typeof tokens.color)['day'];
export type AccentName = keyof ColorSet['accent'];

export type Theme = {
  mode: ThemeMode;
  isDark: boolean;
  color: {
    paper: string;
    surface: string;
    surfaceSunk: string;
    ink: string;
    inkSoft: string;
    line: string;
    primary: string;
    primarySoft: string;
    /** Full-strength category accents. */
    accent: Record<AccentName, string>;
    /** Category accents laid over the theme's paper (~13%) for dots/backgrounds. */
    accentSoft: Record<AccentName, string>;
  };
  radius: typeof tokens.radius;
  space: typeof tokens.space;
  size: typeof tokens.size;
  motion: typeof tokens.motion;
  type: typeof tokens.type;
  elevation: (typeof tokens.elevation)['day'];
  night: typeof tokens.night;
};

const SOFT_RATIO = tokens.night.softMixRatio;

function buildTheme(mode: ThemeMode): Theme {
  const c = tokens.color[mode];
  const keys = Object.keys(c.accent) as AccentName[];
  const accent = {} as Record<AccentName, string>;
  const accentSoft = {} as Record<AccentName, string>;
  for (const k of keys) {
    accent[k] = c.accent[k];
    accentSoft[k] = mixHex(c.accent[k], c.paper, SOFT_RATIO);
  }
  return {
    mode,
    isDark: mode !== 'day',
    color: {
      paper: c.paper,
      surface: c.surface,
      surfaceSunk: c.surfaceSunk,
      ink: c.ink,
      inkSoft: c.inkSoft,
      line: c.line,
      primary: c.primary,
      primarySoft: c.primarySoft,
      accent,
      accentSoft,
    },
    radius: tokens.radius,
    space: tokens.space,
    size: tokens.size,
    motion: tokens.motion,
    type: tokens.type,
    elevation: tokens.elevation[mode],
    night: tokens.night,
  };
}

/** The three resolved themes, built once from tokens. */
export const themes: Record<ThemeMode, Theme> = {
  day: buildTheme('day'),
  dark: buildTheme('dark'),
  night: buildTheme('night'),
};
