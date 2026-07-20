import { useEffect, useRef, useState } from 'react';

import { useLogging } from '@/features/logging/data';
import { useUndo } from '@/features/logging/feedback/UndoController';

import { type MedicationPayload,MedicationSheet } from './MedicationSheet';
import { type MoreKind,MoreSheet } from './MoreSheet';
import { NoteSheet } from './NoteSheet';
import { type SolidsPayload,SolidsSheet } from './SolidsSheet';
import { type TemperaturePayload,TemperatureSheet } from './TemperatureSheet';

export type MoreLogProps = { visible: boolean; onClose: () => void };

/**
 * Owns the secondary log flow: the menu, its detail sheets, and the writes.
 *
 * Bath and tummy time need no detail, so they log straight from the menu —
 * two taps, same as the core path. The rest open a sheet because the value is
 * in the detail (which medication, which food, what the thermometer said).
 * Every write is undoable, like everything else.
 */
export function MoreLog({ visible, onClose }: MoreLogProps) {
  const { logInstant, startTimer, deleteEvent } = useLogging();
  const { showUndo } = useUndo();
  const [open, setOpen] = useState<MoreKind | null>(null);
  const handoff = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (handoff.current) clearTimeout(handoff.current);
    },
    [],
  );

  const logged = (id: string | null, label: string) => {
    if (id) showUndo(label, () => deleteEvent(id));
  };

  const onSelect = (kind: MoreKind) => {
    if (kind === 'bath') {
      logged(logInstant('bath'), 'Logged bath');
      return;
    }
    if (kind === 'tummy_time') {
      logged(startTimer('tummy_time'), 'Tummy time started');
      return;
    }
    // The menu closes in this same commit. Mounting a second Modal while the
    // first is unmounting drops it on web, so hand off on the next tick.
    handoff.current = setTimeout(() => setOpen(kind), 0);
  };

  const saveMedication = (p: MedicationPayload) => {
    const id = logInstant('medication', {
      note: null,
      data: {
        name: p.name,
        ...(p.amount != null ? { amount: p.amount, unit: p.unit } : {}),
        ...(p.minIntervalHours != null ? { min_interval_hours: p.minIntervalHours } : {}),
      },
    });
    logged(id, `Logged ${p.name}`);
  };

  const saveTemperature = (p: TemperaturePayload) => {
    const id = logInstant('temperature', {
      data: {
        temp_c: Number(p.tempC.toFixed(2)),
        unit: p.unit,
        ...(p.method ? { method: p.method } : {}),
      },
    });
    logged(id, 'Logged temperature');
  };

  const saveSolids = (p: SolidsPayload) => {
    const id = logInstant('solids', {
      data: { food: p.food, ...(p.reaction ? { reaction: p.reaction } : {}) },
    });
    logged(id, `Logged ${p.food}`);
  };

  const saveNote = (note: string) => {
    logged(logInstant('note', { note }), 'Note saved');
  };

  const close = () => setOpen(null);

  return (
    <>
      <MoreSheet visible={visible} onClose={onClose} onSelect={onSelect} />
      <MedicationSheet visible={open === 'medication'} onClose={close} onSave={saveMedication} />
      <TemperatureSheet visible={open === 'temperature'} onClose={close} onSave={saveTemperature} />
      <SolidsSheet visible={open === 'solids'} onClose={close} onSave={saveSolids} />
      <NoteSheet visible={open === 'note'} onClose={close} onSave={saveNote} />
    </>
  );
}
