import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from './PlayersContext';

interface HomeTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  isCompleted: boolean;
}

export default function ZawodnikPanelScreen() {
  const { players } = usePlayers();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    players.length > 0 ? String(players[0].id) : '1'
  );

  const currentPlayer = players.find((p: any) => String(p.id) === String(selectedPlayerId)) || players[0];

  // Przykładowe zadania domowe od trenera przypisane do zawodnika
  const [tasks, setTasks] = useState<HomeTask[]>([
    {
      id: '1',
      title: 'Trening techniczny: Prowadzenie piłki',
      description: '500 dotknięć piłki wewnętrzną i zewnętrzną częścią stopy w domu/ogrodzie.',
      deadline: 'Jutro, 18:00',
      isCompleted: false,
    },
    {
      id: '2',
      title: 'Zadanie motoryczne: Stabilizacja (Core)',
      description: '3 serie deski (plank) po 45 sekund oraz rozciąganie pośladków.',
      deadline: 'Piątek',
      isCompleted: true,
    },
    {
      id: '3',
      title: 'Analiza wideo i mobilność',
      description: 'Rozciąganie powięziowe nóg (roller) – min. 10 minut.',
      deadline: 'Sobota',
      isCompleted: false,
    },
  ]);

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newState = !t.isCompleted;
          if (newState) {
            Alert.alert('Brawo! 💪', 'Zadanie zostało oznaczone jako wykonane. Trener widzi Twój postęp!');
          }
          return { ...t, isCompleted: newState };
        }
        return t;
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Strefa Zawodnika ⚽⚡</Text>
          <Text style={styles.headerSubtitle}>Twój indywidualny rozwój, zadania i statystyki</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* WYBÓR PROFILU ZAWODNIKA */}
        <Text style={styles.sectionLabel}>Aktywny profil:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {players.map((player: any) => {
            const isSelected = String(player.id) === String(selectedPlayerId);
            const cleanName = (player.name || `${player.firstName} ${player.lastName}`).replace(/\s*\(\d{4}\)/g, '');
            return (
              <TouchableOpacity
                key={player.id}
                style={[styles.playerChip, isSelected && styles.playerChipActive]}
                onPress={() => setSelectedPlayerId(String(player.id))}
              >
                <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                  #{player.number || '•'} {cleanName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {currentPlayer && (
          <>
            {/* KARTA PROFILU I POZYCJI */}
            <View style={styles.profileCard}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>#{currentPlayer.number || '10'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.profileName}>{currentPlayer.name || `${currentPlayer.firstName} ${currentPlayer.lastName}`}</Text>
                <Text style={styles.profileMeta}>Pozycja: {currentPlayer.position || 'Pomocnik'} | Rocznik {currentPlayer.year || '2012'}</Text>
                <View style={styles.formBadge}>
                  <Text style={styles.formBadgeText}>🔥 Forma: Wysoka (9.2 / 10)</Text>
                </View>
              </View>
            </View>

            {/* SEKCJA: ZADANIA DOMOWE OD TRENERA */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
              <Text style={styles.sectionTitle}>Zadania Domowe od Trenera 📋</Text>
              <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>
                {tasks.filter(t => t.isCompleted).length} / {tasks.length} ukończone
              </Text>
            </View>

            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.isCompleted && styles.taskCardCompleted]}
                onPress={() => toggleTaskCompletion(task.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.checkboxBox, task.isCompleted && styles.checkboxBoxChecked]}>
                    {task.isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.taskTitle, task.isCompleted && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskDesc}>{task.description}</Text>
                    <Text style={styles.taskDeadline}>⏰ Termin: {task.deadline}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* STATYSTYKI INDYWIDUALNE ZAWODNIKA */}
            <Text style={styles.sectionTitle}>Twoje Statystyki w Sezonie 📊</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>⚽ 4</Text>
                <Text style={styles.statBoxLabel}>Bramki</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>🎯 7</Text>
                <Text style={styles.statBoxLabel}>Asysty</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxNum}>⭐ 2</Text>
                <Text style={styles.statBoxLabel}>MVP Meczów</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  content: { padding: 16 },

  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 6 },
  playerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  playerChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  playerChipText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  playerChipTextActive: { color: '#fff' },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  avatarLargeText: { fontSize: 14, fontWeight: 'bold', color: '#2563eb' },
  profileName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  formBadge: {
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
    formBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 10, marginTop: 8 },
  
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskCardCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  taskTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#166534' },
  taskDesc: { fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 15 },
  taskDeadline: { fontSize: 10, color: '#dc2626', fontWeight: 'bold', marginTop: 6 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBoxNum: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  statBoxLabel: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 4 },
});