import {
  type BreastSide,
  type ChildRow,
  type DiaperContents,
  type EventRow,
  type EventType,
  type Json,
} from '@baby-bean/db';
import { use$ } from '@legendapp/state/react';
import * as Crypto from 'expo-crypto';
import { useCallback, useMemo } from 'react';

import { useSession } from '@/features/auth';

import { getHouseholdStore, type HouseholdStore } from './householdStore';

/** Fields a caller provides to create an event. Server/derived fields are set here. */
export type NewEvent = {
  child_id: string;
  type: EventType;
  started_at?: string;
  ended_at?: string | null;
  amount_ml?: number | null;
  duration_seconds?: number | null;
  breast_side?: BreastSide | null;
  diaper_contents?: DiaperContents | null;
  data?: Json;
  note?: string | null;
};

export type EventPatch = Partial<Omit<EventRow, 'id' | 'household_id' | 'created_at'>>;

export type DateRange = { from?: string; to?: string };

/** The store for the active household, or null when signed out / no household. */
export function useHouseholdStore(): HouseholdStore | null {
  const { activeHouseholdId } = useSession();
  return useMemo(
    () => (activeHouseholdId ? getHouseholdStore(activeHouseholdId) : null),
    [activeHouseholdId],
  );
}

function activeList<T>(record: Record<string, T> | undefined): T[] {
  if (!record) return [];
  return Object.values(record).filter((r) => !(r as { deleted_at?: string | null }).deleted_at);
}

/**
 * Non-deleted events for the active household, newest first. Reactive: updates
 * on local writes and on synced remote changes. `range` filters by started_at.
 */
export function useEvents(range?: DateRange): EventRow[] {
  const from = range?.from;
  const to = range?.to;
  const store = useHouseholdStore();
  const record = use$(store?.events$);
  return useMemo(() => {
    let list = activeList<EventRow>(record);
    if (from) list = list.filter((e) => e.started_at >= from);
    if (to) list = list.filter((e) => e.started_at <= to);
    return list.sort((a, b) => b.started_at.localeCompare(a.started_at));
  }, [record, from, to]);
}

/** Non-deleted children for the active household. */
export function useChildren(): ChildRow[] {
  const store = useHouseholdStore();
  const record = use$(store?.children$);
  return useMemo(() => activeList<ChildRow>(record), [record]);
}

/**
 * Local-first mutations. Each writes to the observable and returns immediately;
 * Legend-State persists to disk and syncs to Supabase in the background.
 */
/** Legend-State's recursive Observable types are too deep for tsc when indexed
 * with our typed rows, so we access mutation nodes through this loose view. */
type EventNode = { set: (value: EventRow) => void; assign: (patch: Partial<EventRow>) => void };
function eventNode(store: HouseholdStore, id: string): EventNode {
  return (store.events$ as unknown as Record<string, EventNode>)[id]!;
}

export function useEventActions() {
  const store = useHouseholdStore();
  const { activeHouseholdId, user } = useSession();

  const addEvent = useCallback(
    (input: NewEvent): string | null => {
      if (!store || !activeHouseholdId) return null;
      const id = Crypto.randomUUID();
      const now = new Date().toISOString();
      const row: EventRow = {
        id,
        child_id: input.child_id,
        household_id: activeHouseholdId,
        type: input.type,
        started_at: input.started_at ?? now,
        ended_at: input.ended_at ?? null,
        amount_ml: input.amount_ml ?? null,
        duration_seconds: input.duration_seconds ?? null,
        breast_side: input.breast_side ?? null,
        diaper_contents: input.diaper_contents ?? null,
        data: input.data ?? {},
        note: input.note ?? null,
        created_by: user?.id ?? null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      eventNode(store, id).set(row);
      return id;
    },
    [store, activeHouseholdId, user?.id],
  );

  const updateEvent = useCallback(
    (id: string, patch: EventPatch) => {
      if (!store) return;
      eventNode(store, id).assign({ ...patch, updated_at: new Date().toISOString() });
    },
    [store],
  );

  const softDeleteEvent = useCallback(
    (id: string) => {
      if (!store) return;
      const now = new Date().toISOString();
      eventNode(store, id).assign({ deleted_at: now, updated_at: now });
    },
    [store],
  );

  const undoDelete = useCallback(
    (id: string) => {
      if (!store) return;
      eventNode(store, id).assign({ deleted_at: null, updated_at: new Date().toISOString() });
    },
    [store],
  );

  return { addEvent, updateEvent, softDeleteEvent, undoDelete };
}
