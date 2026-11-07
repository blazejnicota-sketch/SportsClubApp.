import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { PlayersProvider } from '../components/PlayersContext';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'Auth';

    if (!session && !inAuthGroup) {
      // Jeśli nie ma sesji, wyrzuć na ekran logowania
      router.replace('/Auth');
    } else if (session && inAuthGroup) {
      // Jeśli jest sesja i jesteśmy na logowaniu, wpuść do apki
      router.replace('/');
    }
  }, [session, isInitializing, segments]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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
        <Tabs.Screen name="index" options={{ title: 'Start', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="Kalendarz" options={{ title: 'Kalendarz', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="Boisko" options={{ title: 'Boisko', tabBarIcon: ({ color, size }) => <Ionicons name="football-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="Szatnia" options={{ title: 'Szatnia', tabBarIcon: ({ color, size }) => <Ionicons name="fitness-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="Zawodnicy" options={{ title: 'Zawodnicy', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />

        {/* UKRYTE EKRANY */}
        <Tabs.Screen name="Auth" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="Finanse" options={{ href: null }} />
        <Tabs.Screen name="testy" options={{ href: null }} />
        <Tabs.Screen name="Klub" options={{ href: null }} />
        <Tabs.Screen name="Raporty" options={{ href: null }} />
        <Tabs.Screen name="StrojePanel" options={{ href: null }} />
        <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
        <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
        <Tabs.Screen name="ZawodnikPanel" options={{ href: null }} />
        <Tabs.Screen name="QuickAttendance" options={{ href: null }} />
        <Tabs.Screen name="AiVideoAnalysis" options={{ href: null }} />
        <Tabs.Screen name="MatchOptimizer" options={{ href: null }} />
        <Tabs.Screen name="SklepKlubowy" options={{ href: null }} />
        <Tabs.Screen name="Ustawienia" options={{ href: null }} />
      </Tabs>
    </PlayersProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', height: 60, paddingBottom: 8, paddingTop: 6 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});
