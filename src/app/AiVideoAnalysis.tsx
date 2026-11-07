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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayers, Player } from '../components/PlayersContext';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type AnalysisState = 'idle' | 'recording' | 'analyzing' | 'results';

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export default function AiVideoAnalysisScreen() {
  const router = useRouter();
  const { players } = usePlayers();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [drillType, setDrillType] = useState<string>('Strzał na bramkę');
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const startRecording = () => {
    if (!selectedPlayer) {
      alert('Wybierz najpierw zawodnika!');
      return;
    }
    setAnalysisState('recording');
    // Symulacja nagrywania trwającego 3 sekundy
    setTimeout(() => {
      startAnalysis();
    }, 3000);
  };

  const startAnalysis = () => {
    setAnalysisState('analyzing');
    // Symulacja analizy AI trwającej 2 sekundy
    setTimeout(() => {
      generateMockResults();
      setAnalysisState('results');
    }, 2500);
  };

  const generateMockResults = () => {
    const mockResults: Record<string, AnalysisResult> = {
      'Strzał na bramkę': {
        score: 78,
        strengths: ['Dobre ułożenie stopy postawnej', 'Płynny zamach nogi uderzającej'],
        improvements: ['Ciało zbytnio odchylone do tyłu podczas kontaktu z piłką', 'Brak pełnego podążania za uderzeniem (follow-through)'],
        recommendation: 'Skup się na pochyleniu tułowia nad piłką w momencie strzału, aby uniknąć posyłania piłki nad poprzeczką. Ćwiczenie: Strzały z piłki toczącej się z naciskiem na niską postawę.',
      },
      'Drybling': {
        score: 85,
        strengths: ['Niski środek ciężkości', 'Szybki kontakt z piłką obiema stopami'],
        improvements: ['Wzrok zbyt często skierowany na piłkę zamiast na boisko', 'Zbyt długi krok przy zmianie kierunku'],
        recommendation: 'Ćwicz prowadzenie piłki z głową w górze. Użyj pachołków i poproś asystenta o pokazywanie cyfr palcami, które musisz głośno czytać podczas dryblingu.',
      },
      'Podanie wewnętrzną częścią stopy': {
        score: 92,
        strengths: ['Idealne zablokowanie stawu skokowego', 'Bardzo dobra celność i siła'],
        improvements: ['Stopa postawna mogłaby być odrobinę bliżej piłki'],
        recommendation: 'Technika jest niemal perfekcyjna. Wprowadź teraz presję czasu i przeciwnika (gry na utrzymanie), aby zautomatyzować ten ruch w warunkach meczowych.',
      },
    };

    setResult(mockResults[drillType] || mockResults['Strzał na bramkę']);
  };

  const resetAnalysis = () => {
    setAnalysisState('idle');
    setResult(null);
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
          <Text style={styles.headerTitle}>AI Analiza Wideo</Text>
          <Text style={styles.headerSubtitle}>Biomechanika i technika</Text>
        </View>
        <View style={styles.betaBadge}>
          <Text style={styles.betaBadgeText}>BETA</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* KROK 1: WYBÓR ZAWODNIKA I ĆWICZENIA (Tylko gdy idle) */}
        {analysisState === 'idle' && (
          <View style={styles.setupCard}>
            <Text style={styles.sectionLabel}>1. Wybierz zawodnika do analizy:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
              {players.slice(0, 10).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerChip, selectedPlayer?.id === p.id && styles.playerChipActive]}
                  onPress={() => setSelectedPlayer(p)}
                >
                  <View style={[styles.avatarMini, selectedPlayer?.id === p.id && styles.avatarMiniActive]}>
                    <Text style={[styles.avatarMiniText, selectedPlayer?.id === p.id && { color: '#fff' }]}>#{p.number}</Text>
                  </View>
                  <Text style={[styles.playerChipName, selectedPlayer?.id === p.id && { color: '#2563eb', fontWeight: 'bold' }]}>
                    {p.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>2. Wybierz element techniczny:</Text>
            <View style={styles.drillTypeContainer}>
              {['Strzał na bramkę', 'Drybling', 'Podanie wewnętrzną częścią stopy'].map(drill => (
                <TouchableOpacity
                  key={drill}
                  style={[styles.drillBtn, drillType === drill && styles.drillBtnActive]}
                  onPress={() => setDrillType(drill)}
                >
                  <Text style={[styles.drillBtnText, drillType === drill && styles.drillBtnTextActive]}>{drill}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.startRecordBtn, !selectedPlayer && styles.startRecordBtnDisabled]}
              onPress={startRecording}
              disabled={!selectedPlayer}
            >
              <Ionicons name="videocam" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startRecordBtnText}>Rozpocznij Nagrywanie</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EKRAN NAGRYWANIA I ANALIZY */}
        {(analysisState === 'recording' || analysisState === 'analyzing') && (
          <View style={styles.activeProcessCard}>
            <View style={styles.cameraViewMock}>
              <Ionicons name="scan-outline" size={80} color={analysisState === 'recording' ? '#ef4444' : '#3b82f6'} />
              <Text style={styles.cameraText}>
                {analysisState === 'recording' ? 'Nagrywanie w toku...' : 'AI analizuje ruch...'}
              </Text>
              {analysisState === 'analyzing' && <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />}
            </View>
            <Text style={styles.processSubtext}>
              {analysisState === 'recording' 
                ? 'Poproś zawodnika o wykonanie ćwiczenia. Trzymaj telefon stabilnie.' 
                : 'Rozpoznawanie wzorców ruchowych i kątów ułożenia stawów...'}
            </Text>
          </View>
        )}

        {/* WYNIKI ANALIZY */}
        {analysisState === 'results' && result && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultTitle}>Raport Techniczny AI</Text>
                <Text style={styles.resultSubTitle}>{selectedPlayer?.firstName} {selectedPlayer?.lastName} • {drillType}</Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{result.score}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackHeaderRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.feedbackTitleGreen}>Mocne strony (Strengths)</Text>
              </View>
              {result.strengths.map((str, idx) => (
                <Text key={idx} style={styles.feedbackItem}>• {str}</Text>
              ))}
            </View>

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackHeaderRow}>
                <Ionicons name="construct" size={18} color="#ea580c" style={{ marginRight: 6 }} />
                <Text style={styles.feedbackTitleOrange}>Do poprawy (Improvements)</Text>
              </View>
              {result.improvements.map((imp, idx) => (
                <Text key={idx} style={styles.feedbackItem}>• {imp}</Text>
              ))}
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>🧠 Rekomendacja AI Trenera:</Text>
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.saveReportBtn} onPress={() => alert('Raport zapisany w profilu zawodnika!')}>
                <Ionicons name="save-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={styles.saveReportBtnText}>Zapisz w Karcie</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.newAnalysisBtn} onPress={resetAnalysis}>
                <Ionicons name="refresh" size={18} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.newAnalysisBtnText}>Nowa Analiza</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  betaBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  betaBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#1d4ed8' },
  
  content: { flex: 1, padding: 16 },
  
  setupCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  
  playerScroll: { flexDirection: 'row', marginBottom: 10 },
  playerChip: { alignItems: 'center', marginRight: 12, width: 60 },
  playerChipActive: { opacity: 1 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent', marginBottom: 6 },
  avatarMiniActive: { backgroundColor: '#3b82f6', borderColor: '#bfdbfe' },
  avatarMiniText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  playerChipName: { fontSize: 11, color: '#475569', textAlign: 'center' },
  
  drillTypeContainer: { gap: 8, marginBottom: 24 },
  drillBtn: { backgroundColor: '#f8fafc', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  drillBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  drillBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  drillBtnTextActive: { color: '#1d4ed8', fontWeight: 'bold' },
  
  startRecordBtn: { backgroundColor: '#ef4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  startRecordBtnDisabled: { backgroundColor: '#fca5a5' },
  startRecordBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  activeProcessCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 30, alignItems: 'center', justifyContent: 'center', height: 400 },
  cameraViewMock: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  cameraText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  processSubtext: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },

  resultsContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 16 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  resultSubTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#1d4ed8' },
  scoreLabel: { fontSize: 10, color: '#64748b', marginTop: -2 },

  feedbackSection: { marginBottom: 16 },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  feedbackTitleGreen: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  feedbackTitleOrange: { fontSize: 14, fontWeight: 'bold', color: '#ea580c' },
  feedbackItem: { fontSize: 13, color: '#334155', marginLeft: 24, marginBottom: 4, lineHeight: 18 },

  recommendationBox: { backgroundColor: '#f0fdf4', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 8, marginBottom: 20 },
  recommendationTitle: { fontSize: 13, fontWeight: 'bold', color: '#166534', marginBottom: 6 },
  recommendationText: { fontSize: 13, color: '#15803d', lineHeight: 18, fontStyle: 'italic' },

  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  saveReportBtn: { flex: 2, backgroundColor: '#eff6ff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  saveReportBtnText: { color: '#1d4ed8', fontSize: 13, fontWeight: 'bold' },
  newAnalysisBtn: { flex: 1, backgroundColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  newAnalysisBtnText: { color: '#475569', fontSize: 12, fontWeight: 'bold' },
});