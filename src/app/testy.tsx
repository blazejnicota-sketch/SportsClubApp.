import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  SafeAreaView, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamStore, Player, TestResult } from './store/useTeamStore';

const screenWidth = Dimensions.get('window').width;

export default function TestyScreen() {
  const players: Player[] = useTeamStore((state: any) => state.players);
  const testResults: TestResult[] = useTeamStore((state: any) => state.testResults);
  const addTestResult = useTeamStore((state: any) => state.addTestResult);
  const deleteTestResult = useTeamStore((state: any) => state.deleteTestResult);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [selectedTestName, setSelectedTestName] = useState<string>('Sprint 30m');
  const [modalVisible, setModalVisible] = useState(false);

  // Formularz nowego testu
  const [newTestName, setNewTestName] = useState('Sprint 30m');
  const [newTestValue, setNewTestValue] = useState('');
  const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split('T')[0]);

  // Lista unikalnych nazw testów dostępnych w systemie lub domyślnych
  const availableTestTypes = ['Sprint 30m', 'Skok w dal', 'Bieg wahadłowy 10x5', 'Wyskok dosiężny', 'Wytrzymałość (Beep test)'];

  // Przefiltrowane wyniki dla wybranego zawodnika i wybranego testu
  const playerTests = testResults.filter(
    (t) => t.playerId === selectedPlayerId && (t.testName === selectedTestName || t.name === selectedTestName)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Wyciąganie wartości numerycznych do wykresu
  const chartData = playerTests.map((t) => {
    const rawVal = t.resultValue ?? t.value ?? '0';
    const num = parseFloat(String(rawVal).replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
    return {
      date: t.date,
      value: num,
      raw: rawVal,
      id: t.id
    };
  });

  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 1) : 1;

  const handleAddTest = () => {
    if (!newTestValue.trim()) return;
    addTestResult({
      playerId: selectedPlayerId,
      testName: newTestName,
      name: newTestName,
      testType: 'Motoryczny',
      resultValue: newTestValue,
      value: newTestValue,
      date: newTestDate,
    });
    setNewTestValue('');
    setModalVisible(false);
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Nagłówek */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analiza Testów Motorycznych</Text>
          <Text style={styles.headerSubtitle}>Śledź postępy i trendy zawodników</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wybór zawodnika */}
        <Text style={styles.sectionLabel}>Wybierz zawodnika:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {players.map((player) => {
            const isSelected = player.id === selectedPlayerId;
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerChip, isSelected && styles.playerChipActive]}
                onPress={() => setSelectedPlayerId(player.id)}
              >
                <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                  {player.name} {player.number ? `(${player.number})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Wybór rodzaju testu */}
        <Text style={styles.sectionLabel}>Rodzaj testu:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {availableTestTypes.map((testName) => {
            const isSelected = testName === selectedTestName;
            return (
              <TouchableOpacity
                key={testName}
                style={[styles.testChip, isSelected && styles.testChipActive]}
                onPress={() => setSelectedTestName(testName)}
              >
                <Text style={[styles.testChipText, isSelected && styles.testChipTextActive]}>
                  {testName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sekcja Wykresu Trendu */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Wykres postępów: {selectedTestName}</Text>
          </View>
          
          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>Brak pomiarów dla tego testu.</Text>
              <Text style={styles.emptySubtext}>Kliknij '+' w prawym górnym rogu, aby dodać nowy pomiar.</Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <View style={styles.chartBarsArea}>
                {chartData.map((item, index) => {
                  const barHeight = Math.max((item.value / maxVal) * 140, 20);
                  return (
                    <View key={index} style={styles.barColumn}>
                      <Text style={styles.barValueText}>{item.raw}</Text>
                      <View style={[styles.barFill, { height: barHeight }]} />
                      <Text style={styles.barDateText}>{item.date.slice(5)}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.chartFooterInfo}>
                Zawodnik: {selectedPlayer?.name} • Łącznie pomiarów: {chartData.length}
              </Text>
            </View>
          )}
        </View>

        {/* Historia pomiarów (Lista) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historia pomiarów w czasie</Text>
          {playerTests.length === 0 ? (
            <Text style={styles.noHistoryText}>Brak zarejestrowanych wyników.</Text>
          ) : (
            playerTests.map((t) => (
              <View key={t.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>{t.date}</Text>
                  <Text style={styles.historyTestName}>{t.testName || t.name}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyValue}>{t.resultValue ?? t.value}</Text>
                  <TouchableOpacity onPress={() => deleteTestResult(t.id)} style={styles.deleteIconBtn}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal dodawania nowego pomiaru */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dodaj wynik testu motorycznego</Text>
            
            <Text style={styles.inputLabel}>Nazwa testu:</Text>
            <TextInput
              style={styles.input}
              value={newTestName}
              onChangeText={setNewTestName}
              placeholder="np. Sprint 30m"
            />

            <Text style={styles.inputLabel}>Wynik (np. 4.15 s lub 210 cm):</Text>
            <TextInput
              style={styles.input}
              value={newTestValue}
              onChangeText={setNewTestValue}
              placeholder="Wprowadź wynik"
              keyboardType="default"
            />

            <Text style={styles.inputLabel}>Data (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={newTestDate}
              onChangeText={setNewTestDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleAddTest}
              >
                <Text style={styles.saveBtnText}>Zapisz</Text>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  horizontalList: {
    marginBottom: 8,
  },
  playerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  playerChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  playerChipText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  playerChipTextActive: {
    color: '#ffffff',
  },
  testChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    marginRight: 6,
  },
  testChipActive: {
    backgroundColor: '#0f172a',
  },
  testChipText: {
    fontSize: 13,
    color: '#334155',
  },
  testChipTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chartBarsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 50,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  barFill: {
    width: 24,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barDateText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
  },
  chartFooterInfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
  },
  historyTestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 16,
  },
  deleteIconBtn: {
    padding: 4,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelBtn: {
    backgroundColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});