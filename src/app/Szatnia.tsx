import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamStore, Player, TestResult, FeeItem, EventItem } from './store/useTeamStore';

export default function SzatniaScreen() {
  const players: Player[] = useTeamStore((state: any) => state.players);
  const testResults: TestResult[] = useTeamStore((state: any) => state.testResults);
  const fees: FeeItem[] = useTeamStore((state: any) => state.fees);
  const events: EventItem[] = useTeamStore((state: any) => state.events);

  const currentRole = useTeamStore((state: any) => state.currentRole);
  const activePlayerId = useTeamStore((state: any) => state.activePlayerId);
  const setCurrentRole = useTeamStore((state: any) => state.setCurrentRole);
  const setActivePlayerId = useTeamStore((state: any) => state.setActivePlayerId);

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];
  const playerTests = testResults.filter((t) => t.playerId === activePlayer?.id);
  const playerFees = fees.filter((f) => f.playerId === activePlayer?.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Szatnia & Profile</Text>
          <Text style={styles.headerSubtitle}>Przełączanie ról i perspektywy użytkownika</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SEKCJA PRZEŁĄCZANIA RÓL */}
        <Text style={styles.sectionTitle}>Wybierz aktywną rolę:</Text>
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, currentRole === 'TRENER' && styles.roleBtnActive]}
            onPress={() => setCurrentRole('TRENER')}
          >
            <Ionicons
              name="briefcase"
              size={18}
              color={currentRole === 'TRENER' ? '#ffffff' : '#475569'}
            />
            <Text style={[styles.roleBtnText, currentRole === 'TRENER' && styles.roleBtnTextActive]}>
              Trener
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, currentRole === 'ZAWODNIK' && styles.roleBtnActive]}
            onPress={() => setCurrentRole('ZAWODNIK')}
          >
            <Ionicons
              name="fitness"
              size={18}
              color={currentRole === 'ZAWODNIK' ? '#ffffff' : '#475569'}
            />
            <Text style={[styles.roleBtnText, currentRole === 'ZAWODNIK' && styles.roleBtnTextActive]}>
              Zawodnik
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, currentRole === 'RODZIC' && styles.roleBtnActive]}
            onPress={() => setCurrentRole('RODZIC')}
          >
            <Ionicons
              name="heart"
              size={18}
              color={currentRole === 'RODZIC' ? '#ffffff' : '#475569'}
            />
            <Text style={[styles.roleBtnText, currentRole === 'RODZIC' && styles.roleBtnTextActive]}>
              Rodzic
            </Text>
          </TouchableOpacity>
        </View>

        {/* WYBÓR AKTYWNEGO ZAWODNIKA / DZIECKA (Gdy rola to Zawodnik lub Rodzic) */}
        {currentRole !== 'TRENER' && (
          <View style={styles.playerSelectBox}>
            <Text style={styles.inputLabel}>
              {currentRole === 'RODZIC' ? 'Wybierz swoje dziecko:' : 'Wybierz swój profil:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {players.map((p) => {
                const isSelected = p.id === activePlayerId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, isSelected && styles.playerChipActive]}
                    onPress={() => setActivePlayerId(p.id)}
                  >
                    <Text style={[styles.playerChipText, isSelected && styles.playerChipTextActive]}>
                      {p.name} #{p.number}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* WIDOK TRENERA */}
        {currentRole === 'TRENER' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={22} color="#2563eb" />
              <Text style={styles.cardTitle}>Panel Trenera / Administratora</Text>
            </View>
            <Text style={styles.cardDesc}>
              Masz pełne uprawnienia do zarządzania zespołem, dodawania wydarzeń, analizy wyników oraz prowadzenia meczu na żywo.
            </Text>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>Liczba zawodników w kadrze: {players.length}</Text>
            </View>
          </View>
        )}

        {/* WIDOK ZAWODNIKA */}
        {currentRole === 'ZAWODNIK' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={22} color="#16a34a" />
              <Text style={styles.cardTitle}>Profil Zawodnika: {activePlayer?.name}</Text>
            </View>

            <View style={styles.playerDetailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Numer:</Text>
                <Text style={styles.detailValue}>#{activePlayer?.number || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pozycja:</Text>
                <Text style={styles.detailValue}>{activePlayer?.position || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Rola:</Text>
                <Text style={styles.detailValue}>{activePlayer?.role || '-'}</Text>
              </View>
            </View>

            <Text style={styles.subHeaderTitle}>Ostatnie wyniki testów:</Text>
            {playerTests.length === 0 ? (
              <Text style={styles.emptyText}>Brak zarejestrowanych testów motorycznych.</Text>
            ) : (
              playerTests.map((t) => (
                <View key={t.id} style={styles.rowItem}>
                  <Text style={styles.rowTitle}>{t.testName || t.name}</Text>
                  <Text style={styles.rowVal}>{t.resultValue ?? t.value}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* WIDOK RODZICA */}
        {currentRole === 'RODZIC' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-circle" size={22} color="#dc2626" />
              <Text style={styles.cardTitle}>Karta Rodzica: {activePlayer?.name}</Text>
            </View>

            <Text style={styles.subHeaderTitle}>Status składek członkowskich:</Text>
            {playerFees.length === 0 ? (
              <Text style={styles.emptyText}>Brak przypisanych składek.</Text>
            ) : (
              playerFees.map((f) => (
                <View key={f.id} style={styles.rowItem}>
                  <Text style={styles.rowTitle}>{f.month} ({f.amount} PLN)</Text>
                  <Text style={[styles.statusTag, f.paid ? styles.statusPaid : styles.statusUnpaid]}>
                    {f.paid ? 'OPŁACONE' : 'DO ZAPŁATY'}
                  </Text>
                </View>
              ))
            )}

            <Text style={styles.subHeaderTitle}>Nadchodzące mecze i treningi:</Text>
            {events.map((e) => (
              <View key={e.id} style={styles.rowItem}>
                <View>
                  <Text style={styles.rowTitle}>{e.title}</Text>
                  <Text style={styles.rowSub}>{e.date} o godz. {e.time}</Text>
                </View>
                <Text style={styles.eventTypeTag}>{e.type}</Text>
              </View>
            ))}
          </View>
        )}
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
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  roleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  roleBtnTextActive: {
    color: '#ffffff',
  },
  playerSelectBox: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  horizontalList: {
    flexDirection: 'row',
  },
  playerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  playerChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  playerChipText: {
    fontSize: 13,
    color: '#334155',
  },
  playerChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  infoBadge: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoBadgeText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 13,
  },
  playerDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  subHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748b',
  },
  rowVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statusTag: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusUnpaid: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  eventTypeTag: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});