import { formatClockTime, formatDuration } from '@baby-bean/core';
import { observer } from '@legendapp/state/react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusStat } from '@/components';
import { useActiveChild, useRunningTimers } from '@/features/logging/data';
import { Text, useTheme, View } from '@/theme';

import { useSleepPrediction, useTodaySummary } from './useInsights';

export const InsightsScreen = observer(function InsightsScreen() {
  const theme = useTheme();
  const child = useActiveChild();
  const prediction = useSleepPrediction();
  const summary = useTodaySummary();
  const running = useRunningTimers();
  const asleep = running.some((e) => e.type === 'sleep');
  const name = child?.name ?? 'Baby';

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView edges={['top']} style={styles.fill}>
        <ScrollView contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl }}>
          <Text variant="title">Insights</Text>

          {/* Sleep window */}
          <View
            bg="surface"
            radius="lg"
            padding="lg"
            style={{ gap: theme.space.sm, borderWidth: theme.size.hairline, borderColor: theme.color.line }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.xs }}>
              <View style={{ width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.pill, backgroundColor: theme.color.accent.sleep }} />
              <Text variant="caption" color="inkSoft">
                sleep window
              </Text>
            </View>
            {prediction ? (
              <>
                <Text variant="display" style={{ fontSize: theme.type.scale.title }}>
                  {formatClockTime(prediction.start)} – {formatClockTime(prediction.end)}
                </Text>
                <Text variant="body" color="inkSoft">
                  {prediction.source === 'personalized'
                    ? `Likely ready to sleep, based on ${name}'s recent rhythm.`
                    : `Likely ready to sleep${prediction.ageWeeks != null ? ` for a ${prediction.ageWeeks}-week-old` : ''}.`}
                </Text>
              </>
            ) : asleep ? (
              <>
                <Text variant="display" style={{ fontSize: theme.type.scale.title }}>
                  Asleep now
                </Text>
                <Text variant="body" color="inkSoft">
                  Next window appears once {name} wakes.
                </Text>
              </>
            ) : (
              <>
                <Text variant="subtitle">Not enough sleep logged yet</Text>
                <Text variant="body" color="inkSoft">
                  Log a nap or two and a suggested sleep window will appear here.
                </Text>
              </>
            )}
          </View>

          {/* Today */}
          <View style={{ gap: theme.space.md }}>
            <Text variant="subtitle">Today</Text>
            <View style={[styles.grid, { gap: theme.space.xl }]}>
              <StatusStat label="feeds" value={String(summary.feeds)} accent="feed" />
              {summary.volumeMl > 0 ? (
                <StatusStat label="volume" value={`${summary.volumeMl} ml`} accent="feed" />
              ) : null}
              <StatusStat label="diapers" value={String(summary.diapers)} accent="diaper" />
              <StatusStat label="total sleep" value={formatDuration(summary.sleepSeconds)} accent="sleep" />
              {summary.longestSleepSeconds > 0 ? (
                <StatusStat label="longest stretch" value={formatDuration(summary.longestSleepSeconds)} accent="sleep" />
              ) : null}
              <StatusStat label="naps" value={String(summary.naps)} accent="sleep" />
            </View>
          </View>

          <Text variant="caption" color="inkSoft">
            {`Guidance from ${name}'s own patterns and general sleep norms — not medical advice. Every baby differs; ask your pediatrician with any concerns.`}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
