import { type ReactNode, useEffect } from 'react';
import { Modal, Pressable, type PressableProps, StyleSheet, View as RNView } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AccentName, Text, useTheme, View } from '@/theme';

import { useHaptic } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * A bottom sheet for quick choices. Opens fast, dismisses by backdrop tap or
 * back gesture, one-handed. Options (see `SheetOption`) render as large targets.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  const height = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      progress.value = reduce ? 1 : withTiming(1, { duration: theme.motion.base });
    }
  }, [visible, reduce, progress, theme.motion.base]);

  const close = () => {
    if (reduce) {
      onClose();
      return;
    }
    progress.value = withTiming(0, { duration: theme.motion.fast }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.5 }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <RNView style={styles.fill}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={close}
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Animated.View
          onLayout={(e) => {
            height.value = e.nativeEvent.layout.height;
          }}
          style={[styles.panelWrap, panelStyle]}
        >
          <View
            bg="surface"
            style={{
              paddingBottom: insets.bottom + theme.space.lg,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
            }}
          >
            <View style={{ alignItems: 'center', paddingVertical: theme.space.sm }}>
              <RNView
                style={{
                  width: theme.space.xxxl,
                  height: theme.space.xs,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.line,
                }}
              />
            </View>
            {title ? (
              <Text variant="subtitle" style={{ paddingHorizontal: theme.space.lg, marginBottom: theme.space.md }}>
                {title}
              </Text>
            ) : null}
            <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.sm }}>{children}</View>
          </View>
        </Animated.View>
      </RNView>
    </Modal>
  );
}

export type SheetOptionProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  sublabel?: string;
  category?: AccentName;
  iconLeft?: ReactNode;
};

/** A large, one-handed choice row for use inside a Sheet. */
export function SheetOption({
  label,
  sublabel,
  category,
  iconLeft,
  onPress,
  accessibilityLabel,
  ...rest
}: SheetOptionProps) {
  const theme = useTheme();
  const fireHaptic = useHaptic();
  const tint = category ? theme.color.accentSoft[category] : theme.color.surfaceSunk;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={(e) => {
        fireHaptic('light');
        onPress?.(e);
      }}
      style={{
        minHeight: theme.size.pebblePrimary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        paddingHorizontal: theme.space.lg,
        borderRadius: theme.radius.md,
        backgroundColor: tint,
      }}
      {...rest}
    >
      {iconLeft}
      <View style={{ flex: 1 }}>
        <Text variant="bodyLarge">{label}</Text>
        {sublabel ? (
          <Text variant="caption" color="inkSoft">
            {sublabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: '#000000' },
  panelWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
