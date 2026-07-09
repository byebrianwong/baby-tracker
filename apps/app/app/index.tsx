import { APP_NAME } from '@baby-bean/core';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, useTheme, View } from '@/theme';

/**
 * Placeholder Home for the Phase 0 scaffold — now themed (Day/Dark/Night).
 * The real Home (status strip, timeline, quick-log bar) is P0-7 and Phase 1.
 */
export default function Home() {
  const theme = useTheme();
  return (
    <View bg="paper" style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={[styles.center, { gap: theme.space.sm }]}>
          <Text variant="display">{APP_NAME}</Text>
          <Text variant="body" color="inkSoft">
            Scaffold is running.
          </Text>
          <Link href="/dev/theme" style={{ marginTop: theme.space.lg }}>
            <Text variant="subtitle" color="primary">
              Open theme preview →
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
