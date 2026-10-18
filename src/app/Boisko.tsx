import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamStore, Player } from './store/useTeamStore';

interface MatchEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  playerId: string;
  playerName: string;
  secondaryPlayerId?: string;
  secondaryPlayerName?: string;
  notes?: string;
}

export default function BoiskoScreen() {
  const players: Player[] = useTeamStore((state: any) => state.players);

  // --- STOPER MECZOWY ---
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [half, setHalf] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    setHalf(1);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentMinute = Math.max(1, Math.ceil(seconds / 60));

  // --- WYNIK MECZU ---
  const [ourScore, setOurScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [opponentName, setOpponentName] = useState<string>('Rywal');

  // --- SKŁAD I ZMIANY ---
  // Domyślnie pierwsi zawodnicy na boisku, reszta na ławce
  const [onPitchIds, setOnPitchIds] = useState<string[]>(
    players.slice(0, 7).map((p) => p.id)
  );
  const [benchIds, setBenchIds] = useState<string[]>(
    players.slice(7).map((p) => p.id)
  );

  // --- LOG ZDARZEŃ ---
  const [events, setEvents] = useState<MatchEvent[]>([]);

  // --- MODALE MODUŁÓW AKCJI ---
  const [modalType, setModalType] = useState<'GOAL' | 'CARD' | 'SUB' | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedAssistId, setSelectedAssistId] = useState<string>('');
  const [cardType, setCardType] = useState<'YELLOW' | 'RED'>('YELLOW');
  const [subOutId, setSubOutId] = useState<string>('');
  const [subInId, setSubInId] = useState<string>('');

  // Szybkie dodanie gola przeciwko nam
  const handleOpponentGoal = () => {
    setOpponentScore((prev) => prev + 1);
    setEvents((prev) => [
      {
        id: Date.now().toString(),
        minute: currentMinute,
        type: 'GOAL',
        playerId: 'opponent',
        playerName: opponentName,
        notes: 'Gol dla przeciwnika',
      },
      ...prev,
    ]);
  };

  // Zapisywanie zdarzenia Gol
  const handleSaveGoal = () => {
    if (!selectedPlayerId) return;
    const scorer = players.find((p) => p.id === selectedPlayerId);
    const assistant = players.find((p) => p.id === selectedAssistId);

    setOurScore((prev) => prev + 1);
    setEvents((prev) => [
      {
        id: Date.now().toString(),
        minute: currentMinute,
        type: 'GOAL',
        playerId: selectedPlayerId,
        playerName: scorer?.name || 'Zawodnik',
        secondaryPlayerId: selectedAssistId || undefined,
        secondaryPlayerName: assistant?.name,
      },
      ...prev,
    ]);

    setModalType(null);
    setSelectedPlayerId('');
    setSelectedAssistId('');
  };

  // Zapisywanie kartki
  const handleSaveCard = () => {
    if (!selectedPlayerId) return;
    const player = players.find((p) => p.id === selectedPlayerId);

    setEvents((prev) => [
      {
        id: Date.now().toString(),
        minute: currentMinute,
        type: cardType === 'YELLOW' ? 'YELLOW_CARD' : 'RED_CARD',
        playerId: selectedPlayerId,
        playerName: player?.name || 'Zawodnik',
      },
      ...prev,
    ]);

    setModalType(null);
    setSelectedPlayerId('');
  };

  // Zapisywanie zmiany
  const handleSaveSub = () => {
    if (!subOutId || !subInId) return;
    const playerOut = players.find((p) => p.id === subOutId);
    const playerIn = players.find((p) => p.id === subInId);

    // Zamiana miejscami w składzie
    setOnPitchIds((prev) => prev.filter((id) => id !== subOutId).concat(subInId));
    setBenchIds((prev) => prev.filter((id) => id !== subInId).concat(subOutId));

    setEvents((prev) => [
      {
        id: Date.now().toString(),
        minute: currentMinute,
        type: 'SUBSTITUTION',
        playerId: subInId,
        playerName: playerIn?.name || 'Zawodnik Wchodzący',
        secondaryPlayerId: subOutId,
        secondaryPlayerName: playerOut?.name || 'Zawodnik Schodzący',
      },
      ...prev,
    ]);

    setModalType(null);
    setSubOutId('');
    setSubInId('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* NAGŁÓWEK Z TABLICĄ WYNIKÓW I STOPEREM */}
      <View style={styles.scoreboardCard}>
        <View style={styles.teamsRow}>
          <View style={styles.teamBox}>
            <Text style={styles.teamName}>NASZ KLUB</Text>
            <Text style={styles.scoreText}>{ourScore}</Text>
          </View>
          <View style={styles.timerCenterBox}>
            <Text style={styles.halfText}>{half}. POŁOWA</Text>
            <Text style={styles.timerText}>{formatTime(seconds)}</Text>
            <View style={styles.timerControls}>
              <TouchableOpacity style={styles.timerBtn} onPress={toggleTimer}>
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={18}
                  color="#ffffff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerBtn, styles.resetBtn]}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.teamBox}>
            <Text style={styles.teamName}>{opponentName}</Text>
            <Text style={styles.scoreText}>{opponentScore}</Text>
          </View>
        </View>

        {/* PRZYCISKI SZYBKICH AKCJI */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => setModalType('GOAL')}
          >
            <Ionicons name="football" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>GOL NASZ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
            onPress={handleOpponentGoal}
          >
            <Ionicons name="remove-circle" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>GOL RYWALA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#eab308' }]}
            onPress={() => setModalType('CARD')}
          >
            <Ionicons name="square" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>KARTKA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}
            onPress={() => setModalType('SUB')}
          >
            <Ionicons name="swap-horizontal" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>ZMIANA</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* BOISKO I SKŁAD NA ŻYWO */}
        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={20} color="#0f172a" />
          <Text style={styles.sectionTitle}>Na boisku ({onPitchIds.length})</Text>
        </View>

        <View style={styles.pitchCard}>
          <View style={styles.pitchGrid}>
            {onPitchIds.map((id) => {
              const player = players.find((p) => p.id === id);
              return (
                <View key={id} style={styles.playerOnPitch}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>
                      {player?.number || '#'}
                    </Text>
                  </View>
                  <Text style={styles.playerNameOnPitch} numberOfLines={1}>
                    {player?.name || 'Zawodnik'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ŁAWKA REZERWOWYCH */}
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color="#0f172a" />
          <Text style={styles.sectionTitle}>Ławka rezerwowych ({benchIds.length})</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.benchScroll}>
          {benchIds.map((id) => {
            const player = players.find((p) => p.id === id);
            return (
              <View key={id} style={styles.benchPlayerChip}>
                <Text style={styles.benchPlayerText}>
                  {player?.number ? `#${player.number} ` : ''}
                  {player?.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* DZIENNIK ZDARZEŃ MECZOWYCH */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color="#0f172a" />
          <Text style={styles.sectionTitle}>Dziennik zdarzeń ({events.length})</Text>
        </View>

        <View style={styles.eventsCard}>
          {events.length === 0 ? (
            <Text style={styles.emptyEventsText}>Brak zarejestrowanych zdarzeń meczowych.</Text>
          ) : (
            events.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventMinute}>{e.minute}'</Text>
                <View style={styles.eventDetails}>
                  {e.type === 'GOAL' && (
                    <Text style={styles.eventText}>
                      ⚽ <Text style={styles.boldText}>{e.playerName}</Text>
                      {e.secondaryPlayerName ? ` (Asysta: ${e.secondaryPlayerName})` : ''}
                    </Text>
                  )}
                  {e.type === 'YELLOW_CARD' && (
                    <Text style={styles.eventText}>
                      🟨 Żółta kartka: <Text style={styles.boldText}>{e.playerName}</Text>
                    </Text>
                  )}
                  {e.type === 'RED_CARD' && (
                    <Text style={styles.eventText}>
                      🟥 Czerwona kartka: <Text style={styles.boldText}>{e.playerName}</Text>
                    </Text>
                  )}
                  {e.type === 'SUBSTITUTION' && (
                    <Text style={styles.eventText}>
                      🔄 Zmiana: <Text style={styles.boldText}>{e.playerName}</Text> (WEJŚCIE) 
                      {' <- '} <Text style={styles.subOutText}>{e.secondaryPlayerName}</Text> (ZEJŚCIE)
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL GOL */}
      <Modal visible={modalType === 'GOAL'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚽ Rejestracja Gola</Text>

            <Text style={styles.inputLabel}>Strzelec gola:</Text>
            <ScrollView style={styles.modalPlayerList}>
              {onPitchIds.map((id) => {
                const player = players.find((p) => p.id === id);
                const isSelected = selectedPlayerId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.modalPlayerOption, isSelected && styles.modalPlayerOptionActive]}
                    onPress={() => setSelectedPlayerId(id)}
                  >
                    <Text style={[styles.modalPlayerOptionText, isSelected && styles.modalPlayerOptionTextActive]}>
                      {player?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Asysta (opcjonalnie):</Text>
            <ScrollView style={styles.modalPlayerList}>
              {onPitchIds.map((id) => {
                if (id === selectedPlayerId) return null;
                const player = players.find((p) => p.id === id);
                const isSelected = selectedAssistId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.modalPlayerOption, isSelected && styles.modalPlayerOptionActive]}
                    onPress={() => setSelectedAssistId(id)}
                  >
                    <Text style={[styles.modalPlayerOptionText, isSelected && styles.modalPlayerOptionTextActive]}>
                      {player?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoal}>
                <Text style={styles.saveBtnText}>Zapisz Gol</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL KARTKA */}
      <Modal visible={modalType === 'CARD'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🟨 / 🟥 Rejestracja Kartki</Text>

            <View style={styles.cardTypeToggle}>
              <TouchableOpacity
                style={[styles.cardTypeBtn, cardType === 'YELLOW' && { backgroundColor: '#eab308' }]}
                onPress={() => setCardType('YELLOW')}
              >
                <Text style={styles.cardTypeBtnText}>Żółta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardTypeBtn, cardType === 'RED' && { backgroundColor: '#dc2626' }]}
                onPress={() => setCardType('RED')}
              >
                <Text style={styles.cardTypeBtnText}>Czerwona</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Ukarany zawodnik:</Text>
            <ScrollView style={styles.modalPlayerList}>
              {onPitchIds.map((id) => {
                const player = players.find((p) => p.id === id);
                const isSelected = selectedPlayerId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.modalPlayerOption, isSelected && styles.modalPlayerOptionActive]}
                    onPress={() => setSelectedPlayerId(id)}
                  >
                    <Text style={[styles.modalPlayerOptionText, isSelected && styles.modalPlayerOptionTextActive]}>
                      {player?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCard}>
                <Text style={styles.saveBtnText}>Zapisz Kartkę</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ZMIANA */}
      <Modal visible={modalType === 'SUB'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔄 Zmiana Zawodnika</Text>

            <Text style={styles.inputLabel}>Schodzi z boiska:</Text>
            <ScrollView style={styles.modalPlayerList}>
              {onPitchIds.map((id) => {
                const player = players.find((p) => p.id === id);
                const isSelected = subOutId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.modalPlayerOption, isSelected && styles.modalPlayerOptionActive]}
                    onPress={() => setSubOutId(id)}
                  >
                    <Text style={[styles.modalPlayerOptionText, isSelected && styles.modalPlayerOptionTextActive]}>
                      ⬇️ {player?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Wchodzi z ławki:</Text>
            <ScrollView style={styles.modalPlayerList}>
              {benchIds.map((id) => {
                const player = players.find((p) => p.id === id);
                const isSelected = subInId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.modalPlayerOption, isSelected && styles.modalPlayerOptionActive]}
                    onPress={() => setSubInId(id)}
                  >
                    <Text style={[styles.modalPlayerOptionText, isSelected && styles.modalPlayerOptionTextActive]}>
                      ⬆️ {player?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSub}>
                <Text style={styles.saveBtnText}>Wykonaj Zmianę</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scoreboardCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  teamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamBox: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  timerCenterBox: {
    alignItems: 'center',
    flex: 1.2,
  },
  halfText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginVertical: 2,
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 4,
  },
  timerBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  resetBtn: {
    backgroundColor: '#475569',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 8,
  },
  pitchCard: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pitchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  playerOnPitch: {
    alignItems: 'center',
    width: '30%',
    marginVertical: 8,
  },
  numberBadge: {
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  numberBadgeText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerNameOnPitch: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  benchScroll: {
    marginBottom: 8,
  },
  benchPlayerChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  benchPlayerText: {
    fontSize: 13,
    color: '#334155',
  },
  eventsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyEventsText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventMinute: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    width: 35,
  },
  eventDetails: {
    flex: 1,
  },
  eventText: {
    fontSize: 13,
    color: '#1e293b',
  },
  boldText: {
    fontWeight: 'bold',
  },
  subOutText: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  modalPlayerList: {
    maxHeight: 100,
    marginBottom: 8,
  },
  modalPlayerOption: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalPlayerOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  modalPlayerOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  modalPlayerOptionTextActive: {
    color: '#1d4ed8',
    fontWeight: 'bold',
  },
  cardTypeToggle: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#94a3b8',
  },
  cardTypeBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});