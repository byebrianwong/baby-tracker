import { View as RNView } from 'react-native';

import { type AccentName, Text, useTheme, View } from '@/theme';

export type StatusStatProps = {
  /** Small label, e.g. "since last feed". */
  label: string;
  /** Big glanceable value, e.g. "2h 10m". */
  value: string;
  sublabel?: string;
  accent?: AccentName;
};

/**
 * A large, glanceable stat for the Home status strip — answers "when did we
 * last…?" before any tapping. Big value in the display font.
 */
export function StatusStat({ label, value, sublabel, accent }: StatusStatProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${value} ${label}${sublabel ? `, ${sublabel}` : ''}`}
      style={{ gap: theme.space.xs, minWidth: theme.size.pebblePrimary }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.xs }}>
        {accent ? (
          <RNView
            style={{
              width: theme.space.sm,
              height: theme.space.sm,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.accent[accent],
            }}
          />
        ) : null}
        <Text variant="caption" color="inkSoft">
          {label}
        </Text>
      </View>
      <Text variant="display" style={{ fontSize: theme.type.scale.title }}>
        {value}
      </Text>
      {sublabel ? (
        <Text variant="caption" color="inkSoft">
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
