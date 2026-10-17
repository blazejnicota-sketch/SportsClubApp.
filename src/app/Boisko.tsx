import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTeamStore, Player } from './store/useTeamStore';

export default function BoiskoScreen() {
  const store = useTeamStore();
  const players: Player[] = store.players || [];
  const [selectedPosition, setSelectedPosition] = useState<string>('Wszyscy');

  const positions = ['Wszyscy', 'Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'];

  const filteredPlayers = selectedPosition === 'Wszyscy'
    ? players
    : players.filter((p: any) => p.position === selectedPosition);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ustawienie na Boisku</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {positions.map((pos: any, idx: number) => (
          <TouchableOpacity
            key={`pos-${idx}`}
            style={[styles.filterChip, selectedPosition === pos && styles.activeFilterChip]}
            onPress={() => setSelectedPosition(pos)}
          >
            <Text style={[styles.filterText, selectedPosition === pos && styles.activeFilterText]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list}>
        {filteredPlayers.map((player: any) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>#{player.number || '?'}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerRole}>{player.position || 'Brak pozycji'} {player.role ? `• ${player.role}` : ''}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  filterContainer: { flexDirection: 'row', marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  activeFilterChip: { backgroundColor: '#007AFF' },
  filterText: { color: '#333', fontSize: 14 },
  activeFilterText: { color: '#FFF', fontWeight: 'bold' },
  list: { flex: 1 },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#EAEAEA' },
  numberBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  numberText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  playerRole: { fontSize: 13, color: '#666', marginTop: 2 },
});