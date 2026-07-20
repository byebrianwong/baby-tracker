import { type MilkInventoryRow } from '@baby-bean/db';
import * as Crypto from 'expo-crypto';
import { useCallback } from 'react';

import { useSession } from '@/features/auth';

import { useHouseholdStore } from './events';

export type NewMilk = {
  volume_ml: number;
  storage?: 'fridge' | 'freezer';
  pumped_at?: string;
  note?: string | null;
};

type MilkNode = {
  set: (value: MilkInventoryRow) => void;
  assign: (patch: Partial<MilkInventoryRow>) => void;
};

function milkNode(store: { milk$: unknown }, id: string): MilkNode {
  return (store.milk$ as Record<string, MilkNode>)[id]!;
}

/**
 * The expressed-milk stash for the active household.
 *
 * Normalized to plain objects for the same reason `activeList` does it in
 * `state/events.ts`: Legend-State hands back proxies for just-written rows, and
 * reading a nested field off one breaks the pure core helpers.
 */
export function useMilkStash(): MilkInventoryRow[] {
  const store = useHouseholdStore();
  if (!store) return [];
  const record = store.milk$.get();
  if (!record) return [];
  const plain = JSON.parse(JSON.stringify(record)) as Record<string, MilkInventoryRow>;
  return Object.values(plain).sort((a, b) => String(a.pumped_at).localeCompare(String(b.pumped_at)));
}

/**
 * Local-first stash mutations.
 *
 * `milk_inventory` has no `deleted_at` column — its lifecycle is the domain's
 * own (`used_at`, `discarded`), and both are reversible, which is what makes
 * every action here undoable.
 */
export function useMilkActions() {
  const store = useHouseholdStore();
  const { activeHouseholdId } = useSession();

  const addMilk = useCallback(
    (input: NewMilk): string | null => {
      if (!store || !activeHouseholdId) return null;
      const id = Crypto.randomUUID();
      const row: MilkInventoryRow = {
        id,
        household_id: activeHouseholdId,
        volume_ml: input.volume_ml,
        pumped_at: input.pumped_at ?? new Date().toISOString(),
        storage: input.storage ?? 'fridge',
        used_at: null,
        discarded: false,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      };
      milkNode(store, id).set(row);
      return id;
    },
    [store, activeHouseholdId],
  );

  const markUsed = useCallback(
    (id: string) => {
      if (!store) return;
      milkNode(store, id).assign({ used_at: new Date().toISOString() });
    },
    [store],
  );

  const markDiscarded = useCallback(
    (id: string) => {
      if (!store) return;
      milkNode(store, id).assign({ discarded: true });
    },
    [store],
  );

  /** Put a bag back on the shelf — the undo for both "used" and "discarded". */
  const restore = useCallback(
    (id: string) => {
      if (!store) return;
      milkNode(store, id).assign({ used_at: null, discarded: false });
    },
    [store],
  );

  return { addMilk, markUsed, markDiscarded, restore };
}
