import {
  type BreastSide,
  type ChildRow,
  type DiaperContents,
  type EventRow,
  type EventType,
  type Json,
  type MilkInventoryRow,
} from '@baby-bean/db';
import { observable } from '@legendapp/state';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSession } from '@/features/auth';

import { getHouseholdStore, type HouseholdStore } from './householdStore';

// A stable, plain (non-synced) empty store used when there is no active
// household. Reads always target a real observable so `use$` keeps a stable
// hook signature (passing undefined changes React's hook count → crash).
const EMPTY_STORE: HouseholdStore = {
  events$: observable<Record<string, EventRow>>({}),
  children$: observable<Record<string, ChildRow>>({}),
  milk$: observable<Record<string, MilkInventoryRow>>({}),
};

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
  // Normalize to fully-plain objects: Legend-State can hand back proxies for
  // just-written rows, and reading a nested field (e.g. started_at) off a proxy
  // yields a non-primitive that breaks String comparisons downstream (and the
  // pure core helpers). A JSON round-trip forces plain values everywhere.
  const plain = JSON.parse(JSON.stringify(record)) as Record<string, T>;
  return Object.values(plain).filter((r) => !(r as { deleted_at?: string | null }).deleted_at);
}

/**
 * Non-deleted events for the active household, newest first. Reactive: updates
 * on local writes and on synced remote changes. `range` filters by started_at.
 */
export function useEvents(range?: DateRange): EventRow[] {
  const store = useHouseholdStore();
  // `.get()` tracks changes in the enclosing observer(); activeList normalizes
  // the value to plain objects (see there).
  const record = (store ?? EMPTY_STORE).events$.get();
  let list = activeList<EventRow>(record);
  if (range?.from) list = list.filter((e) => e.started_at >= range.from!);
  if (range?.to) list = list.filter((e) => e.started_at <= range.to!);
  return list.sort((a, b) => b.started_at.localeCompare(a.started_at));
}

/** Non-deleted children for the active household. */
export function useChildren(): ChildRow[] {
  const store = useHouseholdStore();
  return activeList<ChildRow>((store ?? EMPTY_STORE).children$.get());
}

/**
 * Whether the active household has a child. Uses a manual observable
 * subscription (stable useState + useEffect hook signature) rather than
 * `use$`/`observer`, because it runs in the route guard — a hot component where
 * a conditional reactive hook would trip React's rules-of-hooks.
 */
export function useHasChild(): boolean {
  const store = useHouseholdStore();
  const [has, setHas] = useState(false);
  useEffect(() => {
    const target = store ?? EMPTY_STORE;
    const compute = () => setHas(activeList<ChildRow>(target.children$.peek()).length > 0);
    compute();
    return target.children$.onChange(compute);
  }, [store]);
  return has;
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
