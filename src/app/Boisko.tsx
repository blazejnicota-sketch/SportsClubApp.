import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS, Player } from './data/mockPlayers';

export default function BoiskoScreen() {
  const [playersList] = useState<Player[]>(MOCK_100_PLAYERS);
  
  // Wybrana 11-stka wyjściowa oraz rezerwowi
  const [startingLineup, setStartingLineup] = useState<Player[]>(
    MOCK_100_PLAYERS.slice(0, 11)
  );
  const [substitutes, setSubstitutes] = useState<Player[]>(
    MOCK_100_PLAYERS.slice(11, 18)
  );

  // Modal wyboru zawodnika do składu
  const [modalVisible, setModalVisible] = useState(false);
  const [targetSlot, setTargetSlot] = useState<'starting' | 'sub'>('starting');

  // Stoper meczowy na żywo
  const [matchTime, setMatchTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [matchPeriod, setMatchPeriod] = useState<'Przed meczem' | 'I Połowa' | 'Przerwa' | 'II Połowa' | 'Koniec'>('Przed meczem');

  // Obsługa stopera (symulacja)
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    if (matchPeriod === 'Przed meczem') setMatchPeriod('I Połowa');
  };

  const handleRemovePlayer = (id: string, type: 'starting' | 'sub') => {
    if (type === 'starting') {
      setStartingLineup(startingLineup.filter((p) => p.id !== id));
    } else {
      setSubstitutes(substitutes.filter((p) => p.id !== id));
    }
  };

  const handleAddPlayerToSquad = (player: Player) => {
    if (targetSlot === 'starting') {
      if (startingLineup.length >= 11) {
        Alert.alert('Uwaga', 'Wyjściowa 11-stka jest już pełna.');
        return;
      }
      if (startingLineup.some((p) => p.id === player.id)) {
        Alert.alert('Uwaga', 'Ten zawodnik jest już w składzie.');
        return;
      }
      setStartingLineup([...startingLineup, player]);
    } else {
      if (substitutes.length >= 7) {
        Alert.alert('Uwaga', 'Ławka rezerwowych jest pełna (max 7).');
        return;
      }
      if (substitutes.some((p) => p.id === player.id)) {
        Alert.alert('Uwaga', 'Ten zawodnik jest już na ławce.');
        return;
      }
      setSubstitutes([...substitutes, player]);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK I STATUS MECZU */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Skład i Boisko (Match Day)</Text>
          <Text style={styles.headerSubtitle}>Status: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{matchPeriod}</Text></Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerText}>
            {Math.floor(matchTime / 60)}:{('0' + (matchTime % 60)).slice(-2)}
          </Text>
          <TouchableOpacity style={styles.timerBtn} onPress={toggleTimer}>
            <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* WIZUALIZACJA BOISKA / SKŁAD WYJŚCIOWY */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Wyjściowa 11-stka ({startingLineup.length}/11)</Text>
          <TouchableOpacity
            style={styles.actionAddBtn}
            onPress={() => { setTargetSlot('starting'); setModalVisible(true); }}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.actionAddBtnText}>Dodaj zawodnika</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pitchCard}>
          {startingLineup.length === 0 ? (
            <Text style={styles.emptyPitchText}>Brak zawodników w składzie wyjściowym.</Text>
          ) : (
            startingLineup.map((player, index) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={styles.playerNumberBadge}>
                  <Text style={styles.playerNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>{player.firstName} {player.lastName}</Text>
                  <Text style={styles.playerMeta}>{player.position} • Rocznik {player.birthYear}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePlayer(player.id, 'starting')}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ŁAWKA REZERWOWYCH */}
        <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Ławka Rezerwowych ({substitutes.length}/7)</Text>
          <TouchableOpacity
            style={[styles.actionAddBtn, { backgroundColor: '#d97706' }]}
            onPress={() => { setTargetSlot('sub'); setModalVisible(true); }}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.actionAddBtnText}>Dodaj rezerwowego</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pitchCard}>
          {substitutes.length === 0 ? (
            <Text style={styles.emptyPitchText}>Brak zawodników na ławce.</Text>
          ) : (
            substitutes.map((player, index) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={[styles.playerNumberBadge, { backgroundColor: '#fef3c7', borderColor: '#d97706' }]}>
                  <Text style={[styles.playerNumberText, { color: '#d97706' }]}>R{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>{player.firstName} {player.lastName}</Text>
                  <Text style={styles.playerMeta}>{player.position} • Rocznik {player.birthYear}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePlayer(player.id, 'sub')}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL WYBORU ZAWODNIKA Z BAZY 100 */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Wybierz zawodnika ({targetSlot === 'starting' ? 'Skład Główny' : 'Rezerwa'})
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 10 }}>
              {playersList.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.modalPlayerRow}
                  onPress={() => handleAddPlayerToSquad(player)}
                >
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{player.firstName[0]}{player.lastName[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.playerName}>{player.firstName} {player.lastName}</Text>
                    <Text style={styles.playerMeta}>Rocznik {player.birthYear} • {player.position} • {player.category}</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color="#2563eb" />
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  timerText: { fontSize: 16, fontWeight: 'bold', color: '#1d4ed8', marginRight: 8 },
  timerBtn: { backgroundColor: '#2563eb', padding: 6, borderRadius: 6 },
  content: { flex: 1, padding: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  actionAddBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionAddBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  pitchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    elevation: 2,
  },
  emptyPitchText: { textAlign: 'center', color: '#9ca3af', padding: 12, fontSize: 13 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  playerNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: { fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  playerMeta: { fontSize: 11, color: '#6b7280' },
  removeBtn: { padding: 6 },
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
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  modalPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
});