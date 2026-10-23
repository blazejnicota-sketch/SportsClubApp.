import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';

type RoleType = 'Trener' | 'Zawodnik' | 'Rodzice';

export default function RootLayout() {
  const [currentRole, setCurrentRole] = useState<RoleType>('Trener');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* GÓRNY PASEK WYBORU ROLI (Poprawiona pozycja - nie blokuje treści) */}
      <View style={styles.roleBarContainer}>
        <View style={styles.roleBar}>
          {(['Trener', 'Zawodnik', 'Rodzice'] as RoleType[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleBtn, currentRole === role && styles.roleBtnActive]}
              onPress={() => setCurrentRole(role)}
            >
              <Text style={[styles.roleText, currentRole === role && styles.roleTextActive]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GŁÓWNY NAWIGATOR ZAKŁADEK */}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
          }}
        >
          {/* 5 GŁÓWNYCH ZAKŁADEK */}
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

          {/* UKRYTE EKRANY POMOCNICZE I MODUŁY (href: null usuwa je z paska dolnego) */}
          <Tabs.Screen name="Finanse" options={{ href: null }} />
          <Tabs.Screen name="Auth" options={{ href: null }} />
          <Tabs.Screen name="testy" options={{ href: null }} />
          <Tabs.Screen name="Klub" options={{ href: null }} />
          <Tabs.Screen name="Raporty" options={{ href: null }} />
          <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
          <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
          <Tabs.Screen name="ZawodnikPanel" options={{ href: null }} />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  roleBarContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 10,
  },
  roleBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 3,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleBtnActive: {
    backgroundColor: '#2563eb',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
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