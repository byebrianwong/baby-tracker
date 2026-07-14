import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/features/auth';

/**
 * Baby Bean's local-first sync engine. Legend-State observables are the source
 * of truth the UI renders; this configures how they persist to disk and sync
 * with Supabase in the background.
 *
 * Conflict rules (spec §4.5):
 *   - `fieldUpdatedAt` → last-write-wins on edits, and it stamps the delete so a
 *     stale edit (older updated_at) never resurrects a deleted row.
 *
 * NOTE: we deliberately do NOT set `fieldDeleted` (which would remove the row
 * from the local store and break undo — a prime-directive requirement). Instead
 * `deleted_at` is a normal synced column: soft delete is an update, undo clears
 * it, and `useEvents` filters deleted rows out of the timeline. That rules out
 * `changesSince: 'last-sync'` (which requires fieldDeleted), so we sync the full
 * set each time — fine for a newborn tracker's data volumes.
 */
export const syncedBabyBean = configureSynced(syncedSupabase, {
  supabase,
  persist: {
    plugin: observablePersistAsyncStorage({ AsyncStorage }),
  },
  generateId: () => Crypto.randomUUID(),
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  changesSince: 'all',
  // Subscribe to Realtime so a second caregiver's changes arrive live.
  realtime: true,
});
