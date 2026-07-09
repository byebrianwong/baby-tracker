# Tasks — Phase 0 and Phase 1

These break Phase 0 (Foundation) and Phase 1 (Fast-log core) into discrete tasks, each sized for one Claude Code session. Every task file is self-contained: with `CLAUDE.md` plus one task file, a fresh session can execute it.

## How to run in parallel
Tasks are grouped into **waves**. Everything inside a wave can run at the same time in separate sessions because their **owned file sets are disjoint**. Finish a wave (or at least its blockers) before starting the next. Each task lists what it `Owns` and `Depends on` at the top.

```
WAVE 1  (solo, blocker)
  P0-1  Monorepo + Expo + tooling scaffold
        │
WAVE 2  (2 parallel)
  P0-2  Supabase schema + RLS + generated types        ┐
  P0-3  Design tokens + ThemeProvider + Night mode      ┘ independent
        │
WAVE 3  (3 parallel)
  P0-4  Base component kit            (needs P0-3)      ┐
  P0-5  Auth flow                     (needs P0-2)      │ disjoint dirs
  P0-6  Legend-State store + sync      (needs P0-2)      ┘
        │
WAVE 4  (solo integration)
  P0-7  Tab shell + empty themed Home  (needs P0-3,4,5)
        │
── Phase 1 ──
        │
WAVE 5  (solo, blocker for Phase 1)
  P1-1  Events data layer: CRUD, offline, soft-delete, undo  (needs P0-6)
        │
WAVE 6  (4 parallel)
  P1-2  Timeline + status strip        (needs P1-1, P0-4)  ← owns Home composition
  P1-3  Quick-log bar + timed events   (needs P1-1, P0-4)  ← exports components/hooks
  P1-4  Diaper instant-log sheet       (needs P1-1, P0-4)  ← exports component
  P1-5  Backdate + edit + undo UI      (needs P1-1)        ← exports editor
        │
WAVE 7  (solo, native)
  P1-6  Running-timer persistence: Live Activity + ongoing notification  (needs P1-3)
```

## Collision rule for Wave 6
P1-2 owns the Home screen composition and mounts the pieces the others export. P1-3, P1-4, and P1-5 each build self-contained components/hooks in their own feature folder and expose a public interface; they do **not** edit the Home screen file. A short integration step at the end of P1-2 (or a dedicated follow-up) wires them together. This keeps four sessions from fighting over one file.

## Task list
- Phase 0: `phase-0/P0-1-scaffold.md` … `P0-7-shell-and-home.md`
- Phase 1: `phase-1/P1-1-events-data-layer.md` … `P1-6-timer-persistence.md`

## Suggested tmux layout
One pane per task in the active wave. Keep `CLAUDE.md` and the relevant task file open in each session. Do not start a task whose dependencies are unmet; the acceptance checklists assume prerequisites exist.
