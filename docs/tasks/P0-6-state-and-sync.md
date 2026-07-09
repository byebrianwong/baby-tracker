# P0-6 · Legend-State store + Supabase sync

**Phase:** 0 · **Wave:** 3 (parallel with P0-4, P0-5) · **Depends on:** P0-2
**Owns:** `apps/app/src/state/` (stores, sync config, persistence), sync helpers in `packages/core` if pure

## Objective
Stand up the local-first state layer: an observable store persisted to disk, syncing with Supabase in the background, with the conflict rules from the spec. This is the plumbing the entire fast-log core depends on.

## Steps
1. Add Legend-State v3 and its Supabase sync plugin (verify current versions). If the plugin is not stable, fall back to WatermelonDB or PowerSync and document the switch in `CLAUDE.md`.
2. Create an observable store for the active household's `events` (and `children`), persisted to disk so reads are instant on launch and writes work offline.
3. Configure sync:
   - Push local writes to Supabase; subscribe to Realtime for the household's `events` so other caregivers' changes arrive live.
   - Filter subscriptions by active household id.
4. Implement conflict rules:
   - Edits: last-write-wins on `updated_at`.
   - Deletes: soft delete via `deleted_at`; never resurrect a deleted row from a stale edit.
   - Running timers (`ended_at is null`): the starting device owns the timer; if two start the same activity within a short window, mark for a merge prompt (the prompt UI is Phase 1, expose the state here).
5. Expose a clean data API the UI will use (no Supabase types leaking into components): `useEvents(range)`, `addEvent()`, `updateEvent()`, `softDeleteEvent()`, `undoDelete()`. These write locally first and return immediately.
6. Offline behavior: queue writes when offline, flush on reconnect. Never block the UI on network.

## Acceptance criteria
- [ ] A write appears in the UI immediately with no network (airplane mode), then syncs when back online.
- [ ] A change made in Supabase (or a second client) appears locally via Realtime within seconds.
- [ ] Soft delete + undo round-trips correctly and survives sync.
- [ ] Last-write-wins verified with a simple concurrent-edit test.
- [ ] The public data API hides Supabase specifics from consumers.

## Out of scope
Event UI, timers, timeline (Phase 1 consumes this API). Auth (P0-5) provides the active household id; import it, do not build it.

## Notes
Keep any pure logic (merge decisions, timer math helpers) in `packages/core` with tests. The store wires them together.
