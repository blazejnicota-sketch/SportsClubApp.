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
import { usePlayers } from './PlayersContext';

export default function RodzicPanelScreen() {
  const { players } = usePlayers();
  
  // Domyślnie podglądamy pierwszego zawodnika z listy lub dajemy możliwość wyboru
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    players.length > 0 ? String(players[0].id) : '1'
  );

  const [attendanceConfirmed, setAttendanceConfirmed] = useState<string | null>(null);

  const currentPlayer = players.find((p: any) => String(p.id) === String(selectedPlayerId)) || players[0];

  const handleConfirmAttendance = (status: 'yes' | 'no') => {
    setAttendanceConfirmed(status);
    Alert.alert(
      'Potwierdzeno obecność 👍',
      status === 'yes'
        ? 'Dziękujemy! Informacja została przekazana trenerowi.'
        : 'Zaznaczono nieobecność. Trener został powiadomiony.'
    );
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK PANELU RODZICA */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Panel Rodzica / Zawodnika 👨‍👩‍👦</Text>
          <Text style={styles.headerSubtitle}>Podgląd kalendarza, powołań i składek klubu</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* WYBÓR DZIECKA (jeśli rodzic ma więcej niż jednego zawodnika w klubie) */}
        <Text style={styles.sectionLabel}>Wybierz profil zawodnika:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {players.map((player: any) => {
            const isSelected = String(player.id) === String(selectedPlayerId);
            const cleanName = (player.name || `${player.firstName} ${player.lastName}`).replace(/\s*\(\d{4}\)/g, '');
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerChip, isSelected && styles.playerChipActive]}
                onPress={() => {
                  setSelectedPlayerId(String(player.id));
                  setAttendanceConfirmed(null);
                }}
              >
                <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                  #{player.number || '•'} {cleanName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {currentPlayer && (
          <>
            {/* KARTA STATUSU FINANSOWEGO DZIECKA */}
            <View style={styles.financeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.financeIconBox}>
                    <Ionicons name="wallet-outline" size={18} color="#2563eb" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.financeCardTitle}>Składka członkowa (Październik)</Text>
                    <Text style={styles.financeCardSub}>Kwota: 180 zł</Text>
                  </View>
                </View>
                <View style={styles.statusBadgeGreen}>
                  <Text style={styles.statusBadgeTextGreen}>Opłacone ✓</Text>
                </View>
              </View>
            </View>

            {/* NAJBLIŻSZE WYDARZENIE / POWOŁANIE */}
            <Text style={styles.sectionTitle}>Najbliższe Wydarzenie & Powołanie</Text>
            <View style={styles.eventCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.eventTitle}>⚽ Mecz Ligowy z WKS Wieluń</Text>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>Mecz</Text>
                </View>
              </View>

              <Text style={styles.eventMeta}>📅 Niedziela, 25 października 2026</Text>
              <Text style={styles.eventMeta}>⏰ Zbiórka: <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>07:05</Text> | Szatnia klubowa</Text>
              <Text style={styles.eventMeta}>📍 Miejsce: Stadion Miejski, ul. Sportowa 1</Text>

              <View style={styles.divider} />

              <Text style={styles.confirmLabel}>Czy zawodnik weźmie udział w wydarzeniu?</Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  style={[styles.confirmBtnYes, attendanceConfirmed === 'yes' && { backgroundColor: '#15803d' }]}
                  onPress={() => handleConfirmAttendance('yes')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.confirmBtnText}>Potwierdzam (Będzie)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtnNo, attendanceConfirmed === 'no' && { backgroundColor: '#b91c1c' }]}
                  onPress={() => handleConfirmAttendance('no')}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.confirmBtnText}>Nieobecny</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STATYSTYKI FREKWENCJI I ROZWOJU DZIECKA */}
            <Text style={styles.sectionTitle}>Statystyki Sezonu</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>{currentPlayer.trainingsPresent || 14}</Text>
                <Text style={styles.statBoxLabel}>Obecności na treningach</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>92%</Text>
                <Text style={styles.statBoxLabel}>Frekwencja</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>3</Text>
                <Text style={styles.statBoxLabel}>Zdobyte bramki</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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

  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 6 },
  playerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  playerChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  playerChipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  playerChipTextActive: { color: '#fff' },

  financeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  financeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  financeCardSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusBadgeGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeTextGreen: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, marginTop: 4 },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  eventTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  matchBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  matchBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },
  eventMeta: { fontSize: 12, color: '#475569', marginBottom: 3 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },

  confirmLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 8, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtnYes: {
    flex: 1,
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 6,
  },
  confirmBtnNo: {
    flex: 1,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 6,
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBoxNum: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  statBoxLabel: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 4 },
});