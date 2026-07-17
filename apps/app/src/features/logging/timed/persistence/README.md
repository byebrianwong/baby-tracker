# Running-timer persistence (P1-6)

A started timer must survive app close, phone lock, and reboot, and be stoppable
without opening the app. This is what makes the 3am timer trustworthy.

## What's done (and verified)

**In-app reboot / force-quit survival — DONE.** Running events (`ended_at is null`)
persist in the Legend-State store (AsyncStorage), and elapsed time is *always*
recomputed from `started_at` via `packages/core` `elapsedSeconds` — never from a
stored counter. So after a cold start the running timer restores and shows the
correct elapsed time. (Verified in the web dev harness: a sleep timer read the
correct multi-hour elapsed after long gaps / reloads.)

**The cross-platform seam — DONE.** `timerSurface.ts` defines `TimerSurface`
(`sync(activities)`), and `useTimerPersistence()` keeps it reconciled to the
store's open timers. Web / Expo Go are safe no-ops (no lock-screen surface).

## What's left — the native surfaces (needs dev builds + a device)

These can't be built or verified in the web dev server; they require an Expo dev
build and a device/simulator.

### iOS — Live Activity (`@bacons/apple-targets`, installed at 4.0.7)
1. Add an `apps/app/targets/timer/` Widget/Live Activity target (Swift) via the
   `@bacons/apple-targets` config plugin; register it in `app.json` plugins.
2. Define an `ActivityAttributes` with `startedAt` + `type`; the widget renders
   elapsed from `startedAt` (SwiftUI `Text(timerInterval:)`) on the lock screen
   and Dynamic Island, with a **Stop** `AppIntent`.
3. Implement the native `TimerSurface`: `sync()` starts/updates/ends
   `Activity<…>` to match `activities`. Requires the `com.apple.developer.
   usernotifications.time-sensitive` + Live Activities Info.plist keys.
4. Stop from the activity fires the App Intent → writes `stopTimer` through the
   P1-1 data layer, so app and activity stay consistent.

### Android — foreground-service ongoing notification
1. Add a foreground service (via a config plugin) with `FOREGROUND_SERVICE` +
   `POST_NOTIFICATIONS` permissions.
2. Show an ongoing notification with elapsed (chronometer `setUsesChronometer`
   from `startedAt`) and a **Stop** action that routes to `stopTimer`.
3. `sync()` starts/stops the service to match `activities`.

### Wiring
Replace the no-op branch in `getTimerSurface()` with the native implementation
(guarded by `Platform.OS`). `useTimerPersistence()` is already mounted in
`HomeScreen`, so once the surface reports `supported`, timers appear on the
lock screen automatically.

### Acceptance (spec §5.6)
- iOS: timer on lock screen / Dynamic Island, stoppable there; app + activity in sync.
- Android: ongoing notification shows + stops the timer; in sync.
- Survives force-quit and reboot; elapsed reconciles from `started_at`. *(in-app: done)*
- Web degrades cleanly. *(done)*
