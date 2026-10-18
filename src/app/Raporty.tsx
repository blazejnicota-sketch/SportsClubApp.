import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamStore } from './store/useTeamStore';
import {
  exportToCSV,
  generateTestResultsCSV,
  generateFeesCSV,
  generatePlayersCSV
} from './services/exportService';

export default function RaportyScreen() {
  const players = useTeamStore((state: any) => state.players);
  const testResults = useTeamStore((state: any) => state.testResults);
  const fees = useTeamStore((state: any) => state.fees);
  const events = useTeamStore((state: any) => state.events);

  // Wyliczenia statystyk
  const totalPaid = fees.filter((f: any) => f.paid).reduce((acc: number, curr: any) => acc + curr.amount, 0);
  const totalUnpaid = fees.filter((f: any) => !f.paid).reduce((acc: number, curr: any) => acc + curr.amount, 0);

  // Funkcje wywołujące eksport
  const handleExportTests = async () => {
    if (testResults.length === 0) {
      Alert.alert('Brak danych', 'Brak zarejestrowanych testów motorycznych do wyeksportowania.');
      return;
    }
    const csv = generateTestResultsCSV(testResults, players);
    await exportToCSV('Raport_Testow_Motorycznych.csv', csv);
  };

  const handleExportFees = async () => {
    if (fees.length === 0) {
      Alert.alert('Brak danych', 'Brak zarejestrowanych składek do wyeksportowania.');
      return;
    }
    const csv = generateFeesCSV(fees, players);
    await exportToCSV('Raport_Skladek_Klubowych.csv', csv);
  };

  const handleExportPlayers = async () => {
    if (players.length === 0) {
      Alert.alert('Brak danych', 'Brak zarejestrowanych zawodników do wyeksportowania.');
      return;
    }
    const csv = generatePlayersCSV(players);
    await exportToCSV('Karta_Kadry_Zawodników.csv', csv);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Raporty i Analityka</Text>
          <Text style={styles.headerSubtitle}>Podsumowanie statystyk i eksport danych</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PODSUMOWANIE STATYSTYK */}
        <Text style={styles.sectionTitle}>Podsumowanie Klubu</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#2563eb" />
            <Text style={styles.statValue}>{players.length}</Text>
            <Text style={styles.statLabel}>Zawodników</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="fitness" size={24} color="#16a34a" />
            <Text style={styles.statValue}>{testResults.length}</Text>
            <Text style={styles.statLabel}>Wyników testów</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#eab308" />
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Wydarzeń</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="wallet" size={24} color="#dc2626" />
            <Text style={styles.statValue}>{totalPaid} PLN</Text>
            <Text style={styles.statLabel}>Wpłacone składki</Text>
          </View>
        </View>

        {/* SEKCJA EKSPORTU DO PLIKÓW */}
        <Text style={styles.sectionTitle}>Eksport Raportów (CSV / Excel)</Text>

        <TouchableOpacity style={styles.exportCard} onPress={handleExportTests}>
          <View style={styles.exportIconBox}>
            <Ionicons name="document-text" size={24} color="#2563eb" />
          </View>
          <View style={styles.exportTextBox}>
            <Text style={styles.exportTitle}>Raport Wyników Testów</Text>
            <Text style={styles.exportSub}>Pobierz historię wszystkich pomiarów zawodników</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#2563eb" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportCard} onPress={handleExportFees}>
          <View style={[styles.exportIconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="cash" size={24} color="#166534" />
          </View>
          <View style={styles.exportTextBox}>
            <Text style={styles.exportTitle}>Raport Składek Finansowych</Text>
            <Text style={styles.exportSub}>Zestawienie wpłat i zaległości członkowskich</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#166534" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportCard} onPress={handleExportPlayers}>
          <View style={[styles.exportIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="person-circle" size={24} color="#854d0e" />
          </View>
          <View style={styles.exportTextBox}>
            <Text style={styles.exportTitle}>Karta Kadry i Zawodników</Text>
            <Text style={styles.exportSub}>Eksport danych kontaktowych i profilowych</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#854d0e" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportTextBox: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  exportSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});