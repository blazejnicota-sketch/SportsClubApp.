import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from './PlayersContext';

type SessionType = '1on1' | 'group';

export default function TreningiIndywidualnePanel() {
  const { players } = usePlayers();
  
  const [activeTab, setActiveTab] = useState<SessionType>('1on1');
  
  const [playerName, setPlayerName] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [coachNotes, setCoachNotes] = useState(''); // <--- NOWOŚĆ Z WIDEO

  const [sessions, setSessions] = useState([
    { id: '1', name: 'Kuba Nowak (Spoza listy)', time: 'Środa, 05.11.2026 • 16:00 - 17:00', goal: 'Gra 1v1 i strzały z dystansu', notes: 'Widoczna poprawa dynamiki, do dopracowania uderzenie z lewej nogi.', status: 'Zaplanowany' },
    { id: '2', name: 'Michał Wiśniewski', time: 'Środa, 05.11.2026 • 17:15 - 18:15', goal: 'Koordynacja i przyjęcie kierunkowe', notes: 'Bardzo dobre skupienie na treningu.', status: 'Zakończony' }
  ]);

  const handleAddSession = () => {
    if (!playerName || !sessionTime || !sessionGoal) {
      Alert.alert('Brak danych', 'Wypełnij imię, godzinę oraz cel treningowy.');
      return;
    }
    const newSession = {
      id: Date.now().toString(),
      name: playerName,
      time: sessionTime,
      goal: sessionGoal,
      notes: coachNotes || 'Brak notatek wstępnych.',
      status: 'Zaplanowany'
    };
    setSessions([newSession, ...sessions]);
    setPlayerName('');
    setSessionTime('');
    setSessionGoal('');
    setCoachNotes('');
    Alert.alert('Sukces', 'Trening indywidualny dodany do harmonogramu.');
  };

  const markAsCompleted = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'Zakończony' } : s));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Treningi Indywidualne i 1-on-1 ⚽</Text>
        <Text style={styles.subtitle}>Zarządzaj sesjami technicznymi niezależnie od drużyny</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === '1on1' && styles.tabActive]} onPress={() => setActiveTab('1on1')}>
          <Text style={[styles.tabText, activeTab === '1on1' && styles.tabTextActive]}>Sesje 1-on-1 (Prywatne)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'group' && styles.tabActive]} onPress={() => setActiveTab('group')}>
          <Text style={[styles.tabText, activeTab === 'group' && styles.tabTextActive]}>Małe Grupy (2-4 osoby)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Zaplanuj nowy trening {activeTab === '1on1' ? 'indywidualny' : 'grupowy'}</Text>
        
        <TextInput style={styles.input} placeholder="Imię i nazwisko zawodnika" value={playerName} onChangeText={setPlayerName} />
        <TextInput style={styles.input} placeholder="Godzina (np. 15:30 - 16:30)" value={sessionTime} onChangeText={setSessionTime} />
        <TextInput style={styles.input} placeholder="Cel treningowy / Główny element" value={sessionGoal} onChangeText={setSessionGoal} />
        
        {/* NOWE POLE Z WIDEO */}
        <TextInput 
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
          placeholder="Notatki Trenera (np. nad czym się skupić, wnioski)" 
          multiline 
          value={coachNotes} 
          onChangeText={setCoachNotes} 
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddSession}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>Dodaj do harmonogramu trenera</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Zaplanowane sesje indywidualne:</Text>

      {sessions.map(s => (
        <View key={s.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionName}>{s.name}</Text>
            <View style={[styles.statusBadge, s.status === 'Zakończony' && { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.statusText, s.status === 'Zakończony' && { color: '#16a34a' }]}>{s.status}</Text>
            </View>
          </View>
          
          <Text style={styles.sessionTime}>🕒 {s.time}</Text>
          <Text style={styles.sessionGoal}>🎯 Cel: {s.goal}</Text>
          
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notatka trenera:</Text>
            <Text style={styles.notesText}>{s.notes}</Text>
          </View>

          {s.status === 'Zaplanowany' && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => markAsCompleted(s.id)}>
              <Text style={styles.completeBtnText}>Oznacz jako zrealizowany</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  headerBox: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 4, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  formTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 10 },
  submitBtn: { backgroundColor: '#16a34a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 8, marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  sessionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sessionName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  sessionTime: { fontSize: 12, color: '#475569', marginBottom: 4 },
  sessionGoal: { fontSize: 12, color: '#0f172a', fontWeight: '600', marginBottom: 10 },
  notesBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  notesLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  notesText: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
  completeBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
