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

export default function TestyScreen() {
  const [playersList, setPlayersList] = useState<Player[]>(MOCK_100_PLAYERS);
  const [selectedYear, setSelectedYear] = useState<number | 'Wszystkie'>('Wszystkie');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal wprowadzania/edycji wyników testów
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Formularz wyników
  const [speed10m, setSpeed10m] = useState('');
  const [speed30m, setSpeed30m] = useState('');
  const [jumpCMJ, setJumpCMJ] = useState('');
  const [beepTest, setBeepTest] = useState('');

  const yearsOptions = ['Wszystkie', 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018];

  const filteredPlayers = playersList.filter((p) => {
    const matchesYear = selectedYear === 'Wszystkie' || p.birthYear === selectedYear;
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const handleOpenTestModal = (player: Player) => {
    setSelectedPlayer(player);
    setSpeed10m(player.tests?.speed10m?.toString() || '');
    setSpeed30m(player.tests?.speed30m?.toString() || '');
    setJumpCMJ(player.tests?.jumpCMJ?.toString() || '');
    setBeepTest(player.tests?.beepTestLevel || '');
    setModalVisible(true);
  };

  const handleSaveTests = () => {
    if (!selectedPlayer) return;

    const updated = playersList.map((p) => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          tests: {
            speed10m: parseFloat(speed10m) || undefined,
            speed30m: parseFloat(speed30m) || undefined,
            jumpCMJ: parseInt(jumpCMJ) || undefined,
            beepTestLevel: beepTest || undefined,
            date: new Date().toISOString().split('T')[0],
          },
        };
      }
      return p;
    });

    setPlayersList(updated);
    setModalVisible(false);
    Alert.alert('Sukces', 'Wyniki testów zostały zapisane!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Testy Motoryczne</Text>
        <Text style={styles.headerSubtitle}>Baza zawodników: {filteredPlayers.length} / 100</Text>
      </View>

      {/* WYSZUKIWARKA I FILTR ROCZNIKA */}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearsRow}>
          {yearsOptions.map((y) => (
            <TouchableOpacity
              key={y.toString()}
              style={[
                styles.yearChip,
                selectedYear === y && styles.yearChipActive,
              ]}
              onPress={() => setSelectedYear(y as any)}
            >
              <Text
                style={[
                  styles.yearChipText,
                  selectedYear === y && styles.yearChipTextActive,
                ]}
              >
                {y === 'Wszystkie' ? 'Wszystkie' : `Rocznik ${y}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA ZAWODNIKÓW I WYNIKÓW TESTÓW */}
      <ScrollView style={styles.content}>
        {filteredPlayers.map((player) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.playerMainInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {player.firstName[0]}
                  {player.lastName[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>
                  {player.firstName} {player.lastName}
                </Text>
                <Text style={styles.playerMeta}>
                  Rocznik {player.birthYear} • {player.position} • {player.category}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editTestBtn}
                onPress={() => handleOpenTestModal(player)}
              >
                <Ionicons name="stats-chart" size={16} color="#fff" />
                <Text style={styles.editTestBtnText}>Wpisz testy</Text>
              </TouchableOpacity>
            </View>

            {/* SIATKA WYNIKÓW TESTÓW */}
            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Szybkość 10m</Text>
                <Text style={styles.resultValue}>
                  {player.tests?.speed10m ? `${player.tests.speed10m}s` : '-'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Szybkość 30m</Text>
                <Text style={styles.resultValue}>
                  {player.tests?.speed30m ? `${player.tests.speed30m}s` : '-'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Skok CMJ</Text>
                <Text style={styles.resultValue}>
                  {player.tests?.jumpCMJ ? `${player.tests.jumpCMJ} cm` : '-'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Beep Test</Text>
                <Text style={styles.resultValue}>
                  {player.tests?.beepTestLevel ? `Lvl ${player.tests.beepTestLevel}` : '-'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL EDYCJI TESTU */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Testy: {selectedPlayer?.firstName} {selectedPlayer?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Szybkość 10m (sekundy)</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 1.85"
              keyboardType="numeric"
              value={speed10m}
              onChangeText={setSpeed10m}
            />

            <Text style={styles.inputLabel}>Szybkość 30m (sekundy)</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 4.45"
              keyboardType="numeric"
              value={speed30m}
              onChangeText={setSpeed30m}
            />

            <Text style={styles.inputLabel}>Skok w dal / CMJ (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 35"
              keyboardType="numeric"
              value={jumpCMJ}
              onChangeText={setJumpCMJ}
            />

            <Text style={styles.inputLabel}>Beep Test / Wydolność (Poziom.Wahadło)</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 9.4"
              value={beepTest}
              onChangeText={setBeepTest}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTests}>
              <Text style={styles.saveBtnText}>Zapisz Wyniki Testu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
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
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  yearsRow: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  yearChipActive: {
    backgroundColor: '#2563eb',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  yearChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  playerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  playerMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  editTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editTestBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resultsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  resultItem: {
    alignItems: 'center',
    flex: 1,
  },
  resultLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});