import { type BreastSide, type DiaperContents } from '@baby-bean/core';
import { type EventRow } from '@baby-bean/db';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';

import { Pebble, Sheet, Stepper } from '@/components';
import { useLogging } from '@/features/logging/data';
import { useUndo } from '@/features/logging/feedback/UndoController';
import { type EventPatch } from '@/state';
import { FONT, Text, useTheme, View } from '@/theme';

import { TimeAdjust } from './TimeAdjust';

const SIDES: BreastSide[] = ['left', 'right', 'both'];
const CONTENTS: DiaperContents[] = ['wet', 'dirty', 'mixed', 'dry'];

export type EventEditorProps = {
  /** The event being edited, or null when the editor is closed. */
  event: EventRow | null;
  onClose: () => void;
};

/**
 * Compact editor for any event: start/end time (backdate), the type-specific
 * field, and a note. Saves via the P1-1 data layer (validates end-after-start),
 * offers undo of the edit, and can delete. Never leaves the timeline.
 *
 * Mounted with `key={event.id}` so state re-initializes per event (no effect).
 */
export function EventEditor({ event, onClose }: EventEditorProps) {
  const theme = useTheme();
  const { editEvent, deleteEvent, undo } = useLogging();
  const { showUndo } = useUndo();

  const [started, setStarted] = useState(() => new Date(event?.started_at ?? Date.now()));
  const [ended, setEnded] = useState<Date | null>(() =>
    event?.ended_at ? new Date(event.ended_at) : null,
  );
  const [side, setSide] = useState<BreastSide | null>(
    () => (event?.breast_side as BreastSide | null) ?? null,
  );
  const [ml, setMl] = useState(() => event?.amount_ml ?? 0);
  const [contents, setContents] = useState<DiaperContents | null>(
    () => (event?.diaper_contents as DiaperContents | null) ?? null,
  );
  const [note, setNote] = useState(() => event?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!event) return;
    const patch: EventPatch = { started_at: started.toISOString(), note: note.trim() || null };
    if (ended) patch.ended_at = ended.toISOString();
    if (event.type === 'breast' && side) patch.breast_side = side;
    if ((event.type === 'bottle' || event.type === 'pump') && ml > 0) patch.amount_ml = ml;
    if (event.type === 'diaper' && contents) patch.diaper_contents = contents;

    const prior: EventPatch = {
      started_at: event.started_at,
      ended_at: event.ended_at,
      duration_seconds: event.duration_seconds,
      breast_side: event.breast_side,
      amount_ml: event.amount_ml,
      diaper_contents: event.diaper_contents,
      note: event.note,
    };

    const { error: err } = editEvent(event.id, patch);
    if (err) {
      setError(err);
      return;
    }
    showUndo('Saved', () => editEvent(event.id, prior));
    onClose();
  };

  const remove = () => {
    if (!event) return;
    const id = event.id;
    deleteEvent(id);
    showUndo('Deleted', () => undo(id));
    onClose();
  };

  const isTimed = event ? event.ended_at != null : false;

  return (
    <Sheet visible={event != null} onClose={onClose} title="Edit">
      {event ? (
        <View style={{ gap: theme.space.lg }}>
          <TimeAdjust label="Start" value={started} onChange={setStarted} />
          {isTimed && ended ? (
            <TimeAdjust label="End" value={ended} onChange={setEnded} />
          ) : null}

          {event.type === 'breast' ? (
            <ChipRow<BreastSide> label="Side" options={SIDES} value={side} onChange={setSide} />
          ) : null}
          {event.type === 'diaper' ? (
            <ChipRow<DiaperContents> label="Contents" options={CONTENTS} value={contents} onChange={setContents} />
          ) : null}
          {event.type === 'bottle' || event.type === 'pump' ? (
            <View style={{ gap: theme.space.sm }}>
              <Text variant="caption" color="inkSoft">
                Amount
              </Text>
              <Stepper value={ml} onChange={setMl} step={10} unit="ml" />
            </View>
          ) : null}

          <View style={{ gap: theme.space.sm }}>
            <Text variant="caption" color="inkSoft">
              Note
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              placeholderTextColor={theme.color.inkSoft}
              multiline
              style={{
                minHeight: theme.size.tapMin,
                padding: theme.space.md,
                borderRadius: theme.radius.md,
                backgroundColor: theme.color.surfaceSunk,
                borderWidth: theme.size.hairline,
                borderColor: theme.color.line,
                color: theme.color.ink,
                fontFamily: FONT.bodyRegular,
                fontSize: theme.type.scale.bodyLarge,
              }}
            />
          </View>

          {error ? (
            <Text variant="body" color="health" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <View style={{ gap: theme.space.sm }}>
            <Pebble label="Save" onPress={save} />
            <Pebble label="Delete" variant="ghost" onPress={remove} />
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="caption" color="inkSoft">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {options.map((o) => {
          const selected = value === o;
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(o)}
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
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
