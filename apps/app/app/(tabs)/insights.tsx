import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, useTheme, View } from '@/theme';

export default function Insights() {
  const theme = useTheme();
  return (
    <View bg="paper" style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: theme.space.lg, gap: theme.space.md }}>
        <Text variant="title">Insights</Text>
        <Text variant="body" color="inkSoft">
          Daily and weekly summaries, trends, and free sleep predictions will appear here once
          there is a little history to learn from.
        </Text>
      </SafeAreaView>
    </View>
  );
}
