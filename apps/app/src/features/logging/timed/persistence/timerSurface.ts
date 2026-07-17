import { Platform } from 'react-native';

/** A running timer projected for a native surface (lock screen / notification). */
export type TimerActivity = {
  id: string;
  type: string;
  /** ISO start time — the native surface computes elapsed from this, not a stored count. */
  startedAt: string;
  label: string;
};

/**
 * The cross-platform seam for surfacing a running timer outside the app:
 *   - iOS  → Live Activity (lock screen + Dynamic Island) with a Stop control
 *   - Android → foreground-service ongoing notification with a Stop action
 *   - Web / Expo Go → nothing (no such surface); the in-app timer is the truth
 *
 * IMPORTANT: reboot/force-quit survival of the *in-app* timer is already handled
 * — running events (ended_at is null) persist in the Legend-State store, and
 * elapsed is always recomputed from `startedAt` (packages/core `elapsedSeconds`),
 * never from a counter. This seam adds the *native lock-screen* surface on top.
 *
 * The native implementations (Swift Live Activity via @bacons/apple-targets, and
 * the Android foreground service) require native dev builds and are a follow-up
 * — see persistence/README.md. Until they exist, every platform is a safe no-op.
 */
export interface TimerSurface {
  /** True when this platform can show a running timer outside the app. */
  readonly supported: boolean;
  /** Reconcile the native surface to exactly this set of running timers. */
  sync(activities: TimerActivity[]): Promise<void>;
}

const noopSurface: TimerSurface = {
  supported: false,
  async sync() {
    // No lock-screen surface on web / Expo Go; the in-app timer is authoritative.
  },
};

let cached: TimerSurface | null = null;

/** The timer surface for the current platform (memoized). */
export function getTimerSurface(): TimerSurface {
  if (cached) return cached;
  // Native surfaces are wired in a dev build (see README); no-op until then so
  // web and Expo Go keep working and never crash on a missing native module.
  cached = Platform.OS === 'web' ? noopSurface : noopSurface;
  return cached;
}
