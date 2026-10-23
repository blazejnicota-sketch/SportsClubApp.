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

type ActiveTab = 'motoryka' | 'zdrowie' | 'notatki';
type PositionFilter = 'WSZYSTKIE' | 'Bramkarz' | 'Obrońca' | 'Pomocnik' | 'Napastnik';
type YearFilter = 'WSZYSTKIE' | '2012' | '2013' | '2014';

interface InjuryRecord {
  playerId: string;
  injuryName: string;
  dateFrom: string;
  expectedReturn: string;
  rtpStage: string; // Return To Play
}

interface MotoricRecord {
  playerId: string;
  sprint30m: string; // w sekundach
  jumpRange: string; // w cm
  beepTest: string; // poziom
}

export default function SzatniaScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('motoryka');

  // Filtry
  const [selectedYear, setSelectedYear] = useState<YearFilter>('WSZYSTKIE');
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stany modali
  const [addInjuryModalVisible, setAddInjuryModalVisible] = useState<boolean>(false);
  const [addTestModalVisible, setAddTestModalVisible] = useState<boolean>(false);
  const [selectedPlayerForNote, setSelectedPlayerForNote] = useState<any>(null);

  // Dane testów motorycznych (przykładowe wpisy)
  const [motoricData, setMotoricData] = useState<{ [playerId: string]: MotoricRecord }>({
    '1': { playerId: '1', sprint30m: '4.2s', jumpRange: '210cm', beepTest: 'Poziom 11.2' },
    '2': { playerId: '2', sprint30m: '4.5s', jumpRange: '195cm', beepTest: 'Poziom 9.8' },
    '3': { playerId: '3', sprint30m: '4.1s', jumpRange: '225cm', beepTest: 'Poziom 12.1' },
  });

  // Dane kontuzji
  const [injuries, setInjuries] = useState<InjuryRecord[]>([
    {
      playerId: '2',
      injuryName: 'Skręcenie stawu skokowego',
      dateFrom: '2026-10-10',
      expectedReturn: '2026-11-01',
      rtpStage: 'Etap 2: Bieganie proste',
    },
    {
      playerId: '5',
      injuryName: 'Naciągnięcie mięśnia dwugłowego',
      dateFrom: '2026-10-18',
      expectedReturn: '2026-10-28',
      rtpStage: 'Etap 3: Trening indywidualny z piłką',
    },
  ]);

  // Notatki trenerskie
  const [notes, setNotes] = useState<{ [playerId: string]: string }>({
    '1': 'Świetny lider na boisku. Popracować nad prawą nogą przy dośrodkowaniach.',
    '3': 'Wysoka motoryka, duża powtarzalność w sprintach. Dobre nastawienie.',
  });

  // Formularze
  const [newInjuryName, setNewInjuryName] = useState('');
  const [newInjuryReturn, setNewInjuryReturn] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('1');

  const [newSprint, setNewSprint] = useState('');
  const [newJump, setNewJump] = useState('');
  const [newBeep, setNewBeep] = useState('');

  const [tempNoteText, setTempNoteText] = useState('');

  // Pomocnicza funkcja nazwy
  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    return 'Zawodnik';
  };

  // Filtrowana lista zawodników
  const filteredPlayers = useMemo(() => {
    return MOCK_100_PLAYERS.slice(0, 25).filter((p: any) => {
      const pName = getPlayerName(p).toLowerCase();
      const matchesSearch = pName.includes(searchQuery.toLowerCase());

      // Rocznik (symulowany na podstawie ID/rocznika w danych)
      const playerYear = p.year || (parseInt(p.id) % 2 === 0 ? '2012' : '2013');
      const matchesYear = selectedYear === 'WSZYSTKIE' || playerYear === selectedYear;

      // Pozycja
      const playerPos = p.position || 'Pomocnik';
      const matchesPos = selectedPosition === 'WSZYSTKIE' || playerPos === selectedPosition;

      return matchesSearch && matchesYear && matchesPos;
    });
  }, [searchQuery, selectedYear, selectedPosition]);

  const handleAddInjury = () => {
    if (!newInjuryName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę urazu.');
      return;
    }
    const newRecord: InjuryRecord = {
      playerId: selectedPlayerId,
      injuryName: newInjuryName,
      dateFrom: new Date().toISOString().split('T')[0],
      expectedReturn: newInjuryReturn || 'Nieokreślono',
      rtpStage: 'Etap 1: Fizjoterapia',
    };
    setInjuries([...injuries, newRecord]);
    setNewInjuryName('');
    setNewInjuryReturn('');
    setAddInjuryModalVisible(false);
    Alert.alert('Zapisano 🏥', 'Dodano nowy wpis w Dzienniku Urazów.');
  };

  const handleSaveMotoricTest = () => {
    setMotoricData((prev) => ({
      ...prev,
      [selectedPlayerId]: {
        playerId: selectedPlayerId,
        sprint30m: newSprint ? `${newSprint}s` : 'Brak',
        jumpRange: newJump ? `${newJump}cm` : 'Brak',
        beepTest: newBeep ? `Poziom ${newBeep}` : 'Brak',
      },
    }));
    setAddTestModalVisible(false);
    Alert.alert('Zapisano ⏱️', 'Zaktualizowano wyniki testów motorycznych.');
  };

  const handleSaveNote = () => {
    if (!selectedPlayerForNote) return;
    setNotes((prev) => ({
      ...prev,
      [selectedPlayerForNote.id]: tempNoteText,
    }));
    setSelectedPlayerForNote(null);
    Alert.alert('Zapisano 📝', 'Notatka trenerska została zaktualizowana.');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Szatnia & Centrum Motoryki</Text>
          <Text style={styles.headerSubtitle}>
            Testy fizyczne, kartoteka zdrowotna i notatki
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addTopBtn}
          onPress={() => {
            if (activeTab === 'zdrowie') setAddInjuryModalVisible(true);
            else setAddTestModalVisible(true);
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addTopBtnText}>Nowy Wpis</Text>
        </TouchableOpacity>
      </View>

      {/* ZAKŁADKI MODULE (Motoryka / Zdrowie / Notatki) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'motoryka' && styles.tabBtnActive]}
          onPress={() => setActiveTab('motoryka')}
        >
          <Ionicons
            name="stopwatch-outline"
            size={15}
            color={activeTab === 'motoryka' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'motoryka' && styles.tabTextActive]}>
            Motoryka
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'zdrowie' && styles.tabBtnActive]}
          onPress={() => setActiveTab('zdrowie')}
        >
          <Ionicons
            name="medkit-outline"
            size={15}
            color={activeTab === 'zdrowie' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'zdrowie' && styles.tabTextActive]}>
            Zdrowie ({injuries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'notatki' && styles.tabBtnActive]}
          onPress={() => setActiveTab('notatki')}
        >
          <Ionicons
            name="create-outline"
            size={15}
            color={activeTab === 'notatki' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'notatki' && styles.tabTextActive]}>
            Notatki
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEKCJA FILTRÓW (ROCZNIK & POZYCJA) */}
      <View style={styles.filtersSection}>
        {/* Wyszukiwarka */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj zawodnika..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Paski wyboru Rocznika i Pozycji */}
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

      {/* LISTA ZAWODNIKÓW Z DANYMI ZAKŁADKI */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Zawodnicy ({filteredPlayers.length})
        </Text>

        {filteredPlayers.map((player: any) => {
          const pName = getPlayerName(player);
          const pPos = player.position || 'Pomocnik';
          const pYear = player.year || (parseInt(player.id) % 2 === 0 ? '2012' : '2013');
          const pMotor = motoricData[player.id];
          const pInjury = injuries.find((i) => i.playerId === player.id);
          const pNote = notes[player.id];

          return (
            <View key={player.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {player.number || Math.floor(Math.random() * 80) + 1}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>{pName}</Text>
                  <Text style={styles.playerMeta}>
                    {pPos} • Rocznik {pYear}
                  </Text>
                </View>

                {pInjury && (
                  <View style={styles.injuryBadge}>
                    <Ionicons name="warning" size={12} color="#dc2626" />
                    <Text style={styles.injuryBadgeText}>Kontuzja</Text>
                  </View>
                )}
              </View>

              {/* ZAWARTOŚĆ W ZALEŻNOŚCI OD ZAKŁADKI */}
              {activeTab === 'motoryka' && (
                <View style={styles.tabContentBox}>
                  {pMotor ? (
                    <View style={styles.motorGrid}>
                      <View style={styles.motorItem}>
                        <Text style={styles.motorLabel}>Sprint 30m</Text>
                        <Text style={styles.motorValue}>{pMotor.sprint30m}</Text>
                      </View>
                      <View style={styles.motorItem}>
                        <Text style={styles.motorLabel}>Skok w dal</Text>
                        <Text style={styles.motorValue}>{pMotor.jumpRange}</Text>
                      </View>
                      <View style={styles.motorItem}>
                        <Text style={styles.motorLabel}>Beep Test</Text>
                        <Text style={styles.motorValue}>{pMotor.beepTest}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>Brak zarejestrowanych testów motorycznych.</Text>
                  )}
                </View>
              )}

              {activeTab === 'zdrowie' && (
                <View style={styles.tabContentBox}>
                  {pInjury ? (
                    <View style={styles.injuryInfoBox}>
                      <Text style={styles.injuryTitle}> Uraz: {pInjury.injuryName}</Text>
                      <Text style={styles.injurySub}>
                        Od: {pInjury.dateFrom} • Powrót: {pInjury.expectedReturn}
                      </Text>
                      <View style={styles.rtpTag}>
                        <Text style={styles.rtpTagText}>{pInjury.rtpStage}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.healthyText}> W 100% zdrów i gotowy do gry</Text>
                  )}
                </View>
              )}

              {activeTab === 'notatki' && (
                <View style={styles.tabContentBox}>
                  {pNote ? (
                    <Text style={styles.noteText}>"{pNote}"</Text>
                  ) : (
                    <Text style={styles.emptyText}>Brak uwag trenerskich.</Text>
                  )}
                  <TouchableOpacity
                    style={styles.editNoteBtn}
                    onPress={() => {
                      setSelectedPlayerForNote(player);
                      setTempNoteText(pNote || '');
                    }}
                  >
                    <Ionicons name="pencil" size={12} color="#2563eb" />
                    <Text style={styles.editNoteBtnText}>Edytuj Notatkę</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: DODAWANIE KONTUZJI */}
      <Modal animationType="slide" transparent={true} visible={addInjuryModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zgłoś Uraz / Kontuzję 🏥</Text>
              <TouchableOpacity onPress={() => setAddInjuryModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Wybierz zawodnika</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {MOCK_100_PLAYERS.slice(0, 10).map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.playerPickChip,
                    selectedPlayerId === p.id && styles.playerPickChipSelected,
                  ]}
                  onPress={() => setSelectedPlayerId(p.id)}
                >
                  <Text
                    style={[
                      styles.playerPickChipText,
                      selectedPlayerId === p.id && { color: '#fff' },
                    ]}
                  >
                    {getPlayerName(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Nazwa urazu / Diagnoza</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. Skręcenie kostki"
              value={newInjuryName}
              onChangeText={setNewInjuryName}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Przewidywana data powrotu</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. 2026-11-10"
              value={newInjuryReturn}
              onChangeText={setNewInjuryReturn}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddInjuryModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddInjury}>
                <Text style={styles.saveBtnText}>Zapisz w Dzienniku</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DODAWANIE TESTU MOTORYCZNEGO */}
      <Modal animationType="slide" transparent={true} visible={addTestModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wprowadź Wyniki Testów ⏱️</Text>
              <TouchableOpacity onPress={() => setAddTestModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Wybierz zawodnika</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {MOCK_100_PLAYERS.slice(0, 10).map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.playerPickChip,
                    selectedPlayerId === p.id && styles.playerPickChipSelected,
                  ]}
                  onPress={() => setSelectedPlayerId(p.id)}
                >
                  <Text
                    style={[
                      styles.playerPickChipText,
                      selectedPlayerId === p.id && { color: '#fff' },
                    ]}
                  >
                    {getPlayerName(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Sprint 30m (sekundy)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. 4.2"
              keyboardType="numeric"
              value={newSprint}
              onChangeText={setNewSprint}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Skok w dal z miejsca (cm)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. 210"
              keyboardType="numeric"
              value={newJump}
              onChangeText={setNewJump}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Beep Test (poziom)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="np. 11.2"
              value={newBeep}
              onChangeText={setNewBeep}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddTestModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMotoricTest}>
                <Text style={styles.saveBtnText}>Zapisz Pomiary</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: EDYCJA NOTATKI TRENERSKIEJ */}
      <Modal animationType="slide" transparent={true} visible={!!selectedPlayerForNote}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notatka Trenerska 📝</Text>
              <TouchableOpacity onPress={() => setSelectedPlayerForNote(null)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 }}>
              Zawodnik: {selectedPlayerForNote ? getPlayerName(selectedPlayerForNote) : ''}
            </Text>

            <TextInput
              style={[styles.modalInput, { height: 90 }]}
              multiline
              placeholder="Wpisz uwagi dotyczące zachowania, zaangażowania lub taktyki..."
              value={tempNoteText}
              onChangeText={setTempNoteText}
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedPlayerForNote(null)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>Zapisz Notatkę</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addTopBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addTopBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  tabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  tabTextActive: { color: '#2563eb', fontWeight: 'bold' },

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
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
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
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },

  injuryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  injuryBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626', marginLeft: 4 },

  tabContentBox: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },

  motorGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  motorItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 4,
  },
  motorLabel: { fontSize: 10, color: '#64748b' },
  motorValue: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  emptyText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },
  healthyText: { fontSize: 11, color: '#16a34a', fontWeight: 'bold' },

  injuryInfoBox: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 6 },
  injuryTitle: { fontSize: 12, fontWeight: 'bold', color: '#991b1b' },
  injurySub: { fontSize: 10, color: '#b91c1c', marginTop: 2 },
  rtpTag: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  rtpTagText: { fontSize: 9, fontWeight: 'bold', color: '#dc2626' },

  noteText: { fontSize: 11, color: '#334155', fontStyle: 'italic', lineHeight: 16 },
  editNoteBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6, alignSelf: 'flex-end' },
  editNoteBtnText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb', marginLeft: 2 },

  /* MODALE */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
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

  playerPickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  playerPickChipSelected: { backgroundColor: '#2563eb' },
  playerPickChipText: { fontSize: 11, fontWeight: '600', color: '#475569' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});