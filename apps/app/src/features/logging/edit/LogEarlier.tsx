import {
  type DiaperContents,
  type EventType,
  minutesAgo,
  nextBreastSide,
} from '@baby-bean/core';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Pebble, Sheet, Stepper } from '@/components';
import { useLogging, useTimeline } from '@/features/logging/data';
import { useUndo } from '@/features/logging/feedback/UndoController';
import { type AccentName, Text, useTheme, View } from '@/theme';

import { TimeAdjust } from './TimeAdjust';

type LogType = { key: EventType; label: string; category: AccentName; timed: boolean };
const TYPES: LogType[] = [
  { key: 'breast', label: 'Feed', category: 'feed', timed: true },
  { key: 'diaper', label: 'Diaper', category: 'diaper', timed: false },
  { key: 'sleep', label: 'Sleep', category: 'sleep', timed: true },
  { key: 'pump', label: 'Pump', category: 'pump', timed: true },
];
const CONTENTS: DiaperContents[] = ['wet', 'dirty', 'mixed', 'dry'];

export type LogEarlierProps = { visible: boolean; onClose: () => void };

/**
 * Create a past event without leaving the flow: pick a type, set the time
 * (backdated), fill the minimal field, save. Timed types get an estimated
 * duration; the result is a completed event.
 */
export function LogEarlier({ visible, onClose }: LogEarlierProps) {
  const theme = useTheme();
  const { logInstant, deleteEvent } = useLogging();
  const { showUndo } = useUndo();
  const timeline = useTimeline();

  const [type, setType] = useState<LogType>(TYPES[0]!);
  const [when, setWhen] = useState(() => new Date(minutesAgo(new Date(), 30)));
  const [durationMin, setDurationMin] = useState(15);
  const [contents, setContents] = useState<DiaperContents>('wet');
  const [ml, setMl] = useState(0);

  const save = () => {
    const started_at = when.toISOString();
    const fields: Parameters<typeof logInstant>[1] = { started_at };
    if (type.timed) {
      const ended = new Date(when.getTime() + durationMin * 60_000);
      fields.ended_at = ended.toISOString();
      fields.duration_seconds = durationMin * 60;
      if (type.key === 'breast') fields.breast_side = nextBreastSide(timeline);
      if (type.key === 'pump' && ml > 0) fields.amount_ml = ml;
    }
    if (type.key === 'diaper') fields.diaper_contents = contents;

    const id = logInstant(type.key, fields);
    if (id) showUndo(`Logged ${type.label.toLowerCase()} earlier`, () => deleteEvent(id));
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log something earlier">
      <View style={{ gap: theme.space.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {TYPES.map((t) => {
            const selected = type.key === t.key;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setType(t)}
                style={{
                  minHeight: theme.size.tapMin,
                  paddingHorizontal: theme.space.lg,
                  justifyContent: 'center',
                  borderRadius: theme.radius.pill,
                  backgroundColor: selected ? theme.color.accentSoft[t.category] : theme.color.surfaceSunk,
                  borderWidth: theme.size.hairline,
                  borderColor: selected ? theme.color.accent[t.category] : theme.color.line,
                }}
              >
                <Text variant="body">{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TimeAdjust label="When" value={when} onChange={setWhen} />

        {type.timed ? (
          <View style={{ gap: theme.space.sm }}>
            <Text variant="caption" color="inkSoft">
              Duration (minutes)
            </Text>
            <Stepper value={durationMin} onChange={setDurationMin} step={5} min={0} unit="min" />
          </View>
        ) : null}

        {type.key === 'diaper' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
            {CONTENTS.map((c) => {
              const selected = contents === c;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setContents(c)}
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
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {type.key === 'pump' ? (
          <View style={{ gap: theme.space.sm }}>
            <Text variant="caption" color="inkSoft">
              Amount
            </Text>
            <Stepper value={ml} onChange={setMl} step={10} unit="ml" />
          </View>
        ) : null}

        <Pebble label="Log it" category={type.category} onPress={save} />
      </View>
    </Sheet>
  );
}
