import { View as RNView, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from './ThemeProvider';
import { type Theme } from './themes';

export type ThemedViewProps = ViewProps & {
  /** Background surface token. */
  bg?: 'paper' | 'surface' | 'surfaceSunk' | 'none';
  radius?: keyof Theme['radius'];
  padding?: keyof Theme['space'];
  /** Apply the theme's soft diffuse elevation shadow. */
  elevated?: boolean;
};

/** Themed view. Reads surface color, radius, spacing, and elevation from tokens. */
export function View({
  bg = 'none',
  radius,
  padding,
  elevated = false,
  style,
  ...rest
}: ThemedViewProps) {
  const theme = useTheme();
  const s: ViewStyle = {};
  if (bg !== 'none') s.backgroundColor = theme.color[bg];
  if (radius) s.borderRadius = theme.radius[radius];
  if (padding) s.padding = theme.space[padding];
  if (elevated) {
    s.shadowColor = theme.elevation.shadowColor;
    s.shadowOpacity = theme.elevation.shadowOpacity;
    s.shadowRadius = theme.elevation.shadowRadius;
    s.shadowOffset = { width: 0, height: theme.elevation.shadowOffsetY };
    s.elevation = 3;
  }
  return <RNView style={[s, style]} {...rest} />;
}
