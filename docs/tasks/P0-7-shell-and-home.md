# P0-7 · Tab shell + empty themed Home

**Phase:** 0 · **Wave:** 4 (solo integration) · **Depends on:** P0-3, P0-4, P0-5
**Owns:** `apps/app/app/` route structure (tabs), `apps/app/src/features/home/` shell only

## Objective
Assemble the app shell: a four-item tab bar and an empty, themed Home screen that proves the foundation is wired end to end. No event data yet.

## Steps
1. Build the Expo Router tab layout with four tabs: **Home**, **Insights**, **Baby**, **More**. Home is the default. Keep the tab bar in the thumb zone and minimal.
2. Home screen skeleton composed from P0-4 components:
   - Status strip region (placeholder StatusStats).
   - Timeline region (empty state: "No feeds yet today. Tap Feed to start.").
   - Quick-log bar region at the bottom with four Pebbles (Feed, Diaper, Sleep, Pump), non-functional placeholders for now.
3. Wire the theme mode switcher into More/Settings (Day / Dark / Night) using P0-3.
4. Confirm the route guard from P0-5 gates the tabs behind auth and that the active household id is available on Home.
5. Stub Insights, Baby, and More screens with titled empty states.

## Acceptance criteria
- [ ] Signed-in user lands on a themed Home with status strip, empty timeline, and the four-Pebble quick-log bar.
- [ ] Tab navigation works on iOS, Android, and Web.
- [ ] Switching Day / Dark / Night restyles the whole app.
- [ ] Signed-out users cannot reach the tabs.
- [ ] Layout holds one-handed on a phone; quick-log bar sits in the bottom third.

## Out of scope
Making the quick-log buttons actually log (Phase 1). Real content in Insights/Baby/More.

## Notes
This is the integration checkpoint for Phase 0. When it passes, Phase 1 can begin.
