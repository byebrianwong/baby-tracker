import { doseStatus, formatClockTime, formatDuration, medicationsGiven } from '@baby-bean/core';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble, Sheet, Stepper } from '@/components';
import { Field } from '@/features/auth/Field';
import { useTimeline } from '@/features/logging/data';
import { Text, useTheme, View } from '@/theme';

const UNITS = ['ml', 'mg', 'drop', 'tablet'] as const;

export type MedicationPayload = {
  name: string;
  amount: number | null;
  unit: string;
  minIntervalHours: number | null;
};

export type MedicationSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: MedicationPayload) => void;
};

/**
 * Log a dose, and answer the 3am question: when was the last one?
 *
 * The interval is the caregiver's own — read off the label or given by their
 * pediatrician. Baby Bean never supplies a dose amount or a drug interval
 * (spec §1: not a doctor); it only does the arithmetic on what was entered.
 */
export function MedicationSheet({ visible, onClose, onSave }: MedicationSheetProps) {
  const theme = useTheme();
  const timeline = useTimeline();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<string>('ml');
  const [intervalHours, setIntervalHours] = useState(0);

  const recent = useMemo(() => medicationsGiven(timeline).slice(0, 4), [timeline]);

  const status = useMemo(
    () =>
      name.trim()
        ? doseStatus({
            events: timeline,
            name,
            minIntervalHours: intervalHours > 0 ? intervalHours : null,
            now: new Date(),
          })
        : null,
    [timeline, name, intervalHours],
  );

  const parsedAmount = Number.parseFloat(amount);
  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
      unit,
      // Carry forward the interval this medication already remembers, so
      // re-logging it doesn't silently forget what the label said.
      minIntervalHours: intervalHours > 0 ? intervalHours : (status?.intervalHours ?? null),
    });
    setName('');
    setAmount('');
    setIntervalHours(0);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log medication">
      <View style={{ gap: theme.space.lg }}>
        <Field
          label="Medication"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Infant acetaminophen"
        />

        {recent.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
            {recent.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityLabel={`Use ${m}`}
                onPress={() => setName(m)}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.lg,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.surfaceSunk,
                  borderWidth: theme.size.hairline,
                  borderColor: theme.color.line,
                }}
              >
                <Text variant="body">{m}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {status?.lastAt ? (
          <View
            style={{
              gap: theme.space.xs,
              padding: theme.space.md,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.accentSoft.health,
            }}
          >
            <Text variant="body">
              {`Last dose ${formatClockTime(new Date(status.lastAt))} · ${status.countLast24h} in the last 24h`}
            </Text>
            {status.nextAt ? (
              <Text variant="caption" color="inkSoft">
                {status.readyInSeconds && status.readyInSeconds > 0
                  ? `Your ${status.intervalHours}h interval is up at ${formatClockTime(new Date(status.nextAt))} — ${formatDuration(status.readyInSeconds)} away`
                  : `Your ${status.intervalHours}h interval passed at ${formatClockTime(new Date(status.nextAt))}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="2.5"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {UNITS.map((u) => {
            const selected = unit === u;
            return (
              <Pressable
                key={u}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setUnit(u)}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.lg,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: selected ? theme.color.accentSoft.health : theme.color.surfaceSunk,
                  borderWidth: theme.size.hairline,
                  borderColor: selected ? theme.color.accent.health : theme.color.line,
                }}
              >
                <Text variant="body">{u}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Text variant="caption" color="inkSoft">
            {intervalHours > 0
              ? `Minimum hours between doses, from the label (${intervalHours}h)`
              : status?.intervalHours
                ? `Minimum hours between doses, from the label (remembered: ${status.intervalHours}h)`
                : 'Minimum hours between doses, from the label (not set)'}
          </Text>
          <Stepper value={intervalHours} onChange={setIntervalHours} step={1} min={0} max={24} unit="h" />
        </View>

        <Pebble label="Log dose" onPress={save} disabled={!canSave} />

        <Text variant="caption" color="inkSoft">
          Baby Bean records what you enter. It never suggests a dose or an interval — follow the label and
          your pediatrician.
        </Text>
      </View>
    </Sheet>
  );
}
