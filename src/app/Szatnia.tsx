import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS, Player } from './data/mockPlayers';

export default function SzatniaScreen() {
  const [players] = useState<Player[]>(MOCK_100_PLAYERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const filteredPlayers = players.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Szatnia Zawodników</Text>
        <Text style={styles.headerSubtitle}>
          Karty zawodników, frekwencja, zdrowie i rozwój
        </Text>
      </View>

      {/* WYSZUKIWARKA */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Wyszukaj zawodnika..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LISTA ZAWODNIKÓW */}
      <ScrollView style={styles.content}>
        {filteredPlayers.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={styles.playerCard}
            onPress={() => {
              setSelectedPlayer(player);
              setDetailsModalVisible(true);
            }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {player.firstName[0]}
                {player.lastName[0]}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.playerName}>
                {player.firstName} {player.lastName}
              </Text>
              <Text style={styles.playerMeta}>
                Rocznik {player.birthYear} • {player.position}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Ionicons name="medical" size={12} color="#10b981" />
              <Text style={styles.statusBadgeText}>Zdrowy</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* MODAL KARTY SPORTOWEJ ZAWODNIKA */}
      <Modal visible={detailsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlayer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Karta Sportowa</Text>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* NAGŁÓWEK PROFILU */}
                <View style={styles.profileHeader}>
                  <View style={[styles.avatar, { width: 56, height: 56, borderRadius: 28 }]}>
                    <Text style={[styles.avatarText, { fontSize: 20 }]}>
                      {selectedPlayer.firstName[0]}
                      {selectedPlayer.lastName[0]}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </Text>
                  <Text style={styles.profileMeta}>
                    {selectedPlayer.position} • Kat. {selectedPlayer.category} (Rocznik {selectedPlayer.birthYear})
                  </Text>
                </View>

                {/* SEKCJA 1: FREKWENCJA I OBECNOŚCI */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                    <Text style={styles.sectionTitle}>Frekwencja (Treningi i Mecze)</Text>
                  </View>
                  <View style={styles.statGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>88%</Text>
                      <Text style={styles.statLabel}>Treningi</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>95%</Text>
                      <Text style={styles.statLabel}>Mecze</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>22/25</Text>
                      <Text style={styles.statLabel}>Obecności</Text>
                    </View>
                  </View>
                </View>

                {/* SEKCJA 2: ZDROWIE I KONTUZJE */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="fitness-outline" size={18} color="#10b981" />
                    <Text style={styles.sectionTitle}>Status Zdrowotny</Text>
                  </View>
                  <View style={styles.healthRow}>
                    <Text style={styles.healthLabel}>Aktualny stan:</Text>
                    <Text style={styles.healthStatusActive}>Gotowy do gry (100%)</Text>
                  </View>
                  <Text style={styles.healthNote}>Brak zgłoszonych urazów w ostatnim miesiącu.</Text>
                </View>

                {/* SEKCJA 3: OSTATNIE TESTY MOTORYCZNE */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="stats-chart-outline" size={18} color="#8b5cf6" />
                    <Text style={styles.sectionTitle}>Testy Motoryczne</Text>
                  </View>
                  <View style={styles.testRow}>
                    <Text style={styles.testName}>Sprint 30m:</Text>
                    <Text style={styles.testResult}>4.25 s</Text>
                  </View>
                  <View style={styles.testRow}>
                    <Text style={styles.testName}>BEEP Test:</Text>
                    <Text style={styles.testResult}>Poziom 10.2</Text>
                  </View>
                  <View style={styles.testRow}>
                    <Text style={styles.testName}>Skok w dal z miejsca:</Text>
                    <Text style={styles.testResult}>215 cm</Text>
                  </View>
                </View>

                {/* SEKCJA 4: UWAGI TRENERSKIE */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="create-outline" size={18} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Notatki Trenerskie</Text>
                  </View>
                  <Text style={styles.trainerNote}>
                    Praca nad wykończeniem lewą nogą. Świetne zaangażowanie na treningach taktycznych.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Zamknij kartę</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 38,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  content: { flex: 1, padding: 16 },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 14 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  playerMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 10, color: '#059669', fontWeight: 'bold', marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  profileHeader: { alignItems: 'center', marginBottom: 16 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  profileMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  sectionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginLeft: 6 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthLabel: { fontSize: 12, color: '#6b7280' },
  healthStatusActive: { fontSize: 12, fontWeight: 'bold', color: '#10b981' },
  healthNote: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  testRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  testName: { fontSize: 12, color: '#4b5563' },
  testResult: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  trainerNote: { fontSize: 12, color: '#4b5563', fontStyle: 'italic' },
  closeBtn: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  closeBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 14 },
});