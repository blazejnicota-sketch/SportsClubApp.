import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IndividualSession {
  id: string;
  playerName: string;
  time: string;
  date: string;
  focusArea: string;
  notes: string;
  status: 'Zaplanowany' | 'Zakończony';
}

const INITIAL_SESSIONS: IndividualSession[] = [
  {
    id: '1',
    playerName: 'Kuba Nowak (Spoza listy)',
    time: '16:00 - 17:00',
    date: 'Środa, 05.11.2026',
    focusArea: 'Gra 1v1 i strzały z dystansu',
    notes: 'Widoczna poprawa dynamiki, do dopracowania uderzenie z lewej nogi.',
    status: 'Zaplanowany',
  },
  {
    id: '2',
    playerName: 'Michał Wiśniewski',
    time: '17:15 - 18:15',
    date: 'Środa, 05.11.2026',
    focusArea: 'Koordynacja i przyjęcie kierunkowe',
    notes: 'Bardzo dobre skupienie.',
    status: 'Zaplanowany',
  },
];

export default function TreningiIndywidualnePanel() {
  const [sessions, setSessions] = useState<IndividualSession[]>(INITIAL_SESSIONS);
  const [activeTab, setActiveTab] = useState<'1on1' | 'groups'>('1on1');

  // Stan nowego treningu indywidualnego
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  const handleAddSession = () => {
    if (!playerNameInput.trim() || !timeInput.trim()) {
      Alert.alert('Błąd', 'Podaj imię zawodnika oraz godzinę treningu.');
      return;
    }

    const newSession: IndividualSession = {
      id: Date.now().toString(),
      playerName: playerNameInput.trim(),
      time: timeInput.trim(),
      date: 'Dzisiaj',
      focusArea: focusInput.trim() || 'Trening techniczny ogólny',
      notes: 'Brak notatek po treningu.',
      status: 'Zaplanowany',
    };

    setSessions([newSession, ...sessions]);
    setPlayerNameInput('');
    setFocusInput('');
    setTimeInput('');
    Alert.alert('Sukces! ⚽', 'Dodano nowy trening indywidualny do harmonogramu.');
  };

  const handleCompleteSession = (id: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'Zakończony' } : s))
    );
    Alert.alert('Zakończono sesję', 'Trening oznaczony jako zrealizowany.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* NAGŁÓWEK */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Treningi Indywidualne i 1-on-1 👤⚽</Text>
          <Text style={styles.headerSubtitle}>Zarządzaj sesjami technicznymi niezależnie od drużyn</Text>
        </View>

        {/* PRZEŁĄCZNIK TRYBÓW */}
        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            style={[styles.modeBtn, activeTab === '1on1' && styles.modeBtnActive]}
            onPress={() => setActiveTab('1on1')}
          >
            <Text style={[styles.modeBtnText, activeTab === '1on1' && styles.modeBtnTextActive]}>
              Sesje 1-on-1 (Prywatne)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeTab === 'groups' && styles.modeBtnActive]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.modeBtnText, activeTab === 'groups' && styles.modeBtnTextActive]}>
              Małe Grupy (2-4 osoby)
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* FORMULARZ DODAWANIA SESJI */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zaplanuj nowy trening indywidualny</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Imię i nazwisko zawodnika"
              placeholderTextColor="#888"
              value={playerNameInput}
              onChangeText={setPlayerNameInput}
            />

            <TextInput
              style={styles.input}
              placeholder="Godzina (np. 15:30 - 16:30)"
              placeholderTextColor="#888"
              value={timeInput}
              onChangeText={setTimeInput}
            />

            <TextInput
              style={styles.input}
              placeholder="Cel treningowy / Główny element (np. Strzały)"
              placeholderTextColor="#888"
              value={focusInput}
              onChangeText={setFocusInput}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddSession}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addButtonText}>Dodaj do harmonogramu trenera</Text>
            </TouchableOpacity>
          </View>

          {/* LISTA SESJI */}
          <Text style={styles.sectionLabel}>Zaplanowane sesje indywidualne:</Text>
          
          {sessions.map((item) => (
            <View key={item.id} style={styles.sessionCard}>
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionPlayer}>{item.playerName}</Text>
                <View style={[styles.statusBadge, item.status === 'Zakończony' ? styles.badgeDone : styles.badgeActive]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.sessionTime}>🕒 {item.date} • {item.time}</Text>
              <Text style={styles.sessionFocus}>🎯 Cel: <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{item.focusArea}</Text></Text>
              
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notatka trenera:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>

              {item.status === 'Zaplanowany' && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => handleCompleteSession(item.id)}
                >
                  <Text style={styles.completeBtnText}>Oznacz jako zrealizowany</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
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

  modeSwitchRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  modeBtnActive: {
    backgroundColor: '#2563eb',
  },
  modeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  modeBtnTextActive: { color: '#fff' },

  content: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 10 },

  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionPlayer: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  badgeDone: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#1e40af' },

  sessionTime: { fontSize: 13, color: '#475569', marginBottom: 4 },
  sessionFocus: { fontSize: 13, color: '#475569', marginBottom: 10 },

  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  notesLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 2 },
  notesText: { fontSize: 12, color: '#334155' },

  completeBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});