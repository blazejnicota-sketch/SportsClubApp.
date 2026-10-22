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

export default function ZawodnicyScreen() {
  const [players, setPlayers] = useState<Player[]>(MOCK_100_PLAYERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszyscy');

  // Modal szczegółów zawodnika
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Modal dodawania nowego zawodnika
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newBirthYear, setNewBirthYear] = useState('2014');
  const [newPosition, setNewPosition] = useState<'Pomocnik' | 'Bramkarz' | 'Obrońca' | 'Napastnik'>('Pomocnik');
  const [newCategory, setNewCategory] = useState('Orlik');

  // Dostępne kategorie do filtrowania
  const categories = ['Wszyscy', 'Żak', 'Orlik', 'Młodzik', 'Trampkarz', 'Junior'];

  const handleAddPlayer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Błąd', 'Wpisz imię i nazwisko zawodnika.');
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      birthYear: parseInt(newBirthYear) || 2014,
      position: newPosition,
      category: newCategory,
    } as Player;

    setPlayers([newPlayer, ...players]);
    setNewFirstName('');
    setNewLastName('');
    setAddModalVisible(false);
    Alert.alert('Sukces', 'Dodano nowego zawodnika do bazy.');
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Wszyscy' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Baza Zawodników</Text>
          <Text style={styles.headerSubtitle}>
            Łącznie w bazie: {players.length} zawodników
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={styles.addBtnHeaderText}>Nowy zawodnik</Text>
        </TouchableOpacity>
      </View>

      {/* WYSZUKIWARKA I FILTRY KATEGORII */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj zawodnika (imię lub nazwisko)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA ZAWODNIKÓW */}
      <ScrollView style={styles.content}>
        {filteredPlayers.length === 0 ? (
          <Text style={styles.emptyText}>Nie znaleziono zawodników.</Text>
        ) : (
          filteredPlayers.map((player) => (
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
                  Rocznik {player.birthYear} • {player.position} • Kat. {player.category}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL SZCZEGÓŁÓW ZAWODNIKA */}
      <Modal visible={detailsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlayer && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Karta Zawodnika</Text>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.playerProfileCard}>
                  <View style={[styles.avatar, { width: 56, height: 56, borderRadius: 28 }]}>
                    <Text style={[styles.avatarText, { fontSize: 20 }]}>
                      {selectedPlayer.firstName[0]}
                      {selectedPlayer.lastName[0]}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </Text>
                  <Text style={styles.profileCategory}>
                    Kategoria: {selectedPlayer.category} (Rocznik {selectedPlayer.birthYear})
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pozycja:</Text>
                    <Text style={styles.infoValue}>{selectedPlayer.position}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={[styles.infoValue, { color: '#10b981', fontWeight: 'bold' }]}>
                      Aktywny zawodnik
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Zamknij</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DODAWANIA ZAWODNIKA */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Nowego Zawodnika</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Imię</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Jan"
                value={newFirstName}
                onChangeText={setNewFirstName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nazwisko</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Kowalski"
                value={newLastName}
                onChangeText={setNewLastName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rocznik</Text>
              <TextInput
                style={styles.input}
                placeholder="np. 2014"
                keyboardType="numeric"
                value={newBirthYear}
                onChangeText={setNewBirthYear}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlayer}>
              <Text style={styles.saveBtnText}>Zapisz zawodnika</Text>
            </TouchableOpacity>
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
  addBtnHeader: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnHeaderText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 30, fontSize: 14 },
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  playerProfileCard: { alignItems: 'center', marginBottom: 20 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  profileCategory: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  infoSection: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  closeBtn: { backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 14 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
  },
  saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});