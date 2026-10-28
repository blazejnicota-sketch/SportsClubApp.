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
import { usePlayers, Player } from './PlayersContext'; // Pobieramy ze wspólnego kontekstu

const MOTORMETIC_TESTS = [
  'Bieg na 30m (s)',
  'Skok w dal z miejsca (cm)',
  'Bieg wahadłowy 4x5m (s)',
  'Zwinność (test łuków) (s)',
  'Żonglerka piłką (szt.)',
  'Wysokość wyskoku (cm)',
];

export default function ZawodnicyScreen() {
  const { players, updatePlayer, availableYears } = usePlayers();

const [selectedYearFilter, setSelectedYearFilter] = useState<string>('Wszyscy');
const [searchQuery, setSearchQuery] = useState<string>('');

  // Stany modali
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [testModalVisible, setTestModalVisible] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Szybki test zbiorczy na boisku
  const [activeTestType, setActiveTestType] = useState<string>(MOTORMETIC_TESTS[0]);
  const [bulkResults, setBulkResults] = useState<Record<string, string>>({});

  const filteredPlayers = players.filter((p) => {
    const matchesYear = selectedYearFilter === 'Wszyscy' || String(p.year) === selectedYearFilter;
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || String(p.number).includes(searchQuery);
    return matchesYear && matchesSearch;
  });

  const handleOpenProfile = (player: Player) => {
    setSelectedPlayer(player);
    setProfileModalVisible(true);
  };

  const handleOpenBulkTests = () => {
    setBulkResults({});
    setTestModalVisible(true);
  };

  const handleSaveBulkResults = () => {
    players.forEach((player) => {
      const resVal = bulkResults[player.id];
      if (resVal && resVal.trim() !== '') {
        const newTest = {
          testName: activeTestType,
          result: resVal.trim(),
          date: new Date().toISOString().split('T')[0],
        };
        updatePlayer(player.id, {
          tests: [newTest, ...(player.tests || [])],
        });
      }
    });
    setTestModalVisible(false);
    Alert.alert('Zapisano 🚀', `Wyniki dla próby "${activeTestType}" zostały pomyślnie dodane!`);
  };

  const toggleHealthStatus = (newStatus: 'Zdrowy' | 'Kontuzja' | 'Rehabilitacja' | 'Chory') => {
    if (!selectedPlayer) return;
    updatePlayer(selectedPlayer.id, { healthStatus: newStatus });
    setSelectedPlayer({ ...selectedPlayer, healthStatus: newStatus });
  };

  const updatePlayerStat = (field: keyof Player, delta: number) => {
    if (!selectedPlayer) return;
    const currentVal = Number(selectedPlayer[field] || 0);
    const updatedValue = Math.max(0, currentVal + delta);
    
    updatePlayer(selectedPlayer.id, { [field]: updatedValue });
    setSelectedPlayer({ ...selectedPlayer, [field]: updatedValue });
  };

  return (
    <View style={styles.container}>
      {/* Nagłówek */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kadra & Statystyki</Text>
          <Text style={styles.headerSubtitle}>Zarządzanie zawodnikami, formą i motoryką</Text>
        </View>
        <TouchableOpacity style={styles.testBtn} onPress={handleOpenBulkTests}>
          <Ionicons name="flash" size={15} color="#fff" />
          <Text style={styles.testBtnText}>Szybki Test</Text>
        </TouchableOpacity>
      </View>

      {/* Wyszukiwarka */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj zawodnika..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Dynamiczne filtry roczników pobierane z kontekstu */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40, marginBottom: 12 }}>
  {['Wszyscy', ...availableYears].map((yr) => (
    <TouchableOpacity
      key={yr}
      style={[styles.yearChip, selectedYearFilter === yr && styles.yearChipActive]}
      onPress={() => setSelectedYearFilter(yr)}
    >
      <Text style={[styles.yearChipText, selectedYearFilter === yr && styles.yearChipTextActive]}>
        {yr}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

      {/* Lista zawodników */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {filteredPlayers.map((player) => {
          const trainingsTotal = player.trainingsTotal || 0;
          const trainingsPresent = player.trainingsPresent || 0;
          const attendancePercent = trainingsTotal > 0 
            ? Math.round((trainingsPresent / trainingsTotal) * 100) 
            : 100;

          return (
            <TouchableOpacity
              key={player.id}
              style={styles.playerCard}
              onPress={() => handleOpenProfile(player)}
            >
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>#{player.number}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.playerName}>{player.firstName} {player.lastName}</Text>
                <Text style={styles.playerMeta}>Roczn. {player.year} | {player.position} | Gole: {player.goals || 0} ⚽ | As: {player.assists || 0}</Text>
              </View>
              
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: player.healthStatus === 'Zdrowy' ? '#16a34a' : player.healthStatus === 'Kontuzja' ? '#dc2626' : '#ca8a04' }
              ]} />

              <View style={styles.attendanceBadge}>
                <Text style={styles.attendanceBadgeText}>{attendancePercent}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: SZYBKI TEST NA BOISKU */}
      <Modal animationType="slide" transparent={true} visible={testModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '88%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Szybki Skaner Testów</Text>
              <TouchableOpacity onPress={() => setTestModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Wybierz próbę motoryczną:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 45, marginBottom: 10 }}>
              {MOTORMETIC_TESTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.testTypeChip, activeTestType === t && styles.testTypeChipActive]}
                  onPress={() => setActiveTestType(t)}
                >
                  <Text style={[styles.testTypeChipText, activeTestType === t && styles.testTypeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.subInfoText}>Wpisz wynik zawodnikowi i przejdź do kolejnego:</Text>

            <ScrollView style={{ flex: 1, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {filteredPlayers.map((p) => (
                <View key={p.id} style={styles.bulkRow}>
                  <Text style={styles.bulkPlayerName}>#{p.number} {p.firstName} {p.lastName}</Text>
                  <TextInput
                    style={styles.bulkInput}
                    placeholder="Wynik"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="numeric"
                    value={bulkResults[p.id] || ''}
                    onChangeText={(val) => setBulkResults({ ...bulkResults, [p.id]: val })}
                  />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveBulkBtn} onPress={handleSaveBulkResults}>
              <Text style={styles.saveBulkBtnText}>Zapisz Wyniki całej grupy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: INDYWIDUALNY PROFIL ZAWODNIKA ZE STATYSTYKAMI */}
      <Modal animationType="fade" transparent={true} visible={profileModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Profil i Statystyki Zawodnika</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedPlayer && (
              <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.profileName}>{selectedPlayer.firstName} {selectedPlayer.lastName}</Text>
                <Text style={styles.profileDetails}>Nr: #{selectedPlayer.number} | Rocznik: {selectedPlayer.year} | Pozycja: {selectedPlayer.position}</Text>
                <Text style={styles.profileDetails}>Noga: {selectedPlayer.preferredFoot || 'Prawa'} | Rodzic: <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>{selectedPlayer.parentPhone || 'Brak'}</Text></Text>

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Status zdrowotny:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(['Zdrowy', 'Kontuzja', 'Rehabilitacja', 'Chory'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusChip,
                        selectedPlayer.healthStatus === st && styles.statusChipActive,
                        st === 'Zdrowy' && selectedPlayer.healthStatus === st && { backgroundColor: '#16a34a' },
                        st === 'Kontuzja' && selectedPlayer.healthStatus === st && { backgroundColor: '#dc2626' },
                      ]}
                      onPress={() => toggleHealthStatus(st)}
                    >
                      <Text style={[styles.statusChipText, selectedPlayer.healthStatus === st && { color: '#fff' }]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 6 }]}>Statystyki Meczowe i Sezon:</Text>
                <View style={styles.statsContainerBox}>
                  <View style={styles.statBoxItem}>
                    <Text style={styles.statBoxValue}>{selectedPlayer.matchesPlayed || 0}</Text>
                    <Text style={styles.statBoxLabel}>Mecze</Text>
                    <View style={styles.statButtonsRow}>
                      <TouchableOpacity onPress={() => updatePlayerStat('matchesPlayed', -1)} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('matchesPlayed', 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statBoxItem}>
                    <Text style={[styles.statBoxValue, { color: '#16a34a' }]}>{selectedPlayer.goals || 0}</Text>
                    <Text style={styles.statBoxLabel}>Gole ⚽</Text>
                    <View style={styles.statButtonsRow}>
                      <TouchableOpacity onPress={() => updatePlayerStat('goals', -1)} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('goals', 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statBoxItem}>
                    <Text style={[styles.statBoxValue, { color: '#2563eb' }]}>{selectedPlayer.assists || 0}</Text>
                    <Text style={styles.statBoxLabel}>Asysty 🎯</Text>
                    <View style={styles.statButtonsRow}>
                      <TouchableOpacity onPress={() => updatePlayerStat('assists', -1)} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('assists', 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statBoxItem}>
                    <Text style={[styles.statBoxValue, { color: '#ca8a04' }]}>{selectedPlayer.yellowCards || 0}</Text>
                    <Text style={styles.statBoxLabel}>Kartki 🟨</Text>
                    <View style={styles.statButtonsRow}>
                      <TouchableOpacity onPress={() => updatePlayerStat('yellowCards', -1)} style={styles.miniBtn}><Text>-</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('yellowCards', 1)} style={styles.miniBtn}><Text>+</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Frekwencja treningowa:</Text>
                <View style={styles.attendanceBox}>
                  <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>
                    Obecność: <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>{selectedPlayer.trainingsPresent || 0} / {selectedPlayer.trainingsTotal || 0}</Text> treningów
                  </Text>
                  <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold' }}>
                    {(selectedPlayer.trainingsTotal || 0) > 0 ? Math.round(((selectedPlayer.trainingsPresent || 0) / selectedPlayer.trainingsTotal!) * 100) : 100}%
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Historia testów motorycznych:</Text>
                {selectedPlayer.tests && selectedPlayer.tests.length > 0 ? (
                  selectedPlayer.tests.map((t, idx) => (
                    <View key={idx} style={styles.testHistoryRow}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}>{t.testName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold', marginRight: 8 }}>{t.result}</Text>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>({t.date})</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>Brak zarejestrowanych testów.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  testBtn: { backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  testBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  filterRow: { marginBottom: 8 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#1e293b' },
  yearChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 6, backgroundColor: '#fff', height: 32, justifyContent: 'center' },
  yearChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  yearChipText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  yearChipTextActive: { color: '#fff', fontWeight: 'bold' },
  playerCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  attendanceBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  attendanceBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 14, padding: 16, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 4, marginTop: 4 },
  testTypeChip: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, marginRight: 6, height: 32 },
  testTypeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  testTypeChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  testTypeChipTextActive: { color: '#fff', fontWeight: 'bold' },
  subInfoText: { fontSize: 11, color: '#64748b', marginBottom: 6, fontStyle: 'italic' },
  bulkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bulkPlayerName: { fontSize: 12, fontWeight: '600', color: '#1e293b', flex: 1 },
  bulkInput: { width: 70, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, textAlign: 'center', color: '#1e293b' },
  saveBulkBtn: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 10 },
  saveBulkBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  profileDetails: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  statusChipActive: { backgroundColor: '#ca8a04', borderColor: 'transparent' },
  statusChipText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  statsContainerBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 4 },
  statBoxItem: { alignItems: 'center', flex: 1 },
  statBoxValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statBoxLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  statButtonsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  miniBtn: { width: 22, height: 22, backgroundColor: '#e2e8f0', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  attendanceBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  testHistoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' },
});