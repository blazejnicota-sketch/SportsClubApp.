import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { usePlayers, Player } from './PlayersContext';

type YearFilter = 'WSZYSTKIE' | '2012' | '2013' | '2014' | '2016';
type FinanseTab = 'skladki' | 'indywidualne';

export default function FinanseScreen() {
  const { players, updatePlayer, availableYears } = usePlayers();

  const [activeTab, setActiveTab] = useState<FinanseTab>('skladki');
  const [selectedYear, setSelectedYear] = useState<YearFilter>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Zostawiamy dla płatności jednorazowych, ale składki idą prosto z profilu gracza
  const [selectedMonth, setSelectedMonth] = useState<string>('Bieżący miesiąc');

  // Stany modali
  const [reminderModalVisible, setReminderModalVisible] = useState<boolean>(false);
  const [selectedPlayerForReminder, setSelectedPlayerForReminder] = useState<Player | null>(null);

  // Stan płatności za treningi indywidualne (1-on-1) - w przyszłości też to wepniemy w bazę
  const [individualPayments, setIndividualPayments] = useState([
    { id: '1', playerName: 'Kuba Nowak (Spoza listy)', date: '05.11.2026', amount: 100, status: 'Opłacone' },
    { id: '2', playerName: 'Michał Wiśniewski', date: '05.11.2026', amount: 100, status: 'Oczekuje' },
  ]);

  // Filtrowanie zawodników z użyciem globalnego kontekstu (PlayersContext)
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // NAPRAWIONY BŁĄD 'toLowerCase' za pomocą optional chaining (?.)
      const pName = p.name?.toLowerCase() || '';
      const matchesSearch = pName.includes(searchQuery?.toLowerCase() || '');
      const pYear = String(p.year);
      const matchesYear = selectedYear === 'WSZYSTKIE' || pYear === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [players, searchQuery, selectedYear]);

  // Statystyki finansowe składek liczone w locie z bazy graczy
  const stats = useMemo(() => {
    let totalPaidCount = 0;
    let totalOverdueCount = 0;
    let totalCollected = 0;

    filteredPlayers.forEach((p) => {
      // Zakładamy, że balance = 0 to stan opłacony. Minus to zaległość, plus to nadpłata.
      const balance = p.balance || 0;
      const fee = p.monthlyFee || 150;

      if (balance < 0) {
        totalOverdueCount++;
        // Zebraliśmy tylko to, co wystaje ponad debet (np. składka 150, saldo -50, to wpłacił 100)
        totalCollected += Math.max(0, fee + balance);
      } else {
        totalPaidCount++;
        totalCollected += fee;
      }
    });

    const percent = filteredPlayers.length > 0
      ? Math.round((totalPaidCount / filteredPlayers.length) * 100)
      : 0;

    return { totalPaidCount, totalOverdueCount, totalCollected, percent };
  }, [filteredPlayers]);

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

  // AKCJA 1: Zmiana statusu opłaty w Karcie Zawodnika
  const togglePaymentStatus = async (player: Player) => {
    const fee = player.monthlyFee || 150;
    const currentBalance = player.balance || 0;

    // Prosta maszyna stanów: Opłacone(0) -> Zaległość (-fee) -> Częściowo (-fee/2) -> Opłacone(0)
    let newBalance = 0;

    if (currentBalance >= 0) {
      newBalance = -fee; // Było opłacone, robimy na minus
    } else if (currentBalance === -fee) {
      newBalance = -(fee / 2); // Była pełna zaległość, oznaczamy połowę
    } else {
      newBalance = 0; // Wyrównanie rachunku
    }

    await updatePlayer(player.id, { balance: newBalance });
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

  const openReminderModal = (player: Player) => {
    setSelectedPlayerForReminder(player);
    setReminderModalVisible(true);
  };

  const copyReminderText = async () => {
    if (!selectedPlayerForReminder) return;
    
    const fee = selectedPlayerForReminder.monthlyFee || 150;
    const balance = selectedPlayerForReminder.balance || 0;
    const debtAmount = Math.abs(balance); // Kwota zaległości

    const text = `Dzień dobry! 👋\n\nPrzypominamy uprzejmie o uregulowaniu płatności za treningi dla zawodnika ${selectedPlayerForReminder.name}.\n\nObecne saldo zaległości wynosi: ${debtAmount} zł.\nProsimy o wykonanie przelewu na konto klubu. Dziękujemy!`;
    
    await Clipboard.setStringAsync(text);
    Alert.alert('Skopiowano do Schowka! 📋', 'Gotowe do wysłania na WhatsApp rodzica.');
    setReminderModalVisible(false);
  };

  // NOWOŚĆ: Masowy komunikat dla wszystkich dłużników
  const copyBulkReminderText = async () => {
    const debtors = filteredPlayers.filter(p => (p.balance || 0) < 0);
    
    if (debtors.length === 0) {
      Alert.alert('Brak zaległości', 'Wszyscy widoczni zawodnicy mają opłacone składki!');
      return;
    }

    let text = `🚨 *RAPORT ZALEGŁOŚCI SKŁADEK* 🚨\nDo zapłaty pozostali:\n\n`;
    debtors.forEach(d => {
      text += `• ${d.name} -> Do wpłaty: ${Math.abs(d.balance || 0)} zł\n`;
    });
    
    await Clipboard.setStringAsync(text);
    Alert.alert('Zrobione 📋', `Lista ${debtors.length} dłużników została skopiowana. Możesz ją wkleić w wiadomości.`);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Finanse i Rozliczenia 💳</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'skladki' ? `Ewidencja wpłat miesięcznych` : 'Rozliczenia dodatkowe 1-on-1'}
          </Text>
        </View>
        
        {/* NOWOŚĆ: Masowe rozliczenie */}
        {activeTab === 'skladki' && stats.totalOverdueCount > 0 && (
           <TouchableOpacity style={styles.bulkBtn} onPress={copyBulkReminderText}>
             <Ionicons name="chatbubbles" size={14} color="#fff" />
           </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'skladki' && styles.tabBtnActive]} onPress={() => setActiveTab('skladki')}>
          <Text style={[styles.tabBtnText, activeTab === 'skladki' && styles.tabBtnTextActive]}>Klubowe Składki</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'indywidualne' && styles.tabBtnActive]} onPress={() => setActiveTab('indywidualne')}>
          <Text style={[styles.tabBtnText, activeTab === 'indywidualne' && styles.tabBtnTextActive]}>Treningi 1-on-1</Text>
        </TouchableOpacity>
      </View>

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
            {['WSZYSTKIE', ...availableYears].map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[styles.chipFilter, selectedYear === yr && styles.chipFilterActive]}
                onPress={() => setSelectedYear(yr as YearFilter)}
              >
                <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ZAWARTOŚĆ GŁÓWNA */}
      {activeTab === 'skladki' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>
            Bieżące Salda Zawodników ({filteredPlayers.length})
          </Text>

          {filteredPlayers.map((player) => {
            const balance = player.balance || 0;
            const fee = player.monthlyFee || 150;
            
            // Określamy wizualny status na podstawie balansu
            let badgeText = 'Opłacone';
            let badgeStyle = styles.statusBadgeGreen;
            
            if (balance === -fee) {
              badgeText = 'Zaległość';
              badgeStyle = styles.statusBadgeRed;
            } else if (balance < 0) {
              badgeText = 'Częściowo';
              badgeStyle = styles.statusBadgeYellow;
            } else if (balance > 0) {
              badgeText = 'Nadpłata';
              badgeStyle = styles.statusBadgeGreen;
            }

            return (
              <View key={player.id} style={styles.card}>
                <View style={styles.cardMainRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>#{player.number}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerMeta}>Rocznik {player.year} | Składka: {fee} zł</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.statusBadge, badgeStyle]}
                    onPress={() => togglePaymentStatus(player)}
                  >
                    <Text style={styles.statusBadgeText}>{badgeText}</Text>
                  </TouchableOpacity>
                </View>

                {balance < 0 && (
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerInfoText}>
                      Do zapłaty: {Math.abs(balance)} zł
                    </Text>
                    <TouchableOpacity style={styles.remindBtn} onPress={() => openReminderModal(player)}>
                      <Ionicons name="logo-whatsapp" size={13} color="#25d366" />
                      <Text style={styles.remindBtnText}>Monit do rodzica</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
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
                  style={[styles.statusBadge, item.status === 'Opłacone' ? styles.statusBadgeGreen : styles.statusBadgeYellow]}
                  onPress={() => toggleIndividualStatus(item.id)}
                >
                  <Text style={styles.statusBadgeText}>{item.status} (Zmień)</Text>
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
                Przypominamy uprzejmie o uregulowaniu płatności za treningi dla zawodnika{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedPlayerForReminder?.name}</Text>.{'\n\n'}
                Obecne saldo zaległości wynosi:{' '}
                <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  {selectedPlayerForReminder ? Math.abs(selectedPlayerForReminder.balance || 0) : 0} zł
                </Text>.{'\n'}
                Prosimy o wykonanie przelewu na konto klubu. Dziękujemy!
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={copyReminderText}>
              <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Skopiuj treść monitu do wysłania</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  bulkBtn: { backgroundColor: '#dc2626', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  tabBtnActive: { backgroundColor: '#2563eb' },
  tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  tabBtnTextActive: { color: '#fff' },

  statsCardRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  statCard: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  statValue: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },

  filtersSection: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a', padding: 0 },
  filterGroupLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', alignSelf: 'center', marginRight: 6 },
  chipFilter: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9', marginRight: 4 },
  chipFilterActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  cardMainRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9' },
  statusBadgeGreen: { backgroundColor: '#dcfce7' },
  statusBadgeRed: { backgroundColor: '#fee2e2' },
  statusBadgeYellow: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerInfoText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  remindBtnText: { fontSize: 10, fontWeight: 'bold', color: '#166534', marginLeft: 4 },

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