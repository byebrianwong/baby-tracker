import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, View as RNView } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { type AccentName, Text, useTheme, View } from '@/theme';

import { Icon, type IconName } from './icons/Icon';

export type TimelineRowProps = {
  accent: AccentName;
  icon?: IconName;
  /** e.g. "2:14 pm" */
  time: string;
  /** One-line summary, e.g. "Left breast · 18 min". */
  title: string;
  right?: ReactNode;
  onPress?: () => void;
  /**
   * Swipe-reveal actions (undo/delete). The row does NOT implement the data
   * action — the consumer supplies the buttons and wires them.
   */
  renderRightActions?: ComponentProps<typeof ReanimatedSwipeable>['renderRightActions'];
};

/** A single event row: category dot/icon, time, one-line summary, right affordance. */
export function TimelineRow({
  accent,
  icon,
  time,
  title,
  right,
  onPress,
  renderRightActions,
}: TimelineRowProps) {
  const theme = useTheme();

  const content = (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${title}, ${time}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        paddingVertical: theme.space.md,
        paddingHorizontal: theme.space.lg,
        minHeight: theme.size.tapMin,
        backgroundColor: theme.color.paper,
      }}
    >
      <RNView
        style={{
          width: theme.size.tapMin,
          height: theme.size.tapMin,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.color.accentSoft[accent],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon ? (
          <Icon name={icon} size={theme.space.xl} color={theme.color.accent[accent]} />
        ) : (
          <RNView
            style={{
              width: theme.space.md,
              height: theme.space.md,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.color.accent[accent],
            }}
          />
        )}
      </RNView>
      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text variant="body">{title}</Text>
        <Text variant="caption" color="inkSoft">
          {time}
        </Text>
      </View>
      {right}
    </Pressable>
  );

  if (!renderRightActions) return content;

  return (
    <ReanimatedSwipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={theme.size.tapMin}
    >
      {content}
    </ReanimatedSwipeable>
  );
}
