import { defaultBottleMl, nextBreastSide } from '@baby-bean/core';
import { type ChildRow, type EventRow } from '@baby-bean/db';
import { useMemo } from 'react';

import { type DateRange, useChildren, useEvents } from '@/state';

/**
 * The active child. Single-baby is the common case, so we default to the first
 * child; explicit multi-child selection is a later addition.
 */
export function useActiveChild(): ChildRow | null {
  const children = useChildren();
  return children[0] ?? null;
}

/** Reverse-chronological, non-deleted events for the active child. */
export function useTimeline(range?: DateRange): EventRow[] {
  const child = useActiveChild();
  const events = useEvents(range);
  return useMemo(
    () => (child ? events.filter((e) => e.child_id === child.id) : []),
    [events, child],
  );
}

/** Currently-running (open) events for the active child. */
export function useRunningTimers(): EventRow[] {
  const child = useActiveChild();
  const events = useEvents();
  return useMemo(
    () => (child ? events.filter((e) => e.child_id === child.id && e.ended_at == null) : []),
    [events, child],
  );
}

/** The side to pre-select for the next breast feed (opposite of the last). */
export function useNextBreastSide(): 'left' | 'right' {
  const timeline = useTimeline();
  return useMemo(() => nextBreastSide(timeline), [timeline]);
}

/** The suggested bottle volume (rolling median of recent bottles), or null. */
export function useDefaultBottleMl(): number | null {
  const timeline = useTimeline();
  return useMemo(() => defaultBottleMl(timeline), [timeline]);
}
