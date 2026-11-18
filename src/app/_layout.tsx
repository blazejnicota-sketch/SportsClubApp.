import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { PlayersProvider } from '../components/PlayersContext';
import { ClubSettingsProvider, useClubSettings } from '../components/ClubSettingsContext';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

// Konfiguracja Reactotrona (tylko w trybie deweloperskim na Android/iOS, z pominięciem Web)
if (__DEV__ && Platform.OS !== 'web') {
  import('../ReactotronConfig').catch(() => {});
}

function AppTabsLayout({ userRole }: { userRole: 'trener' | 'rodzic' | 'zawodnik' | null }) {
  const { features, hasAiAccess, darkMode } = useClubSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: darkMode ? '#94a3b8' : '#64748b',
        tabBarStyle: [
          styles.tabBar,
          darkMode && { backgroundColor: '#1e293b', borderTopColor: '#334155' },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* 1. START / PULPIT */}
      <Tabs.Screen
        name="index"
        options={{
          title: userRole === 'trener' ? 'Pulpit' : 'Start',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />

      {/* 2. KADRA (Tylko dla trenera) */}
      <Tabs.Screen
        name="Zawodnicy"
        options={{
          title: 'Kadra',
          href: userRole === 'trener' ? '/Zawodnicy' : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      {/* 3. TERMINARZ (Ukrywany dynamicznie, jeśli trener wyłączy go w Ustawieniach) */}
      <Tabs.Screen
        name="Kalendarz"
        options={{
          title: 'Terminarz',
          href:
            features.enableCalendar && (userRole === 'trener' || userRole === 'rodzic')
              ? '/Kalendarz'
              : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      {/* 4. WYZWANIA AI (Widoczne dla trenera i zawodnika — z kłódką w pakiecie STANDARD) */}
      <Tabs.Screen
        name="ZadaniaDomowe"
        options={{
          title: 'Wyzwania AI',
          href: userRole === 'trener' || userRole === 'zawodnik' ? '/ZadaniaDomowe' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={hasAiAccess ? 'rocket-outline' : 'lock-closed-outline'}
              size={size}
              color={hasAiAccess ? color : '#f59e0b'}
            />
          ),
        }}
      />

      {/* 4B. MENTAL SPACE & SAFE SPORT */}
      <Tabs.Screen
        name="MentalSpace"
        options={{
          title: 'Mental',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
        }}
      />

      {/* 5. USTAWIENIA & SUBSKRYPCJA */}
      <Tabs.Screen
        name="Ustawienia"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />

      {/* UKRYTE EKRANY */}
      <Tabs.Screen name="Auth" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="Boisko" options={{ href: null }} />
      <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
      <Tabs.Screen name="PanelTrenera" options={{ href: null }} />
      <Tabs.Screen name="ZawodnikPanel" options={{ href: null }} />
      <Tabs.Screen name="AiVideoAnalysis" options={{ href: null }} />
      <Tabs.Screen name="MatchOptimizer" options={{ href: null }} />
      <Tabs.Screen name="SklepKlubowy" options={{ href: null }} />
      <Tabs.Screen name="ParentLinkScreen" options={{ href: null }} />
      <Tabs.Screen name="Szatnia" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userRole, setUserRole] = useState<'trener' | 'rodzic' | 'zawodnik' | null>(null);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setUserRole(session.user.user_metadata?.role || 'trener');
      setIsInitializing(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setUserRole(session.user.user_metadata?.role || 'trener');
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === 'Auth';

    if (!session && !inAuthGroup) {
      router.replace('/Auth');
    } else if (session && inAuthGroup) {
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
    <ClubSettingsProvider>
      <PlayersProvider>
        <AppTabsLayout userRole={userRole} />
      </PlayersProvider>
    </ClubSettingsProvider>
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