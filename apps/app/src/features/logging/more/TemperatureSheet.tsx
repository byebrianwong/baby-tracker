import { cToF, formatClockTime, formatTemp, fToC, lastTemperature, type TempUnit } from '@baby-bean/core';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble, Sheet } from '@/components';
import { Field } from '@/features/auth/Field';
import { useTimeline } from '@/features/logging/data';
import { Text, useTheme, View } from '@/theme';

const UNITS: { key: TempUnit; label: string }[] = [
  { key: 'c', label: '°C' },
  { key: 'f', label: '°F' },
];

export type TemperaturePayload = { tempC: number; unit: TempUnit; method: string | null };

export type TemperatureSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: TemperaturePayload) => void;
};

/**
 * Record a temperature. Stored in Celsius whichever scale it was typed in, so
 * switching units never loses precision.
 *
 * No thresholds, no "high" flag — reading a number back to a pediatrician is
 * the job; interpreting it is theirs (spec §1).
 */
export function TemperatureSheet({ visible, onClose, onSave }: TemperatureSheetProps) {
  const theme = useTheme();
  const timeline = useTimeline();

  const [unit, setUnit] = useState<TempUnit>('c');
  const [value, setValue] = useState('');
  const [method, setMethod] = useState('');

  const last = useMemo(() => lastTemperature(timeline), [timeline]);
  const lastC = (last?.data as { temp_c?: number } | undefined)?.temp_c;

  const parsed = Number.parseFloat(value);
  const valid = Number.isFinite(parsed);

  const switchUnit = (next: TempUnit) => {
    if (next === unit) return;
    if (valid) setValue((next === 'f' ? cToF(parsed) : fToC(parsed)).toFixed(1));
    setUnit(next);
  };

  const save = () => {
    if (!valid) return;
    onSave({
      tempC: unit === 'f' ? fToC(parsed) : parsed,
      unit,
      method: method.trim() || null,
    });
    setValue('');
    setMethod('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log temperature">
      <View style={{ gap: theme.space.lg }}>
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          {UNITS.map((u) => {
            const selected = unit === u.key;
            return (
              <Pressable
                key={u.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={u.key === 'c' ? 'Celsius' : 'Fahrenheit'}
                onPress={() => switchUnit(u.key)}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.xl,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: selected ? theme.color.accentSoft.health : theme.color.surfaceSunk,
                  borderWidth: theme.size.hairline,
                  borderColor: selected ? theme.color.accent.health : theme.color.line,
                }}
              >
                <Text variant="body">{u.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label={`Reading (${unit === 'f' ? '°F' : '°C'})`}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={unit === 'f' ? '99.3' : '37.4'}
        />

        <Field
          label="Where you took it (optional)"
          value={method}
          onChangeText={setMethod}
          autoCapitalize="none"
          placeholder="armpit"
        />

        {lastC != null && last ? (
          <Text variant="caption" color="inkSoft">
            {`Last reading ${formatTemp(lastC, unit)} at ${formatClockTime(new Date(last.started_at))}`}
          </Text>
        ) : null}

        <Pebble label="Log temperature" onPress={save} disabled={!valid} />

        <Text variant="caption" color="inkSoft">
          Baby Bean keeps the record. Call your pediatrician with any concern about a temperature.
        </Text>
      </View>
    </Sheet>
  );
}
