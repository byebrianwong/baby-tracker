/**
 * @baby-bean/db — Supabase client, generated types, schema SQL, and RLS.
 *
 * Baby Bean lives in the `baby_bean` Postgres schema of a Supabase project
 * shared with the `second-guess` app. The migration + RLS live in
 * `supabase/migrations/`; this package is the typed client + types the app uses.
 */
export {
  type BabyBeanClient,
  createBabyBeanClient,
  createBabyBeanClientFromEnv,
  type CreateClientArgs,
} from './client';
export {
  type BreastSide,
  type ChildRow,
  type Database,
  type DiaperContents,
  type EventRow,
  type EventType,
  type HouseholdRow,
  type Json,
  type MilkInventoryRow,
  type ReminderKind,
  type Role,
  type StorageLocation,
  type Tables,
  type TablesInsert,
  type TablesUpdate,
} from './types';

export const DB_PACKAGE = '@baby-bean/db' as const;
