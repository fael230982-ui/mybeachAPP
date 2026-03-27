import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: '#fff', height: 65, paddingBottom: 10 },
      tabBarActiveTintColor: '#ef4444',
      tabBarInactiveTintColor: '#94a3b8',
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="mapas" options={{ title: 'Mapas', tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} /> }} />
    </Tabs>
  );
}