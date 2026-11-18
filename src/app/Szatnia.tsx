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
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, Player } from '../components/PlayersContext';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type SubTab = 'zdrowie' | 'motoryka' | 'notatki';
type PositionFilter = 'WSZYSTKIE' | 'Bramkarz' | 'Obrońca' | 'Pomocnik' | 'Napastnik';

export default function SzatniaScreen() {
  const { players: playersData, addPlayer, updatePlayer, removePlayer, availableYears: contextYears } = usePlayers();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('zdrowie');
  const [selectedYear, setSelectedYear] = useState<string>('WSZYSTKIE');
  const [selectedPosition, setSelectedPosition] = useState<PositionFilter>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modale
  const [testModalVisible, setTestModalVisible] = useState<boolean>(false);
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState<boolean>(false);
  
  // Stany dla edycji i rozwoju fizycznego
  const [editPlayerModalVisible, setEditPlayerModalVisible] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editHeight, setEditHeight] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');

  // Stan dla testu motorycznego
  const [selectedPlayerForTest, setSelectedPlayerForTest] = useState<Player | null>(null);
  const [sprintTime, setSprintTime] = useState<string>('4.5');
  const [jumpDist, setJumpDist] = useState<string>('210');
  const [beepLevel, setBeepLevel] = useState<string>('8.5');

  // Stany dla formularza nowego zawodnika (ROZBUDOWANE)
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newYear, setNewYear] = useState<string>('2016');
  const [newPosition, setNewPosition] = useState<string>('Pomocnik');
  const [newNumber, setNewNumber] = useState<string>('');
  const [newPreferredFoot, setNewPreferredFoot] = useState<string>('Prawa');
  const [newParentName, setNewParentName] = useState<string>('');
  const [newParentPhone, setNewParentPhone] = useState<string>('');
  const [newMedicalDate, setNewMedicalDate] = useState<string>('');

  const availableYears = useMemo(() => {
    return ['WSZYSTKIE', ...contextYears];
  }, [contextYears]);

  // Filtrowanie zawodników
  const filteredPlayers = useMemo(() => {
    return playersData.filter((p: any) => {
      const pName = (p.name || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase();
      const matchesSearch = pName.includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'WSZYSTKIE' || String(p.year) === selectedYear;
      const matchesPos = selectedPosition === 'WSZYSTKIE' || p.position === selectedPosition;

      return matchesSearch && matchesYear && matchesPos;
    });
  }, [playersData, searchQuery, selectedYear, selectedPosition]);

  const calculateBMI = (h?: number, w?: number) => {
    if (!h || !w || h === 0) return 0;
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleSaveTest = () => {
    if (!selectedPlayerForTest) return;
    const currentDate = new Date().toLocaleDateString('pl-PL');
    const newTestEntry = {
      testName: 'Testy Ogólne (Sprint / Skok / Beep)',
      result: `Sprint: ${sprintTime}s, Skok: ${jumpDist}cm, Beep: ${beepLevel}`,
      date: currentDate,
    };

    const existingTests = selectedPlayerForTest.tests || [];

    updatePlayer(selectedPlayerForTest.id, {
      sprint30m: sprintTime,
      jumpCm: parseInt(jumpDist) || selectedPlayerForTest.jumpCm,
      beepTest: beepLevel,
      tests: [newTestEntry, ...existingTests],
    });

    setTestModalVisible(false);
    Alert.alert('Sukces 📊', 'Wyniki pomiarów i historia zostały zaktualizowane.');
  };

  // ROZBUDOWANA FUNKCJA DODAWANIA ZAWODNIKA
  const handleAddNewPlayer = () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Błąd', 'Podaj imię i nazwisko nowego zawodnika.');
      return;
    }

    addPlayer({
      firstName: newFirstName,
      lastName: newLastName,
      name: `${newFirstName} ${newLastName}`,
      number: parseInt(newNumber) || Math.floor(Math.random() * 80) + 10,
      year: newYear,
      position: newPosition,
      preferredFoot: newPreferredFoot,
      parentName: newParentName,
      parentPhone: newParentPhone,
      medicalClearanceDate: newMedicalDate,
      sprint30m: '4.50',
      jumpCm: 200,
      beepTest: '7.0',
      injuryStatus: 'Zdrowy',
      coachNote: 'Nowo dodany zawodnik do kadry.',
      tests: [],
      height: 145,
      weight: 38,
    });

    // Resetowanie pól po dodaniu
    setNewFirstName('');
    setNewLastName('');
    setNewYear('2016');
    setNewPosition('Pomocnik');
    setNewNumber('');
    setNewPreferredFoot('Prawa');
    setNewParentName('');
    setNewParentPhone('');
    setNewMedicalDate('');
    
    setAddPlayerModalVisible(false);
    Alert.alert('Sukces ⚽', 'Nowy zawodnik został dodany do bazy wraz z danymi opiekuna!');
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setEditFirstName(player.firstName || '');
    setEditLastName(player.lastName || '');
    setEditHeight(player.height ? String(player.height) : '');
    setEditWeight(player.weight ? String(player.weight) : '');
    setEditPlayerModalVisible(true);
  };

  const handleSaveEditedPlayer = () => {
    if (!editingPlayer) return;
    updatePlayer(editingPlayer.id, {
      firstName: editFirstName,
      lastName: editLastName,
      name: `${editFirstName} ${editLastName}`,
      height: parseInt(editHeight) || 0,
      weight: parseFloat(editWeight) || 0,
      lastMeasurementDate: new Date().toLocaleDateString('pl-PL'),
    });
    setEditPlayerModalVisible(false);
    Alert.alert('Sukces', 'Karta fizyczna zawodnika została zaktualizowana.');
  };

  const handleDeletePlayerPrompt = (player: Player) => {
    Alert.alert(
      'Usuń zawodnika',
      `Czy na pewno chcesz usunąć zawodnika ${player.name} z kadry?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => removePlayer(player.id) },
      ]
    );
  };

  const toggleHealthStatus = (player: Player) => {
    const nextStatus = player.injuryStatus === 'Zdrowy' ? 'Kontuzja (2 tyg. przerwy)' : 'Zdrowy';
    updatePlayer(player.id, { injuryStatus: nextStatus });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* NAGŁÓWEK Z PRZYCISKAMI AKCJI */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Szatnia & Rozwój Fizyczny</Text>
          <Text style={styles.headerSubtitle}>Zdrowie, waga, wzrost i motoryka</Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={styles.addPlayerTopBtn}
            onPress={() => setAddPlayerModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={14} color="#2563eb" />
            <Text style={styles.addPlayerTopBtnText}>+ Gracza</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newEntryBtn}
            onPress={() => {
              if (filteredPlayers.length > 0) {
                setSelectedPlayerForTest(filteredPlayers[0]);
                setTestModalVisible(true);
              } else {
                Alert.alert('Uwaga', 'Brak zawodników w wybranej grupie.');
              }
            }}
          >
            <Ionicons name="speedometer-outline" size={14} color="#fff" />
            <Text style={styles.newEntryBtnText}>+ Pomiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PODZAKŁADKI */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'zdrowie' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('zdrowie')}
        >
          <Ionicons name="medkit-outline" size={14} color={activeSubTab === 'zdrowie' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.subTabText, activeSubTab === 'zdrowie' && styles.subTabTextActive]}>Rozwój & Zdrowie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'motoryka' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('motoryka')}
        >
          <Ionicons name="speedometer-outline" size={14} color={activeSubTab === 'motoryka' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.subTabText, activeSubTab === 'motoryka' && styles.subTabTextActive]}>Motoryka</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'notatki' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('notatki')}
        >
          <Ionicons name="create-outline" size={14} color={activeSubTab === 'notatki' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.subTabText, activeSubTab === 'notatki' && styles.subTabTextActive]}>Notatki</Text>
        </TouchableOpacity>
      </View>

      {/* FILTRY I WYSZUKIWARKA */}
      <View style={styles.filtersSection}>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <Text style={styles.filterGroupLabel}>Rocznik:</Text>
          {availableYears.map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[styles.chipFilter, selectedYear === yr && styles.chipFilterActive]}
              onPress={() => setSelectedYear(yr)}
            >
              <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA ZAWODNIKÓW */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Karty Zawodników ({filteredPlayers.length})
        </Text>

        {filteredPlayers.map((player: any) => {
          const pName = player.name || `${player.firstName || ''} ${player.lastName || ''}`;
          const bmi = calculateBMI(player.height, player.weight);

          return (
            <View key={player.id} style={styles.card}>
              <View style={styles.cardMainRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>#{player.number || player.id}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>{pName}</Text>
                  <Text style={styles.playerMeta}>
                    {player.position} | Rocznik {player.year}
                  </Text>
                </View>

                {/* PRZYCISKI AKCJI (EDYCJA / USUWANIE) */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { marginRight: 6 }]}
                    onPress={() => openEditModal(player)}
                  >
                    <Ionicons name="pencil-outline" size={14} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                    onPress={() => handleDeletePlayerPrompt(player)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ZAKŁADKA: ROZWÓJ I ZDROWIE */}
              {activeSubTab === 'zdrowie' && (
                <>
                  <View style={styles.physicalRow}>
                    <View style={styles.physicalBox}>
                      <Text style={styles.physicalLabel}>Wzrost</Text>
                      <Text style={styles.physicalVal}>{player.height ? `${player.height} cm` : '---'}</Text>
                    </View>
                    <View style={styles.physicalBox}>
                      <Text style={styles.physicalLabel}>Waga</Text>
                      <Text style={styles.physicalVal}>{player.weight ? `${player.weight} kg` : '---'}</Text>
                    </View>
                    <View style={[styles.physicalBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Text style={styles.physicalLabel}>BMI</Text>
                      <Text style={[styles.physicalVal, { color: '#16a34a' }]}>{bmi || '---'}</Text>
                    </View>
                  </View>
                  
                  {/* Wyświetlanie danych zdrowotnych i opiekuna */}
                  <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                    {(player.parentName || player.parentPhone) && (
                      <Text style={styles.infoLineText}>
                        <Ionicons name="people-outline" size={12} /> Opiekun: {player.parentName || 'Brak danych'} {player.parentPhone ? `(${player.parentPhone})` : ''}
                      </Text>
                    )}
                    {player.medicalClearanceDate && (
                      <Text style={[styles.infoLineText, { marginTop: 4, color: '#d97706' }]}>
                        <Ionicons name="medical-outline" size={12} /> Badania ważne do: {player.medicalClearanceDate}
                      </Text>
                    )}
                  </View>

                  <View style={styles.healthRow}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => toggleHealthStatus(player)}
                    >
                      <Ionicons
                        name={player.injuryStatus === 'Zdrowy' ? 'checkmark-circle' : 'alert-circle'}
                        size={18}
                        color={player.injuryStatus === 'Zdrowy' ? '#16a34a' : '#dc2626'}
                      />
                      <Text
                        style={[
                          styles.healthText,
                          { color: player.injuryStatus === 'Zdrowy' ? '#16a34a' : '#dc2626' },
                        ]}
                      >
                        Status Zdrowia: {player.injuryStatus || 'Zdrowy'} (Kliknij)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ZAKŁADKA: MOTORYKA */}
              {activeSubTab === 'motoryka' && (
                <>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Sprint 30m</Text>
                      <Text style={styles.metricVal}>{player.sprint30m} s</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Skok w dal</Text>
                      <Text style={styles.metricVal}>{player.jumpCm} cm</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricLabel}>Beep Test</Text>
                      <Text style={styles.metricVal}>{player.beepTest}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.singleTestBtn}
                    onPress={() => {
                      setSelectedPlayerForTest(player);
                      setSprintTime(String(player.sprint30m || '4.5'));
                      setJumpDist(String(player.jumpCm || '200'));
                      setBeepLevel(String(player.beepTest || '7.0'));
                      setTestModalVisible(true);
                    }}
                  >
                    <Ionicons name="speedometer-outline" size={13} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.singleTestBtnText}>Wprowadź nowy pomiar motoryczny</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ZAKŁADKA: NOTATKI I HISTORIA TESTÓW */}
              {activeSubTab === 'notatki' && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Notatka trenerska:</Text>
                  <Text style={styles.noteText}>
                    {player.coachNote ? player.coachNote : 'Brak notatek dla tego zawodnika.'}
                  </Text>

                  {player.tests && player.tests.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.noteTitle}>Historia ostatnich testów:</Text>
                      {player.tests.slice(0, 3).map((t: any, idx: number) => (
                        <Text key={idx} style={styles.historyItemText}>
                          • [{t.date}] {t.result}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: EDYCJA WZROSTU I WAGI */}
      <Modal animationType="slide" transparent={true} visible={editPlayerModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aktualizuj Pomiary 📏</Text>
              <TouchableOpacity onPress={() => setEditPlayerModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalPlayerTitle}>{editFirstName} {editLastName}</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Wzrost (cm)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric" 
                  value={editHeight} 
                  onChangeText={setEditHeight} 
                  placeholder="np. 145" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Waga (kg)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric" 
                  value={editWeight} 
                  onChangeText={setEditWeight} 
                  placeholder="np. 38.5" 
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditedPlayer}>
              <Text style={styles.saveBtnText}>Zapisz Dane Fizyczne</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DODAWANIE NOWEGO ZAWODNIKA (ROZBUDOWANY) */}
      <Modal animationType="slide" transparent={true} visible={addPlayerModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Zawodnika do Szatni ⚽</Text>
              <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeading}>Dane Podstawowe</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Imię zawodnika</Text>
                  <TextInput style={styles.modalInput} placeholder="np. Adam" value={newFirstName} onChangeText={setNewFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Nazwisko zawodnika</Text>
                  <TextInput style={styles.modalInput} placeholder="np. Wiśniewski" value={newLastName} onChangeText={setNewLastName} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Rocznik (np. 2016)</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" value={newYear} onChangeText={setNewYear} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pozycja</Text>
                  <TextInput style={styles.modalInput} value={newPosition} onChangeText={setNewPosition} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Numer na koszulce</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="np. 10" value={newNumber} onChangeText={setNewNumber} />
                </View>
                <View style={{ flex: 1 }} />
              </View>

              <Text style={styles.inputLabel}>Lepsza Noga</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10}}>
                <TouchableOpacity 
                  style={[styles.subTabBtn, {flex: 1, paddingVertical: 8}, newPreferredFoot === 'Prawa' && styles.subTabBtnActive]} 
                  onPress={() => setNewPreferredFoot('Prawa')}
                >
                  <Text style={[styles.subTabText, newPreferredFoot === 'Prawa' && styles.subTabTextActive]}>Prawa</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.subTabBtn, {flex: 1, paddingVertical: 8}, newPreferredFoot === 'Lewa' && styles.subTabBtnActive]}
                  onPress={() => setNewPreferredFoot('Lewa')}
                >
                  <Text style={[styles.subTabText, newPreferredFoot === 'Lewa' && styles.subTabTextActive]}>Lewa</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.subTabBtn, {flex: 1, paddingVertical: 8}, newPreferredFoot === 'Obie' && styles.subTabBtnActive]}
                  onPress={() => setNewPreferredFoot('Obie')}
                >
                  <Text style={[styles.subTabText, newPreferredFoot === 'Obie' && styles.subTabTextActive]}>Obie</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeading}>Opiekun & Zdrowie</Text>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Imię i Nazwisko opiekuna</Text>
                  <TextInput style={styles.modalInput} placeholder="np. Jan Wiśniewski" value={newParentName} onChangeText={setNewParentName} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Telefon kontaktowy (Rodzic)</Text>
                  <TextInput style={styles.modalInput} placeholder="np. 500 100 200" keyboardType="phone-pad" value={newParentPhone} onChangeText={setNewParentPhone} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Badania Lekarskie (Ważne do)</Text>
                  <TextInput style={styles.modalInput} placeholder="DD-MM-RRRR" value={newMedicalDate} onChangeText={setNewMedicalDate} />
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddPlayerModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Anuluj</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtnModal} onPress={handleAddNewPlayer}>
                  <Text style={styles.saveBtnText}>Zapisz Zawodnika</Text>
                </TouchableOpacity>
              </View>
              <View style={{height: 20}}/>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: WPISYWANIE WYNIKÓW TESTU MOTORYCZNEGO */}
      <Modal animationType="slide" transparent={true} visible={testModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wprowadź Pomiary Motoryki ⏱️</Text>
              <TouchableOpacity onPress={() => setTestModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Wybrany zawodnik</Text>
            <Text style={styles.selectedPlayerNameText}>
              {selectedPlayerForTest ? (selectedPlayerForTest.name || `${selectedPlayerForTest.firstName} ${selectedPlayerForTest.lastName}`) : ''} (Rocznik {selectedPlayerForTest?.year})
            </Text>

            <Text style={styles.inputLabel}>Sprint 30m (sekundy)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={sprintTime} onChangeText={setSprintTime} />

            <Text style={styles.inputLabel}>Skok w dal z miejsca (cm)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={jumpDist} onChangeText={setJumpDist} />

            <Text style={styles.inputLabel}>Beep Test (poziom)</Text>
            <TextInput style={styles.modalInput} value={beepLevel} onChangeText={setBeepLevel} />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTestModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtnModal} onPress={handleSaveTest}>
                <Text style={styles.saveBtnText}>Zapisz Pomiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  addPlayerTopBtn: {
    backgroundColor: '#eff6ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addPlayerTopBtnText: { color: '#2563eb', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  newEntryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newEntryBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  subTabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  subTabText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  subTabTextActive: { color: '#2563eb', fontWeight: 'bold' },
  
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLineText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  
  /* ROZWÓJ FIZYCZNY I ZDROWIE STYLES */
  physicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  physicalBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  physicalLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  physicalVal: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  healthText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  
  /* MOTORYKA STYLES */
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metricBox: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 6, borderRadius: 6, marginRight: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  metricLabel: { fontSize: 9, color: '#64748b' },
  metricVal: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  singleTestBtn: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleTestBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  
  /* NOTATKI STYLES */
  noteBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  noteTitle: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 2 },
  noteText: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
  historyItemText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  
  /* MODALS */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  modalPlayerTitle: { fontSize: 13, color: '#2563eb', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  sectionHeading: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 6 },
  selectedPlayerNameText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb', marginBottom: 4 },
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
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtnModal: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});