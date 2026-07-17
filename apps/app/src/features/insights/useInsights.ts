import {
  dayBounds,
  type DaySummary,
  predictNextSleep,
  type SleepPrediction,
  summarizeRange,
} from '@baby-bean/core';
import { useMemo } from 'react';

import { useActiveChild, useTimeline } from '@/features/logging/data';
import { useTicker } from '@/features/logging/quicklog';

/** Suggested next-sleep window for the active child (recomputed each minute). */
export function useSleepPrediction(): SleepPrediction | null {
  const child = useActiveChild();
  const timeline = useTimeline();
  const now = useTicker(true, 60_000);
  return useMemo(
    () => predictNextSleep({ dob: child?.dob ?? null, recentSleeps: timeline, now }),
    [child?.dob, timeline, now],
  );
}

/** Today's summary for the active child. */
export function useTodaySummary(): DaySummary {
  const timeline = useTimeline();
  const now = useTicker(true, 60_000);
  return useMemo(() => {
    const { fromISO, toISO } = dayBounds(now);
    return summarizeRange(timeline, fromISO, toISO);
  }, [timeline, now]);
}
