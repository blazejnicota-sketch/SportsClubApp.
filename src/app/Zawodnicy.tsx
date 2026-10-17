import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Player {
  id: string;
  name: string;
  role: string;
  birthYear: number;
}

const AVAILABLE_PLAYERS: Player[] = [
  { id: 'p1', name: 'Jan Kowalski', role: 'Bramkarz', birthYear: 2015 },
  { id: 'p2', name: 'Piotr Nowak', role: 'Obrońca', birthYear: 2015 },
  { id: 'p3', name: 'Adam Wiśniewski', role: 'Pomocnik', birthYear: 2016 },
  { id: 'p4', name: 'Kamil Zieliński', role: 'Napastnik', birthYear: 2014 },
  { id: 'p5', name: 'Michał Lewandowski', role: 'Obrońca', birthYear: 2015 },
  { id: 'p6', name: 'Mateusz Wójcik', role: 'Bramkarz', birthYear: 2016 },
  { id: 'p7', name: 'Szymon Kamiński', role: 'Obrońca', birthYear: 2014 },
  { id: 'p8', name: 'Łukasz Dąbrowski', role: 'Obrońca', birthYear: 2014 },
  { id: 'p9', name: 'Kacper Kozłowski', role: 'Obrońca', birthYear: 2015 },
  { id: 'p10', name: 'Jakub Jankowski', role: 'Pomocnik', birthYear: 2014 },
];

export default function PlayerCallupsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const eventTitle = (params.eventTitle as string) || 'Mecz Ligowy';
  const squadIdsStr = (params.squad as string) || '';
  
  const squadIds = squadIdsStr ? squadIdsStr.split(',') : ['p4', 'p7', 'p8', 'p10', 'p3'];
  const squadPlayers = AVAILABLE_PLAYERS.filter((p) => squadIds.includes(p.id));

  const formattedPlayersList = squadPlayers.length > 0 
    ? squadPlayers.map((p) => `• ${p.name} (${p.role}${p.birthYear !== 2014 ? `, rocznik ${p.birthYear}` : ''})`).join('\n')
    : 'Brak powołanych zawodników.';

  const messageText = `📢 OFICJALNE POWOŁANIA\n\n📌 Wydarzenie: ${eventTitle}\n📅 Zbiórka: 45 min przed meczem\n\nPowołani zawodnicy (${squadPlayers.length}):\n${formattedPlayersList}\n\nProszę o potwierdzenie obecności w aplikacji!`;

  const handleCopyMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(messageText);
      alert('📋 Dynamiczna lista powołań skopiowana do schowka! Wklej ją na WhatsApp.');
    } else {
      alert(messageText);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/Calendar')}>
            <Text style={styles.backButtonText}>← Powrót do Kalendarza</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📢 Generator Powołań</Text>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Szablon wiadomości dla rodziców:</Text>
            <Text style={styles.messagePreview}>{messageText}</Text>

            <TouchableOpacity style={styles.whatsappButton} onPress={handleCopyMessage}>
              <Text style={styles.whatsappButtonText}>💬 Kopiuj wiadomość do schowka</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#0d1117' },
  container: { flex: 1, backgroundColor: '#0d1117', paddingHorizontal: 20, paddingTop: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#21262d', borderRadius: 6 },
  backButtonText: { color: '#58a6ff', fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  contentScroll: { flex: 1 },
  scrollContentContainer: { paddingBottom: 30 },
  card: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#30363d' },
  cardTitle: { color: '#58a6ff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  messagePreview: { backgroundColor: '#0d1117', padding: 14, borderRadius: 8, color: '#c9d1d9', fontSize: 13, lineHeight: 20, marginBottom: 16, borderWidth: 1, borderColor: '#30363d' },

  whatsappButton: { backgroundColor: '#238636', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  whatsappButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});