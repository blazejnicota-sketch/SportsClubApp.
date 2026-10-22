import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function FinanseScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = MOCK_100_PLAYERS.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zarządzanie Finansami</Text>
        <Text style={styles.headerSubtitle}>Składki członkowskie i wpłaty zawodników</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>12,400 zł</Text>
          <Text style={styles.summaryLabel}>Zebrane składki</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>800 zł</Text>
          <Text style={styles.summaryLabel}>Zaległości</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj po nazwisku..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredPlayers.map((player, idx) => {
          const isPaid = idx % 5 !== 0; // Przykładowy status opłacenia
          return (
            <View key={player.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{player.firstName} {player.lastName}</Text>
                <Text style={styles.sub}>Składka miesięczna: 150 zł</Text>
              </View>

              <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                <Text style={[styles.badgeText, isPaid ? styles.textPaid : styles.textUnpaid]}>
                  {isPaid ? 'Opłacone' : 'Zaległość'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#10b981' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 38,
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 16 },
  row: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  sub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePaid: { backgroundColor: '#d1fae5' },
  badgeUnpaid: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  textPaid: { color: '#047857' },
  textUnpaid: { color: '#b91c1c' },
});