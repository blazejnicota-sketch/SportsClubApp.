import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTeamStore, Player, TestResult, EventItem } from './store/useTeamStore';

export default function SzatniaScreen() {
  const store = useTeamStore();
  const players: Player[] = store.players || [];
  const testResults: TestResult[] = store.testResults || [];
  const events: EventItem[] = store.events || [];

  const [activeTab, setActiveTab] = useState<'zawodnicy' | 'testy' | 'wydarzenia'>('zawodnicy');
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');

  const handleAddPlayer = () => {
    if (!playerName.trim()) {
      Alert.alert('Błąd', 'Wprowadź imię i nazwisko zawodnika.');
      return;
    }
    store.addPlayer({
      name: playerName,
      number: playerNumber,
      position: playerPosition,
    });
    setPlayerName('');
    setPlayerNumber('');
    setPlayerPosition('');
    Alert.alert('Sukces', 'Dodano nowego zawodnika.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Szatnia Zespołu</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'zawodnicy' && styles.activeTab]}
          onPress={() => setActiveTab('zawodnicy')}
        >
          <Text style={styles.tabText}>Zawodnicy ({players.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'testy' && styles.activeTab]}
          onPress={() => setActiveTab('testy')}
        >
          <Text style={styles.tabText}>Testy ({testResults.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wydarzenia' && styles.activeTab]}
          onPress={() => setActiveTab('wydarzenia')}
        >
          <Text style={styles.tabText}>Wydarzenia ({events.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'zawodnicy' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dodaj zawodnika</Text>
          <TextInput
            style={styles.input}
            placeholder="Imię i nazwisko"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Numer na koszulce"
            value={playerNumber}
            onChangeText={setPlayerNumber}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Pozycja"
            value={playerPosition}
            onChangeText={setPlayerPosition}
          />
          <TouchableOpacity style={styles.button} onPress={handleAddPlayer}>
            <Text style={styles.buttonText}>Dodaj zawodnika</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Lista zawodników</Text>
          {players.map((player: Player) => (
            <View key={player.id} style={styles.card}>
              <Text style={styles.cardTitle}>{player.name}</Text>
              <Text style={styles.cardSubtitle}>
                Pozycja: {player.position || 'Brak'} | Numer: #{player.number || '-'}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => store.removePlayer(player.id)}
              >
                <Text style={styles.deleteButtonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'testy' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wyniki testów</Text>
          {testResults.map((test: TestResult) => (
            <View key={test.id} style={styles.card}>
              <Text style={styles.cardTitle}>{test.testName || test.name || 'Test'}</Text>
              <Text style={styles.cardSubtitle}>
                Wynik: {test.resultValue || test.value || '-'} | Data: {test.date}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => store.removeTestResult(test.id)}
              >
                <Text style={styles.deleteButtonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'wydarzenia' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nadchodzące wydarzenia</Text>
          {events.map((event: EventItem) => (
            <View key={event.id} style={styles.card}>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardSubtitle}>
                {event.date} o {event.time} | {event.type}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => store.removeEvent(event.id)}
              >
                <Text style={styles.deleteButtonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  tabContainer: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, backgroundColor: '#DDD', alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { color: '#FFF', fontWeight: '600' },
  section: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#444' },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#28A745', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  card: { padding: 12, borderWidth: 1, borderColor: '#EEE', borderRadius: 8, marginBottom: 8, backgroundColor: '#F9F9F9' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  deleteButton: { marginTop: 8, alignSelf: 'flex-start' },
  deleteButtonText: { color: '#DC3545', fontWeight: '600' },
});