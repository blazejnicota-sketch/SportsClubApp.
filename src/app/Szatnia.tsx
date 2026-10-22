import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS, Player } from './data/mockPlayers';

interface PlayerPayment extends Player {
  paymentStatus: 'paid' | 'pending' | 'overdue';
  amount: number;
  lastPaidDate?: string;
}

export default function SzatniaScreen() {
  // Inicjalizacja danych finansowych na bazie 100 zawodników
  const [playersPayments, setPlayersPayments] = useState<PlayerPayment[]>(
    MOCK_100_PLAYERS.map((p, index) => ({
      ...p,
      paymentStatus: index % 3 === 0 ? 'paid' : index % 5 === 0 ? 'overdue' : 'pending',
      amount: 150, // np. 150 zł składki miesięcznej
      lastPaidDate: index % 3 === 0 ? '2026-10-05' : undefined,
    }))
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Statystyki finansowe
  const totalPaid = playersPayments.filter((p) => p.paymentStatus === 'paid').length;
  const totalPending = playersPayments.filter((p) => p.paymentStatus === 'pending').length;
  const totalOverdue = playersPayments.filter((p) => p.paymentStatus === 'overdue').length;

  const handleUpdateStatus = (id: string, status: 'paid' | 'pending' | 'overdue') => {
    setPlayersPayments(
      playersPayments.map((p) =>
        p.id === id ? { ...p, paymentStatus: status, lastPaidDate: status === 'paid' ? '2026-10-22' : p.lastPaidDate } : p
      )
    );
  };

  const sendReminder = (player: PlayerPayment) => {
    Alert.alert(
      'Przypomnienie wysłane',
      `Wysłano SMS/powiadomienie do rodziców zawodnika: ${player.firstName} ${player.lastName} z prośbą o uregulowanie składki (${player.amount} zł).`
    );
  };

  const filteredPlayers = playersPayments.filter((p) => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return { label: 'Opłacone', color: '#10b981', bg: '#ecfdf5' };
      case 'pending':
        return { label: 'Oczekuje', color: '#d97706', bg: '#fffbeb' };
      case 'overdue':
        return { label: 'Zaległość', color: '#ef4444', bg: '#fef2f2' };
    }
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK I PODSUMOWANIE FINANSOWE */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Szatnia i Finanse Drużyny</Text>
        <Text style={styles.headerSubtitle}>Kontrola składek członkowskich (100 zawodników)</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{totalPaid}</Text>
            <Text style={styles.statLabel}>Opłacone</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fffbeb' }]}>
            <Text style={[styles.statNumber, { color: '#d97706' }]}>{totalPending}</Text>
            <Text style={styles.statLabel}>Oczekujące</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{totalOverdue}</Text>
            <Text style={styles.statLabel}>Zaległe</Text>
          </View>
        </View>
      </View>

      {/* WYSZUKIWARKA I FILTRY */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj zawodnika..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all'
                  ? 'Wszyscy'
                  : status === 'paid'
                  ? 'Opłacone'
                  : status === 'pending'
                  ? 'Oczekujące'
                  : 'Zaległości'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA ZAWODNIKÓW I STATUS SKŁADEK */}
      <ScrollView style={styles.content}>
        {filteredPlayers.map((player) => {
          const badge = getStatusBadge(player.paymentStatus);
          return (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.playerInfoRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {player.firstName[0]}
                    {player.lastName[0]}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>
                    {player.firstName} {player.lastName}
                  </Text>
                  <Text style={styles.playerMeta}>
                    Rocznik {player.birthYear} • {player.category} • Składka: {player.amount} zł
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              {/* PRZYCISKI ZARZĄDZANIA PŁATNOŚCIĄ */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleUpdateStatus(player.id, 'paid')}
                >
                  <Text style={styles.actionBtnText}>Oznacz jako opłacone</Text>
                </TouchableOpacity>

                {player.paymentStatus !== 'paid' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                    onPress={() => sendReminder(player)}
                  >
                    <Ionicons name="notifications-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnText}>Przypomnij</Text>
                  </TouchableOpacity>
                )}
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statNumber: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  filterSection: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 38,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterRow: { paddingHorizontal: 16, marginTop: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  playerInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 13 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  playerMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});