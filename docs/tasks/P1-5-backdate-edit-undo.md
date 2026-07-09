# P1-5 · Backdate + edit + undo UI

**Phase:** 1 · **Wave:** 6 (parallel) · **Depends on:** P1-1
**Owns:** `apps/app/src/features/logging/edit/`
**Exports:** `<EventEditor />`, `<TimeAdjust />`, and a "log something earlier" entry point that P1-2/P1-3/P1-4 import. Does not edit their files.

## Objective
Make correcting and backdating entries a first-class, fast path, since parents log late constantly. No deep settings dives.

## Steps
1. **EventEditor:** a compact sheet to edit any event: start time, end time (for timed types), amount/side/contents as relevant, and note. Uses the P0-4 Stepper/TimeWheel. Saves via `editEvent`; validates end-after-start.
2. **TimeAdjust:** fast time editing with quick offsets ("now", "15 min ago", "30 min ago", "1h ago") plus fine adjustment. This is the piece other tasks import for backdated entry.
3. **Log something earlier:** an entry point (for the quick-log bar's overflow and the diaper sheet) to create a past event: pick type, set time via TimeAdjust, fill minimal fields, save.
4. **Undo:** the UndoBar behavior after create/edit/delete, calling `undo`/`softDelete` from P1-1. Editing never requires leaving the timeline for a settings screen.

## Acceptance criteria
- [ ] Any event's start/end time can be edited in a few taps from the timeline.
- [ ] Quick offsets work and validation prevents end-before-start.
- [ ] A past event can be created without leaving the current flow.
- [ ] Undo restores exact prior state after create, edit, and delete.
- [ ] Works offline and in all three theme modes.

## Out of scope
Timeline rendering (P1-2), quick-log bar (P1-3), diaper sheet (P1-4). You provide editors they import.
