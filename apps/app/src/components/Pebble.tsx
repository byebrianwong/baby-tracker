import { isLightColor } from '@baby-bean/core';
import { type ReactNode, useState } from 'react';
import { Pressable, type PressableProps, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { type AccentName, Text, useTheme } from '@/theme';

import { type HapticKind, useHaptic } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PebbleVariant = 'primary' | 'secondary' | 'ghost';

export type PebbleProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: PebbleVariant;
  /** Tints a primary pebble with a category color (feed, sleep, …). */
  category?: AccentName;
  iconLeft?: ReactNode;
  haptic?: HapticKind;
  style?: ViewStyle;
};

/**
 * The primary rounded "pebble" button. `primary` is 64px tall and category-
 * colorable for the quick-log bar; `secondary`/`ghost` for everything else.
 * Soft press-scale (reduced-motion aware) + a confirmation haptic on native.
 */
export function Pebble({
  label,
  variant = 'primary',
  category,
  iconLeft,
  haptic = 'light',
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  ...rest
}: PebbleProps) {
  const theme = useTheme();
  const fireHaptic = useHaptic();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary'
      ? category
        ? theme.color.accent[category]
        : theme.color.primary
      : variant === 'secondary'
        ? theme.color.surface
        : 'transparent';

  const textColor =
    variant === 'primary'
      ? isLightColor(bg)
        ? theme.color.ink
        : theme.color.paper
      : variant === 'ghost'
        ? theme.color.primary
        : theme.color.ink;

  const base: ViewStyle = {
    minHeight: variant === 'primary' ? theme.size.pebblePrimary : theme.size.tapMin,
    gap: theme.space.sm,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.lg,
    backgroundColor: bg,
    opacity: disabled ? 0.45 : 1,
    borderWidth: variant === 'secondary' ? theme.size.hairline : 0,
    borderColor: theme.color.line,
  };

  const focusRing: ViewStyle = focused
    ? { borderWidth: 2, borderColor: theme.color.primary }
    : {};

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPressIn={() => {
        if (!reduceMotion) scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        if (!reduceMotion) scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
      onPress={(e) => {
        fireHaptic(haptic);
        onPress?.(e);
      }}
      style={[styles.row, base, focusRing, animatedStyle, style]}
      {...rest}
    >
      {iconLeft}
      <Text variant={variant === 'primary' ? 'subtitle' : 'body'} style={{ color: textColor }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
