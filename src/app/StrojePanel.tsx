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

interface OrderItem {
  playerId: string;
  playerName: string;
  size: string;
  number: string;
}

export default function StrojePanelScreen() {
  const { players } = usePlayers();
  
  // Stan przechowujący zamówienia (w docelowej wersji spięte z bazą/AsyncStorage)
  const [orders, setOrders] = useState<Record<string, string>>({
    // Przykładowo pierwszy zawodnik ma już wybrany rozmiar
    [players[0]?.id || '1']: '140',
  });

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    players.length > 0 ? String(players[0].id) : '1'
  );

  const availableSizes = ['116', '128', '140', '152', 'S', 'M'];

  const currentPlayer = players.find((p: any) => String(p.id) === String(selectedPlayerId)) || players[0];

  const handleSizeSelect = (size: string) => {
    setOrders((prev) => ({
      ...prev,
      [selectedPlayerId]: size,
    }));
    Alert.alert('Zapisano rozmiar! 👕', `Wybrano rozmiar ${size} dla zawodnika.`);
  };

  // Generowanie raportu zbiorczego dla trenera
  const getSummary = () => {
    const summary: Record<string, number> = {};
    Object.values(orders).forEach((size) => {
      summary[size] = (summary[size] || 0) + 1;
    });
    return summary;
  };

  const summary = getSummary();
  const totalOrdered = Object.keys(orders).length;

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Zamówienie strojów meczowych ⚽👕</Text>
          <Text style={styles.headerSubtitle}>Wybór rozmiarów i raport zbiorczy dla trenera</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEKCJA DLA RODZICA / WYBÓR ROZMIARU DZIECKA */}
        <Text style={styles.sectionLabel}>Wybierz zawodnika, aby wskazać rozmiar:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {players.map((player: any) => {
            const isSelected = String(player.id) === String(selectedPlayerId);
            const cleanName = (player.name || `${player.firstName} ${player.lastName}`).replace(/\s*\(\d{4}\)/g, '');
            const hasOrdered = orders[player.id];

            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerChip, isSelected && styles.playerChipActive]}
                onPress={() => setSelectedPlayerId(String(player.id))}
              >
                <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                  #{player.number || '•'} {cleanName} {hasOrdered ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {currentPlayer && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Rozmiar koszulki dla: {currentPlayer.name || `${currentPlayer.firstName} ${currentPlayer.lastName}`}
            </Text>
            <Text style={styles.cardSub}>
              Aktualnie wybrany rozmiar: <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>{orders[currentPlayer.id] || 'Brak wyboru'}</Text>
            </Text>

            <View style={styles.sizesGrid}>
              {availableSizes.map((size) => {
                const isChosen = orders[currentPlayer.id] === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeBtn, isChosen && styles.sizeBtnActive]}
                    onPress={() => handleSizeSelect(size)}
                  >
                    <Text style={[styles.sizeBtnText, isChosen && styles.sizeBtnTextActive]}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SEKCJA RAPORTU DLA TRENERA */}
        <View style={styles.trainerReportBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="clipboard-outline" size={20} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.reportTitle}>Raport Trenera – Podsumowanie zamówienia</Text>
          </View>

          <Text style={styles.reportMeta}>Łącznie złożone zamówienia: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{totalOrdered} / {players.length}</Text></Text>

          <View style={styles.summaryRow}>
            {availableSizes.map((size) => {
              const count = summary[size] || 0;
              if (count === 0) return null;
              return (
                <View key={size} style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeSize}>Rozmiar {size}</Text>
                  <Text style={styles.summaryBadgeCount}>{count} szt.</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => Alert.alert('Eksport raportu', 'Podsumowanie zostało skopiowane do schowka / wysłane do producenta!')}
          >
            <Ionicons name="share-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.exportBtnText}>Skopiuj raport dla hurtowni / na grupę</Text>
          </TouchableOpacity>
        </View>

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

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 14 },

  sizesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sizeBtn: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sizeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sizeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  sizeBtnTextActive: { color: '#fff' },

  trainerReportBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reportTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  reportMeta: { fontSize: 12, color: '#475569', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  summaryBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryBadgeSize: { fontSize: 11, color: '#1e40af', fontWeight: 'bold' },
  summaryBadgeCount: { fontSize: 14, color: '#2563eb', fontWeight: 'bold', marginTop: 2 },

  exportBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});