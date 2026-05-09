import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tint = '#6366f1';
  const inactive = isDark ? '#64748b' : '#94a3b8';

  const tabs = [
    {
      name: 'index',
      title: 'Chat',
      icon: 'chatbubble-ellipses',
    },
    {
      name: 'explore',
      title: 'ស្វែងរក',
      icon: 'compass',
    },
    {
      name: 'settings',
      title: 'ការកំណត',
      icon: 'settings-outline',
    },
  ] as const;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: inactive,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f1117' : '#ffffff',
          borderTopColor: isDark ? '#1e2130' : '#e2e8f0',
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      {tabs.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Ionicons name={icon} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}