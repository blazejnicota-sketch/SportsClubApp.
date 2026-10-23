import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function SzatniaScreen() {
  const [activeTab, setActiveTab] = useState<'tests' | 'health' | 'notes'>('tests');
  const [searchQuery, setSearchQuery] = useState('');

  // Pomocnicza funkcja pobierająca pełne imię i nazwisko
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

  // Filtrowanie zawodników
  const filteredPlayers = MOCK_100_PLAYERS.filter((player: any) => {
    const fullName = getPlayerName(player).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }).slice(0, 10);

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Szatnia i Centrum Analityki</Text>
        <Text style={styles.headerSubtitle}>
          Testy motoryczne, profilaktyka zdrowotna i notatki trenerskie
        </Text>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tests' && styles.activeTabBtn]}
          onPress={() => setActiveTab('tests')}
        >
          <Ionicons
            name="fitness-outline"
            size={15}
            color={activeTab === 'tests' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'tests' && styles.activeTabText]}>
            Testy Motoryczne
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'health' && styles.activeTabBtn]}
          onPress={() => setActiveTab('health')}
        >
          <Ionicons
            name="medkit-outline"
            size={15}
            color={activeTab === 'health' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
            Zdrowie & Urazy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'notes' && styles.activeTabBtn]}
          onPress={() => setActiveTab('notes')}
        >
          <Ionicons
            name="create-outline"
            size={15}
            color={activeTab === 'notes' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
            Notatki
          </Text>
        </TouchableOpacity>
      </View>

      {/* PASEK WYSZUKIWANIA */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj zawodnika z kadry..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* ZAWARTOŚĆ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'tests' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ostatnie Wyniki Testów</Text>
              <TouchableOpacity onPress={() => Alert.alert('Testy', 'Wprowadź nowe wyniki testu')}>
                <Text style={styles.addBtnText}>+ Wprowadź wyniki</Text>
              </TouchableOpacity>
            </View>

            {filteredPlayers.map((player: any) => (
              <View key={player.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                  <Text style={styles.playerPosition}>{player.position || 'Zawodnik'}</Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Sprint 30m</Text>
                    <Text style={styles.statValue}>4.21 s</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>BEEP Test</Text>
                    <Text style={styles.statValue}>Poziom 11.4</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Skok w dal</Text>
                    <Text style={styles.statValue}>2.15 m</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'health' && (
          <View>
            <Text style={styles.sectionTitle}>Status Zdrowotny Zespołu</Text>

            <View style={styles.healthSummaryCard}>
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatNumber, { color: '#16a34a' }]}>16</Text>
                <Text style={styles.healthStatLabel}>W pełni gotowi</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatNumber, { color: '#d97706' }]}>2</Text>
                <Text style={styles.healthStatLabel}>Drobny uraz</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthStatItem}>
                <Text style={[styles.healthStatNumber, { color: '#dc2626' }]}>1</Text>
                <Text style={styles.healthStatLabel}>Kontuzja</Text>
              </View>
            </View>

            <Text style={styles.subSectionTitle}>Lista Zawodników z Urazami</Text>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>Michał Kowalczyk</Text>
                <View style={styles.badgeDanger}>
                  <Text style={styles.badgeDangerText}>Wykluczony z gry</Text>
                </View>
              </View>
              <Text style={styles.injuryDesc}>Skręcenie stawu skokowego (Trening 18.10)</Text>
              <Text style={styles.injuryReturn}>Przewidywany powrót: za 12 dni</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>Piotr Adamski</Text>
                <View style={styles.badgeWarning}>
                  <Text style={styles.badgeWarningText}>Trening indywidualny</Text>
                </View>
              </View>
              <Text style={styles.injuryDesc}>Przeciążenie mięśnia czworogłowego</Text>
              <Text style={styles.injuryReturn}>Przewidywany powrót: za 3 dni</Text>
            </View>
          </View>
        )}

        {activeTab === 'notes' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Prywatny Dziennik Trenera</Text>
              <TouchableOpacity onPress={() => Alert.alert('Notatka', 'Dodaj nową notatkę')}>
                <Text style={styles.addBtnText}>+ Nowa notatka</Text>
              </TouchableOpacity>
            </View>

            {filteredPlayers.slice(0, 5).map((player: any) => (
              <View key={player.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                  <Text style={styles.noteDate}>Ostatni wpis: 2 dni temu</Text>
                </View>
                <Text style={styles.noteText}>
                  Świetna postawa w grze 1v1 w defensywie. Pracujemy nad celnością podań otwierających na lewą stronę.
                </Text>
              </View>
            ))}
          </View>
        )}
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

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', padding: 0 },

  content: { padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginTop: 12, marginBottom: 8 },
  addBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerPosition: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  statBox: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, width: '31%', alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#64748b' },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#2563eb', marginTop: 2 },

  healthSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  healthStatItem: { alignItems: 'center' },
  healthStatNumber: { fontSize: 22, fontWeight: 'bold' },
  healthStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  healthDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },

  badgeDanger: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeDangerText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },
  badgeWarning: { backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeWarningText: { fontSize: 10, fontWeight: 'bold', color: '#d97706' },

  injuryDesc: { fontSize: 12, color: '#334155', marginBottom: 4 },
  injuryReturn: { fontSize: 11, color: '#64748b' },

  noteDate: { fontSize: 10, color: '#94a3b8' },
  noteText: { fontSize: 12, color: '#334155', lineHeight: 18 },
});