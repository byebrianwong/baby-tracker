import { observer } from '@legendapp/state/react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/features/auth';
import { useActiveChild } from '@/features/logging/data';
import { QuickLogBar } from '@/features/logging/quicklog';
import { StatusStrip } from '@/features/logging/status/StatusStrip';
import { Timeline } from '@/features/logging/timeline/Timeline';
import { Text, useTheme, View } from '@/theme';

/**
 * Home: the glanceable status strip + the day's timeline, with the quick-log
 * bar pinned in the thumb zone. The timeline is the scroll surface; the status
 * strip rides as its header so the whole thing stays virtualized.
 */
export const HomeScreen = observer(function HomeScreen() {
  const theme = useTheme();
  const { households, activeHouseholdId } = useSession();
  const child = useActiveChild();
  const householdName = households.find((h) => h.id === activeHouseholdId)?.name ?? 'Home';

  const header = (
    <View style={{ gap: theme.space.xl, marginBottom: theme.space.lg }}>
      <View style={{ gap: theme.space.xs }}>
        <Text variant="body" color="inkSoft">
          {householdName}
        </Text>
        <Text variant="title">{child?.name ?? 'Today'}</Text>
      </View>
      <StatusStrip />
    </View>
  );

  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView edges={['top']} style={styles.fill}>
        <Timeline header={header} />
      </SafeAreaView>
      <QuickLogBar />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
