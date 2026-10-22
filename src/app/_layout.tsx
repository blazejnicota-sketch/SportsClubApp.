import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      {/* 1. START / PANEL GŁÓWNY */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />

      {/* 2. KALENDARZ */}
      <Tabs.Screen
        name="Kalendarz"
        options={{
          title: 'Kalendarz',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />

      {/* 3. BOISKO / SKŁAD */}
      <Tabs.Screen
        name="Boisko"
        options={{
          title: 'Boisko',
          tabBarIcon: ({ color, size }) => <Ionicons name="football-outline" size={size} color={color} />,
        }}
      />

      {/* 4. SZATNIA (Sportowa baza zawodników i zdrowie) */}
      <Tabs.Screen
        name="Szatnia"
        options={{
          title: 'Szatnia',
          tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" size={size} color={color} />,
        }}
      />

      {/* 5. ZAWODNICY (Pełna baza danych) */}
      <Tabs.Screen
        name="Zawodnicy"
        options={{
          title: 'Zawodnicy',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />

      {/* UKRYTE MODUŁY (Niewidoczne na dolnym pasku, dostępne w kodzie / nawigacji) */}
      <Tabs.Screen name="Finanse" options={{ href: null }} />
      <Tabs.Screen name="Klub" options={{ href: null }} />
      <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
      <Tabs.Screen name="Raporty" options={{ href: null }} />
      <Tabs.Screen name="testy" options={{ href: null }} />
      <Tabs.Screen name="Auth" options={{ href: null }} />
    </Tabs>
  );
}