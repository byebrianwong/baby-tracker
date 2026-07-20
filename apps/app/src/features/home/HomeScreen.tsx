import { type EventRow } from '@baby-bean/db';
import { observer } from '@legendapp/state/react';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth';
import { useActiveChild } from '@/features/logging/data';
import { EventEditor, LogEarlier } from '@/features/logging/edit';
import { UndoProvider } from '@/features/logging/feedback/UndoController';
import { MoreLog } from '@/features/logging/more';
import { QuickLogBar } from '@/features/logging/quicklog';
import { StatusStrip } from '@/features/logging/status/StatusStrip';
import { useTimerPersistence } from '@/features/logging/timed/persistence';
import { Timeline } from '@/features/logging/timeline/Timeline';
import { Text, useTheme, View } from '@/theme';

/**
 * Home: the glanceable status strip + the day's timeline, with the quick-log
 * bar pinned in the thumb zone. Tap a row to edit; "Log earlier" backdates.
 * One shared Undo bar (UndoProvider) covers every create / edit / delete.
 */
export const HomeScreen = observer(function HomeScreen() {
  const theme = useTheme();
  const { households, activeHouseholdId } = useSession();
  const child = useActiveChild();
  const householdName = households.find((h) => h.id === activeHouseholdId)?.name ?? 'Home';

  const [editing, setEditing] = useState<EventRow | null>(null);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Surface running timers to the lock screen (native only; no-op on web).
  useTimerPersistence();

  const header = (
    <View style={{ gap: theme.space.xl, marginBottom: theme.space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ gap: theme.space.xs }}>
          <Text variant="body" color="inkSoft">
            {householdName}
          </Text>
          <Text variant="title">{child?.name ?? 'Today'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEarlierOpen(true)}
            style={{ minHeight: theme.size.tapMin, justifyContent: 'center' }}
          >
            <Text variant="body" color="primary">
              Log earlier
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log something else"
            onPress={() => setMoreOpen(true)}
            style={{ minHeight: theme.size.tapMin, justifyContent: 'center' }}
          >
            <Text variant="body" color="primary">
              Something else
            </Text>
          </Pressable>
        </View>
      </View>
      <StatusStrip />
    </View>
  );

  return (
    <View bg="paper" style={styles.fill}>
      <UndoProvider>
        <SafeAreaView edges={['top']} style={styles.fill}>
          <Timeline header={header} onEventPress={setEditing} />
        </SafeAreaView>
        <QuickLogBar />
        <EventEditor key={editing?.id ?? 'closed'} event={editing} onClose={() => setEditing(null)} />
        <LogEarlier visible={earlierOpen} onClose={() => setEarlierOpen(false)} />
        <MoreLog visible={moreOpen} onClose={() => setMoreOpen(false)} />
      </UndoProvider>
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
