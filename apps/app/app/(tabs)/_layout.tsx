import { Tabs } from 'expo-router';
import { type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components';
import { FONT, useTheme } from '@/theme';

type TabIconProps = { color: ColorValue; size: number };
const tabIcon = (name: IconName) =>
  function TabBarIcon({ color, size }: TabIconProps) {
    return <Icon name={name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.primary,
        tabBarInactiveTintColor: theme.color.inkSoft,
        tabBarStyle: {
          backgroundColor: theme.color.surface,
          borderTopColor: theme.color.line,
        },
        tabBarLabelStyle: { fontFamily: FONT.bodyMedium, fontSize: theme.type.scale.caption },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: tabIcon('growth') }} />
      <Tabs.Screen name="baby" options={{ title: 'Baby', tabBarIcon: tabIcon('baby') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabIcon('menu') }} />
    </Tabs>
  );
}
