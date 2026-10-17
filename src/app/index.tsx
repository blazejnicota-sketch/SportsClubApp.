import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTeamStore, Player, EventItem } from './store/useTeamStore';

export default function DashboardScreen() {
  const store = useTeamStore();
  const players: Player[] = store.players || [];
  const events: EventItem[] = store.events || [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Panel Główny</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Podsumowanie Drużyny</Text>
        <Text style={styles.cardText}>Liczba zawodników w kadrze: <Text style={styles.bold}>{players.length}</Text></Text>
        <Text style={styles.cardText}>Liczba nadchodzących wydarzeń: <Text style={styles.bold}>{events.length}</Text></Text>
      </View>

      <Text style={[styles.title, { fontSize: 18, marginTop: 16 }]}>Zawodnicy w kadrze</Text>
      {players.map((p: any) => (
        <View key={p.id} style={styles.playerItem}>
          <Text style={styles.playerName}>{p.name}</Text>
          <Text style={styles.playerRole}>{p.position || 'Brak pozycji'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  cardText: { fontSize: 15, color: '#444', marginBottom: 4 },
  bold: { fontWeight: 'bold', color: '#111' },
  playerItem: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerName: { fontSize: 15, fontWeight: '600' },
  playerRole: { fontSize: 13, color: '#777' },
});