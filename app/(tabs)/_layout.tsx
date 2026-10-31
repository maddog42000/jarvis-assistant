import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 8 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#20c9e8',
        tabBarInactiveTintColor: '#8292a4',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          height: 58 + bottomPadding,
          paddingTop: 5,
          paddingBottom: bottomPadding,
          backgroundColor: '#081321',
          borderTopColor: '#1b3448',
          borderTopWidth: 1,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <MaterialIcons size={focused ? 24 : 22} name="home" color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color, focused }) => <MaterialIcons size={focused ? 24 : 22} name="chat-bubble-outline" color={color} /> }} />
      <Tabs.Screen name="actions" options={{ title: 'Actions', tabBarIcon: ({ color, focused }) => <MaterialIcons size={focused ? 24 : 22} name="bolt" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <MaterialIcons size={focused ? 24 : 22} name="tune" color={color} /> }} />
    </Tabs>
  );
}
