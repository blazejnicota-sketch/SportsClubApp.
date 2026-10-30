import React, { useState } from 'react';
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
import { usePlayers, Player } from './PlayersContext';

type GameFormat = '5v5' | '7v7' | '9v9' | '11v11';
type ActiveTab = 'pitch' | 'matchLive';

interface PositionSlot {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow' | 'red';
  player: Player;
  minute: string;
  assistPlayer?: Player;
}

const FORMAT_FORMATIONS: Record<GameFormat, { name: string; slots: PositionSlot[] }[]> = {
  '5v5': [
    {
      name: '1-2-1',
      slots: [
        { id: 'GK', label: 'Bramkarz (GK)', x: 50, y: 85 },
        { id: 'CB', label: 'Obrońca (CB)', x: 50, y: 65 },
        { id: 'LM', label: 'Lewy Pomocnik (LM)', x: 25, y: 40 },
        { id: 'RM', label: 'Prawy Pomocnik (RM)', x: 75, y: 40 },
        { id: 'ST', label: 'Napastnik (ST)', x: 50, y: 20 },
      ],
    },
  ],
  '7v7': [
    {
      name: '1-3-2-1',
      slots: [
        { id: 'GK', label: 'Bramkarz (GK)', x: 50, y: 85 },
        { id: 'LB', label: 'Lewy Obrońca (LB)', x: 20, y: 65 },
        { id: 'CB', label: 'Środkowy Obrońca (CB)', x: 50, y: 70 },
        { id: 'RB', label: 'Prawy Obrońca (RB)', x: 80, y: 65 },
        { id: 'LM', label: 'Lewy Pomocnik (LM)', x: 25, y: 40 },
        { id: 'RM', label: 'Prawy Pomocnik (RM)', x: 75, y: 40 },
        { id: 'ST', label: 'Napastnik (ST)', x: 50, y: 20 },
      ],
    },
  ],
  '9v9': [
    {
      name: '1-3-4-1',
      slots: [
        { id: 'GK', label: 'Bramkarz (GK)', x: 50, y: 85 },
        { id: 'LB', label: 'Lewy Obrońca (LB)', x: 20, y: 68 },
        { id: 'CB', label: 'Środkowy Obrońca (CB)', x: 50, y: 72 },
        { id: 'RB', label: 'Prawy Obrońca (RB)', x: 80, y: 68 },
        { id: 'LM', label: 'Lewy Pomocnik (LM)', x: 15, y: 45 },
        { id: 'CM1', label: 'Środkowy Pomocnik', x: 38, y: 48 },
        { id: 'CM2', label: 'Środkowy Pomocnik', x: 62, y: 48 },
        { id: 'RM', label: 'Prawy Pomocnik (RM)', x: 85, y: 45 },
        { id: 'ST', label: 'Napastnik (ST)', x: 50, y: 20 },
      ],
    },
  ],
  '11v11': [
    {
      name: '1-4-3-3',
      slots: [
        { id: 'GK', label: 'Bramkarz (GK)', x: 50, y: 85 },
        { id: 'LB', label: 'Lewy Obrońca (LB)', x: 15, y: 65 },
        { id: 'CB1', label: 'Środkowy Obrońca (CB)', x: 38, y: 70 },
        { id: 'CB2', label: 'Środkowy Obrońca (CB)', x: 62, y: 70 },
        { id: 'RB', label: 'Prawy Obrońca (RB)', x: 85, y: 65 },
        { id: 'CM1', label: 'Środkowy Pomocnik (CM)', x: 30, y: 45 },
        { id: 'CM2', label: 'Środkowy Pomocnik (CM)', x: 50, y: 50 },
        { id: 'CM3', label: 'Środkowy Pomocnik (CM)', x: 70, y: 45 },
        { id: 'LW', label: 'Lewy Skrzydłowy (LW)', x: 18, y: 20 },
        { id: 'ST', label: 'Napastnik (ST)', x: 50, y: 15 },
        { id: 'RW', label: 'Prawy Skrzydłowy (RW)', x: 82, y: 20 },
      ],
    },
  ],
};

