import { elapsedSeconds, formatDuration } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { StyleSheet, View } from 'react-native';

import { StatusStat } from '@/components';
import { useRunningTimers, useTimeline } from '@/features/logging/data';
import { useTicker } from '@/features/logging/quicklog';
import { useTheme } from '@/theme';

/**
 * The glanceable "when did we last…?" strip. Answers feed / diaper / sleep at a
 * glance before any tapping. Updates live as timers run and events are logged.
 */
export const StatusStrip = observer(function StatusStrip() {
  const theme = useTheme();
  const timeline = useTimeline();
  const running = useRunningTimers();
  const now = useTicker(true, 30_000);

  const lastFeed = timeline.find((e) => e.type === 'breast' || e.type === 'bottle');
  const lastDiaper = timeline.find((e) => e.type === 'diaper');
  const sleeping = running.find((e) => e.type === 'sleep');

  const since = (startedAt: string | undefined) =>
    startedAt ? formatDuration(elapsedSeconds(startedAt, now)) : '—';

  return (
    <View style={[styles.row, { gap: theme.space.xl }]}>
      <StatusStat label="since last feed" value={since(lastFeed?.started_at)} accent="feed" />
      <StatusStat label="since last diaper" value={since(lastDiaper?.started_at)} accent="diaper" />
      {sleeping ? (
        <StatusStat label="asleep for" value={since(sleeping.started_at)} accent="sleep" />
      ) : (
        <StatusStat label="sleep" value="awake" accent="sleep" />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
