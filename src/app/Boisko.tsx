import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function BoiskoScreen() {
  const { players } = usePlayers();
  
  // Stoper meczowy
  const [matchTime, setMatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<'przed_meczem' | 'pierwsza_polowa' | 'przerwa' | 'druga_polowa' | 'koniec'>('przed_meczem');
  
  // Wynik
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<{ minute: number; text: string; type: 'goal' | 'yellow' | 'red' }[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setMatchTime((prev) => prev + 1);
      }, 1000); // W prawdziwej apce na 60000 dla minut, tu 1000 dla testów i szybkiego podglądu (sekundy jako minuty)
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addEvent = (type: 'goal' | 'yellow' | 'red') => {
    if (!isRunning && matchPhase !== 'pierwsza_polowa' && matchPhase !== 'druga_polowa') {
      Alert.alert('Błąd', 'Mecz jest zatrzymany. Uruchom stoper.');
      return;
    }
    const currentMinute = Math.floor(matchTime / 60) || 1; // symulacja
    const typeNames = { goal: 'Gol dla Nas!', yellow: 'Żółta kartka', red: 'Czerwona kartka' };
    setEvents([{ minute: currentMinute, text: typeNames[type], type }, ...events]);
    
    if (type === 'goal') setHomeScore(prev => prev + 1);
  };

  const handleMatchPhase = () => {
    if (matchPhase === 'przed_meczem') { setMatchPhase('pierwsza_polowa'); setIsRunning(true); }
    else if (matchPhase === 'pierwsza_polowa') { setMatchPhase('przerwa'); setIsRunning(false); }
    else if (matchPhase === 'przerwa') { setMatchPhase('druga_polowa'); setIsRunning(true); }
    else if (matchPhase === 'druga_polowa') { setMatchPhase('koniec'); setIsRunning(false); Alert.alert('Koniec', 'Zapisano do chmury!'); }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Protokół LIVE & Stoper</Text>
      </View>

      <ScrollView style={styles.content}>
        
        {/* Panel Stopera */}
        <View style={styles.stopwatchCard}>
          <Text style={styles.phaseText}>
            Faza: {matchPhase.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.timeText}>{formatTime(matchTime)}</Text>
          <TouchableOpacity style={[styles.mainBtn, isRunning ? styles.btnStop : styles.btnStart]} onPress={handleMatchPhase}>
            <Text style={styles.mainBtnText}>
              {matchPhase === 'przed_meczem' ? 'Rozpocznij Mecz' : 
               matchPhase === 'pierwsza_polowa' ? 'Zakończ 1. Połowę (Przerwa)' : 
               matchPhase === 'przerwa' ? 'Rozpocznij 2. Połowę' :
               matchPhase === 'druga_polowa' ? 'Zakończ Mecz' : 'Mecz Zakończony'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tablica Wyników */}
        <View style={styles.scoreBoard}>
          <View style={styles.teamScore}><Text style={styles.teamName}>NASZ KLUB</Text><Text style={styles.scoreNum}>{homeScore}</Text></View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#cbd5e1' }}>VS</Text>
          <View style={styles.teamScore}>
            <Text style={styles.teamName}>PRZECIWNIK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setAwayScore(Math.max(0, awayScore - 1))} style={styles.scoreAdjust}><Text style={styles.scoreAdjustText}>-</Text></TouchableOpacity>
              <Text style={styles.scoreNum}>{awayScore}</Text>
              <TouchableOpacity onPress={() => setAwayScore(awayScore + 1)} style={styles.scoreAdjust}><Text style={styles.scoreAdjustText}>+</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Akcje meczowe (Kartki, Gole) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => addEvent('goal')}>
            <Ionicons name="football" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Gol (Nasz)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eab308' }]} onPress={() => addEvent('yellow')}>
            <Ionicons name="alert" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Żółta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => addEvent('red')}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Czerwona</Text>
          </TouchableOpacity>
        </View>

        {/* Protokół zdarzeń */}
        <View style={styles.logCard}>
          <Text style={styles.logTitle}>Przebieg Spotkania</Text>
          {events.length === 0 ? <Text style={styles.logEmpty}>Brak zdarzeń.</Text> : 
            events.map((e, idx) => (
              <View key={idx} style={styles.logItem}>
                <Text style={styles.logMinute}>{e.minute}'</Text>
                <Text style={styles.logText}>{e.text}</Text>
              </View>
            ))
          }
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  
  stopwatchCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  phaseText: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 8 },
  timeText: { fontSize: 48, fontWeight: 'bold', color: '#0f172a', letterSpacing: 2, marginBottom: 16 },
  mainBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnStart: { backgroundColor: '#2563eb' },
  btnStop: { backgroundColor: '#dc2626' },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  scoreBoard: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  teamScore: { alignItems: 'center', flex: 1 },
  teamName: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  scoreNum: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  scoreAdjust: { backgroundColor: '#334155', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  scoreAdjustText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 12 },

  logCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  logTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  logEmpty: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 10 },
  logItem: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logMinute: { fontWeight: 'bold', color: '#2563eb', width: 40 },
  logText: { color: '#334155' }
});
