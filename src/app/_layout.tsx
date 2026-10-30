import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { PlayersProvider } from './PlayersContext';

export default function RootLayout() {
  return (
    <PlayersProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        {/* 5 GŁÓWNYCH ZAKŁADEK DOLNYCH */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Start',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Kalendarz"
          options={{
            title: 'Kalendarz',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Boisko"
          options={{
            title: 'Boisko',
            tabBarIcon: ({ color, size }) => <Ionicons name="football-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Szatnia"
          options={{
            title: 'Szatnia',
            tabBarIcon: ({ color, size }) => <Ionicons name="fitness-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Zawodnicy"
          options={{
            title: 'Zawodnicy',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
          }}
        />

        {/* UKRYTE EKRANY POMOCNICZE I MODUŁY (DOSTĘPNE PRZEZ ROUTER) */}
        <Tabs.Screen name="Finanse" options={{ href: null }} />
        <Tabs.Screen name="Auth" options={{ href: null }} />
        <Tabs.Screen name="testy" options={{ href: null }} />
        <Tabs.Screen name="Klub" options={{ href: null }} />
        <Tabs.Screen name="Raporty" options={{ href: null }} />
        <Tabs.Screen name="StrojePanel" options={{ href: null }} />
        <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
        <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
        <Tabs.Screen name="ZawodnikPanel" options={{ href: null }} />
      </Tabs>
    </PlayersProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});