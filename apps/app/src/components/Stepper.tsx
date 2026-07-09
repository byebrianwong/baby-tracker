import { clamp } from '@baby-bean/core';
import { Pressable, type PressableProps } from 'react-native';

import { Text, useTheme, View } from '@/theme';

import { useHaptic } from './haptics';
import { Icon, type IconName } from './icons/Icon';

function RoundButton({
  icon,
  label,
  onPress,
  disabled,
  ...rest
}: { icon: IconName; label: string } & Omit<PressableProps, 'children'>) {
  const theme = useTheme();
  const fireHaptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(e) => {
        fireHaptic('selection');
        onPress?.(e);
      }}
      style={{
        width: theme.size.tapMin,
        height: theme.size.tapMin,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.color.surfaceSunk,
        opacity: disabled ? 0.4 : 1,
      }}
      {...rest}
    >
      <Icon name={icon} size={theme.space.xl} />
    </Pressable>
  );
}

export type QuickPick<T> = { label: string; value: T };

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  quickPicks?: QuickPick<number>[];
};

/** Fast number adjustment (volumes, counts) with +/- and optional quick picks. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  unit,
  quickPicks,
}: StepperProps) {
  const theme = useTheme();
  const set = (n: number) => onChange(clamp(n, min, max));
  return (
    <View style={{ gap: theme.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg }}>
        <RoundButton icon="minus" label={`Decrease by ${step}`} onPress={() => set(value - step)} disabled={value <= min} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.space.xs, minWidth: theme.size.pebblePrimary, justifyContent: 'center' }}>
          <Text variant="mono" style={{ fontSize: theme.type.scale.title }}>
            {value}
          </Text>
          {unit ? (
            <Text variant="body" color="inkSoft">
              {unit}
            </Text>
          ) : null}
        </View>
        <RoundButton icon="plus" label={`Increase by ${step}`} onPress={() => set(value + step)} disabled={value >= max} />
      </View>
      {quickPicks && quickPicks.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {quickPicks.map((q) => (
            <Chip key={q.label} label={q.label} selected={value === q.value} onPress={() => set(q.value)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export type TimeStepperProps = {
  value: Date;
  onChange: (value: Date) => void;
  /** Minute increment for the +/- buttons. */
  stepMinutes?: number;
  /** Quick "N min ago" offsets, in minutes back from now. */
  offsetsMinutes?: number[];
  /** Injected clock for testability; defaults to Date.now via new Date(). */
  now?: () => Date;
};

/**
 * Fast time adjustment for backdating. Quick "N min ago" offsets plus fine
 * +/- stepping. The full editor (P1-5) builds on this primitive.
 */
export function TimeStepper({
  value,
  onChange,
  stepMinutes = 5,
  offsetsMinutes = [0, 15, 30, 60],
  now,
}: TimeStepperProps) {
  const theme = useTheme();
  const shift = (mins: number) => onChange(new Date(value.getTime() + mins * 60_000));
  const setOffsetAgo = (mins: number) => {
    const base = now ? now() : new Date();
    onChange(new Date(base.getTime() - mins * 60_000));
  };
  return (
    <View style={{ gap: theme.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg }}>
        <RoundButton icon="minus" label={`Back ${stepMinutes} minutes`} onPress={() => shift(-stepMinutes)} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, minWidth: 120, justifyContent: 'center' }}>
          <Icon name="clock" size={theme.space.xl} color={theme.color.inkSoft} />
          <Text variant="mono" style={{ fontSize: theme.type.scale.subtitle }}>
            {formatClock(value)}
          </Text>
        </View>
        <RoundButton icon="plus" label={`Forward ${stepMinutes} minutes`} onPress={() => shift(stepMinutes)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {offsetsMinutes.map((m) => (
          <Chip key={m} label={m === 0 ? 'Now' : `${m} min ago`} onPress={() => setOffsetAgo(m)} />
        ))}
      </View>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const fireHaptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        fireHaptic('selection');
        onPress();
      }}
      style={{
        minHeight: theme.size.tapMin,
        paddingHorizontal: theme.space.lg,
        justifyContent: 'center',
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.color.primarySoft : theme.color.surfaceSunk,
        borderWidth: theme.size.hairline,
        borderColor: selected ? theme.color.primary : theme.color.line,
      }}
    >
      <Text variant="body" style={{ color: selected ? theme.color.primary : theme.color.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatClock(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'am' : 'pm';
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}
