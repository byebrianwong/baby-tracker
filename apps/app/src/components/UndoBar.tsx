import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, useTheme, View } from '@/theme';

import { useHaptic } from './haptics';

export type UndoBarProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. */
  duration?: number;
};

/**
 * Brief inline confirmation with an Undo affordance. Presentational: the
 * consumer supplies the message and the undo/dismiss handlers. Auto-dismisses.
 */
export function UndoBar({
  visible,
  message,
  actionLabel = 'Undo',
  onAction,
  onDismiss,
  duration = 4000,
}: UndoBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fireHaptic = useHaptic();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(theme.motion.base)}
      exiting={reduce ? undefined : FadeOutDown.duration(theme.motion.fast)}
      style={[styles.wrap, { bottom: insets.bottom + theme.space.lg, paddingHorizontal: theme.space.lg }]}
      pointerEvents="box-none"
    >
      <View
        bg="surface"
        elevated
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingLeft: theme.space.lg,
          paddingRight: theme.space.sm,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.pill,
          borderWidth: theme.size.hairline,
          borderColor: theme.color.line,
        }}
      >
        <Text variant="body" style={{ flex: 1 }}>
          {message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            fireHaptic('medium');
            onAction();
          }}
          style={{
            minHeight: theme.size.tapMin,
            paddingHorizontal: theme.space.lg,
            justifyContent: 'center',
            borderRadius: theme.radius.pill,
          }}
        >
          <Text variant="subtitle" color="primary" style={{ fontSize: theme.type.scale.bodyLarge }}>
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
