import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './index';
import ZawodnikPanelScreen from './ZawodnikPanel';
import RodzicPanelScreen from './RodzicPanel';

export default function AppLayout() {
  // Stan wybranej roli: 'trener' | 'zawodnik' | 'rodzic'
  const [currentRole, setCurrentRole] = useState<'trener' | 'zawodnik' | 'rodzic'>('trener');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* PASEK PRZEŁĄCZANIA RÓL (SYMULATOR) */}
      <View style={styles.roleBar}>
        <Text style={styles.roleBarLabel}>Rola:</Text>
        <TouchableOpacity
          style={[styles.roleChip, currentRole === 'trener' && styles.roleChipActive]}
          onPress={() => setCurrentRole('trener')}
        >
          <Ionicons
            name="football-outline"
            size={12}
            color={currentRole === 'trener' ? '#fff' : '#475569'}
          />
          <Text style={[styles.roleChipText, currentRole === 'trener' && styles.roleChipTextActive]}>
            Trener
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleChip, currentRole === 'zawodnik' && styles.roleChipActive]}
          onPress={() => setCurrentRole('zawodnik')}
        >
          <Ionicons
            name="person-outline"
            size={12}
            color={currentRole === 'zawodnik' ? '#fff' : '#475569'}
          />
          <Text style={[styles.roleChipText, currentRole === 'zawodnik' && styles.roleChipTextActive]}>
            Zawodnik
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleChip, currentRole === 'rodzic' && styles.roleChipActive]}
          onPress={() => setCurrentRole('rodzic')}
        >
          <Ionicons
            name="people-outline"
            size={12}
            color={currentRole === 'rodzic' ? '#fff' : '#475569'}
          />
          <Text style={[styles.roleChipText, currentRole === 'rodzic' && styles.roleChipTextActive]}>
            Rodzic
          </Text>
        </TouchableOpacity>
      </View>

      {/* RENDEROWANIE WIDOKU W ZALEŻNOŚCI OD WYBRANEJ ROLI */}
      {currentRole === 'zawodnik' ? (
        <ZawodnikPanelScreen />
      ) : currentRole === 'rodzic' ? (
        <RodzicPanelScreen />
      ) : (
        /* PEŁNY EKOSYSTEM TRENERA (5 ZAKŁADEK) */
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2563eb',
            tabBarInactiveTintColor: '#64748b',
            tabBarStyle: {
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
            },
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
            name="Kalendarz"
            options={{
              title: 'Kalendarz',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
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
                <Ionicons name="fitness-outline" size={size} color={color} />
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

          {/* UKRYTE PODSTRONY */}
          <Tabs.Screen name="Finanse" options={{ href: null }} />
          <Tabs.Screen name="Klub" options={{ href: null }} />
          <Tabs.Screen name="Raporty" options={{ href: null }} />
          <Tabs.Screen name="ZadaniaDomowe" options={{ href: null }} />
          <Tabs.Screen name="ZawodnikPanel" options={{ href: null }} />
          <Tabs.Screen name="RodzicPanel" options={{ href: null }} />
        </Tabs>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleBarLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  roleChipActive: {
    backgroundColor: '#2563eb',
  },
  roleChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  roleChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});