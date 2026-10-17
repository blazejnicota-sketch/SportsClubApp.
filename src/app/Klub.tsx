import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTeamStore, Player, FeeItem } from './store/useTeamStore';

export default function KlubScreen() {
  const store = useTeamStore();
  const players: Player[] = store.players || [];
  const fees: FeeItem[] = store.fees || [];

  const totalPaid = fees.filter((f: any) => f.paid).reduce((acc: number, f: any) => acc + (f.amount || 0), 0);
  const totalPending = fees.filter((f: any) => !f.paid).reduce((acc: number, f: any) => acc + (f.amount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Zarządzanie Klubem</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: '#D4EDDA' }]}>
          <Text style={styles.statTitle}>Opłacone składki</Text>
          <Text style={[styles.statValue, { color: '#155724' }]}>{totalPaid} PLN</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#F8D7DA' }]}>
          <Text style={styles.statTitle}>Zaległości</Text>
          <Text style={[styles.statValue, { color: '#721C24' }]}>{totalPending} PLN</Text>
        </View>
      </View>

      <Text style={[styles.title, { fontSize: 18, marginTop: 16 }]}>Składki zawodników</Text>
      {fees.map((f: any) => {
        const player = players.find((p: any) => p.id === f.playerId);
        return (
          <View key={f.id} style={styles.feeCard}>
            <View>
              <Text style={styles.playerName}>{player ? player.name : 'Nieznany zawodnik'}</Text>
              <Text style={styles.feeDetail}>{f.month} • {f.amount} PLN</Text>
            </View>
            <TouchableOpacity
              style={[styles.statusBadge, f.paid ? styles.paidBadge : styles.unpaidBadge]}
              onPress={() => store.toggleFeePaid(f.id)}
            >
              <Text style={styles.statusText}>{f.paid ? 'Opłacone' : 'Brak wpłaty'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, padding: 14, borderRadius: 10, marginHorizontal: 4, alignItems: 'center' },
  statTitle: { fontSize: 13, color: '#555', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  feeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EAEAEA' },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  feeDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  paidBadge: { backgroundColor: '#28A745' },
  unpaidBadge: { backgroundColor: '#DC3545' },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});