import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

type ViewTab = 'taktyka' | 'protokol';
type FormationType = '4-3-3' | '4-2-3-1' | '3-5-2' | '3-2-2';
type YearFilter = 'WSZYSTKIE' | '2012' | '2013' | '2014';

interface MatchEvent {
  id: string;
  minute: number;
  team: 'home' | 'away'; // home = nasza drużyna (lewa), away = przeciwnik (prawa)
  type: 'goal' | 'yellow_card' | 'red_card';
  scorerName?: string;
  assistantName?: string;
}

export default function BoiskoScreen() {
  const [activeTab, setActiveTab] = useState<ViewTab>('taktyka');
  const [formation, setFormation] = useState<FormationType>('4-3-3');
  const [selectedYear, setSelectedYear] = useState<YearFilter>('WSZYSTKIE');

  // Stan meczu w Protokole
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [currentMinute, setCurrentMinute] = useState<string>('15');

  // Stany modali
  const [goalModalVisible, setGoalModalVisible] = useState<boolean>(false);
  const [selectedScorerId, setSelectedScorerId] = useState<string>('1');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('none');

  // Pomocnicze pobieranie nazwy zawodnika
  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    return 'Zawodnik';
  };

  // Filtrowani zawodnicy do składu / strzelców
  const availablePlayers = useMemo(() => {
    return MOCK_100_PLAYERS.slice(0, 20).filter((p: any) => {
      const pYear = p.year || (parseInt(p.id) % 2 === 0 ? '2012' : '2013');
      return selectedYear === 'WSZYSTKIE' || pYear === selectedYear;
    });
  }, [selectedYear]);

  // DODAWANIE GOLA DLA NASZEJ DRUŻYNY (LEWA STRONA) - Z WYBOREM STRZELCA
  const handleAddHomeGoal = () => {
    const scorer = availablePlayers.find((p: any) => p.id === selectedScorerId);
    const assistant = availablePlayers.find((p: any) => p.id === selectedAssistantId);

    const scorerName = scorer ? getPlayerName(scorer) : 'Zawodnik Nasz';
    const assistantName = assistant ? getPlayerName(assistant) : undefined;

    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      minute: parseInt(currentMinute) || 1,
      team: 'home',
      type: 'goal',
      scorerName,
      assistantName,
    };

    setMatchEvents([newEvent, ...matchEvents]);
    setHomeScore((prev) => prev + 1);
    setGoalModalVisible(false);
  };

  // DODAWANIE GOLA DLA PRZECIWNIKA (PRAWA STRONA) - BEZ PYTANIA O STRZELCA
  const handleAddAwayGoal = () => {
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      minute: parseInt(currentMinute) || 1,
      team: 'away',
      type: 'goal',
      scorerName: 'Przeciwnik',
    };

    setMatchEvents([newEvent, ...matchEvents]);
    setAwayScore((prev) => prev + 1);
  };

  // Reset protokołu meczowego
  const handleResetMatch = () => {
    Alert.alert(
      'Reset Protokołu 🔄',
      'Czy na pewno chcesz zresetować wynik i wyczyścić statystyki meczu?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Resetuj',
          style: 'destructive',
          onPress: () => {
            setHomeScore(0);
            setAwayScore(0);
            setMatchEvents([]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Boisko i Protokół Meczowy</Text>
          <Text style={styles.headerSubtitle}>Taktyka, formacje i rejestrator zdarzeń live</Text>
        </View>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK (Taktyka / Protokół) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'taktyka' && styles.tabBtnActive]}
          onPress={() => setActiveTab('taktyka')}
        >
          <Ionicons
            name="easel-outline"
            size={15}
            color={activeTab === 'taktyka' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'taktyka' && styles.tabTextActive]}>
            Tablica Taktyczna
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'protokol' && styles.tabBtnActive]}
          onPress={() => setActiveTab('protokol')}
        >
          <Ionicons
            name="trophy-outline"
            size={15}
            color={activeTab === 'protokol' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'protokol' && styles.tabTextActive]}>
            Protokół LIVE ({homeScore}:{awayScore})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= ZAKŁADKA 1: TABLICA TAKTYCZNA ================= */}
        {activeTab === 'taktyka' && (
          <View>
            {/* Wybór Formacji i Rocznika */}
            <View style={styles.controlsCard}>
              <Text style={styles.controlLabel}>Wybór Formacji:</Text>
              <View style={styles.chipsRow}>
                {(['4-3-3', '4-2-3-1', '3-5-2', '3-2-2'] as FormationType[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, formation === f && styles.chipActive]}
                    onPress={() => setFormation(f)}
                  >
                    <Text style={[styles.chipText, formation === f && styles.chipTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.controlLabel, { marginTop: 10 }]}>Filtruj Rocznik:</Text>
              <View style={styles.chipsRow}>
                {(['WSZYSTKIE', '2012', '2013', '2014'] as YearFilter[]).map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.chip, selectedYear === yr && styles.chipActive]}
                    onPress={() => setSelectedYear(yr)}
                  >
                    <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* MAKETA BOISKA */}
            <View style={styles.pitchContainer}>
              <View style={styles.pitchLines}>
                <View style={styles.pitchCenterCircle} />
                <View style={styles.pitchCenterLine} />
                <View style={styles.pitchPenaltyAreaTop} />
                <View style={styles.pitchPenaltyAreaBottom} />
              </View>

              {/* Zawodnicy na boisku */}
              <View style={styles.pitchPlayersOverlay}>
                {/* Bramkarz */}
                <View style={[styles.playerNode, { top: '85%', left: '44%' }]}>
                  <View style={[styles.playerShirt, { backgroundColor: '#eab308' }]}>
                    <Text style={styles.playerShirtNum}>1</Text>
                  </View>
                  <Text style={styles.playerNodeName}>BR</Text>
                </View>

                {/* Obrona */}
                <View style={[styles.playerNode, { top: '68%', left: '12%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>2</Text></View>
                  <Text style={styles.playerNodeName}>LO</Text>
                </View>
                <View style={[styles.playerNode, { top: '70%', left: '35%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>4</Text></View>
                  <Text style={styles.playerNodeName}>ŚO</Text>
                </View>
                <View style={[styles.playerNode, { top: '70%', left: '55%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>5</Text></View>
                  <Text style={styles.playerNodeName}>ŚO</Text>
                </View>
                <View style={[styles.playerNode, { top: '68%', left: '78%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>3</Text></View>
                  <Text style={styles.playerNodeName}>PO</Text>
                </View>

                {/* Pomoc */}
                <View style={[styles.playerNode, { top: '45%', left: '25%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>6</Text></View>
                  <Text style={styles.playerNodeName}>ŚPOM</Text>
                </View>
                <View style={[styles.playerNode, { top: '42%', left: '45%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>8</Text></View>
                  <Text style={styles.playerNodeName}>ŚPOM</Text>
                </View>
                <View style={[styles.playerNode, { top: '45%', left: '65%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>10</Text></View>
                  <Text style={styles.playerNodeName}>ŚPOM</Text>
                </View>

                {/* Atak */}
                <View style={[styles.playerNode, { top: '20%', left: '15%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>7</Text></View>
                  <Text style={styles.playerNodeName}>LW</Text>
                </View>
                <View style={[styles.playerNode, { top: '15%', left: '45%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>9</Text></View>
                  <Text style={styles.playerNodeName}>N</Text>
                </View>
                <View style={[styles.playerNode, { top: '20%', left: '75%' }]}>
                  <View style={styles.playerShirt}><Text style={styles.playerShirtNum}>11</Text></View>
                  <Text style={styles.playerNodeName}>PW</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= ZAKŁADKA 2: PROTOKÓŁ MECZOWY LIVE ================= */}
        {activeTab === 'protokol' && (
          <View>
            {/* TABLICA WYNIKÓW */}
            <View style={styles.scoreboardCard}>
              <View style={styles.teamScoreBox}>
                <Text style={styles.teamNameLabel}>NASZ KLUB</Text>
                <Text style={styles.scoreNumber}>{homeScore}</Text>
              </View>

              <View style={styles.scoreDividerBox}>
                <Text style={styles.scoreVsText}>VS</Text>
                <View style={styles.minuteInputBox}>
                  <Text style={styles.minuteLabel}>Minuta:</Text>
                  <TextInput
                    style={styles.minuteInput}
                    value={currentMinute}
                    onChangeText={setCurrentMinute}
                    keyboardType="numeric"
                  />
                  <Text style={styles.minuteLabel}>'</Text>
                </View>
              </View>

              <View style={styles.teamScoreBox}>
                <Text style={styles.teamNameLabel}>PRZECIWNIK</Text>
                <Text style={styles.scoreNumber}>{awayScore}</Text>
              </View>
            </View>

            {/* PRZYCISKI REJESTRACJI GOLI */}
            <View style={styles.goalButtonsRow}>
              {/* LEWA STRONA: DODAJ BRAMKĘ + KTO STRZELIŁ */}
              <TouchableOpacity
                style={styles.homeGoalBtn}
                onPress={() => setGoalModalVisible(true)}
              >
                <Ionicons name="football" size={18} color="#fff" />
                <Text style={styles.goalBtnText}>+ Gol dla Nas (Wybierz strzelca)</Text>
              </TouchableOpacity>

              {/* PRAWA STRONA: DODAJ BRAMKĘ PRZECIWNIKA (BEZ IMION) */}
              <TouchableOpacity
                style={styles.awayGoalBtn}
                onPress={handleAddAwayGoal}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.goalBtnText}>+ Gol Przeciwnika</Text>
              </TouchableOpacity>
            </View>

            {/* OŚ CZASU MECZU (DZIENNIK ZDARZEŃ) */}
            <View style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTitle}>Przebieg Meczu LIVE</Text>
                <TouchableOpacity onPress={handleResetMatch}>
                  <Text style={styles.resetBtnText}>Resetuj mecz</Text>
                </TouchableOpacity>
              </View>

              {matchEvents.length === 0 ? (
                <Text style={styles.emptyTimelineText}>
                  Brak zarejestrowanych goli. Użyj przycisków powyżej, aby dodać bramkę.
                </Text>
              ) : (
                matchEvents.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.timelineEventRow,
                      ev.team === 'home' ? styles.homeEventRow : styles.awayEventRow,
                    ]}
                  >
                    <View style={styles.eventMinBadge}>
                      <Text style={styles.eventMinText}>{ev.minute}'</Text>
                    </View>

                    <View style={styles.eventDetailContent}>
                      <Text style={styles.eventTitleText}>
                        ⚽ Gol! ({ev.team === 'home' ? 'Nasz Klub' : 'Przeciwnik'})
                      </Text>
                      {ev.team === 'home' && (
                        <Text style={styles.eventSubText}>
                          Strzelec: <Text style={{ fontWeight: 'bold' }}>{ev.scorerName}</Text>
                          {ev.assistantName ? ` • Asysta: ${ev.assistantName}` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= MODAL: WYBÓR STRZELCA DLA NASZEJ DRUŻYNY ================= */}
      <Modal animationType="slide" transparent={true} visible={goalModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kto strzelił bramkę? ⚽</Text>
              <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Strzelec bramki:</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 10 }}>
              {availablePlayers.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pickerItem,
                    selectedScorerId === p.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => setSelectedScorerId(p.id)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedScorerId === p.id && styles.pickerItemTextSelected,
                    ]}
                  >
                    #{p.number || p.id} {getPlayerName(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Asystent (opcjonalnie):</Text>
            <ScrollView style={{ maxHeight: 120, marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedAssistantId === 'none' && styles.pickerItemSelected,
                ]}
                onPress={() => setSelectedAssistantId('none')}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedAssistantId === 'none' && styles.pickerItemTextSelected,
                  ]}
                >
                  Brak asysty (Akcja indywidualna)
                </Text>
              </TouchableOpacity>

              {availablePlayers.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pickerItem,
                    selectedAssistantId === p.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => setSelectedAssistantId(p.id)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedAssistantId === p.id && styles.pickerItemTextSelected,
                    ]}
                  >
                    #{p.number || p.id} {getPlayerName(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddHomeGoal}>
                <Text style={styles.saveBtnText}>Zatwierdź Gol!</Text>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

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

  content: { padding: 16 },

  /* TABLICA TAKTYCZNA */
  controlsCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  controlLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    marginBottom: 4,
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  pitchContainer: {
    height: 380,
    backgroundColor: '#15803d',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  pitchLines: { ...StyleSheet.absoluteFillObject },
  pitchCenterLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pitchCenterCircle: {
    position: 'absolute',
    top: '38%',
    left: '32%',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pitchPenaltyAreaTop: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 60,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pitchPenaltyAreaBottom: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: 60,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },

  pitchPlayersOverlay: { ...StyleSheet.absoluteFillObject },
  playerNode: { position: 'absolute', alignItems: 'center' },
  playerShirt: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  playerShirtNum: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  playerNodeName: { fontSize: 9, fontWeight: 'bold', color: '#fff', marginTop: 1, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 3, borderRadius: 3 },

  /* PROTOKÓŁ MECZOWY LIVE */
  scoreboardCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamScoreBox: { flex: 1, alignItems: 'center' },
  teamNameLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
  scoreNumber: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  scoreDividerBox: { alignItems: 'center', paddingHorizontal: 10 },
  scoreVsText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  minuteInputBox: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  minuteLabel: { fontSize: 11, color: '#94a3b8' },
  minuteInput: {
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginHorizontal: 4,
    width: 32,
    textAlign: 'center',
  },

  goalButtonsRow: { marginBottom: 12 },
  homeGoalBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  awayGoalBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  goalBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },

  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timelineTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  resetBtnText: { fontSize: 11, color: '#dc2626', fontWeight: 'bold' },
  emptyTimelineText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },

  timelineEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  homeEventRow: { borderLeftWidth: 3, borderLeftColor: '#16a34a', paddingLeft: 8 },
  awayEventRow: { borderLeftWidth: 3, borderLeftColor: '#dc2626', paddingLeft: 8 },
  eventMinBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  eventMinText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  eventDetailContent: { flex: 1 },
  eventTitleText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  eventSubText: { fontSize: 10, color: '#64748b', marginTop: 1 },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 8, marginBottom: 4 },

  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerItemSelected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  pickerItemText: { fontSize: 12, color: '#334155' },
  pickerItemTextSelected: { color: '#2563eb', fontWeight: 'bold' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});