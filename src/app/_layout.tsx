import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isInitializing) return;
    const inAuthGroup = segments[0] === 'Auth';
    if (!session && !inAuthGroup) router.replace('/Auth');
    else if (session && inAuthGroup) router.replace('/');
  }, [session, isInitializing, segments]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Łączenie z chmurą SportsClub...</Text>
      </View>
    );
  }

  const tabBarScreens = ['index', 'Kalendarz', 'Boisko', 'Szatnia', 'Zawodnicy'];

  return (
    <PlayersProvider>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: tabBarScreens.includes(route.name) ? styles.tabBar : { display: 'none' },
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Pulpit', tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size + 2} color={color} /> }} />
        <Tabs.Screen name="Kalendarz" options={{ title: 'Terminarz', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-clear" size={size + 2} color={color} /> }} />
        <Tabs.Screen name="Boisko" options={{ title: 'Protokół', tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size + 2} color={color} /> }} />
        <Tabs.Screen name="Szatnia" options={{ title: 'Baza Kadry', tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size + 2} color={color} /> }} />
        
        {/* Ukryte ekrany */}
        <Tabs.Screen name="Zawodnicy" options={{ href: null }} />
        <Tabs.Screen name="Auth" options={{ href: null }} />
        <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
        <Tabs.Screen name="AiVideoAnalysis" options={{ href: null }} />
        <Tabs.Screen name="MatchOptimizer" options={{ href: null }} />
        <Tabs.Screen name="TreningiIndywidualne" options={{ href: null }} />
        <Tabs.Screen name="StrojePanel" options={{ href: null }} />
        <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
      </Tabs>
    </PlayersProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#64748b', fontWeight: '500' },
  tabBar: { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', height: 65, paddingBottom: 8, paddingTop: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  tabLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  tabItem: { paddingVertical: 4 },
});
