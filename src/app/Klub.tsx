import React, { useState } from 'react';
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
import { useTeamStore, FeeItem, Player } from './store/useTeamStore';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from './services/notificationService';

export default function KlubScreen() {
  const players: Player[] = useTeamStore((state: any) => state.players);
  const fees: FeeItem[] = useTeamStore((state: any) => state.fees);
  const toggleFeePaid = useTeamStore((state: any) => state.toggleFeePaid);

  const [pushToken, setPushToken] = useState<string | null>(null);

  // Rejestracja i włączenie powiadomień
  const handleEnableNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setPushToken(token);
      Alert.alert('Powiadomienia aktywne', 'Uprawnienia do powiadomień zostały udzielone!');
    } else {
      Alert.alert(
        'Powiadomienia lokalne',
        'Zarejestrowano uprawnienia dla powiadomień lokalnych.'
      );
    }
  };

  // Testowe powiadomienie wysyłane po 5 sekundach
  const handleTestNotification = async () => {
    await scheduleLocalNotification(
      '⚽ Przypomnienie meczowe',
      'Mecz ligowy rozpoczyna się za 2 godziny! Pamiętaj o odprawie.',
      5
    );
    Alert.alert('Zaplanowano test', 'Powiadomienie pojawi się na telefonie za 5 sekund.');
  };

  // Powiadomienie o nieopłaconych składkach
  const handleSendFeeReminders = async () => {
    const unpaidFees = fees.filter((f) => !f.paid);
    if (unpaidFees.length === 0) {
      Alert.alert('Wszystko opłacone', 'Brak zaległych składek w tym miesiącu.');
      return;
    }

    await scheduleLocalNotification(
      '💳 Przypomnienie o składkach',
      `Wykryto ${unpaidFees.length} nieopłaconych składek klubowych w tym miesiącu.`,
      3
    );
    Alert.alert('Wysłano przypomnienie', `Zaplanowano przypomnienie o ${unpaidFees.length} zaległych składkach.`);
  };

  const totalPaid = fees.filter((f) => f.paid).reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaid = fees.filter((f) => !f.paid).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Zarządzanie Klubem</Text>
          <Text style={styles.headerSubtitle}>Finanse, powiadomienia i organizacja</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SEKCJA POWIADOMIEŃ PUSH */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications" size={20} color="#2563eb" />
            <Text style={styles.cardTitle}>Powiadomienia Push & Lokalne</Text>
          </View>
          <Text style={styles.cardDescription}>
            Ustaw przypomnienia o nadchodzących treningach, meczach oraz terminkach składek.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEnableNotifications}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Włącz powiadomienia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleTestNotification}>
              <Ionicons name="time-outline" size={18} color="#2563eb" />
              <Text style={styles.secondaryBtnText}>Test (za 5 sek)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEKCJA SKŁADEK KLUBOWYCH */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="wallet-outline" size={20} color="#16a34a" />
              <Text style={styles.cardTitle}>Składki członkowskie</Text>
            </View>
            <TouchableOpacity style={styles.reminderBtn} onPress={handleSendFeeReminders}>
              <Ionicons name="paper-plane-outline" size={16} color="#2563eb" />
              <Text style={styles.reminderBtnText}>Przypomnij</Text>
            </TouchableOpacity>
          </View>

          {/* PODSUMOWANIE FINANSOWE */}
          <View style={styles.financeSummaryRow}>
            <View style={[styles.financeBox, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.financeLabel}>Zebrano</Text>
              <Text style={[styles.financeValue, { color: '#166534' }]}>{totalPaid} PLN</Text>
            </View>
            <View style={[styles.financeBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.financeLabel}>Zaległości</Text>
              <Text style={[styles.financeValue, { color: '#991b1b' }]}>{totalUnpaid} PLN</Text>
            </View>
          </View>

          {/* LISTA SKŁADEK */}
          <Text style={styles.sectionSubTitle}>Status składek zawodników:</Text>
          {fees.map((fee) => {
            const player = players.find((p) => p.id === fee.playerId);
            return (
              <View key={fee.id} style={styles.feeRow}>
                <View>
                  <Text style={styles.feePlayerName}>{player?.name || 'Zawodnik'}</Text>
                  <Text style={styles.feeMonth}>{fee.month} • {fee.amount} PLN</Text>
                </View>

                <TouchableOpacity
                  style={[styles.statusChip, fee.paid ? styles.statusPaid : styles.statusUnpaid]}
                  onPress={() => toggleFeePaid(fee.id)}
                >
                  <Ionicons
                    name={fee.paid ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={fee.paid ? '#166534' : '#991b1b'}
                  />
                  <Text style={[styles.statusText, { color: fee.paid ? '#166534' : '#991b1b' }]}>
                    {fee.paid ? 'Opłacone' : 'Brak wpłaty'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 6,
  },
  secondaryBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reminderBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    marginLeft: 4,
  },
  financeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financeBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  financeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  feePlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  feeMonth: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});