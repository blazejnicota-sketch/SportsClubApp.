import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTeamStore, Player, TestResult } from './store/useTeamStore';

export default function TestyScreen() {
  const store = useTeamStore();
  const players: Player[] = store.players || [];
  const testResults: TestResult[] = store.testResults || [];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [testName, setTestName] = useState<string>('');
  const [testType, setTestType] = useState<string>('Motoryczny');
  const [resultValue, setResultValue] = useState<string>('');

  const handleAddTest = () => {
    if (!selectedPlayerId) {
      Alert.alert('Błąd', 'Wybierz zawodnika z listy.');
      return;
    }
    if (!testName.trim() || !resultValue.trim()) {
      Alert.alert('Błąd', 'Wypełnij nazwę testu oraz wynik.');
      return;
    }

    store.addTestResult({
      playerId: selectedPlayerId,
      testName,
      name: testName,
      testType,
      resultValue,
      value: resultValue,
      date: new Date().toISOString().split('T')[0],
    });

    setTestName('');
    setResultValue('');
    Alert.alert('Sukces', 'Wynik testu został dodany.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Testy i Wyniki Motoryczne</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dodaj nowy wynik testu</Text>
        <Text style={styles.label}>Wybierz zawodnika:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerPicker}>
          {players.map((p: Player) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.playerChip, selectedPlayerId === p.id && styles.selectedPlayerChip]}
              onPress={() => setSelectedPlayerId(p.id)}
            >
              <Text style={[styles.playerChipText, selectedPlayerId === p.id && styles.selectedPlayerChipText]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput style={styles.input} placeholder="Nazwa testu" value={testName} onChangeText={setTestName} />
        <TextInput style={styles.input} placeholder="Typ testu" value={testType} onChangeText={setTestType} />
        <TextInput style={styles.input} placeholder="Wynik" value={resultValue} onChangeText={setResultValue} />

        <TouchableOpacity style={styles.button} onPress={handleAddTest}>
          <Text style={styles.buttonText}>Zapisz wynik</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { marginTop: 24, fontSize: 20 }]}>Ostatnie wyniki</Text>
      {testResults.length === 0 ? (
        <Text style={styles.emptyText}>Brak zarejestrowanych wyników testów.</Text>
      ) : (
        testResults.map((t: TestResult, index: number) => {
          const player = players.find((p: Player) => p.id === t.playerId);
          return (
            <View key={t.id || `test-${index}`} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.playerName}>{player ? player.name : 'Nieznany zawodnik'}</Text>
                <Text style={styles.testDate}>{t.date}</Text>
              </View>
              <Text style={styles.testDetail}>Test: <Text style={styles.boldText}>{t.testName || t.name || 'Test'}</Text></Text>
              <Text style={styles.testValue}>Wynik: <Text style={styles.valueHighlight}>{t.resultValue || t.value || '-'}</Text></Text>
              <TouchableOpacity style={styles.deleteButton} onPress={() => store.removeTestResult(t.id)}>
                <Text style={styles.deleteText}>Usuń wynik</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 12 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  playerPicker: { flexDirection: 'row', marginBottom: 12 },
  playerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E9ECEF', marginRight: 8 },
  selectedPlayerChip: { backgroundColor: '#007AFF' },
  playerChipText: { color: '#333', fontSize: 14 },
  selectedPlayerChipText: { color: '#FFF', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#28A745', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  resultCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EAEAEA' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  testDate: { fontSize: 12, color: '#888' },
  testDetail: { fontSize: 14, color: '#555', marginBottom: 4 },
  boldText: { fontWeight: 'bold', color: '#333' },
  testValue: { fontSize: 15, color: '#444' },
  valueHighlight: { fontWeight: 'bold', color: '#007AFF', fontSize: 16 },
  deleteButton: { marginTop: 8, alignSelf: 'flex-start' },
  deleteText: { color: '#DC3545', fontWeight: '600', fontSize: 13 },
});