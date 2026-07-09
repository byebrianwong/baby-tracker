import { APP_NAME } from '@baby-bean/core';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Placeholder Home screen for the Phase 0 scaffold. Proves the app runs on
 * iOS, Android, and Web and that it can import a symbol from `@baby-bean/core`
 * (workspace wiring). The real Home — status strip, timeline, quick-log bar —
 * is built in P0-7 and Phase 1.
 */
export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>Scaffold is running.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF7F1' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '600', color: '#2C2A28' },
  subtitle: { fontSize: 16, color: '#6E6A64' },
});