export default function BoiskoScreen() {
  const { players } = usePlayers();

  const [activeTab, setActiveTab] = useState<ActiveTab>('pitch');
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('7v7');
  const [formationIndex, setFormationIndex] = useState<number>(0);
  
  const [lineup, setLineup] = useState<Record<string, Player>>({});

  // Stany modalu wyboru zawodnika do taktyki
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<PositionSlot | null>(null);

  // Stany dla Tablicy Wyników na Żywo (Match Live)
  const [opponentName, setOpponentName] = useState<string>('Przeciwnik');
  const [teamScore, setTeamScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  
  // Modal dodawania zdarzenia (bramka/kartka)
  const [eventModalVisible, setEventModalVisible] = useState<boolean>(false);
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'yellow' | 'red'>('goal');
  const [eventMinute, setEventMinute] = useState<string>('15');

  const availableFormations = FORMAT_FORMATIONS[selectedFormat];
  const currentFormation = availableFormations[formationIndex] || availableFormations[0];
  const currentSlots = currentFormation.slots;

  const handleSelectFormat = (format: GameFormat) => {
    setSelectedFormat(format);
    setFormationIndex(0);
    setLineup({});
  };

  const handleOpenSelector = (slot: PositionSlot) => {
    setActiveSlot(slot);
    setModalVisible(true);
  };

  const handleAssignPlayer = (player: Player) => {
    if (!activeSlot) return;
    setLineup((prev) => ({
      ...prev,
      [activeSlot.id]: player,
    }));
    setModalVisible(false);
    setActiveSlot(null);
  };

  const handleRemoveFromSlot = (slotId: string) => {
    setLineup((prev) => {
      const copy = { ...prev };
      delete copy[slotId];
      return copy;
    });
  };

  const handleClearLineup = () => {
    Alert.alert('Reset składu', 'Czy chcesz wyczyścić całe ustawienie na boisku?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyczyść', style: 'destructive', onPress: () => setLineup({}) },
    ]);
  };

  // Dodawanie zdarzenia meczowego
  const handleOpenEventModal = (type: 'goal' | 'yellow' | 'red') => {
    setSelectedEventType(type);
    setEventModalVisible(true);
  };

  const handleAddEventSubmit = (player: Player) => {
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      type: selectedEventType,
      player,
      minute: eventMinute || '1',
    };

    if (selectedEventType === 'goal') {
      setTeamScore((prev) => prev + 1);
    }

    setMatchEvents([newEvent, ...matchEvents]);
    setEventModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kreator Składu & Mecz ⚽</Text>
          <Text style={styles.headerSubtitle}>Format: {selectedFormat} | Ustawienie: {currentFormation.name}</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearLineup}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK (Boisko / Mecz na żywo) */}
      <View style={styles.mainTabRow}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'pitch' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('pitch')}
        >
          <Ionicons name="football-outline" size={15} color={activeTab === 'pitch' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }} />
          <Text style={[styles.mainTabText, activeTab === 'pitch' && styles.mainTabTextActive]}>Ustawienie & Boisko</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'matchLive' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('matchLive')}
        >
          <Ionicons name="stats-chart-outline" size={15} color={activeTab === 'matchLive' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }} />
          <Text style={[styles.mainTabText, activeTab === 'matchLive' && styles.mainTabTextActive]}>Tablica Wyników na Żywo 🔴</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pitch' ? (
        <>
          {/* WYBÓR FORMATU GRY */}
          <View style={styles.formatRow}>
            {(['5v5', '7v7', '9v9', '11v11'] as GameFormat[]).map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={[styles.formatChip, selectedFormat === fmt && styles.formatChipActive]}
                onPress={() => handleSelectFormat(fmt)}
              >
                <Text style={[styles.formatChipText, selectedFormat === fmt && styles.formatChipTextActive]}>
                  {fmt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* WYBÓR FORMACJI */}
          <View style={styles.formationRow}>
            {availableFormations.map((formObj, idx) => (
              <TouchableOpacity
                key={formObj.name}
                style={[styles.formationChip, formationIndex === idx && styles.formationChipActive]}
                onPress={() => setFormationIndex(idx)}
              >
                <Text style={[styles.formationChipText, formationIndex === idx && styles.formationChipTextActive]}>
                  {formObj.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* WIZUALIZACJA BOISKA */}
          <View style={styles.pitchContainer}>
            <View style={styles.pitchCenterCircle} />
            <View style={styles.pitchCenterLine} />
            <View style={styles.pitchPenaltyBoxTop} />
            <View style={styles.pitchGoalBoxTop} />

            {currentSlots.map((slot) => {
              const assignedPlayer = lineup[slot.id];

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.playerNode, { left: `${slot.x}%`, top: `${slot.y}%` }]}
                  onPress={() => handleOpenSelector(slot)}
                  onLongPress={() => assignedPlayer && handleRemoveFromSlot(slot.id)}
                >
                  <View style={[styles.nodeAvatar, assignedPlayer ? styles.nodeAssigned : styles.nodeEmpty]}>
                    {assignedPlayer ? (
                      <Text style={styles.nodeNumber}>#{assignedPlayer.number}</Text>
                    ) : (
                      <Ionicons name="add" size={16} color="#94a3b8" />
                    )}
                  </View>
                  <Text style={styles.nodeLabel} numberOfLines={1}>
                    {assignedPlayer ? `${assignedPlayer.name.split(' ')[0]}` : slot.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        /* TABLICA WYNIKÓW NA ŻYWO (MATCH LIVE) */
        <ScrollView style={styles.liveContainer} showsVerticalScrollIndicator={false}>
          {/* WYNIK MECZU */}
          <View style={styles.scoreCard}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.teamTitle}>Nasza Drużyna</Text>
              <Text style={styles.scoreText}>{teamScore}</Text>
            </View>

            <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={styles.vsText}>VS</Text>
              <TextInput
                style={styles.opponentInput}
                value={opponentName}
                onChangeText={setOpponentName}
                placeholder="Przeciwnik"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TouchableOpacity 
                  style={styles.scoreAdjBtn} 
                  onPress={() => setOpponentScore(Math.max(0, opponentScore - 1))}
                >
                  <Text style={styles.scoreAdjText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.scoreText, { marginHorizontal: 12, fontSize: 24 }]}>{opponentScore}</Text>
                <TouchableOpacity 
                  style={styles.scoreAdjBtn} 
                  onPress={() => setOpponentScore(opponentScore + 1)}
                >
                  <Text style={styles.scoreAdjText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SZYBKIE AKCJE / ZDARZENIA */}
          <Text style={styles.sectionHeader}>Dodaj zdarzenie w meczu:</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => handleOpenEventModal('goal')}>
              <Ionicons name="football" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.actionBtnText}>+ Bramka</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ca8a04' }]} onPress={() => handleOpenEventModal('yellow')}>
              <Text style={styles.cardYellow}>🟨</Text>
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Żółta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => handleOpenEventModal('red')}>
              <Text style={styles.cardRed}>🟥</Text>
              <Text style={styles.actionBtnText}>Czerwona</Text>
            </TouchableOpacity>
          </View>

          {/* LINIA CZASU ZDARZEŃ */}
          <Text style={styles.sectionHeader}>Przebieg spotkania (Protokół):</Text>
          {matchEvents.length > 0 ? (
            matchEvents.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventMinute}>{ev.minute}'</Text>
                <Text style={styles.eventIcon}>
                  {ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥'}
                </Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.eventPlayerName}>
                    #{ev.player.number} {ev.player.name}
                  </Text>
                  <Text style={styles.eventDesc}>
                    {ev.type === 'goal' ? 'Strzelona bramka' : ev.type === 'yellow' ? 'Żółta kartka' : 'Czerwona kartka'}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    if (ev.type === 'goal') setTeamScore(Math.max(0, teamScore - 1));
                    setMatchEvents(matchEvents.filter((item) => item.id !== ev.id));
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noEventsText}>Brak zarejestrowanych zdarzeń w tym meczu.</Text>
          )}
        </ScrollView>
      )}

      {/* MODAL WYBORU ZAWODNIKA DO TAKTYKI */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz zawodnika dla: {activeSlot?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
              {players.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerSelectRow}
                  onPress={() => handleAssignPlayer(player)}
                >
                  <View style={styles.selectAvatar}>
                    <Text style={styles.selectAvatarText}>#{player.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.selectPlayerName}>{player.name}</Text>
                    <Text style={styles.selectPlayerMeta}>Pozycja: {player.position} | Rocznik {player.year}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL WYBORU ZAWODNIKA DO ZDARZENIA (BRAMKA/KARTKA) */}
      <Modal animationType="slide" transparent={true} visible={eventModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEventType === 'goal' ? '⚽ Kto strzelił bramkę?' : selectedEventType === 'yellow' ? '🟨 Żółta kartka dla:' : '🟥 Czerwona kartka dla:'}
              </Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155', marginRight: 8 }}>Minuta meczu:</Text>
              <TextInput
                style={styles.minuteInput}
                value={eventMinute}
                onChangeText={setEventMinute}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <Text style={styles.modalHint}>Wybierz z zawodników wystawionych w wyjściowym składzie lub z całej kadry:</Text>

            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
              {players.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerSelectRow}
                  onPress={() => handleAddEventSubmit(player)}
                >
                  <View style={styles.selectAvatar}>
                    <Text style={styles.selectAvatarText}>#{player.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.selectPlayerName}>{player.name}</Text>
                    <Text style={styles.selectPlayerMeta}>Rocznik {player.year}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2563eb' }}>Wybierz</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  clearBtn: { padding: 8, backgroundColor: '#ffeeef', borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },

  mainTabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  mainTabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  mainTabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  mainTabTextActive: { color: '#2563eb', fontWeight: 'bold' },

  formatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 4,
  },
  formatChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  formatChipActive: { backgroundColor: '#0284c7' },
  formatChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  formatChipTextActive: { color: '#fff' },

  formationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formationChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  formationChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  formationChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  formationChipTextActive: { color: '#fff', fontWeight: 'bold' },

  /* BOISKO */
  pitchContainer: {
    flex: 1,
    backgroundColor: '#15803d',
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  pitchCenterCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -45 }, { translateY: -45 }],
  },
  pitchCenterLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: '50%',
    left: 0,
    right: 0,
  },
  pitchPenaltyBoxTop: {
    position: 'absolute',
    width: 160,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: 0,
    left: '50%',
    transform: [{ translateX: -80 }],
  },
  pitchGoalBoxTop: {
    position: 'absolute',
    width: 70,
    height: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: 0,
    left: '50%',
    transform: [{ translateX: -35 }],
  },

  playerNode: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
  },
  nodeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  nodeEmpty: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  nodeAssigned: { backgroundColor: '#fef08a', borderColor: '#eab308' },
  nodeNumber: { fontSize: 12, fontWeight: 'bold', color: '#854d0e' },
  nodeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  /* LIVE MATCH STYLES */
  liveContainer: { flex: 1, padding: 16 },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  teamTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  scoreText: { fontSize: 36, fontWeight: 'bold', color: '#0f172a' },
  vsText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  opponentInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    paddingVertical: 2,
    width: 90,
  },
  scoreAdjBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  scoreAdjText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },

  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardYellow: { fontSize: 12, marginRight: 4 },
  cardRed: { fontSize: 12, marginRight: 4 },

  eventRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventMinute: { fontSize: 12, fontWeight: 'bold', color: '#64748b', width: 28 },
  eventIcon: { fontSize: 16, marginRight: 6 },
  eventPlayerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  eventDesc: { fontSize: 10, color: '#64748b' },
  noEventsText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },

  /* MODALS */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  modalHint: { fontSize: 11, color: '#64748b', marginBottom: 10 },
  minuteInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },
  playerList: { maxHeight: 320 },
  playerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectAvatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  selectPlayerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  selectPlayerMeta: { fontSize: 10, color: '#64748b' },
});