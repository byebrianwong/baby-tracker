# P1-4 · Diaper instant-log sheet

**Phase:** 1 · **Wave:** 6 (parallel) · **Depends on:** P1-1, P0-4
**Owns:** `apps/app/src/features/logging/diaper/`
**Exports:** a diaper trigger + `<DiaperSheet />` that P1-3's bar opens and P1-2 mounts. Does not edit Home or the quick-log bar files.

## Objective
Make diaper logging a clean two-tap path: tap Diaper, tap the type, done.

## Steps
1. Build `DiaperSheet` (using the P0-4 Sheet) with three large primary options: **wet**, **dirty**, **mixed**. A less prominent **dry** option for the occasional case.
2. Tapping an option calls `logInstant('diaper', { diaper_contents })`, fires a haptic, closes the sheet, and shows the Undo bar. Total interaction: two taps.
3. Optional attributes (color, consistency) are collapsed behind a small "add detail" affordance so they never slow the default path.
4. Timestamp defaults to now; a small "earlier" affordance opens the backdate control from P1-5 (import it) without leaving the flow.
5. Expose a `useDiaperLog()` hook and the trigger for the quick-log bar to call.

## Acceptance criteria
- [ ] Logging a wet/dirty/mixed diaper is exactly two taps and instant.
- [ ] Undo appears and works.
- [ ] Optional detail is available but never on the default path.
- [ ] Works offline and in all three theme modes.
- [ ] Sheet is fully one-handed with large targets.

## Out of scope
The quick-log bar itself (P1-3 imports this). Backdate control internals (P1-5; you import it).
