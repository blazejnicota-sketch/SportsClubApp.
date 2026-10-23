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

export default function ZawodnikPanelScreen() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'calendar' | 'stats'>('challenges');

  // Stan zadań domowych (Strefa Wyzwań XP)
  const [tasks, setTasks] = useState([
    { id: '1', title: '30 minut żonglerki bez upadku piłki', xp: 150, completed: true },
    { id: '2', title: 'Rozciąganie i mobilność (15 min)', xp: 100, completed: false },
    { id: '3', title: '100 podań o ścianę obiema nogami', xp: 200, completed: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  };

  const totalXp = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.xp, 450);

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK / PROFIL ZAWODNIKA */}
      <View style={styles.header}>
        <View style={styles.playerInfoRow}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color="#2563eb" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Cześć, Janek! 👋</Text>
            <Text style={styles.headerTitle}>Pomocnik • UKS Sparta (U-14)</Text>
          </View>
        </View>

        {/* LICZNIK XP I POZIOMU */}
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={styles.xpText}>{totalXp} XP</Text>
        </View>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'challenges' && styles.activeTabBtn]}
          onPress={() => setActiveTab('challenges')}
        >
          <Ionicons
            name="trophy-outline"
            size={15}
            color={activeTab === 'challenges' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>
            Strefa Wyzwań
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'calendar' && styles.activeTabBtn]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={activeTab === 'calendar' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Mój Kalendarz
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stats' && styles.activeTabBtn]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="stats-chart-outline"
            size={15}
            color={activeTab === 'stats' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Moje Wyniki
          </Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'challenges' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Zadania Domowe & Wyzwania</Text>
              <Text style={styles.subtleText}>Zbieraj XP i odznaki!</Text>
            </View>

            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                onPress={() => toggleTask(task.id)}
              >
                <View style={styles.taskLeft}>
                  <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                    {task.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskXp}>+{task.xp} XP</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'calendar' && (
          <View>
            <Text style={styles.sectionTitle}>Nadchodzące Wydarzenia</Text>

            <View style={styles.eventCard}>
              <View style={styles.eventCardTop}>
                <View style={styles.badgeMatch}>
                  <Text style={styles.badgeMatchText}>MECZ LIGOWY</Text>
                </View>
                <Text style={styles.eventDateText}>Sobota, 17:30</Text>
              </View>
              <Text style={styles.eventTitle}>UKS Sparta vs MKS Orzeł</Text>
              <Text style={styles.eventLocation}>📍 Stadion Miejski (Zbiórka 16:30)</Text>

              <View style={styles.confirmBox}>
                <Text style={styles.confirmLabel}>Twoja obecność:</Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmBtn, styles.confirmYes]}
                    onPress={() => Alert.alert('Potwierdzone', 'Zgłosiłeś obecność na meczu!')}
                  >
                    <Text style={styles.confirmYesText}>✓ Będę</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View>
            <Text style={styles.sectionTitle}>Moje Testy Motoryczne</Text>

            <View style={styles.statsOverviewCard}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Sprint 30m</Text>
                <Text style={styles.statValue}>4.21 s</Text>
                <Text style={styles.statDiff}>📉 -0.05s (Lepiej)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>BEEP Test</Text>
                <Text style={styles.statValue}>11.4</Text>
                <Text style={styles.statDiff}>📈 +0.8 (Super)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Skok w dal</Text>
                <Text style={styles.statValue}>2.15 m</Text>
                <Text style={styles.statDiff}>➡️ Bez zmian</Text>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  playerInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  greeting: { fontSize: 11, color: '#64748b' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  xpText: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  activeTabBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  activeTabText: { color: '#2563eb' },

  content: { padding: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  subtleText: { fontSize: 11, color: '#64748b' },

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardCompleted: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#64748b' },
  taskXp: { fontSize: 11, color: '#d97706', fontWeight: 'bold', marginTop: 2 },

  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeMatch: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeMatchText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  eventDateText: { fontSize: 11, color: '#64748b' },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  eventLocation: { fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 14 },
  confirmBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  confirmButtons: { flexDirection: 'row' },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  confirmYes: { backgroundColor: '#16a34a' },
  confirmYesText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  statsOverviewCard: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    width: '32%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: { fontSize: 10, color: '#64748b' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginTop: 4 },
  statDiff: { fontSize: 9, fontWeight: 'bold', color: '#16a34a', marginTop: 4, textAlign: 'center' },
});