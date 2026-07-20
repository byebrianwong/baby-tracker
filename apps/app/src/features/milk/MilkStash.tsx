import { formatClockTime, formatVolume, nextToUse, stashTotals } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble, Stepper } from '@/components';
import { useUndo } from '@/features/logging/feedback/UndoController';
import { useMilkActions, useMilkStash } from '@/state';
import { Text, useTheme, View } from '@/theme';

const STORAGES = [
  { key: 'fridge', label: 'Fridge' },
  { key: 'freezer', label: 'Freezer' },
] as const;

/**
 * The expressed-milk stash: what's on hand, and which bag to use next.
 *
 * FIFO is the whole point — "use this one first" is the answer that keeps milk
 * from quietly aging out at the back of the freezer. Storage-life windows are
 * not shown, because safe-storage guidance is a pediatrician conversation and
 * not a constant we should assert (spec §1).
 */
export const MilkStash = observer(function MilkStash() {
  const theme = useTheme();
  const stash = useMilkStash();
  const { addMilk, markUsed, markDiscarded, restore } = useMilkActions();
  const { showUndo } = useUndo();

  const [volume, setVolume] = useState(120);
  const [storage, setStorage] = useState<'fridge' | 'freezer'>('fridge');

  const totals = useMemo(() => stashTotals(stash), [stash]);
  const next = useMemo(() => nextToUse(stash), [stash]);

  const add = () => {
    if (volume <= 0) return;
    const id = addMilk({ volume_ml: volume, storage });
    // There is no delete on the stash, so undoing an add takes the bag back
    // off the shelf the only way the domain allows.
    if (id) showUndo(`Added ${formatVolume(volume)} to the ${storage}`, () => markDiscarded(id));
  };

  const use = () => {
    if (!next?.id) return;
    const id = next.id;
    markUsed(id);
    showUndo(`Used ${formatVolume(next.volume_ml)}`, () => restore(id));
  };

  return (
    <View style={{ gap: theme.space.md }}>
      <Text variant="subtitle">Milk stash</Text>

      <View
        bg="surface"
        radius="lg"
        padding="lg"
        style={{ gap: theme.space.sm, borderWidth: theme.size.hairline, borderColor: theme.color.line }}
      >
        <Text variant="display" style={{ fontSize: theme.type.scale.title }}>
          {formatVolume(totals.totalMl)}
        </Text>
        <Text variant="body" color="inkSoft">
          {totals.count === 0
            ? 'Nothing stored yet.'
            : `${formatVolume(totals.fridgeMl)} fridge · ${formatVolume(totals.freezerMl)} freezer · ${totals.count} ${totals.count === 1 ? 'bag' : 'bags'}`}
        </Text>

        {next ? (
          <View style={{ gap: theme.space.sm, marginTop: theme.space.sm }}>
            <Text variant="caption" color="inkSoft">
              {`Use first: ${formatVolume(next.volume_ml)} from the ${next.storage}, stored ${formatClockTime(new Date(next.pumped_at))}`}
            </Text>
            <Pebble label="Mark oldest used" variant="secondary" onPress={use} />
          </View>
        ) : null}
      </View>

      <View style={{ gap: theme.space.sm }}>
        <Text variant="caption" color="inkSoft">
          Add to the stash
        </Text>
        <Stepper
          value={volume}
          onChange={setVolume}
          step={10}
          min={0}
          max={500}
          unit="ml"
          quickPicks={[
            { label: '60', value: 60 },
            { label: '90', value: 90 },
            { label: '120', value: 120 },
            { label: '150', value: 150 },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          {STORAGES.map((s) => {
            const selected = storage === s.key;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStorage(s.key)}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.xl,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: selected ? theme.color.accentSoft.pump : theme.color.surfaceSunk,
                  borderWidth: theme.size.hairline,
                  borderColor: selected ? theme.color.accent.pump : theme.color.line,
                }}
              >
                <Text variant="body">{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pebble label={`Store ${formatVolume(volume)}`} variant="secondary" onPress={add} disabled={volume <= 0} />
      </View>
    </View>
  );
});
