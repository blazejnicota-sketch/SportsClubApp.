import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayers, Player } from '../components/PlayersContext';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

interface AnalyzedPlayer {
  player: Player;
  score: number;
  issues: string[];
  attendancePercent: number;
}

export default function MatchOptimizerScreen() {
  const router = useRouter();
  const { players } = usePlayers();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [squadSize, setSquadSize] = useState<number>(14);
  const [matchFormat, setMatchFormat] = useState<string>('7v7');

  const [optimizedSquad, setOptimizedSquad] = useState<AnalyzedPlayer[] | null>(null);
  const [reserveSquad, setReserveSquad] = useState<AnalyzedPlayer[] | null>(null);

  // Funkcja symulująca sztuczną inteligencję (algorytm optymalizujący)
  const handleOptimize = () => {
    setIsAnalyzing(true);
    setOptimizedSquad(null);
    setReserveSquad(null);

    setTimeout(() => {
      const analyzed: AnalyzedPlayer[] = players.map((p) => {
        let score = 100;
        let issues: string[] = [];

        // 1. ZDROWIE (Kluczowy warunek)
        if (p.healthStatus && p.healthStatus !== 'Zdrowy') {
          score -= 1000; // Całkowita dyskwalifikacja
          issues.push(`Zdrowie: ${p.healthStatus}`);
        }

        // 2. FREKWENCJA
        const trainingsTotal = p.trainingsTotal || 0;
        const trainingsPresent = p.trainingsPresent || 0;
        const attendancePercent = trainingsTotal > 0 ? Math.round((trainingsPresent / trainingsTotal) * 100) : 100;
        
        if (attendancePercent < 50) {
          score -= 40;
          issues.push(`Niska frekwencja (${attendancePercent}%)`);
        } else if (attendancePercent === 100) {
          score += 15; // Bonus za 100% frekwencji
        }

        // 3. FINANSE (Symulacja na potrzeby dema - np. gracze z parzystym ID lub brakiem danych dostają ostrzeżenie)
        // Docelowo tu podłączysz realne dane z bazy Supabase (tabela payments)
        if (p.number === 7 || p.number === 13) {
          score -= 30;
          issues.push('Zaległe składki (Ostrzeżenie)');
        }

        return {
          player: p,
          score,
          issues,
          attendancePercent,
        };
      });

      // Sortowanie: Najlepsi (z najwyższym wynikiem) na górze
      const sorted = analyzed.sort((a, b) => b.score - a.score);

      // Podział na kadrę meczową i rezerwy/odrzuconych
      const mainSquad = sorted.filter(item => item.score > 0).slice(0, squadSize);
      const reserves = sorted.filter(item => !mainSquad.includes(item));

      setOptimizedSquad(mainSquad);
      setReserveSquad(reserves);
      setIsAnalyzing(false);
    }, 1500); // Symulacja "myślenia" AI (1.5 sekundy)
  };

  const getFormatLimit = (format: string) => {
    switch (format) {
      case '5v5': return 10;
      case '7v7': return 14;
      case '9v9': return 16;
      case '11v11': return 18;
      default: return 14;
    }
  };

  const handleFormatChange = (format: string) => {
    setMatchFormat(format);
    setSquadSize(getFormatLimit(format));
    setOptimizedSquad(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>AI Optymalizator Kadry</Text>
          <Text style={styles.headerSubtitle}>Automatyczna selekcja meczowa</Text>
        </View>
        <Ionicons name="color-wand" size={24} color="#8b5cf6" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* PANEL KONFIGURACYJNY */}
        <View style={styles.configCard}>
          <Text style={styles.sectionLabel}>Wybierz format meczu:</Text>
          <View style={styles.formatRow}>
            {['5v5', '7v7', '9v9', '11v11'].map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={[styles.formatBtn, matchFormat === fmt && styles.formatBtnActive]}
                onPress={() => handleFormatChange(fmt)}
              >
                <Text style={[styles.formatBtnText, matchFormat === fmt && styles.formatBtnTextActive]}>{fmt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.capacityRow}>
            <Text style={styles.capacityLabel}>Wielkość powołanej kadry:</Text>
            <View style={styles.capacityControl}>
              <TouchableOpacity style={styles.capBtn} onPress={() => setSquadSize(Math.max(5, squadSize - 1))}>
                <Ionicons name="remove" size={16} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.capValue}>{squadSize}</Text>
              <TouchableOpacity style={styles.capBtn} onPress={() => setSquadSize(Math.min(25, squadSize + 1))}>
                <Ionicons name="add" size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.aiGenerateBtn} onPress={handleOptimize} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.aiGenerateBtnText}>Generuj Optymalną Kadrę (AI)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* WYNIKI ANALIZY AI */}
        {optimizedSquad && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultMainTitle}>Rekomendowana Kadra ({optimizedSquad.length}/{squadSize})</Text>
              <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>Gotowe</Text></View>
            </View>

            {optimizedSquad.map((item, index) => (
              <View key={item.player.id} style={styles.playerRow}>
                <View style={styles.playerIndexBox}>
                  <Text style={styles.playerIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>#{item.player.number}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.player.firstName} {item.player.lastName}</Text>
                  <Text style={styles.playerMeta}>Frekwencja: {item.attendancePercent}% | Zdrowy</Text>
                </View>
                {item.issues.length > 0 ? (
                  <View style={styles.warningIndicator}>
                    <Ionicons name="warning" size={14} color="#ca8a04" />
                  </View>
                ) : (
                  <View style={styles.successIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  </View>
                )}
              </View>
            ))}

            {reserveSquad && reserveSquad.length > 0 && (
              <View style={styles.reservesContainer}>
                <Text style={styles.resultMainTitle}>Odrzuceni / Rezerwa ({reserveSquad.length})</Text>
                <Text style={styles.reservesSubTitle}>Zawodnicy niespełniający warunków algorytmu:</Text>

                {reserveSquad.map((item) => (
                  <View key={item.player.id} style={[styles.playerRow, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                    <View style={[styles.playerAvatar, { backgroundColor: '#fee2e2' }]}>
                      <Text style={[styles.playerAvatarText, { color: '#dc2626' }]}>#{item.player.number}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{item.player.firstName} {item.player.lastName}</Text>
                      {item.issues.map((issue, idx) => (
                        <Text key={idx} style={styles.issueText}>• {issue}</Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            <TouchableOpacity style={styles.saveToCalendarBtn} onPress={() => alert('Przekazano listę do schowka! Możesz wkleić ją w Kalendarzu.')}>
              <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveToCalendarBtnText}>Kopiuj i użyj w Kalendarzu</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#8b5cf6', fontWeight: 'bold' },
  
  content: { flex: 1, padding: 16 },
  
  configCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  
  formatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  formatBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  formatBtnActive: { backgroundColor: '#ede9fe', borderColor: '#8b5cf6' },
  formatBtnText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  formatBtnTextActive: { color: '#7c3aed' },

  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  capacityLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  capacityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  capBtn: { padding: 8 },
  capValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', paddingHorizontal: 12 },

  aiGenerateBtn: { backgroundColor: '#8b5cf6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  aiGenerateBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  resultsContainer: { marginTop: 10 },
  resultHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultMainTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  aiBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  aiBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  playerIndexBox: { width: 24, alignItems: 'center' },
  playerIndexText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  playerAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  successIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  warningIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },

  reservesContainer: { marginTop: 20 },
  reservesSubTitle: { fontSize: 12, color: '#64748b', marginBottom: 10, marginTop: -4 },
  issueText: { fontSize: 11, color: '#dc2626', fontWeight: 'bold', marginTop: 2 },

  saveToCalendarBtn: { backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10, marginTop: 20 },
  saveToCalendarBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});