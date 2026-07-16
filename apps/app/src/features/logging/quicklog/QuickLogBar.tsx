import { type DiaperContents, elapsedSeconds, type EventType, formatStopwatch } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';

import { Icon, Pebble } from '@/components';
import { useLogging, useNextBreastSide, useRunningTimers } from '@/features/logging/data';
import { DiaperSheet } from '@/features/logging/diaper/DiaperSheet';
import { useUndo } from '@/features/logging/feedback/UndoController';
import { type AccentName, useTheme, View } from '@/theme';

import { useTicker } from './useTicker';

type Item = {
  label: string;
  category: AccentName;
  icon: 'feed' | 'diaper' | 'sleep' | 'pump';
  /** null = diaper (instant sheet); otherwise a timed event type. */
  type: EventType | null;
};

const ITEMS: Item[] = [
  { label: 'Feed', category: 'feed', icon: 'feed', type: 'breast' },
  { label: 'Diaper', category: 'diaper', icon: 'diaper', type: null },
  { label: 'Sleep', category: 'sleep', icon: 'sleep', type: 'sleep' },
  { label: 'Pump', category: 'pump', icon: 'pump', type: 'pump' },
];

/**
 * The primary logging surface (thumb zone). Feed/Sleep/Pump are one-tap timers
 * — tap to start (live elapsed shows on the pebble), tap again to stop. Diaper
 * opens the two-tap instant sheet. Every log offers an immediate undo.
 */
export const QuickLogBar = observer(function QuickLogBar() {
  const theme = useTheme();
  const { startTimer, stopTimer, logInstant, deleteEvent } = useLogging();
  const { showUndo } = useUndo();
  const running = useRunningTimers();
  const nextSide = useNextBreastSide();
  const now = useTicker(running.length > 0);

  const [diaperOpen, setDiaperOpen] = useState(false);

  const runningOf = (type: EventType) => running.find((e) => e.type === type);

  const onTimed = (type: EventType) => {
    const active = runningOf(type);
    if (active) {
      stopTimer(active.id);
      showUndo('Logged', () => deleteEvent(active.id));
      return;
    }
    const id = startTimer(type, type === 'breast' ? { breastSide: nextSide } : {});
    if (id) showUndo(type === 'breast' ? `Feed started · ${nextSide}` : 'Started', () => deleteEvent(id));
  };

  const onDiaper = (contents: DiaperContents) => {
    const id = logInstant('diaper', { diaper_contents: contents });
    if (id) showUndo(`Logged ${contents} diaper`, () => deleteEvent(id));
  };

  return (
    <>
      <View
        bg="surface"
        style={[
          styles.bar,
          {
            paddingHorizontal: theme.space.lg,
            paddingTop: theme.space.md,
            paddingBottom: theme.space.md,
            gap: theme.space.sm,
            borderTopWidth: theme.size.hairline,
            borderTopColor: theme.color.line,
          },
        ]}
      >
        {ITEMS.map((item) => {
          const active = item.type ? runningOf(item.type) : undefined;
          const label = active ? formatStopwatch(elapsedSeconds(active.started_at, now)) : item.label;
          return (
            <RNView key={item.label} style={{ flex: 1 }}>
              <Pebble
                label={label}
                category={item.category}
                accessibilityLabel={active ? `Stop ${item.label} timer` : `Start ${item.label}`}
                iconLeft={<Icon name={item.icon} size={theme.space.xl} color={theme.color.ink} />}
                onPress={() => (item.type ? onTimed(item.type) : setDiaperOpen(true))}
                style={{ paddingHorizontal: theme.space.sm }}
              />
            </RNView>
          );
        })}
      </View>

      <DiaperSheet visible={diaperOpen} onClose={() => setDiaperOpen(false)} onSelect={onDiaper} />
    </>
  );
});

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch' },
});
