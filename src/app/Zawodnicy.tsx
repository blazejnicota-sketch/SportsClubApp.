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
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function ZawodnicyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Stan formularza dodawania zawodnika
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPosition, setNewPosition] = useState('Pomocnik');
  const [newNumber, setNewNumber] = useState('');

  // Pomocnicza funkcja pobierania imienia i nazwiska
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

  const filteredPlayers = MOCK_100_PLAYERS.filter((p: any) => {
    const fullName = getPlayerName(p).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  }).slice(0, 15);

  const handleAddPlayer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Błąd', 'Proszę podać imię i nazwisko zawodnika.');
      return;
    }

    Alert.alert(
      'Sukces! ⚽',
      `Dodano zawodnika: ${newFirstName} ${newLastName} (${newPosition})`
    );

    setNewFirstName('');
    setNewLastName('');
    setNewNumber('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Kadra Drużyny</Text>
            <Text style={styles.headerSubtitle}>
              Zarządzanie zawodnikami i profilami graczy
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addPlayerBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addPlayerBtnText}>Dodaj</Text>
          </TouchableOpacity>
        </View>

        {/* PASEK WYSZUKIWANIA */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj w kadrze..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* LISTA ZAWODNIKÓW */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Zawodnicy w Kadrze ({filteredPlayers.length})
        </Text>

        {filteredPlayers.map((player: any) => (
          <View key={player.id} style={styles.playerCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {player.number || Math.floor(Math.random() * 80) + 1}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.playerName}>{getPlayerName(player)}</Text>
              <Text style={styles.playerSub}>
                {player.position || 'Pomocnik'} • Rocznik 2012
              </Text>
            </View>

            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => Alert.alert('Profil', `Otwieranie profilu: ${getPlayerName(player)}`)}
            >
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* MODAL DODAWANIA NOWEGO ZAWODNIKA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Nowego Zawodnika</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Imię</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. Jan"
              value={newFirstName}
              onChangeText={setNewFirstName}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Nazwisko</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. Kowalski"
              value={newLastName}
              onChangeText={setNewLastName}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Pozycja na boisku</Text>
            <View style={styles.positionSelector}>
              {['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'].map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.posChip,
                    newPosition === pos && styles.posChipSelected,
                  ]}
                  onPress={() => setNewPosition(pos)}
                >
                  <Text
                    style={[
                      styles.posChipText,
                      newPosition === pos && styles.posChipTextSelected,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Numer na koszulce (opcjonalnie)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. 10"
              keyboardType="number-pad"
              value={newNumber}
              onChangeText={setNewNumber}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlayer}>
                <Text style={styles.saveBtnText}>Zapisz w Kadrze</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addPlayerBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addPlayerBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', padding: 0 },

  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },

  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  detailsBtn: { padding: 6 },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  positionSelector: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  posChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  posChipSelected: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  posChipText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  posChipTextSelected: { color: '#2563eb', fontWeight: 'bold' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginRight: 8 },
  cancelBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});