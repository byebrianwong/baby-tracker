import { foodHistory, isNewFood } from '@baby-bean/core';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble, Sheet } from '@/components';
import { Field } from '@/features/auth/Field';
import { useTimeline } from '@/features/logging/data';
import { Text, useTheme, View } from '@/theme';

export type SolidsPayload = { food: string; reaction: string | null };

export type SolidsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: SolidsPayload) => void;
};

/**
 * Log a solid food. The value here is the history: what has been tried, when it
 * was first tried, and anything the caregiver noticed after — the record an
 * allergist asks for. We never label a food safe or risky.
 */
export function SolidsSheet({ visible, onClose, onSave }: SolidsSheetProps) {
  const theme = useTheme();
  const timeline = useTimeline();

  const [food, setFood] = useState('');
  const [reaction, setReaction] = useState('');

  const tried = useMemo(() => foodHistory(timeline).slice(0, 6), [timeline]);
  const firstTaste = food.trim().length > 0 && isNewFood(timeline, food);
  const canSave = food.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({ food: food.trim(), reaction: reaction.trim() || null });
    setFood('');
    setReaction('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log solids">
      <View style={{ gap: theme.space.lg }}>
        <Field label="Food" value={food} onChangeText={setFood} autoCapitalize="words" placeholder="Avocado" />

        {tried.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
            {tried.map((f) => (
              <Pressable
                key={f.food}
                accessibilityRole="button"
                accessibilityLabel={`Use ${f.food}`}
                onPress={() => setFood(f.food)}
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
                <Text variant="body">{`${f.food} · ${f.times}×`}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {firstTaste ? (
          <View
            style={{
              padding: theme.space.md,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.accentSoft.solids,
            }}
          >
            <Text variant="body">First taste — worth watching for a few days.</Text>
          </View>
        ) : null}

        <Field
          label="Anything you noticed (optional)"
          value={reaction}
          onChangeText={setReaction}
          placeholder="Rash after, ate the whole bowl…"
        />

        <Pebble label="Log solids" onPress={save} disabled={!canSave} />
      </View>
    </Sheet>
  );
}
