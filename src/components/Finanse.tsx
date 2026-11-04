import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from './PlayersContext';
import { supabase } from '../services/supabase';

type PaymentStatus = 'oplacone' | 'zaleglosc' | 'czesciowo';
type YearFilter = 'WSZYSTKIE' | '2012' | '2013' | '2014';
type FinanseTab = 'skladki' | 'indywidualne';

interface PaymentRecord {
  id?: string;
  playerId: string;
  month: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  lastPaymentDate?: string;
}

interface IndividualPayment {
  id: string;
  playerName: string;
  date: string;
  amount: number;
  status: 'Opłacone' | 'Oczekuje';
}

export default function FinanseScreen() {
  const { players } = usePlayers();

  const [activeTab, setActiveTab] = useState<FinanseTab>('skladki');
  const [selectedYear, setSelectedYear] = useState<YearFilter>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('Październik 2026');
  const [loading, setLoading] = useState<boolean>(true);

  // Stany modali
  const [reminderModalVisible, setReminderModalVisible] = useState<boolean>(false);
  const [selectedPlayerForReminder, setSelectedPlayerForReminder] = useState<any>(null);

  // Stan płatności składek pobierany z Supabase (klucz to ID zawodnika)
  const [payments, setPayments] = useState<{ [playerId: string]: PaymentRecord }>({});

  // Stan płatności za treningi indywidualne (1-on-1)
  const [individualPayments, setIndividualPayments] = useState<IndividualPayment[]>([
    { id: '1', playerName: 'Kuba Nowak (Spoza listy)', date: '05.11.2026', amount: 100, status: 'Opłacone' },
    { id: '2', playerName: 'Michał Wiśniewski', date: '05.11.2026', amount: 100, status: 'Oczekuje' },
  ]);

  const DEFAULT_AMOUNT = 180;

  // Pobieranie danych o płatnościach z Supabase przy zmianie miesiąca
  useEffect(() => {
    fetchPaymentsFromSupabase();
  }, [selectedMonth]);

  const fetchPaymentsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*');

      if (error) throw error;

      const paymentsMap: { [playerId: string]: PaymentRecord } = {};
      if (data) {
        data.forEach((item: any) => {
          let appStatus: PaymentStatus = 'zaleglosc';
          if (item.status === 'PAID') appStatus = 'oplacone';
          else if (item.status === 'PENDING') appStatus = 'czesciowo';
          else if (item.status === 'OVERDUE') appStatus = 'zaleglosc';

          paymentsMap[item.player_id] = {
            id: item.id,
            playerId: item.player_id,
            month: selectedMonth,
            amountDue: DEFAULT_AMOUNT,
            amountPaid: appStatus === 'oplacone' ? DEFAULT_AMOUNT : (appStatus === 'czesciowo' ? DEFAULT_AMOUNT / 2 : 0),
            status: appStatus,
            lastPaymentDate: item.paid_at ? item.paid_at.split('T')[0] : undefined,
          };
        });
      }
      setPayments(paymentsMap);
    } catch (err: any) {
      console.error('Błąd pobierania płatności:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    return 'Zawodnik';
  };

  // Filtrowanie zawodników z użyciem globalnego kontekstu
  const filteredPlayers = useMemo(() => {
    return players.filter((p: any) => {
      const pName = getPlayerName(p).toLowerCase();
      const matchesSearch = pName.includes(searchQuery.toLowerCase());

      const pYear = String(p.year || '2012');
      const matchesYear = selectedYear === 'WSZYSTKIE' || pYear === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [players, searchQuery, selectedYear]);

  // Statystyki finansowe składek
  const stats = useMemo(() => {
    let totalPaidCount = 0;
    let totalOverdueCount = 0;
    let totalCollected = 0;

    filteredPlayers.forEach((p: any) => {
      const pay = payments[p.id] || { status: 'zaleglosc', amountPaid: 0 };
      if (pay.status === 'oplacone') totalPaidCount++;
      if (pay.status === 'zaleglosc') totalOverdueCount++;
      totalCollected += pay.amountPaid;
    });

    const percent = filteredPlayers.length > 0
      ? Math.round((totalPaidCount / filteredPlayers.length) * 100)
      : 0;

    return { totalPaidCount, totalOverdueCount, totalCollected, percent };
  }, [filteredPlayers, payments]);

  // Statystyki treningów indywidualnych
  const individualStats = useMemo(() => {
    let collected = 0;
    let pendingCount = 0;
    individualPayments.forEach(item => {
      if (item.status === 'Opłacone') collected += item.amount;
      else pendingCount++;
    });
    return { collected, pendingCount };
  }, [individualPayments]);

  // Zmiana statusu wpłaty składki i zapis w Supabase
  const togglePaymentStatus = async (playerId: string) => {
    const current = payments[playerId] || { 
      playerId, 
      month: selectedMonth, 
      amountDue: DEFAULT_AMOUNT, 
      amountPaid: 0, 
      status: 'zaleglosc' 
    };

    let newStatus: PaymentStatus = 'oplacone';
    let newPaid = DEFAULT_AMOUNT;

    if (current.status === 'oplacone') {
      newStatus = 'zaleglosc';
      newPaid = 0;
    } else if (current.status === 'zaleglosc') {
      newStatus = 'czesciowo';
      newPaid = DEFAULT_AMOUNT / 2;
    } else {
      newStatus = 'oplacone';
      newPaid = DEFAULT_AMOUNT;
    }

    const dbStatus = newStatus === 'oplacone' ? 'PAID' : (newStatus === 'czesciowo' ? 'PENDING' : 'OVERDUE');
    const paidAtValue = newStatus === 'oplacone' ? new Date().toISOString() : null;

    setPayments((prev) => ({
      ...prev,
      [playerId]: {
        ...current,
        status: newStatus,
        amountPaid: newPaid,
        lastPaymentDate: newStatus === 'oplacone' ? new Date().toISOString().split('T')[0] : current.lastPaymentDate,
      },
    }));

    try {
      const monthNumber = 10; 
      const yearNumber = 2026;

      const { error } = await supabase.from('payments').upsert(
        {
          player_id: playerId,
          month: monthNumber,
          year: yearNumber,
          amount: DEFAULT_AMOUNT,
          status: dbStatus,
          paid_at: paidAtValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,month,year' }
      );

      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Błąd zapisu', 'Nie udało się zaktualizować płatności w bazie: ' + err.message);
      fetchPaymentsFromSupabase();
    }
  };

  // Zmiana statusu płatności za trening indywidualny
  const toggleIndividualStatus = (id: string) => {
    setIndividualPayments(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newStatus = item.status === 'Opłacone' ? 'Oczekuje' : 'Opłacone';
          Alert.alert('Status zmieniony', `Płatność dla ${item.playerName} oznaczona jako: ${newStatus}`);
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const openReminderModal = (player: any) => {
    setSelectedPlayerForReminder(player);
    setReminderModalVisible(true);
  };

  const copyReminderText = () => {
    const pName = selectedPlayerForReminder ? getPlayerName(selectedPlayerForReminder) : 'Zawodnik';
    Alert.alert(
      'Skopiowano do Schowka! 📋',
      `Przypomnienie dla rodzica zawodnika ${pName} za miesiąc ${selectedMonth} (Kwota: ${DEFAULT_AMOUNT} zł) jest gotowe do wysłania na WhatsApp.`
    );
    setReminderModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Finanse i Rozliczenia Akademii 💳</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'skladki' ? `Ewidencja wpłat miesięcznych: ${selectedMonth}` : 'Kontrola opłat za treningi 1-on-1'}
          </Text>
        </View>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK FINANSOWYCH */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'skladki' && styles.tabBtnActive]}
          onPress={() => setActiveTab('skladki')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'skladki' && styles.tabBtnTextActive]}>
            Składki członkowskie
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'indywidualne' && styles.tabBtnActive]}
          onPress={() => setActiveTab('indywidualne')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'indywidualne' && styles.tabBtnTextActive]}>
            Rozliczenia 1-on-1
          </Text>
        </TouchableOpacity>
      </View>

      {/* KARTY STATYSTYK FINANSOWYCH */}
      {activeTab === 'skladki' ? (
        <View style={styles.statsCardRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Zebrane środki</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.totalCollected} zł</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Opłacone</Text>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>{stats.percent}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Zaległości</Text>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.totalOverdueCount} os.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.statsCardRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Przychody 1-on-1</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{individualStats.collected} zł</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Oczekujące płatności</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{individualStats.pendingCount} os.</Text>
          </View>
        </View>
      )}

      {/* FILTRY (TYLKO DLA SKŁADEK) */}
      {activeTab === 'skladki' && (
        <View style={styles.filtersSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj zawodnika..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <Text style={styles.filterGroupLabel}>Rocznik:</Text>
            {(['WSZYSTKIE', '2012', '2013', '2014'] as YearFilter[]).map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[
                  styles.chipFilter,
                  selectedYear === yr && styles.chipFilterActive,
                ]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ZAWARTOŚĆ GŁÓWNA */}
      {activeTab === 'skladki' ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>
              Lista Zawodników ({filteredPlayers.length})
            </Text>

            {filteredPlayers.map((player: any) => {
              const pName = getPlayerName(player);
              const pYear = player.year || '2012';
              const pay = payments[player.id] || {
                playerId: player.id,
                month: selectedMonth,
                amountDue: DEFAULT_AMOUNT,
                amountPaid: 0,
                status: 'zaleglosc',
              };

              return (
                <View key={player.id} style={styles.card}>
                  <View style={styles.cardMainRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>#{player.number || player.id.slice(0, 2)}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.playerName}>{pName}</Text>
                      <Text style={styles.playerMeta}>Rocznik {pYear} | Składka: {DEFAULT_AMOUNT} zł</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        pay.status === 'oplacone' && styles.statusBadgeGreen,
                        pay.status === 'zaleglosc' && styles.statusBadgeRed,
                        pay.status === 'czesciowo' && styles.statusBadgeYellow,
                      ]}
                      onPress={() => togglePaymentStatus(player.id)}
                    >
                      <Text style={styles.statusBadgeText}>
                        {pay.status === 'oplacone' ? 'Opłacone' : pay.status === 'zaleglosc' ? 'Zaległość' : 'Częściowo'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {pay.status !== 'oplacone' && (
                    <View style={styles.cardFooter}>
                      <Text style={styles.footerInfoText}>
                        Wpłacono: {pay.amountPaid} zł / {DEFAULT_AMOUNT} zł
                      </Text>
                      <TouchableOpacity
                        style={styles.remindBtn}
                        onPress={() => openReminderModal(player)}
                      >
                        <Ionicons name="logo-whatsapp" size={13} color="#25d366" />
                        <Text style={styles.remindBtnText}>Przypomnij rodzicowi</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Płatności za sesje prywatne 1-on-1</Text>

          {individualPayments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardMainRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{item.playerName}</Text>
                  <Text style={styles.playerMeta}>Data: {item.date} • Kwota: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.amount} PLN</Text></Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    item.status === 'Opłacone' ? styles.statusBadgeGreen : styles.statusBadgeYellow,
                  ]}
                  onPress={() => toggleIndividualStatus(item.id)}
                >
                  <Text style={styles.statusBadgeText}>
                    {item.status} (Zmień)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* MODAL: PRZYPOMNIENIE O SKŁADCE */}
      <Modal animationType="slide" transparent={true} visible={reminderModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ponaglenie Wpłaty 💬</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Podgląd wiadomości do rodzica:</Text>
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                Dzień dobry! 👋{'\n\n'}
                Przypominamy o uregulowaniu składki członkowskiej za miesiąc{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedMonth}</Text> dla zawodnika{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {selectedPlayerForReminder ? getPlayerName(selectedPlayerForReminder) : ''}
                </Text>
                .{'\n\n'}
                Kwota do zapłaty: {DEFAULT_AMOUNT} zł.{'\n'}
                Prosimy o wykonanie przelewu na konto klubu. Dziękujemy!
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={copyReminderText}>
              <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Skopiuj treść monitu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  tabBtnTextActive: { color: '#fff' },

  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a', padding: 0 },

  filterGroupLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', alignSelf: 'center', marginRight: 6 },
  chipFilter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
  },
  chipFilterActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardMainRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  statusBadgeGreen: { backgroundColor: '#dcfce7' },
  statusBadgeRed: { backgroundColor: '#fee2e2' },
  statusBadgeYellow: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerInfoText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  remindBtnText: { fontSize: 10, fontWeight: 'bold', color: '#166534', marginLeft: 4 },

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 6 },
  previewBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 16 },
  previewText: { fontSize: 12, color: '#0f172a', lineHeight: 18 },

  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});