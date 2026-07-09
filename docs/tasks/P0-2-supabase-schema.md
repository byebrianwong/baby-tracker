# P0-2 · Supabase schema + RLS + generated types

**Phase:** 0 · **Wave:** 2 (parallel with P0-3) · **Depends on:** P0-1
**Owns:** `supabase/migrations/`, `packages/db/` (client, generated types, schema helpers)

## Objective
Create the Supabase project schema, row-level security, and generated TypeScript types. This is the data contract every later task builds on.

## Steps
1. Create the Supabase project (or local `supabase start`). Put URL and anon key in `.env`.
2. Write the initial migration implementing the schema from the spec §4:
   - `households`, `household_members` (role: parent | caregiver | viewer), `household_invites`, `children`.
   - `events` (single table): `id, child_id, household_id, type, started_at, ended_at, amount_ml, duration_seconds, breast_side, diaper_contents, data jsonb, note, created_by, created_at, updated_at, deleted_at`.
   - `milk_inventory`, `reminders`.
3. Indexes: `events (child_id, started_at desc)`, `events (household_id, type, started_at desc)`, partial index on `events` where `ended_at is null` (running timers), and index on `deleted_at`.
4. Enable RLS on every table. Policies: a user can read/write a row only if they are in `household_members` for that `household_id`. `viewer` role is read-only. Add helper `is_household_member(household_id, role_min)`.
5. Add `updated_at` trigger to bump on every update. Never hard-delete from the client; only set `deleted_at`.
6. Build the Supabase client in `packages/db` and a script to generate types from the schema into `packages/db/types.ts`. Export a typed client factory.
7. Seed script: one household, one child, a handful of events, for local dev.

## Acceptance criteria
- [ ] Migration applies cleanly from empty.
- [ ] RLS verified: a user in household A cannot read household B's events (write a quick test or SQL check).
- [ ] `packages/db` exports a typed client and generated `Database` types.
- [ ] Seed script populates a usable local dataset.

## Out of scope
App UI, auth screens (P0-5 consumes this), sync engine (P0-6 consumes this).

## Notes
Keep the single-`events`-table decision; do not split into per-type tables. Soft delete is load-bearing for undo and sync, do not skip it.
