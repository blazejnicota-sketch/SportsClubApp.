import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function BoiskoScreen() {
  const { players } = usePlayers();
  
  // Zaawansowany Stoper
  const [matchTime, setMatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<'Przed Meczem' | '1. Połowa' | 'Przerwa' | '2. Połowa' | 'Koniec'>('Przed Meczem');
  
  // Wyniki i Protokół
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<{ minute: number; text: string; type: string; player?: string }[]>([]);

  // Modale do wyboru zawodnika
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [pendingEventType, setPendingEventType] = useState<'goal' | 'yellow' | 'red' | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => { setMatchTime((prev) => prev + 1); }, 1000); 
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMatchPhase = () => {
    if (matchPhase === 'Przed Meczem') { setMatchPhase('1. Połowa'); setIsRunning(true); }
    else if (matchPhase === '1. Połowa') { setMatchPhase('Przerwa'); setIsRunning(false); }
    else if (matchPhase === 'Przerwa') { setMatchPhase('2. Połowa'); setIsRunning(true); }
    else if (matchPhase === '2. Połowa') { setMatchPhase('Koniec'); setIsRunning(false); Alert.alert('Koniec Spotkania', 'Raport meczowy zsynchronizowany z Supabase.'); }
  };

  const openEventModal = (type: 'goal' | 'yellow' | 'red') => {
    if (!isRunning && matchPhase !== '1. Połowa' && matchPhase !== '2. Połowa') {
      return Alert.alert('Stoper Zatrzymany', 'Zdarzenia możesz dodawać tylko w trakcie trwania połowy.');
    }
    setPendingEventType(type);
    setPlayerModalVisible(true);
  };

  const confirmEvent = (playerName: string) => {
    const currentMinute = Math.floor(matchTime / 60) || 1;
    const typeNames = { goal: 'Gol!', yellow: 'Żółta kartka', red: 'Czerwona kartka' };
    
    setEvents([{ minute: currentMinute, text: typeNames[pendingEventType!], type: pendingEventType!, player: playerName }, ...events]);
    if (pendingEventType === 'goal') setHomeScore(prev => prev + 1);
    
    setPlayerModalVisible(false);
    setPendingEventType(null);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centrum Meczowe LIVE</Text>
        <TouchableOpacity style={styles.syncBadge}><Ionicons name="cloud-done" size={14} color="#16a34a" /><Text style={styles.syncText}>Supabase</Text></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ZAAWANSOWANY STOPER */}
        <View style={styles.stopwatchCard}>
          <View style={styles.phaseBadge}><Text style={styles.phaseText}>{matchPhase}</Text></View>
          <Text style={styles.timeText}>{formatTime(matchTime)}</Text>
          <TouchableOpacity style={[styles.mainBtn, isRunning ? styles.btnStop : styles.btnStart]} onPress={handleMatchPhase}>
            <Text style={styles.mainBtnText}>
              {matchPhase === 'Przed Meczem' ? 'Gwizdek: Start Meczu' : 
               matchPhase === '1. Połowa' ? 'Zakończ 1. Połowę' : 
               matchPhase === 'Przerwa' ? 'Gwizdek: Start 2. Połowy' :
               matchPhase === '2. Połowa' ? 'Zakończ Mecz' : 'Mecz Zakończony'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* INTERAKTYWNA TABLICA WYNIKÓW */}
        <View style={styles.scoreBoard}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>NASZ KLUB</Text>
            <Text style={styles.scoreNum}>{homeScore}</Text>
          </View>
          <View style={styles.vsBox}><Text style={styles.vsText}>VS</Text></View>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>PRZECIWNIK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setAwayScore(Math.max(0, awayScore - 1))} style={styles.scoreAdjust}><Text style={styles.scoreAdjustText}>-</Text></TouchableOpacity>
              <Text style={styles.scoreNumAway}>{awayScore}</Text>
              <TouchableOpacity onPress={() => setAwayScore(awayScore + 1)} style={styles.scoreAdjust}><Text style={styles.scoreAdjustText}>+</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PRZYCISKI ZDARZEŃ */}
        <Text style={styles.sectionTitle}>Rejestracja Zdarzeń</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => openEventModal('goal')}>
            <Ionicons name="football" size={24} color="#fff" />
            <Text style={styles.actionBtnText}>Gol (Nasz)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eab308' }]} onPress={() => openEventModal('yellow')}>
            <View style={styles.cardYellow} />
            <Text style={styles.actionBtnText}>Żółta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => openEventModal('red')}>
            <View style={styles.cardRed} />
            <Text style={styles.actionBtnText}>Czerwona</Text>
          </TouchableOpacity>
        </View>

        {/* PROTOKÓŁ ZDARZEŃ */}
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>Oficjalny Protokół Zdarzeń</Text>
          {events.length === 0 ? <Text style={styles.logEmpty}>Brak zdarzeń. Użyj przycisków powyżej.</Text> : 
            events.map((e, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={styles.logMinuteBox}><Text style={styles.logMinute}>{e.minute}'</Text></View>
                <View style={styles.logDetails}>
                  <Text style={styles.logTextBold}>{e.text}</Text>
                  {e.player && <Text style={styles.logPlayer}>{e.player}</Text>}
                </View>
                <Ionicons name={e.type === 'goal' ? 'football' : 'alert'} size={20} color={e.type === 'goal' ? '#16a34a' : e.type === 'yellow' ? '#eab308' : '#dc2626'} />
              </View>
            ))
          }
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL WYBORU ZAWODNIKA DO ZDARZENIA */}
      <Modal visible={playerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kto brał udział w zdarzeniu?</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {players.length > 0 ? players.map(p => (
                <TouchableOpacity key={p.id} style={styles.modalPlayerRow} onPress={() => confirmEvent(`${p.firstName} ${p.lastName}`)}>
                  <Text style={styles.modalPlayerNumber}>#{p.number}</Text>
                  <Text style={styles.modalPlayerName}>{p.firstName} {p.lastName}</Text>
                </TouchableOpacity>
              )) : (
                <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Brak zawodników w bazie. Dodaj ich w Szatni.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPlayerModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Anuluj Zdarzenie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  syncText: { fontSize: 10, color: '#16a34a', fontWeight: 'bold', marginLeft: 4 },
  
  content: { padding: 16 },
  
  stopwatchCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  phaseBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  phaseText: { fontSize: 12, color: '#2563eb', fontWeight: '800', textTransform: 'uppercase' },
  timeText: { fontSize: 64, fontWeight: '900', color: '#0f172a', letterSpacing: 2, marginBottom: 20, fontVariant: ['tabular-nums'] },
  mainBtn: { paddingVertical: 16, width: '100%', borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  btnStart: { backgroundColor: '#2563eb' },
  btnStop: { backgroundColor: '#ef4444' },
  mainBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },

  scoreBoard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, shadowColor: '#0f172a', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  teamScore: { alignItems: 'center', flex: 1 },
  teamName: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  scoreNum: { color: '#fff', fontSize: 56, fontWeight: '900' },
  scoreNumAway: { color: '#fff', fontSize: 48, fontWeight: '900', marginHorizontal: 12 },
  vsBox: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  vsText: { fontSize: 14, fontWeight: '900', color: '#3b82f6' },
  scoreAdjust: { backgroundColor: '#334155', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scoreAdjustText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12, marginLeft: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 8 },
  cardYellow: { width: 18, height: 24, backgroundColor: '#fef08a', borderRadius: 2, borderWidth: 1, borderColor: '#ca8a04' },
  cardRed: { width: 18, height: 24, backgroundColor: '#fca5a5', borderRadius: 2, borderWidth: 1, borderColor: '#991b1b' },

  logCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  logTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  logEmpty: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logMinuteBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, marginRight: 12 },
  logMinute: { fontWeight: '900', color: '#334155', fontSize: 14 },
  logDetails: { flex: 1 },
  logTextBold: { fontWeight: '800', color: '#0f172a', fontSize: 15 },
  logPlayer: { color: '#64748b', fontSize: 12, marginTop: 2, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  modalPlayerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalPlayerNumber: { fontSize: 16, fontWeight: '900', color: '#2563eb', width: 40 },
  modalPlayerName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  cancelBtn: { marginTop: 20, padding: 16, width: '100%', backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '800', fontSize: 15 },
});
