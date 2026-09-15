import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme, type ColorValue } from 'react-native';

import { Colors } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

type TabIconProps = {
  color: ColorValue;
  size: number;
  focused: boolean;
};

function tabIcon(icon: IoniconName) {
  return function TabBarIcon({ color, size, focused }: TabIconProps) {
    return (
      <Ionicons
        name={focused ? icon : (`${icon}-outline` as IoniconName)}
        size={size}
        color={color}
      />
    );
  };
}

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen
        name="exams"
        options={{ title: 'Evaluaciones', tabBarIcon: tabIcon('document-text') }}
      />
      <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: tabIcon('time') }} />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Configuración', tabBarIcon: tabIcon('settings') }}
      />
    </Tabs>
  );
}
