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

export default function RodzicPanelScreen() {
  const [activeTab, setActiveTab] = useState<'finances' | 'attendance' | 'noticeboard'>('finances');
  const [isPaid, setIsPaid] = useState(false);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState<boolean | null>(null);

  const handlePayFee = () => {
    setIsPaid(true);
    Alert.alert('Sukces! 💳', 'Składka za październik została opłacona pomyślnie.');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK / PROFIL DZIECKA */}
      <View style={styles.header}>
        <View style={styles.parentInfoRow}>
          <View style={styles.avatarContainer}>
            <Ionicons name="shield-checkmark" size={22} color="#16a34a" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greeting}>Panel Opiekuna 👋</Text>
            <Text style={styles.headerTitle}>Zawodnik: Jan Kowalski (U-14)</Text>
          </View>
        </View>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'finances' && styles.activeTabBtn]}
          onPress={() => setActiveTab('finances')}
        >
          <Ionicons
            name="wallet-outline"
            size={15}
            color={activeTab === 'finances' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'finances' && styles.activeTabText]}>
            Składki & Płatności
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'attendance' && styles.activeTabBtn]}
          onPress={() => setActiveTab('attendance')}
        >
          <Ionicons
            name="checkbox-outline"
            size={15}
            color={activeTab === 'attendance' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
            Obecności & Mecze
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'noticeboard' && styles.activeTabBtn]}
          onPress={() => setActiveTab('noticeboard')}
        >
          <Ionicons
            name="notifications-outline"
            size={15}
            color={activeTab === 'noticeboard' ? '#2563eb' : '#64748b'}
          />
          <Text style={[styles.tabText, activeTab === 'noticeboard' && styles.activeTabText]}>
            Ogłoszenia
          </Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'finances' && (
          <View>
            <Text style={styles.sectionTitle}>Status Składek Członkowskich</Text>

            <View style={[styles.card, isPaid ? styles.cardPaid : styles.cardUnpaid]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.feeMonth}>Październik 2026</Text>
                  <Text style={styles.feeAmount}>Kwota: 120,00 zł</Text>
                </View>
                <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                  <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextUnpaid]}>
                    {isPaid ? 'Opłacone' : 'Do zapłaty'}
                  </Text>
                </View>
              </View>

              {!isPaid && (
                <TouchableOpacity style={styles.payBtn} onPress={handlePayFee}>
                  <Ionicons name="card-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.payBtnText}>Opłać teraz szybkimi płatnościami</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.historySection}>
              <Text style={styles.subSectionTitle}>Historia Wpłat</Text>
              <View style={styles.historyRow}>
                <Text style={styles.historyText}>Wrzesień 2026 (120 zł)</Text>
                <Text style={styles.historySuccess}>Opłacono ✓</Text>
              </View>
              <View style={styles.historyRow}>
                <Text style={styles.historyText}>Sierpień 2026 (120 zł)</Text>
                <Text style={styles.historySuccess}>Opłacono ✓</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'attendance' && (
          <View>
            <Text style={styles.sectionTitle}>Najbliższe Wydarzenie Drużyny</Text>

            <View style={styles.eventCard}>
              <View style={styles.eventCardTop}>
                <View style={styles.badgeMatch}>
                  <Text style={styles.badgeMatchText}>MECZ LIGOWY</Text>
                </View>
                <Text style={styles.eventDateText}>Sobota, 17:30</Text>
              </View>
              <Text style={styles.eventTitle}>UKS Sparta vs MKS Orzeł</Text>
              <Text style={styles.eventLocation}>📍 Stadion Miejski (Zbiórka zawodnika: 16:30)</Text>

              <View style={styles.confirmBox}>
                <Text style={styles.confirmLabel}>Czy Janek będzie na meczu?</Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      styles.confirmYes,
                      attendanceConfirmed === true && styles.confirmSelectedYes,
                    ]}
                    onPress={() => {
                      setAttendanceConfirmed(true);
                      Alert.alert('Zapisano', 'Potwierdzono obecność dziecka na meczu.');
                    }}
                  >
                    <Text style={styles.confirmYesText}>✓ Tak, będzie</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      styles.confirmNo,
                      attendanceConfirmed === false && styles.confirmSelectedNo,
                    ]}
                    onPress={() => {
                      setAttendanceConfirmed(false);
                      Alert.alert('Zapisano', 'Zgłoszono nieobecność dziecka.');
                    }}
                  >
                    <Text style={styles.confirmNoText}>✕ Nie będzie</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'noticeboard' && (
          <View>
            <Text style={styles.sectionTitle}>Komunikaty od Trenera</Text>

            <View style={styles.noticeCard}>
              <View style={styles.noticeHeaderRow}>
                <Ionicons name="megaphone-outline" size={16} color="#2563eb" />
                <Text style={styles.noticeTitle}>Zmiana godziny treningu</Text>
                <Text style={styles.noticeDate}>Wczoraj</Text>
              </View>
              <Text style={styles.noticeBody}>
                Szanowni Państwo, w najbliższy czwartek trening rocznika U-14 odbędzie się o godzinie 17:00 zamiast 16:00 z powodu zajęć na boisku głównym.
              </Text>
            </View>

            <View style={styles.noticeCard}>
              <View style={styles.noticeHeaderRow}>
                <Ionicons name="calendar-outline" size={16} color="#16a34a" />
                <Text style={styles.noticeTitle}>Obóz zimowy 2027</Text>
                <Text style={styles.noticeDate}>3 dni temu</Text>
              </View>
              <Text style={styles.noticeBody}>
                Przypominamy o zapisach na obóz zimowy. Szczegóły oraz formularze zgłoszeniowe dostępne są w sekretariacie klubu.
              </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  parentInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  greeting: { fontSize: 11, color: '#64748b' },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },

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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  cardPaid: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  cardUnpaid: { borderColor: '#fecaca', backgroundColor: '#fff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeMonth: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  feeAmount: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgeUnpaid: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeTextPaid: { color: '#16a34a' },
  badgeTextUnpaid: { color: '#dc2626' },
  payBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  historySection: { marginTop: 8 },
  historyRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyText: { fontSize: 12, color: '#334155' },
  historySuccess: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },

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
  },
  confirmLabel: { fontSize: 12, color: '#334155', fontWeight: '600', marginBottom: 8 },
  confirmButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  confirmYes: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginRight: 6 },
  confirmNo: { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginLeft: 6 },
  confirmSelectedYes: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  confirmSelectedNo: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  confirmYesText: { color: '#16a34a', fontWeight: 'bold', fontSize: 12 },
  confirmNoText: { color: '#dc2626', fontWeight: 'bold', fontSize: 12 },

  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noticeHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginLeft: 6, flex: 1 },
  noticeDate: { fontSize: 10, color: '#94a3b8' },
  noticeBody: { fontSize: 12, color: '#475569', lineHeight: 18 },
});