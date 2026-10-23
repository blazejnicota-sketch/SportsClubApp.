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
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function KalendarzScreen() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'callup'>('schedule');

  // Pomocnicza funkcja pobierania pełnego imienia i nazwiska
  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    if (player.first_name || player.last_name) {
      return `${player.first_name || ''} ${player.last_name || ''}`.trim();
    }
    return 'Zawodnik';
  };

  // Stan frekwencji z uwzględnieniem wartości undefined
  const [attendance, setAttendance] = useState<{ [key: string]: 'present' | 'absent' | 'late' | undefined }>({});

  const handleToggleAttendance = (playerId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === status ? undefined : status,
    }));
  };

  const samplePlayers = MOCK_100_PLAYERS.slice(0, 8);

  const callUpMessageText = `📢 POWOŁANIE NA MECZ LIGOWY\n\n🏆 MKS Orzeł vs UKS Sparta\n📅 Data: Sobota, 25 Października\n⏰ Zbiórka: 16:30 (Mecz 17:30)\n📍 Miejsce: Stadion Miejski (Boisko A)\n\nZabieramy: Stroje niebieskie, ochraniacze, legitymacje i dużo energii!\n\nProśba o potwierdzenie obecności w aplikacji.`;

  const handleCopyCallup = () => {
    Alert.alert('Sukces! 📋', 'Treść powołania została skopiowana do schowka! Możesz wkleić ją na grupę rodziców.');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kalendarz & Frekwencja</Text>
        <Text style={styles.headerSubtitle}>
          Harmonogram treningów, lista obecności i generator powołań
        </Text>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'schedule' && styles.activeTabBtn]}
          onPress={() => setActiveTab('schedule')}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'schedule' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
            Harmonogram & Obecność
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'callup' && styles.activeTabBtn]}
          onPress={() => setActiveTab('callup')}
        >
          <Ionicons
            name="megaphone-outline"
            size={16}
            color={activeTab === 'callup' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'callup' && styles.activeTabText]}>
            Generator Powołań
          </Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'schedule' ? (
          <View>
            {/* KARTA WYDARZENIA */}
            <View style={styles.eventCard}>
              <View style={styles.eventCardTop}>
                <View style={styles.badgeMatch}>
                  <Text style={styles.badgeMatchText}>MECZ LIGOWY</Text>
                </View>
                <Text style={styles.eventDateText}>25 Października 2026, 17:30</Text>
              </View>
              <Text style={styles.eventTitle}>UKS Sparta vs MKS Orzeł</Text>
              <Text style={styles.eventLocation}>📍 Boisko Główne Miejskiego Ośrodka Sportu</Text>
            </View>

            {/* LISTA FREKWENCJI */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Sprawdzanie Frekwencji (Dzisiaj)</Text>
              <Text style={styles.summaryCountText}>
                Obecni: {Object.values(attendance).filter((s) => s === 'present').length} / {samplePlayers.length}
              </Text>
            </View>

            {samplePlayers.map((player: any) => {
              const currentStatus = attendance[player.id];
              return (
                <View key={player.id} style={styles.playerRow}>
                  <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                  <View style={styles.statusButtonsGroup}>
                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'present' && styles.statusBtnPresent,
                      ]}
                      onPress={() => handleToggleAttendance(player.id, 'present')}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={currentStatus === 'present' ? '#fff' : '#16a34a'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'late' && styles.statusBtnLate,
                      ]}
                      onPress={() => handleToggleAttendance(player.id, 'late')}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={currentStatus === 'late' ? '#fff' : '#d97706'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'absent' && styles.statusBtnAbsent,
                      ]}
                      onPress={() => handleToggleAttendance(player.id, 'absent')}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={currentStatus === 'absent' ? '#fff' : '#dc2626'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Gotowy Szablon Powołania Meczowego</Text>
            <Text style={styles.sectionDesc}>
              Wygenerowany komunikat możesz skopiować i wkleić bezpośrednio do wiadomości grupowej dla rodziców lub zawodników.
            </Text>

            <View style={styles.callupPreviewBox}>
              <Text style={styles.callupText}>{callUpMessageText}</Text>
            </View>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCallup}>
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={styles.copyBtnText}>Kopiuj Wiadomość do Schowka</Text>
            </TouchableOpacity>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

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
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b', marginLeft: 6 },
  activeTabText: { color: '#2563eb' },

  content: { padding: 16 },

  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    marginBottom: 20,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeMatch: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeMatchText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  eventDateText: { fontSize: 11, color: '#64748b' },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  eventLocation: { fontSize: 12, color: '#475569', marginTop: 4 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  summaryCountText: { fontSize: 12, color: '#2563eb', fontWeight: 'bold' },

  playerRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  statusButtonsGroup: { flexDirection: 'row' },
  statusBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  statusBtnPresent: { backgroundColor: '#16a34a' },
  statusBtnLate: { backgroundColor: '#d97706' },
  statusBtnAbsent: { backgroundColor: '#dc2626' },

  sectionDesc: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 14 },
  callupPreviewBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  callupText: { fontSize: 13, color: '#1e293b', lineHeight: 20 },
  copyBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
});