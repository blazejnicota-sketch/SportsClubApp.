import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTeamStore } from './store/useTeamStore';

export default function RaportyScreen() {
  const router = useRouter();
  const { players, events } = useTeamStore();

  const [filterType, setFilterType] = useState<'ALL' | 'TRENING' | 'MECZ LIGOWY' | 'SPARING'>('ALL');

  const getPlayerAttendanceStats = (playerId: string) => {
    const filteredEvents = events.filter((e: any) => {
      const squadList = e.squad || [];
      const isSquad = squadList.includes(playerId);
      const isTypeMatch = filterType === 'ALL' || e.type === filterType;
      return isSquad && isTypeMatch;
    });

    const totalCalledUp = filteredEvents.length;
    let confirmedCount = 0;
    let declinedCount = 0;

    filteredEvents.forEach((e: any) => {
      const status = e.responses?.[playerId];
      if (status === 'CONFIRMED') confirmedCount++;
      if (status === 'DECLINED') declinedCount++;
    });

    const percentage = totalCalledUp > 0 ? Math.round((confirmedCount / totalCalledUp) * 100) : 0;

    return { totalCalledUp, confirmedCount, declinedCount, percentage };
  };

  const handleExportReportToClipboard = () => {
    if (players.length === 0) {
      Alert.alert('Informacja', 'Brak zawodników do wygenerowania raportu!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const filterName = filterType === 'ALL' ? 'Wszystkie wydarzenia' : filterType;

    let report = `📊 RAPORT FREKWENCJI DRUŻYNY\n`;
    report += `🏆 Kategoria/Typ: ${filterName}\n`;
    report += `📅 Data wygenerowania: ${todayStr}\n\n`;
    report += `👥 Frekwencja zawodników:\n`;

    let totalPercentageSum = 0;

    players.forEach((p: any, idx: number) => {
      const stats = getPlayerAttendanceStats(p.id);
      totalPercentageSum += stats.percentage;
      report += `${idx + 1}. #${p.number || '-'} ${p.name} - ${stats.percentage}% (Obecności: ${stats.confirmedCount}/${stats.totalCalledUp})\n`;
    });

    const avgPercentage = players.length > 0 ? Math.round(totalPercentageSum / players.length) : 0;
    report += `\n📈 Średnia frekwencja całej drużyny: ${avgPercentage}%\n`;
    report += `\nWygenerowano z aplikacji Trenera.`;

    Clipboard.setString(report);
    Alert.alert(
      'Raport skopiowany! 📋',
      'Treść raportu frekwencji została skopiowana do schowka. Możesz ją wkleić w wiadomości e-mail lub na grupie WhatsApp/Messenger!'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Text style={styles.backButtonText}>← Główna</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raport Frekwencji</Text>
        <TouchableOpacity style={styles.exportBtnHeader} onPress={handleExportReportToClipboard}>
          <Text style={styles.exportBtnHeaderText}>📋 Kopiuj</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.exportBannerBtn} onPress={handleExportReportToClipboard}>
        <Text style={styles.exportBannerBtnText}>📋 Skopiuj raport dla Zarządu / Rodziców</Text>
      </TouchableOpacity>

      <View style={styles.filterRow}>
        {(['ALL', 'TRENING', 'MECZ LIGOWY', 'SPARING'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
              {type === 'ALL' ? 'Wszystkie' : type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {players.length === 0 ? (
          <Text style={styles.noDataText}>Brak zawodników w bazie.</Text>
        ) : (
          players.map((player: any) => {
            const stats = getPlayerAttendanceStats(player.id);
            const progressColor =
              stats.percentage >= 80 ? '#238636' : stats.percentage >= 50 ? '#d97706' : '#da3633';

            return (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.playerHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>
                      #{player.number || '-'} {player.name}
                    </Text>
                    <Text style={styles.playerSub}>{player.role || 'Zawodnik'} • U-11 ({player.birthYear || '2010'})</Text>
                  </View>
                  <View style={styles.percentageBadge}>
                    <Text style={[styles.percentageText, { color: progressColor }]}>
                      {stats.percentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${stats.percentage}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>

                <View style={styles.statsRow}>
                  <Text style={styles.statDetailText}>
                    Powołania: <Text style={styles.statBold}>{stats.totalCalledUp}</Text>
                  </Text>
                  <Text style={styles.statDetailText}>
                    🟢 Obecny: <Text style={styles.statBold}>{stats.confirmedCount}</Text>
                  </Text>
                  <Text style={styles.statDetailText}>
                    🔴 Nieobecny: <Text style={styles.statBold}>{stats.declinedCount}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  backButton: { backgroundColor: '#161b22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#30363d' },
  backButtonText: { color: '#58a6ff', fontWeight: '600', fontSize: 13 },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  exportBtnHeader: { backgroundColor: '#1f6feb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  exportBtnHeaderText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  exportBannerBtn: { backgroundColor: '#1f6feb', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#388bfd' },
  exportBannerBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterChip: { backgroundColor: '#161b22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#30363d' },
  filterChipActive: { backgroundColor: '#1f6feb', borderColor: '#388bfd' },
  filterChipText: { color: '#8b949e', fontSize: 11 },
  filterChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  playerCard: { backgroundColor: '#161b22', borderRadius: 8, borderWidth: 1, borderColor: '#30363d', padding: 12, marginBottom: 8 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  playerName: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  playerSub: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  percentageBadge: { backgroundColor: '#0d1117', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#21262d' },
  percentageText: { fontSize: 14, fontWeight: 'bold' },
  progressBarBackground: { height: 6, backgroundColor: '#0d1117', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#30363d', paddingTop: 6 },
  statDetailText: { color: '#8b949e', fontSize: 11 },
  statBold: { color: '#ffffff', fontWeight: 'bold' },
  noDataText: { color: '#8b949e', textAlign: 'center', marginTop: 20, fontSize: 13 },
});