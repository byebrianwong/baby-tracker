# P1-2 · Timeline + status strip (owns Home composition)

**Phase:** 1 · **Wave:** 6 (parallel with P1-3, P1-4, P1-5) · **Depends on:** P1-1, P0-4
**Owns:** `apps/app/src/features/home/` (Home screen composition), `features/logging/timeline/`, `features/logging/status/`

## Objective
Turn the empty Home into the glanceable, live view: a status strip that answers "when did we last..." at a glance, and a performant timeline of the day's events. This task also owns integrating the Wave-6 siblings into Home (see collision rule).

## Steps
1. **Status strip:** using `useTimeline` and `runningTimers`, render StatusStats for time since last feed, time since last diaper, and current sleep state (asleep for X, or awake for Y). Large display numerals, calm.
2. **Timeline:** render `useTimeline(today)` with `TimelineRow`, grouped by part of day (morning/afternoon/evening/night). Category color dot + icon + time + `summarizeEvent` one-liner. Virtualized for performance.
3. **Row interactions:** tap opens the editor (from P1-5's exported component). Swipe reveals Undo/Delete calling the P1-1 API.
4. **Empty and loading states:** inviting empty copy; skeletons that do not flash.
5. **Integration (collision-safe):** import and mount the components/hooks exported by P1-3 (quick-log bar), P1-4 (diaper sheet trigger), and P1-5 (editor) into the Home layout. Only this task edits the Home screen file.

## Acceptance criteria
- [ ] Status strip updates live as events are logged and as timers run, including across a synced second device.
- [ ] Timeline renders 200+ events smoothly with no jank.
- [ ] Tap-to-edit and swipe-to-undo/delete work and reflect instantly.
- [ ] Home reads well one-handed; nothing critical in a top corner.
- [ ] Renders correctly in Day, Dark, and Night.

## Out of scope
Building the quick-log buttons, diaper sheet, or editor internals (those are P1-3/4/5). You mount their public interfaces only.
