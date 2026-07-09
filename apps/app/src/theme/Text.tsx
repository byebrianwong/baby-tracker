import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { FONT } from './fonts';
import { useTheme } from './ThemeProvider';
import { type AccentName, type Theme } from './themes';

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'bodyLarge'
  | 'body'
  | 'caption'
  | 'mono';

export type TextColor = 'ink' | 'inkSoft' | 'primary' | 'inverse' | AccentName;

type ScaleKey = keyof Theme['type']['scale'];

const VARIANT: Record<TextVariant, { family: string; size: ScaleKey; tabular?: boolean }> = {
  display: { family: FONT.displaySemiBold, size: 'display' },
  title: { family: FONT.displaySemiBold, size: 'title' },
  subtitle: { family: FONT.bodySemiBold, size: 'subtitle' },
  bodyLarge: { family: FONT.bodyRegular, size: 'bodyLarge' },
  body: { family: FONT.bodyRegular, size: 'body' },
  caption: { family: FONT.bodyRegular, size: 'caption' },
  mono: { family: FONT.monoMedium, size: 'body', tabular: true },
};

export type ThemedTextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
};

/** Themed text. Picks the right font family, size, line height, and color from tokens. */
export function Text({ variant = 'body', color = 'ink', style, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const v = VARIANT[variant];
  const resolved: TextStyle = {
    fontFamily: v.family,
    fontSize: theme.type.scale[v.size],
    lineHeight: theme.type.lineHeight[v.size],
    color: resolveColor(theme, color),
  };
  if (v.tabular) {
    resolved.fontVariant = ['tabular-nums'];
  }
  return <RNText style={[resolved, style]} {...rest} />;
}

function resolveColor(theme: Theme, color: TextColor): string {
  switch (color) {
    case 'ink':
      return theme.color.ink;
    case 'inkSoft':
      return theme.color.inkSoft;
    case 'primary':
      return theme.color.primary;
    case 'inverse':
      return theme.color.paper;
    default:
      return theme.color.accent[color];
  }
}
