import { type ChildRow, type EventRow } from '@baby-bean/db';
import { type Observable,observable } from '@legendapp/state';

import { syncedBabyBean } from './sync';

export type HouseholdStore = {
  events$: Observable<Record<string, EventRow>>;
  children$: Observable<Record<string, ChildRow>>;
};

// One store per household, created lazily and reused so re-renders and multiple
// consumers share the same observables (and one Realtime subscription each).
const stores = new Map<string, HouseholdStore>();

/**
 * Build a synced observable for a household-scoped collection. The options are
 * cast because the Supabase-typed client makes the sync plugin's generics
 * instantiate too deeply for tsc; the returned observable is re-typed to the
 * concrete row shape so consumers stay fully typed.
 */
function syncedCollection<T>(collection: 'events' | 'children', householdId: string): Observable<Record<string, T>> {
  const options = {
    collection,
    schema: 'baby_bean',
    filter: (select: { eq: (col: string, val: string) => unknown }) =>
      select.eq('household_id', householdId),
    realtime: { filter: `household_id=eq.${householdId}` },
    persist: { name: `bb.${collection}.${householdId}` },
  };
   
  return observable(syncedBabyBean(options as any)) as unknown as Observable<Record<string, T>>;
}

export function getHouseholdStore(householdId: string): HouseholdStore {
  const existing = stores.get(householdId);
  if (existing) return existing;

  const store: HouseholdStore = {
    events$: syncedCollection<EventRow>('events', householdId),
    children$: syncedCollection<ChildRow>('children', householdId),
  };
  stores.set(householdId, store);
  return store;
}
