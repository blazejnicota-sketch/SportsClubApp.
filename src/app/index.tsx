import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export default function HomeScreen() {
  const totalPlayers = MOCK_100_PLAYERS.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Witaj, Trenerze! 👋</Text>
          <Text style={styles.headerTitle}>Panel Główny Akademia</Text>
        </View>
        <TouchableOpacity style={styles.profileBadge}>
          <Ionicons name="person-circle" size={36} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* NAJBLIŻSZE WYDARZENIE */}
        <View style={styles.nextEventCard}>
          <View style={styles.nextEventHeader}>
            <View style={styles.eventTypeBadge}>
              <Text style={styles.eventTypeText}>DZISIAJ • MECZ LIGOWY</Text>
            </View>
            <Text style={styles.eventTime}>17:30</Text>
          </View>

          <Text style={styles.matchTitle}>UKS Sparta vs MKS Orzeł</Text>
          <Text style={styles.eventSub}>Stadion Miejski • Boisko A</Text>

          <View style={styles.eventFooter}>
            <View style={styles.attendanceSummary}>
              <Ionicons name="people" size={16} color="#4b5563" />
              <Text style={styles.attendanceText}>Powołani: 14/14 zawodników</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Szczegóły</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SZYBKIE AKCJE */}
        <Text style={styles.sectionTitle}>Szybkie Akcje</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            </View>
            <Text style={styles.quickActionText}>Dodaj Trening</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="megaphone-outline" size={20} color="#16a34a" />
            </View>
            <Text style={styles.quickActionText}>Ogłoszenie</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#faf5ff' }]}>
              <Ionicons name="fitness-outline" size={20} color="#9333ea" />
            </View>
            <Text style={styles.quickActionText}>Zadanie Domowe</Text>
          </TouchableOpacity>
        </View>

        {/* PODSUMOWANIE DRUŻYNY */}
        <Text style={styles.sectionTitle}>Kluczowe Wskaźniki</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPlayers}</Text>
            <Text style={styles.statLabel}>Zawodnicy w kadze</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>89%</Text>
            <Text style={styles.statLabel}>Śr. Frekwencja</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#d97706' }]}>2</Text>
            <Text style={styles.statLabel}>Urazy / Kontuzje</Text>
          </View>
        </View>

        {/* OSTATNIE OGŁOSZENIE KLUBOWE */}
        <Text style={styles.sectionTitle}>Ostatni Komunikat</Text>
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="notifications-outline" size={18} color="#2563eb" />
            <Text style={styles.noticeTitle}>Obóz zimowy 2027</Text>
          </View>
          <Text style={styles.noticeBody}>
            Przypominamy o wpłacie zaliczki na obóz zimowy do końca tego tygodnia.
          </Text>
          <Text style={styles.noticeDate}>Dodano: dzisiaj, 09:30</Text>
        </View>
      </View>
    </ScrollView>
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
  greeting: { fontSize: 12, color: '#64748b' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  profileBadge: { padding: 2 },
  content: { padding: 16 },

  nextEventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    marginBottom: 20,
    elevation: 2,
  },
  nextEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTypeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  eventTime: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  matchTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  eventSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attendanceSummary: { flexDirection: 'row', alignItems: 'center' },
  attendanceText: { fontSize: 12, color: '#475569', marginLeft: 6 },
  actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },

  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '31%',
    elevation: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '31%',
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },

  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginLeft: 6 },
  noticeBody: { fontSize: 12, color: '#475569' },
  noticeDate: { fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'right' },
});