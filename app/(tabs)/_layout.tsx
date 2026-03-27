import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { 
        backgroundColor: '#ffffff', 
        height: 70, 
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
      },
      tabBarActiveTintColor: '#ef4444', 
      tabBarInactiveTintColor: '#94a3b8',
      headerShown: false,
      tabBarLabelStyle: { fontWeight: '800', fontSize: 10, marginBottom: 5 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="mapas" options={{ title: 'Mapas', tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} /> }} />
      <Tabs.Screen name="mare" options={{ title: 'Maré', tabBarIcon: ({ color }) => <Ionicons name="water" size={24} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} /> }} />
      <Tabs.Screen name="comercios" options={{ title: 'Comércios', tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} /> }} />
    </Tabs>
  );
}