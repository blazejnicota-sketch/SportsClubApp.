import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function FinanseScreen() {
  // Pomocnicza funkcja pobierania imienia i nazwiska
  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    if (player.first_name || player.last_name) {
      return `${player.first_name || ''} ${player.last_name || ''}`.trim();
    }
    return 'Zawodnik';
  };

  const samplePlayers = MOCK_100_PLAYERS.slice(0, 10);
  const [paidStatus, setPaidStatus] = useState<{ [key: string]: boolean }>({
    [samplePlayers[0]?.id]: true,
    [samplePlayers[1]?.id]: true,
    [samplePlayers[2]?.id]: false,
  });

  const togglePaid = (id: string) => {
    setPaidStatus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finanse i Składki Klubowe</Text>
        <Text style={styles.headerSubtitle}>
          Kontrola wpłat miesięcznych, salda drużyny i rozliczenia
        </Text>
      </View>

      <View style={styles.content}>
        {/* PODSUMOWANIE FINANSOWE */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2 400 zł</Text>
            <Text style={styles.summaryLabel}>Zebrane w tym mies.</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#dc2626' }]}>350 zł</Text>
            <Text style={styles.summaryLabel}>Zaległości</Text>
          </View>
        </View>

        {/* NAGŁÓWEK SEKCJI */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Status Składek (Październik 2026)</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Przypomnienie', 'Wysłano powiadomienia o składkach do rodziców')}
          >
            <Text style={styles.addBtnText}>📢 Wyślij przypomnienie</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA ZAWODNIKÓW I SKŁADEK */}
        {samplePlayers.map((player: any) => {
          const isPaid = paidStatus[player.id] || false;
          return (
            <View key={player.id} style={styles.playerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                <Text style={styles.playerSub}>Składka członkowska: 120 zł</Text>
              </View>

              <TouchableOpacity
                style={[styles.statusChip, isPaid ? styles.chipPaid : styles.chipUnpaid]}
                onPress={() => togglePaid(player.id)}
              >
                <Ionicons
                  name={isPaid ? 'checkmark-circle' : 'alert-circle'}
                  size={14}
                  color={isPaid ? '#16a34a' : '#dc2626'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, { color: isPaid ? '#16a34a' : '#dc2626' }]}>
                  {isPaid ? 'Opłacone' : 'Nieopłacone'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { padding: 16 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  addBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },

  playerRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipPaid: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  chipUnpaid: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  chipText: { fontSize: 11, fontWeight: 'bold' },
});