import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2f81f7',
        tabBarInactiveTintColor: '#8b949e',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Boisko"
        options={{
          title: 'Boisko',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Szatnia"
        options={{
          title: 'Szatnia',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Kalendarz"
        options={{
          title: 'Kalendarz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Klub"
        options={{
          title: 'Klub',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Zawodnicy"
        options={{
          title: 'Zawodnicy',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />

      {/* UKRYTE PLIKI I STRONY Z DOLNEGO PASKA */}
      <Tabs.Screen name="testy" options={{ href: null }} />
      <Tabs.Screen name="Raporty" options={{ href: null }} />
      <Tabs.Screen name="Auth" options={{ href: null }} />
    </Tabs>
  );
}