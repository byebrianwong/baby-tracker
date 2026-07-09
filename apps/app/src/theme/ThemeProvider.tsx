import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { type Theme, type ThemeMode, themes } from './themes';

/** What the user picks. `system` follows the OS light/dark; `night` is explicit. */
export type ThemePreference = 'system' | ThemeMode;

type ThemeContextValue = {
  /** The resolved, active theme. */
  theme: Theme;
  /** Resolved mode after applying preference + system scheme. */
  mode: ThemeMode;
  /** The user's stored preference. */
  preference: ThemePreference;
  /** True when the signature Night feed mode is active. */
  isNight: boolean;
  setPreference: (preference: ThemePreference) => void;
  /**
   * Night feed dimming plumbing (spec §9.4). 0 = full brightness; the timer UI
   * (Phase 1/6) escalates this after inactivity to dim the nursery further.
   */
  dimLevel: number;
  escalateDim: () => void;
  resetDim: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialPreference = 'system',
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [dimLevel, setDimLevel] = useState(0);

  const mode: ThemeMode =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'day') : preference;
  const theme = themes[mode];
  const isNight = mode === 'night';

  const escalateDim = useCallback(() => setDimLevel(themes.night.night.dimmedOpacity), []);
  const resetDim = useCallback(() => setDimLevel(0), []);

  // Leaving Night mode always clears any accumulated dimming.
  const setPreferenceSafe = useCallback((next: ThemePreference) => {
    setPreference(next);
    if (next !== 'night') setDimLevel(0);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      preference,
      isNight,
      setPreference: setPreferenceSafe,
      dimLevel,
      escalateDim,
      resetDim,
    }),
    [theme, mode, preference, isNight, setPreferenceSafe, dimLevel, escalateDim, resetDim],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme / useThemeMode must be used within <ThemeProvider>.');
  }
  return ctx;
}

/** The resolved theme (colors, spacing, type, …). Most UI uses this. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Mode controls + Night dimming plumbing. */
export function useThemeMode(): Omit<ThemeContextValue, 'theme'> {
  const { theme: _theme, ...rest } = useThemeContext();
  return rest;
}
