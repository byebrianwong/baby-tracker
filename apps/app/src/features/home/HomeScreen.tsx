import { ScrollView, StyleSheet, View as RNView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Pebble, StatusStat } from '@/components';
import { useSession } from '@/features/auth';
import { useEvents } from '@/state';
import { type AccentName, Text, useTheme, View } from '@/theme';

const QUICK_LOG: { label: string; category: AccentName; icon: 'feed' | 'diaper' | 'sleep' | 'pump' }[] = [
  { label: 'Feed', category: 'feed', icon: 'feed' },
  { label: 'Diaper', category: 'diaper', icon: 'diaper' },
  { label: 'Sleep', category: 'sleep', icon: 'sleep' },
  { label: 'Pump', category: 'pump', icon: 'pump' },
];

/**
 * Home shell (P0-7): a glanceable status strip, the day's timeline, and the
 * quick-log bar in the thumb zone. The status/timeline become live and the
 * quick-log buttons start logging in Phase 1 (P1-2 / P1-3).
 */
export function HomeScreen() {
  const theme = useTheme();
  const { households, activeHouseholdId } = useSession();
  const events = useEvents();

  const householdName = households.find((h) => h.id === activeHouseholdId)?.name ?? 'Home';

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView edges={['top']} style={styles.fill}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl, paddingBottom: theme.space.xxl }}
          showsVerticalScrollIndicator={false}
        >
        <View style={{ gap: theme.space.xs }}>
          <Text variant="body" color="inkSoft">
            {householdName}
          </Text>
          <Text variant="title">Today</Text>
        </View>

        {/* Status strip — placeholder values until P1-2 makes it live. */}
        <View style={[styles.statusStrip, { gap: theme.space.xl }]}>
          <StatusStat label="since last feed" value="—" accent="feed" />
          <StatusStat label="since last diaper" value="—" accent="diaper" />
          <StatusStat label="sleep" value="awake" accent="sleep" />
        </View>

        {/* Timeline */}
        {events.length === 0 ? (
          <View
            bg="surface"
            radius="lg"
            padding="xl"
            style={{ gap: theme.space.sm, borderWidth: theme.size.hairline, borderColor: theme.color.line }}
          >
            <Text variant="subtitle">No feeds yet today</Text>
            <Text variant="body" color="inkSoft">
              Tap Feed below to start. Everything you log is undoable and easy to fix later.
            </Text>
          </View>
        ) : (
          <Text variant="body" color="inkSoft">
            {events.length} events today
          </Text>
        )}
        </ScrollView>
      </SafeAreaView>

      {/* Quick-log bar — thumb zone. Non-functional in P0-7; wired in P1-3. */}
      <View
        bg="surface"
        style={[
          styles.quickBar,
          {
            paddingHorizontal: theme.space.lg,
            paddingTop: theme.space.md,
            paddingBottom: theme.space.md,
            gap: theme.space.sm,
            borderTopWidth: theme.size.hairline,
            borderTopColor: theme.color.line,
          },
        ]}
      >
        {QUICK_LOG.map((q) => (
          <RNView key={q.label} style={{ flex: 1 }}>
            <Pebble
              label={q.label}
              category={q.category}
              iconLeft={<Icon name={q.icon} size={theme.space.xl} color={theme.color.ink} />}
              onPress={() => {}}
              style={{ paddingHorizontal: theme.space.sm }}
            />
          </RNView>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  statusStrip: { flexDirection: 'row', flexWrap: 'wrap' },
  quickBar: { flexDirection: 'row', alignItems: 'stretch' },
});
