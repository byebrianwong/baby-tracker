# P1-3 · Quick-log bar + timed events (feed, sleep, pump)

**Phase:** 1 · **Wave:** 6 (parallel) · **Depends on:** P1-1, P0-4
**Owns:** `apps/app/src/features/logging/quicklog/`, `features/logging/timed/`
**Exports:** `<QuickLogBar />` and hooks that P1-2 mounts into Home. Does not edit the Home screen file.

## Objective
Build the primary logging surface and the timed-event lifecycle. This is the two-tap core; it must be effortless and one-handed.

## Steps
1. **QuickLogBar:** four Pebbles (Feed, Diaper, Sleep, Pump) in the thumb zone. Feed/Sleep/Pump start timers; Diaper delegates to P1-4's sheet (import its trigger). Each Pebble carries its category color.
2. **Timed event flow (feed, sleep, pump):**
   - One tap starts a timer via `startTimer`, confirmed by a soft haptic and a visible **live pebble** showing elapsed time.
   - One tap on the live pebble stops it via `stopTimer`. Start-to-running and running-to-stopped each cost one tap, with no screen change required to start.
   - **Breast feed:** pre-select `nextBreastSide` (shown, overridable); support left/right/both.
   - **Bottle:** quick entry with `defaultBottleMl` pre-filled, unit-aware (ml/oz).
   - **Pump:** left/right volumes; on stop, offer "add to milk stash" (stub the call; inventory UI is Phase 3).
3. **Resume:** if a timer is already running for a type, the Pebble reflects that and tapping resumes/stops rather than starting a duplicate.
4. **Merge prompt:** if the store flags a concurrent-start collision (from P0-6), show a gentle merge choice.
5. Haptics and reduced-motion respected. All actions work offline.

## Acceptance criteria
- [ ] Start-to-logged feed is under 3s and 2 taps on a mid-range Android device, no typing.
- [ ] Live pebble shows elapsed time and stops in one tap.
- [ ] Breast-side memory and bottle default appear correctly and are overridable.
- [ ] Starting a second timer of a running type resumes/stops instead of duplicating.
- [ ] Everything works in airplane mode and in all three theme modes.

## Out of scope
Timeline and status strip (P1-2). Diaper sheet internals (P1-4). Native lock-screen/notification persistence (P1-6); here the timer runs in-app and via the store.
