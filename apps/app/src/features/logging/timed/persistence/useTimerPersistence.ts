import { summarizeEvent } from '@baby-bean/core';
import { useEffect, useMemo } from 'react';

import { useRunningTimers } from '@/features/logging/data';

import { getTimerSurface, type TimerActivity } from './timerSurface';

/**
 * Keeps the native running-timer surface (Live Activity / ongoing notification)
 * in sync with the store's open timers. Mount once, high in the tree. No-op on
 * web / Expo Go. Returns whether a native surface is available.
 */
export function useTimerPersistence(): boolean {
  const surface = useMemo(() => getTimerSurface(), []);
  const running = useRunningTimers();

  // Serialize just the fields the surface needs so the effect only fires on a
  // real change (not on every unrelated re-render).
  const activities = useMemo<TimerActivity[]>(
    () =>
      running.map((e) => ({
        id: e.id,
        type: e.type,
        startedAt: e.started_at,
        label: summarizeEvent(e),
      })),
    [running],
  );
  const key = useMemo(
    () => activities.map((a) => `${a.id}:${a.startedAt}`).join('|'),
    [activities],
  );

  useEffect(() => {
    void surface.sync(activities);
    // `key` is the change signal; `activities` identity is covered by it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, key]);

  return surface.supported;
}
