import {
  type BreastSide,
  computeDurationSeconds,
  type EventType,
  isEndAfterStart,
  startTimedEvent,
  stopTimedEvent,
} from '@baby-bean/core';
import { type EventRow } from '@baby-bean/db';
import { useCallback } from 'react';

import { type EventPatch, type NewEvent, useEventActions, useHouseholdStore } from '@/state';

import { useActiveChild } from './timeline';

export type StartTimerOpts = {
  breastSide?: BreastSide;
  data?: Record<string, unknown>;
  /** Start a fresh timer even if one of this type is already running. */
  force?: boolean;
};

export type InstantFields = Omit<NewEvent, 'child_id' | 'type'>;
export type EditResult = { error: string | null };

/**
 * The write API for the fast-log core. Everything is local-first (writes hit the
 * observable and return immediately) and scoped to the active child. Timer
 * lifecycle enforces one running timer per type (tapping again resumes/stops
 * rather than duplicating).
 */
export function useLogging() {
  const child = useActiveChild();
  const store = useHouseholdStore();
  const { addEvent, updateEvent, softDeleteEvent, undoDelete } = useEventActions();

  // Non-reactive, fully-plain snapshot of the current (non-deleted) events.
  // JSON round-trip so nested fields (e.g. started_at) are primitives, not
  // Legend-State proxies (see state/events.ts activeList).
  const currentEvents = useCallback((): EventRow[] => {
    if (!store) return [];
    const rec = (store.events$ as unknown as { peek: () => Record<string, EventRow> | undefined }).peek();
    if (!rec) return [];
    const plain = JSON.parse(JSON.stringify(rec)) as Record<string, EventRow>;
    return Object.values(plain).filter((e) => !e.deleted_at);
  }, [store]);

  const logInstant = useCallback(
    (type: EventType, fields: InstantFields = {}): string | null => {
      if (!child) return null;
      return addEvent({ child_id: child.id, type, ...fields });
    },
    [child, addEvent],
  );

  const startTimer = useCallback(
    (type: EventType, opts: StartTimerOpts = {}): string | null => {
      if (!child) return null;
      if (!opts.force) {
        const running = currentEvents().find(
          (e) => e.child_id === child.id && e.type === type && e.ended_at == null,
        );
        if (running) return running.id; // resume — never duplicate a running timer
      }
      const fields = startTimedEvent(type, new Date(), { breastSide: opts.breastSide, data: opts.data });
      // core's `data` is Record<string, unknown>; the DB row's is Json — compatible at this seam.
      return addEvent({ child_id: child.id, ...fields } as NewEvent);
    },
    [child, currentEvents, addEvent],
  );

  const stopTimer = useCallback(
    (eventId: string) => {
      const event = currentEvents().find((e) => e.id === eventId);
      if (!event) return;
      updateEvent(eventId, stopTimedEvent(event, new Date()));
    },
    [currentEvents, updateEvent],
  );

  const editEvent = useCallback(
    (id: string, patch: EventPatch): EditResult => {
      const existing = currentEvents().find((e) => e.id === id);
      const started = patch.started_at ?? existing?.started_at;
      const ended = patch.ended_at ?? existing?.ended_at;
      if (started && ended && !isEndAfterStart(started, ended)) {
        return { error: 'End time must be after the start time.' };
      }
      const next: EventPatch = { ...patch };
      // Keep duration consistent when a start/end edit (backdate) changes the span.
      if (started && ended) next.duration_seconds = computeDurationSeconds(started, ended);
      updateEvent(id, next);
      return { error: null };
    },
    [currentEvents, updateEvent],
  );

  const deleteEvent = useCallback((id: string) => softDeleteEvent(id), [softDeleteEvent]);
  const undo = useCallback((id: string) => undoDelete(id), [undoDelete]);

  return { logInstant, startTimer, stopTimer, editEvent, deleteEvent, undo, hasChild: child != null };
}
