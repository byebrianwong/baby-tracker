# P1-1 · Events data layer: CRUD, offline, soft-delete, undo

**Phase:** 1 Fast-log core · **Wave:** 5 (solo blocker for Phase 1) · **Depends on:** P0-6
**Owns:** `apps/app/src/features/logging/data/`, event logic in `packages/core`

## Objective
Build the typed, offline-first event operations the whole fast-log core sits on: create, read (timeline), update, backdate, soft-delete, undo, and running-timer lifecycle. Thin wrapper over the P0-6 store, plus pure logic in `packages/core`.

## Steps
1. In `packages/core`, implement pure helpers with tests:
   - `startTimedEvent(type, now, opts)` and `stopTimedEvent(event, now)` computing `duration_seconds`.
   - `nextBreastSide(recentFeeds)` returning the opposite of the last side.
   - `defaultBottleMl(recentBottles)` returning the rolling median.
   - `summarizeEvent(event)` producing the one-line timeline summary per type.
   - Time helpers for quick offsets ("15 min ago") and validation (end after start).
2. In `features/logging/data`, expose hooks/functions over the P0-6 API:
   - `useTimeline(range)` — reverse-chronological, non-deleted events for the active child.
   - `logInstant(type, fields)` — for diaper and other instant events. Writes locally, returns immediately.
   - `startTimer(type, opts)` / `stopTimer(eventId)` — create/close a running event; supports resume.
   - `editEvent(id, patch)` — including start/end time edits (backdate).
   - `deleteEvent(id)` (soft) and `undo(id)`.
   - `runningTimers()` — current open events for the active child.
3. Enforce invariants: end after start, one running timer per type per child unless explicitly overridden, all writes local-first.
4. Wire smart defaults: new breast feed pre-selects `nextBreastSide`; new bottle pre-fills `defaultBottleMl`. Both overridable.

## Acceptance criteria
- [ ] All `packages/core` helpers have passing unit tests, including edge cases (no history, single side, invalid times).
- [ ] Create / edit / backdate / soft-delete / undo all work offline and render instantly.
- [ ] `useTimeline` excludes soft-deleted events and updates live on writes and on synced remote changes.
- [ ] Breast-side memory and bottle default compute correctly from history.
- [ ] No Supabase types leak into the feature API.

## Out of scope
UI (P1-2 through P1-5 consume this). Native timer persistence (P1-6). Keep this a clean data/logic layer.
