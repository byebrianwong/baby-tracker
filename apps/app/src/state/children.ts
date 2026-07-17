import { type ChildRow } from '@baby-bean/db';
import * as Crypto from 'expo-crypto';
import { useCallback } from 'react';

import { useSession } from '@/features/auth';

import { useHouseholdStore } from './events';

export type NewChild = { name: string; dob?: string | null; sex?: string | null };

export type ChildPatch = { name?: string; dob?: string | null; sex?: string | null };

type ChildNode = {
  set: (value: ChildRow) => void;
  assign: (patch: Partial<ChildRow>) => void;
};

/** Local-first child creation (writes to the synced children store). */
export function useChildActions() {
  const store = useHouseholdStore();
  const { activeHouseholdId } = useSession();

  const addChild = useCallback(
    (input: NewChild): string | null => {
      if (!store || !activeHouseholdId) return null;
      const id = Crypto.randomUUID();
      const row: ChildRow = {
        id,
        household_id: activeHouseholdId,
        name: input.name,
        dob: input.dob ?? null,
        sex: input.sex ?? null,
        photo_path: null,
        created_at: new Date().toISOString(),
      };
      (store.children$ as unknown as Record<string, ChildNode>)[id]!.set(row);
      return id;
    },
    [store, activeHouseholdId],
  );

  const updateChild = useCallback(
    (id: string, patch: ChildPatch) => {
      if (!store) return;
      (store.children$ as unknown as Record<string, ChildNode>)[id]!.assign(patch);
    },
    [store],
  );

  return { addChild, updateChild };
}
