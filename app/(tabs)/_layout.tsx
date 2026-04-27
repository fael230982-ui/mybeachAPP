import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getQueueSummary } from '@/services/offlineQueue';

export default function TabLayout() {
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function refreshQueueBadge() {
      try {
        const summary = await getQueueSummary();
        if (mounted) {
          setPendingQueueCount(summary.total);
        }
      } catch {
        if (mounted) {
          setPendingQueueCount(0);
        }
      }
    }

    refreshQueueBadge();
    const interval = setInterval(refreshQueueBadge, 15000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshQueueBadge();
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 70,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        },
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 10,
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          title: 'Mapas',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mare"
        options={{
          title: 'Maré',
          tabBarIcon: ({ color }) => <Ionicons name="water" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="comercios"
        options={{
          title: 'Comércios',
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Conta',
          tabBarBadge: pendingQueueCount > 0 ? pendingQueueCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
          },
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
