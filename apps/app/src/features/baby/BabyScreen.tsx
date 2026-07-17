import { formatAge } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pebble, Stepper } from '@/components';
import { Field } from '@/features/auth/Field';
import { useActiveChild, useLogging, useTimeline } from '@/features/logging/data';
import { useChildActions } from '@/state';
import { Text, useTheme, View } from '@/theme';

const SEXES = ['female', 'male', 'other'] as const;
type Sex = (typeof SEXES)[number];

function validDob(dob: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const t = new Date(dob).getTime();
  return !Number.isNaN(t) && t <= Date.now();
}

export const BabyScreen = observer(function BabyScreen() {
  const theme = useTheme();
  const child = useActiveChild();
  const { updateChild } = useChildActions();
  const { logInstant } = useLogging();
  const timeline = useTimeline();

  const [name, setName] = useState(child?.name ?? '');
  const [dob, setDob] = useState(child?.dob ?? '');
  const [sex, setSex] = useState<Sex | null>((child?.sex as Sex | null) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [weightG, setWeightG] = useState(0);
  const [heightCm, setHeightCm] = useState(0);
  const [headCm, setHeadCm] = useState(0);

  const lastGrowth = timeline.find((e) => e.type === 'growth');
  const g = (lastGrowth?.data ?? {}) as { weight_g?: number; height_cm?: number; head_cm?: number };

  const saveProfile = () => {
    if (!child) return;
    if (dob && !validDob(dob)) {
      setError('Enter the birth date as YYYY-MM-DD.');
      return;
    }
    setError(null);
    updateChild(child.id, { name: name.trim() || child.name, dob: dob || null, sex });
    setSaved(true);
  };

  const logGrowth = () => {
    const data: Record<string, number> = {};
    if (weightG > 0) data.weight_g = weightG;
    if (heightCm > 0) data.height_cm = heightCm;
    if (headCm > 0) data.head_cm = headCm;
    if (Object.keys(data).length === 0) return;
    logInstant('growth', { data });
    setWeightG(0);
    setHeightCm(0);
    setHeadCm(0);
  };

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView edges={['top']} style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl }}>
          <View style={{ gap: theme.space.xs }}>
            <Text variant="title">{child?.name ?? 'Baby'}</Text>
            {child?.dob && validDob(child.dob) ? (
              <Text variant="body" color="inkSoft">
                {formatAge(child.dob, new Date())} old
              </Text>
            ) : null}
          </View>

          {/* Profile */}
          <View style={{ gap: theme.space.md }}>
            <Text variant="subtitle">Profile</Text>
            <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field
              label="Birth date (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
              autoCapitalize="none"
              placeholder="2026-06-01"
            />
            <View style={{ gap: theme.space.sm }}>
              <Text variant="caption" color="inkSoft">
                Sex (for growth percentiles)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
                {SEXES.map((s) => {
                  const selected = sex === s;
                  return (
                    <Pressable
                      key={s}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSex(s)}
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
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {error ? (
              <Text variant="body" color="health">
                {error}
              </Text>
            ) : null}
            <Pebble label={saved ? 'Saved ✓' : 'Save profile'} onPress={saveProfile} />
          </View>

          {/* Growth */}
          <View style={{ gap: theme.space.md }}>
            <Text variant="subtitle">Growth</Text>
            {lastGrowth ? (
              <Text variant="body" color="inkSoft">
                Last:{' '}
                {[
                  g.weight_g ? `${(g.weight_g / 1000).toFixed(2)} kg` : null,
                  g.height_cm ? `${g.height_cm} cm` : null,
                  g.head_cm ? `${g.head_cm} cm head` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Text>
            ) : null}
            <LabeledStepper label="Weight (g)" value={weightG} onChange={setWeightG} step={50} max={20000} />
            <LabeledStepper label="Height (cm)" value={heightCm} onChange={setHeightCm} step={1} max={150} />
            <LabeledStepper label="Head (cm)" value={headCm} onChange={setHeadCm} step={1} max={70} />
            <Pebble label="Log measurement" variant="secondary" onPress={logGrowth} />
            <Text variant="caption" color="inkSoft">
              WHO percentile curves land here next (they need the official WHO reference tables bundled).
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

function LabeledStepper(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  max: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="caption" color="inkSoft">
        {props.label}
      </Text>
      <Stepper value={props.value} onChange={props.onChange} step={props.step} min={0} max={props.max} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
