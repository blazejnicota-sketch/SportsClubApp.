import React, { useState, useMemo } from 'react';
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

type PositionFilter = 'WSZYSTKIE' | 'Bramkarz' | 'Obrońca' | 'Pomocnik' | 'Napastnik';
type YearFilter = 'WSZYSTKIE' | '2012' | '2013' | '2014';

interface PlayerDetails {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position: string;
  year: string;
  preferredFoot: 'Prawa' | 'Lewa' | 'Obunożny';
  parentName: string;
  parentPhone: string;
  heightCm: number;
  weightKg: number;
  kitSize: string;
  shoeSize: number;
  goals: number;
  assists: number;
  attendancePercent: number;
  isInjured?: boolean;
}

export default function ZawodnicyScreen() {
  const [selectedYear, setSelectedYear] = useState<YearFilter>('WSZYSTKIE');
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modale
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [activePlayer, setActivePlayer] = useState<PlayerDetails | null>(null);

  // Formularz nowego zawodnika
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPosition, setNewPosition] = useState('Pomocnik');
  const [newYear, setNewYear] = useState('2012');
  const [newParentPhone, setNewParentPhone] = useState('');

  // Baza danych zawodników z bogatszymi informacjami
  const [playersList, setPlayersList] = useState<PlayerDetails[]>(() => {
    return MOCK_100_PLAYERS.slice(0, 25).map((p: any, idx: number) => {
      const fName = p.firstName || p.name?.split(' ')[0] || `Zawodnik_${idx + 1}`;
      const lName = p.lastName || p.name?.split(' ')[1] || 'Klubowy';
      const year = p.year || (idx % 2 === 0 ? '2012' : '2013');
      const pos = p.position || (idx % 4 === 0 ? 'Bramkarz' : idx % 3 === 0 ? 'Obrońca' : idx % 2 === 0 ? 'Pomocnik' : 'Napastnik');

      return {
        id: p.id || String(idx + 1),
        firstName: fName,
        lastName: lName,
        number: p.number || (idx + 1),
        position: pos,
        year: year,
        preferredFoot: idx % 3 === 0 ? 'Lewa' : 'Prawa',
        parentName: `Opiekun ${lName}`,
        parentPhone: `+48 600 ${100 + idx} ${200 + idx}`,
        heightCm: 145 + (idx % 15),
        weightKg: 38 + (idx % 10),
        kitSize: idx % 2 === 0 ? 'M (152 cm)' : 'S (140 cm)',
        shoeSize: 36 + (idx % 4),
        goals: (idx * 2) % 9,
        assists: (idx * 3) % 7,
        attendancePercent: 80 + (idx % 20),
        isInjured: idx === 2 || idx === 5,
      };
    });
  });

  // Filtrowanie listy zawodników
  const filteredPlayers = useMemo(() => {
    return playersList.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'WSZYSTKIE' || p.year === selectedYear;
      const matchesPos = selectedPosition === 'WSZYSTKIE' || p.position === selectedPosition;

      return matchesSearch && matchesYear && matchesPos;
    });
  }, [playersList, searchQuery, selectedYear, selectedPosition]);

  const handleOpenProfile = (player: PlayerDetails) => {
    setActivePlayer(player);
    setProfileModalVisible(true);
  };

  const handleAddPlayer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Błąd', 'Wprowadź imię i nazwisko zawodnika.');
      return;
    }

    const created: PlayerDetails = {
      id: Date.now().toString(),
      firstName: newFirstName,
      lastName: newLastName,
      number: parseInt(newNumber) || Math.floor(Math.random() * 90) + 1,
      position: newPosition,
      year: newYear,
      preferredFoot: 'Prawa',
      parentName: `Opiekun ${newLastName}`,
      parentPhone: newParentPhone || '+48 500 000 000',
      heightCm: 150,
      weightKg: 40,
      kitSize: 'M (152 cm)',
      shoeSize: 37,
      goals: 0,
      assists: 0,
      attendancePercent: 100,
      isInjured: false,
    };

    setPlayersList([created, ...playersList]);
    setNewFirstName('');
    setNewLastName('');
    setNewNumber('');
    setNewParentPhone('');
    setAddModalVisible(false);

    Alert.alert('Sukces ⚽', 'Nowy zawodnik został pomyślnie dodany do kadry!');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Baza Zawodników</Text>
          <Text style={styles.headerSubtitle}>
            Kadra, profile, kontakt do rodziców i rozmiarówka
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <Text style={styles.addTopBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      {/* SEKCJA FILTRACJI */}
      <View style={styles.filtersSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po imieniu lub nazwisku..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Text style={styles.filterGroupLabel}>Rocznik:</Text>
          {(['WSZYSTKIE', '2012', '2013', '2014'] as YearFilter[]).map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[
                styles.chipFilter,
                selectedYear === yr && styles.chipFilterActive,
              ]}
              onPress={() => setSelectedYear(yr)}
            >
              <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>
                {yr}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          <Text style={styles.filterGroupLabel}>Pozycja:</Text>
          {(['WSZYSTKIE', 'Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'] as PositionFilter[]).map((pos) => (
            <TouchableOpacity
              key={pos}
              style={[
                styles.chipFilter,
                selectedPosition === pos && styles.chipFilterActive,
              ]}
              onPress={() => setSelectedPosition(pos)}
            >
              <Text style={[styles.chipText, selectedPosition === pos && styles.chipTextActive]}>
                {pos}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA KART ZAWODNIKÓW */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Zawodnicy Kadry ({filteredPlayers.length})
        </Text>

        {filteredPlayers.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={styles.card}
            onPress={() => handleOpenProfile(player)}
          >
            <View style={styles.cardMainRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>#{player.number}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.playerName}>
                    {player.firstName} {player.lastName}
                  </Text>
                  {player.isInjured && (
                    <View style={styles.injuryBadge}>
                      <Text style={styles.injuryBadgeText}>Uraz</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.playerMeta}>
                  {player.position} • Rocznik {player.year} • Noga: {player.preferredFoot}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </View>

            {/* MINI STATYSTYKI ZAWODNIKA */}
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>Mecze/Gole</Text>
                <Text style={styles.miniStatVal}>{player.goals} ⚽ / {player.assists} 🅰️</Text>
              </View>

              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>Frekwencja</Text>
                <Text style={[styles.miniStatVal, { color: '#16a34a' }]}>{player.attendancePercent}%</Text>
              </View>

              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>Rozmiar dresu</Text>
                <Text style={styles.miniStatVal}>{player.kitSize}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: KARTA PROFILOWA ZAWODNIKA */}
      <Modal animationType="slide" transparent={true} visible={profileModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  #{activePlayer?.number} {activePlayer?.firstName} {activePlayer?.lastName}
                </Text>
                <Text style={styles.modalSubTitle}>
                  {activePlayer?.position} • Rocznik {activePlayer?.year}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SEKCJA STATYSTYK SEZONU */}
              <Text style={styles.sectionSubHeader}>Statystyki Sezonowe</Text>
              <View style={styles.profileStatsGrid}>
                <View style={styles.profileStatBox}>
                  <Text style={styles.profileStatNum}>{activePlayer?.goals}</Text>
                  <Text style={styles.profileStatLabel}>Gole ⚽</Text>
                </View>
                <View style={styles.profileStatBox}>
                  <Text style={styles.profileStatNum}>{activePlayer?.assists}</Text>
                  <Text style={styles.profileStatLabel}>Asysty 🅰️</Text>
                </View>
                <View style={styles.profileStatBox}>
                  <Text style={[styles.profileStatNum, { color: '#16a34a' }]}>
                    {activePlayer?.attendancePercent}%
                  </Text>
                  <Text style={styles.profileStatLabel}>Frekwencja</Text>
                </View>
              </View>

              {/* SEKCJA KONTAKTOWA DO RODZICÓW */}
              <Text style={styles.sectionSubHeader}>Kontakt do Opiekuna</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoTextTitle}>{activePlayer?.parentName}</Text>
                <Text style={styles.infoTextSub}>Telefon: {activePlayer?.parentPhone}</Text>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() =>
                    Alert.alert('Inicjowanie połączenia 📞', `Łączenie z numerem: ${activePlayer?.parentPhone}`)
                  }
                >
                  <Ionicons name="call-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.callBtnText}>Zadzwoń do rodzica</Text>
                </TouchableOpacity>
              </View>

              {/* SEKCJA FIZYCZNA I SPRZĘTOWA */}
              <Text style={styles.sectionSubHeader}>Wymiary i Sprzęt Klubowy</Text>
              <View style={styles.grid2Col}>
                <View style={styles.gridColBox}>
                  <Text style={styles.gridBoxLabel}>Wzrost / Waga</Text>
                  <Text style={styles.gridBoxValue}>
                    {activePlayer?.heightCm} cm / {activePlayer?.weightKg} kg
                  </Text>
                </View>
                <View style={styles.gridColBox}>
                  <Text style={styles.gridBoxLabel}>Noga wiodąca</Text>
                  <Text style={styles.gridBoxValue}>{activePlayer?.preferredFoot}</Text>
                </View>
                <View style={styles.gridColBox}>
                  <Text style={styles.gridBoxLabel}>Rozmiar stroju/dresu</Text>
                  <Text style={styles.gridBoxValue}>{activePlayer?.kitSize}</Text>
                </View>
                <View style={styles.gridColBox}>
                  <Text style={styles.gridBoxLabel}>Rozmiar buta</Text>
                  <Text style={styles.gridBoxValue}>{activePlayer?.shoeSize}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 12 }]}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.saveBtnText}>Zamknij Kartę</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DODAWANIE NOWEGO ZAWODNIKA */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Zawodnika do Kadry ⚽</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Imię zawodnika</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. Jan"
              value={newFirstName}
              onChangeText={setNewFirstName}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Nazwisko zawodnika</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. Kowalski"
              value={newLastName}
              onChangeText={setNewLastName}
              placeholderTextColor="#94a3b8"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>Numer na koszulce</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="np. 10"
                  keyboardType="numeric"
                  value={newNumber}
                  onChangeText={setNewNumber}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.inputLabel}>Rocznik</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="np. 2012"
                  value={newYear}
                  onChangeText={setNewYear}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Telefon do rodzica / opiekuna</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. +48 600 100 200"
              keyboardType="phone-pad"
              value={newParentPhone}
              onChangeText={setNewParentPhone}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPlayer}>
                <Text style={styles.saveBtnText}>Dodaj do Kadry</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addTopBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addTopBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a', padding: 0 },

  filterGroupLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', alignSelf: 'center', marginRight: 6 },
  chipFilter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
  },
  chipFilterActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  filterDivider: { width: 1, height: 16, backgroundColor: '#cbd5e1', marginHorizontal: 8, alignSelf: 'center' },

  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardMainRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },

  injuryBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  injuryBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#dc2626' },

  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  miniStatItem: { alignItems: 'center' },
  miniStatLabel: { fontSize: 9, color: '#64748b' },
  miniStatVal: { fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 1 },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalSubTitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionSubHeader: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginTop: 12, marginBottom: 6 },

  profileStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  profileStatBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileStatNum: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  profileStatLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },

  infoCard: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTextTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  infoTextSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  callBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  callBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  grid2Col: { flexDirection: 'row', flexWrap: 'wrap' },
  gridColBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginRight: '2%',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridBoxLabel: { fontSize: 9, color: '#64748b' },
  gridBoxValue: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
  },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});