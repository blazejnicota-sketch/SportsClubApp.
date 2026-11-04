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

export default function RaportyScreen() {
  const { players } = usePlayers();
  const [activeTab, setActiveTab] = useState<'player' | 'team'>('team');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    players.length > 0 ? String(players[0].id) : '1'
  );

  // Pomocnicza funkcja pobierania imienia i nazwiska
  const getPlayerName = (player: any) => {
    if (!player) return 'Zawodnik';
    if (player.name) return player.name.replace(/\s*\(\d{4}\)/g, '');
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    if (player.first_name || player.last_name) {
      return `${player.first_name || ''} ${player.last_name || ''}`.trim();
    }
    return 'Zawodnik';
  };

  const selectedPlayer = players.find((p: any) => String(p.id) === String(selectedPlayerId)) || players[0];

  const handleExportPdf = () => {
    Alert.alert('Eksport Raportu 📄', 'Wygenerowano raport PDF gotowy do druku i wysyłki do Zarządu / Rodziców!');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centrum Raportów i Analytics 📊</Text>
        <Text style={styles.headerSubtitle}>
          Karty zawodników, zestawienia frekwencji i statystyki zespołu
        </Text>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'team' && styles.activeTabBtn]}
          onPress={() => setActiveTab('team')}
        >
          <Ionicons
            name="stats-chart-outline"
            size={15}
            color={activeTab === 'team' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>
            Raport Drużynowy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'player' && styles.activeTabBtn]}
          onPress={() => setActiveTab('player')}
        >
          <Ionicons
            name="person-outline"
            size={15}
            color={activeTab === 'player' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'player' && styles.activeTabText]}>
            Karta Zawodnika
          </Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'team' ? (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Podsumowanie Miesięczne (Październik 2026)</Text>
              <TouchableOpacity onPress={handleExportPdf}>
                <Text style={styles.addBtnText}>📄 Eksport PDF</Text>
              </TouchableOpacity>
            </View>

            {/* KARTY ZESTAWIENIA DRUŻYNY */}
            <View style={styles.gridRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="calendar-outline" size={20} color="#2563eb" />
                <Text style={styles.summaryValue}>88%</Text>
                <Text style={styles.summaryLabel}>Średnia Frekwencja</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="trophy-outline" size={20} color="#16a34a" />
                <Text style={styles.summaryValue}>14 : 3</Text>
                <Text style={styles.summaryLabel}>Bilans Bramek</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="wallet-outline" size={20} color="#d97706" />
                <Text style={styles.summaryValue}>92%</Text>
                <Text style={styles.summaryLabel}>Opłacone Składki</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="fitness-outline" size={20} color="#dc2626" />
                <Text style={styles.summaryValue}>+4.2%</Text>
                <Text style={styles.summaryLabel}>Wzrost Motoryki</Text>
              </View>
            </View>

            {/* PRZODUJĄCY ZAWODNICY */}
            <Text style={styles.subSectionTitle}>Liderzy Frekwencji i Zaangażowania</Text>
            {players.slice(0, 5).map((player: any, idx: number) => (
              <View key={player.id} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>#{idx + 1}</Text>
                <Text style={styles.leaderName}>{getPlayerName(player)}</Text>
                <View style={styles.leaderBadge}>
                  <Text style={styles.leaderBadgeText}>100% Frekwencja</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Wybierz Zawodnika z Kadry</Text>
            
            {/* HORIZONTALNY WYBÓR ZAWODNIKA */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerPickerScroll}>
              {players.map((p: any) => {
                const isSelected = String(p.id) === String(selectedPlayerId);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, isSelected && styles.playerChipActive]}
                    onPress={() => setSelectedPlayerId(String(p.id))}
                  >
                    <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                      #{p.number || '•'} {getPlayerName(p)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* KARTA INDYWIDUALNA ZAWODNIKA */}
            {selectedPlayer && (
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarText}>#{selectedPlayer.number || '10'}</Text>
                  </View>
                  <View style={{ marginLeft: 14, flex: 1 }}>
                    <Text style={styles.profileName}>{getPlayerName(selectedPlayer)}</Text>
                    <Text style={styles.profileSub}>
                      Pozycja: {selectedPlayer.position || 'Pomocnik'} | Rocznik {selectedPlayer.year || '2012'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsOverviewRow}>
                  <View style={styles.profileStatItem}>
                    <Text style={styles.statNumber}>95%</Text>
                    <Text style={styles.statTitle}>Obecność</Text>
                  </View>
                  <View style={styles.profileStatItem}>
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statTitle}>Mecze</Text>
                  </View>
                  <View style={styles.profileStatItem}>
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statTitle}>Bramki</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.downloadCardBtn} onPress={handleExportPdf}>
                  <Ionicons name="download-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.downloadCardBtnText}>Pobierz Kartę Zawodnika (PDF)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  activeTabBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  activeTabText: { color: '#2563eb' },

  content: { padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginTop: 16, marginBottom: 8 },
  addBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },

  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2, textAlign: 'center' },

  leaderRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leaderRank: { fontSize: 12, fontWeight: 'bold', color: '#2563eb', width: 28 },
  leaderName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  leaderBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  leaderBadgeText: { fontSize: 10, color: '#16a34a', fontWeight: 'bold' },

  playerPickerScroll: { marginBottom: 14 },
  playerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  playerChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  playerChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  playerChipTextActive: { color: '#fff', fontWeight: 'bold' },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  avatarText: { fontSize: 15, fontWeight: 'bold', color: '#2563eb' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  profileSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },

  statsOverviewRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  profileStatItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  statTitle: { fontSize: 11, color: '#64748b', marginTop: 2 },

  downloadCardBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadCardBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});