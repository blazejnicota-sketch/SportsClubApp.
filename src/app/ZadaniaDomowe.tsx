import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function ZadaniaDomoweScreen() {
  const { players } = usePlayers();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grywalizacja & XP</Text>
        <Text style={styles.headerSubtitle}>Wyzwania i tablica wyników</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.emptyStateBox}>
          <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>Brak aktywnych wyzwań</Text>
          <Text style={styles.emptyStateDesc}>Dodaj zadania domowe (np. żonglerka, pompki), a zawodnicy będą zdobywać punkty XP w aplikacji.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  content: { padding: 16 },
  emptyStateBox: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginTop: 12 },
  emptyStateDesc: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 18 }
});
