# P1-6 · Running-timer persistence: Live Activity + ongoing notification

**Phase:** 1 · **Wave:** 7 (solo, native) · **Depends on:** P1-3
**Owns:** `apps/app/targets/` (iOS Live Activity target), Android foreground-service config, `features/logging/timed/persistence/`

## Objective
A started timer must survive app close, phone lock, and reboot, and be stoppable without opening the app. This is what makes the timer trustworthy at 3am.

## Steps
1. **iOS Live Activity:** add a Live Activity target via `@bacons/apple-targets` (verify current usage). Show elapsed time on the lock screen and Dynamic Island with a **Stop** control. Starting a timer (P1-3) starts the activity; stopping from either the app or the activity ends both. Reflect state through the P1-1/P0-6 store so it stays consistent.
2. **Android ongoing notification:** run a foreground service showing the running timer with a **Stop** action. Same store-backed consistency.
3. **Reboot survival:** persist enough state (via the offline store) to restore or correctly reconcile a running timer after a cold start. If the app was killed mid-timer, on next launch reconcile elapsed time from `started_at`.
4. **Web:** no Live Activity or service; degrade gracefully to in-app timer only. Say so; do not fake it.
5. Keep all timer math in `packages/core`; this task handles only the native surfacing and lifecycle.

## Acceptance criteria
- [ ] iOS: timer appears on lock screen / Dynamic Island and can be stopped there; app and activity stay in sync.
- [ ] Android: ongoing notification shows the timer and stops it; stays in sync with the app.
- [ ] Timer survives force-quit and reboot on both platforms; elapsed time reconciles from `started_at`.
- [ ] Web degrades cleanly with no errors.
- [ ] Stopping from any surface writes one correct event via the P1-1 API.

## Out of scope
Home-screen and lock-screen *widgets* for quick-logging (Phase 5). This task is only about the running-timer activity/notification.

## Notes
This is the heaviest native task in Phase 1. Budget time for target configuration and platform quirks. When it passes, the Phase 1 acceptance bar in the spec (§5.6) is met.
