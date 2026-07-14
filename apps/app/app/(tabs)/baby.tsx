import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, useTheme, View } from '@/theme';

export default function Baby() {
  const theme = useTheme();
  return (
    <View bg="paper" style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1, padding: theme.space.lg, gap: theme.space.md }}>
        <Text variant="title">Baby</Text>
        <Text variant="body" color="inkSoft">
          Profile, growth charts, milestones, milk stash, and health records will live here.
        </Text>
      </SafeAreaView>
    </View>
  );
}
