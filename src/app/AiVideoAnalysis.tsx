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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraType, useCameraPermissions } from 'expo-camera';
import { usePlayers, Player } from '../components/PlayersContext';
import { supabase } from '../services/supabase';
import MediaPipePoseScanner from '../components/MediaPipePoseScanner';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type AnalysisState = 'idle' | 'recording' | 'results';

interface AnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  asymmetryIndex: number;
  detectedErrors: string[];
  repsCompleted: number;
  xpEarned: number;
}

const DRILL_OPTIONS = [
  { label: 'Strzał / Dynamika (Pionowy)', type: 'squat' },
  { label: 'Wyskok do główki / Blok', type: 'jump_squat' },
  { label: 'Stabilizacja Core / Plank (Poziomy)', type: 'plank' },
];

export default function AiVideoAnalysisScreen() {
  const router = useRouter();
  const { players, updatePlayer } = usePlayers();

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedDrill, setSelectedDrill] = useState(DRILL_OPTIONS[0]);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Oczekiwanie na sylwetkę w kadrze...');

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="videocam-off" size={60} color="#64748b" style={{ marginBottom: 15 }} />
        <Text style={styles.text}>Aplikacja potrzebuje dostępu do aparatu do analizy AI.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btn}>
          <Text style={styles.btnText}>Przyznaj uprawnienia</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = () => {
    if (!selectedPlayer) {
      Alert.alert('Błąd', 'Wybierz najpierw zawodnika z listy!');
      return;
    }
    setLiveStatus('Odliczanie 5s i kalibracja sylwetki (MediaPipe Pose)...');
    setAnalysisState('recording');
  };

  const handleRealAiComplete = (metrics: {
    reps: number;
    score: number;
    asymmetryIndex: number;
    detectedErrors: string[];
  }) => {
    const hasForwardLean = metrics.detectedErrors.includes('forward_lean');
    const hasAsymmetry = metrics.asymmetryIndex > 6;
    const xpEarned = metrics.score >= 90 ? 120 : 100;

    const dynamicResult: AnalysisResult = {
      score: metrics.score,
      asymmetryIndex: metrics.asymmetryIndex,
      detectedErrors: metrics.detectedErrors,
      repsCompleted: metrics.reps,
      xpEarned,
      strengths: [
        `Zarejestrowano ${metrics.reps} poprawnych powtórzeń/sekund na żywo`,
        metrics.asymmetryIndex <= 5
          ? 'Wzorowa symetria pracy lewej i prawej strony ciała'
          : 'Prawidłowa dynamika fazowa ruchu',
      ],
      improvements: [
        ...(hasForwardLean ? ['Wykryto nadmierne pochylenie tułowia względem osi'] : []),
        ...(hasAsymmetry
          ? [`Wykryto asymetrię obciążenia kończyn (${metrics.asymmetryIndex}%)`]
          : []),
        ...(!hasForwardLean && !hasAsymmetry
          ? ['Utrzymuj stabilną postawę w końcowej fazie zmęczenia']
          : []),
      ],
      recommendation: hasAsymmetry
        ? 'Skup się na równomiernym rozkładaniu ciężaru ciała na obie nogi.'
        : 'Parametry biomechaniczne w normie. Świetna technika wykonania!',
    };

    setResult(dynamicResult);
    setAnalysisState('results');
  };

  const resetAnalysis = () => {
    setAnalysisState('idle');
    setResult(null);
    setIsSaving(false);
  };

  const handleSaveToProfile = async () => {
    if (!selectedPlayer || !result) return;

    setIsSaving(true);
    const dateStr = new Date().toLocaleDateString('pl-PL');

    const aiReportText = `\n\n--- AI ANALIZA: ${selectedDrill.label} (${dateStr}) ---\nWynik: ${result.score}/100 (Powtórzenia: ${result.repsCompleted}, +${result.xpEarned} XP)\nAsymetria: ${result.asymmetryIndex}%\n✅ Mocne: ${result.strengths.join(' | ')}\n⚠️ Do poprawy: ${result.improvements.join(' | ')}\n🧠 Rekomendacja: ${result.recommendation}`;

    const existingNotes = selectedPlayer.coachNote ? selectedPlayer.coachNote.trim() : '';
    const updatedNotes = existingNotes + aiReportText;
    const newXpTotal = (selectedPlayer.xp || 300) + result.xpEarned;

    try {
      // 1. Zapisz nowe XP oraz notatkę w tabeli players i w stanie lokalnym
      await updatePlayer(selectedPlayer.id, {
        coachNote: updatedNotes.trim(),
        xp: newXpTotal,
      });

      // 2. Zapisz wynik w głównej tabeli raportów AI (player_task_results)
      const { error } = await supabase.from('player_task_results').insert([
        {
          player_id: selectedPlayer.id,
          reps_completed: result.repsCompleted,
          score: result.score,
          asymmetry_index: result.asymmetryIndex,
          completed_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      Alert.alert(
        'Sukces! 🤖⚡',
        `Raport zapisany w chmurze, a na konto ${selectedPlayer.firstName} trafiło +${result.xpEarned} XP (łącznie: ${newXpTotal} XP)!`
      );
    } catch (error: any) {
      Alert.alert('Zapisano z ostrzeżeniem', 'Dane lokalne zaktualizowane, ale wystąpił problem z siecią: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>AI Analiza Ruchu (Boisko)</Text>
          <Text style={styles.headerSubtitle}>Real-Time MediaPipe Pose + Stabilizacja</Text>
        </View>
        <View style={styles.betaBadge}>
          <Text style={styles.betaBadgeText}>LIVE AI</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {analysisState === 'idle' && (
          <View style={styles.setupCard}>
            <Text style={styles.sectionLabel}>1. Wybierz badanego zawodnika:</Text>
            {players.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Brak zawodników w bazie. Dodaj gracza w zakładce Kadra.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.playerScroll}
              >
                {players.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.playerChip,
                      selectedPlayer?.id === p.id && styles.playerChipActive,
                    ]}
                    onPress={() => setSelectedPlayer(p)}
                  >
                    <View
                      style={[
                        styles.avatarMini,
                        selectedPlayer?.id === p.id && styles.avatarMiniActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarMiniText,
                          selectedPlayer?.id === p.id && { color: '#fff' },
                        ]}
                      >
                        #{p.number}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.playerChipName,
                        selectedPlayer?.id === p.id && { color: '#2563eb', fontWeight: 'bold' },
                      ]}
                      numberOfLines={1}
                    >
                      {p.firstName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>
              2. Wybierz wzorzec testowy (wymagane 5 powtórzeń/sek.):
            </Text>
            <View style={styles.drillTypeContainer}>
              {DRILL_OPTIONS.map((drill) => (
                <TouchableOpacity
                  key={drill.label}
                  style={[
                    styles.drillBtn,
                    selectedDrill.label === drill.label && styles.drillBtnActive,
                  ]}
                  onPress={() => setSelectedDrill(drill)}
                >
                  <Text
                    style={[
                      styles.drillBtnText,
                      selectedDrill.label === drill.label && styles.drillBtnTextActive,
                    ]}
                  >
                    {drill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>3. Wybierz kamerę:</Text>
            <View style={styles.cameraToggleRow}>
              <TouchableOpacity
                style={[
                  styles.cameraToggleBtn,
                  cameraFacing === 'back' && styles.cameraToggleBtnActive,
                ]}
                onPress={() => setCameraFacing('back')}
              >
                <Ionicons
                  name="camera-reverse"
                  size={18}
                  color={cameraFacing === 'back' ? '#2563eb' : '#64748b'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.cameraToggleText,
                    cameraFacing === 'back' && styles.cameraToggleTextActive,
                  ]}
                >
                  Tylna (Trener / Rodzic)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cameraToggleBtn,
                  cameraFacing === 'front' && styles.cameraToggleBtnActive,
                ]}
                onPress={() => setCameraFacing('front')}
              >
                <Ionicons
                  name="person-circle"
                  size={18}
                  color={cameraFacing === 'front' ? '#2563eb' : '#64748b'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.cameraToggleText,
                    cameraFacing === 'front' && styles.cameraToggleTextActive,
                  ]}
                >
                  Przednia (Na statywie)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.startRecordBtn, !selectedPlayer && styles.startRecordBtnDisabled]}
              onPress={startRecording}
              disabled={!selectedPlayer}
            >
              <Ionicons name="videocam" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startRecordBtnText}>Rozpocznij Skanowanie AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SKANER NA ŻYWO */}
        {analysisState === 'recording' && (
          <View style={styles.activeProcessCard}>
            <View style={styles.cameraViewport}>
              <MediaPipePoseScanner
                facing={cameraFacing === 'front' ? 'front' : 'back'}
                targetReps={5}
                drillType={selectedDrill.type}
                isHandheld={cameraFacing === 'back'}
                onRepCountChange={(_reps, statusText) => setLiveStatus(statusText)}
                onComplete={handleRealAiComplete}
                onCancel={resetAnalysis}
              />
            </View>

            <Text style={styles.processSubtext}>{liveStatus}</Text>

            <TouchableOpacity style={styles.cancelScanBtn} onPress={resetAnalysis}>
              <Ionicons name="close-circle" size={18} color="#f87171" style={{ marginRight: 6 }} />
              <Text style={styles.cancelScanBtnText}>Przerwij skanowanie</Text>
            </TouchableOpacity>
          </View>
        )}

        {analysisState === 'results' && result && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>Raport Techniczny AI</Text>
                <Text style={styles.resultSubTitle}>
                  {selectedPlayer?.firstName} {selectedPlayer?.lastName} • +{result.xpEarned} XP
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{result.score}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>

            <View style={styles.asymmetryBox}>
              <Ionicons
                name="git-compare-outline"
                size={18}
                color="#0284c7"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.asymmetryText}>
                Zmierzona asymetria lewa/prawa strona:{' '}
                <Text style={{ fontWeight: 'bold' }}>{result.asymmetryIndex}%</Text>
              </Text>
            </View>

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackHeaderRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#16a34a"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.feedbackTitleGreen}>Wykryte parametry</Text>
              </View>
              {result.strengths.map((str, idx) => (
                <Text key={idx} style={styles.feedbackItem}>
                  • {str}
                </Text>
              ))}
            </View>

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackHeaderRow}>
                <Ionicons name="construct" size={18} color="#ea580c" style={{ marginRight: 6 }} />
                <Text style={styles.feedbackTitleOrange}>Obszary do poprawy</Text>
              </View>
              {result.improvements.map((imp, idx) => (
                <Text key={idx} style={styles.feedbackItem}>
                  • {imp}
                </Text>
              ))}
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>🧠 Rekomendacja AI Trenera:</Text>
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.saveReportBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveToProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#1d4ed8" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={18}
                    color="#2563eb"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={styles.saveReportBtnText}>
                  {isSaving ? 'Zapisywanie...' : `Zapisz (+${result.xpEarned} XP)`}
                </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#3b82f6', fontWeight: 'bold' },
  betaBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  betaBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#15803d' },
  content: { flex: 1, padding: 16 },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  playerScroll: { flexDirection: 'row', marginBottom: 6 },
  playerChip: { alignItems: 'center', marginRight: 12, width: 60 },
  playerChipActive: { opacity: 1 },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  avatarMiniActive: { backgroundColor: '#3b82f6', borderColor: '#bfdbfe' },
  avatarMiniText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  playerChipName: { fontSize: 11, color: '#475569', textAlign: 'center' },
  drillTypeContainer: { gap: 8, marginBottom: 16 },
  drillBtn: {
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  drillBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  drillBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  drillBtnTextActive: { color: '#1d4ed8', fontWeight: 'bold' },
  cameraToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  cameraToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cameraToggleBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  cameraToggleText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  cameraToggleTextActive: { color: '#1d4ed8', fontWeight: 'bold' },
  startRecordBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startRecordBtnDisabled: { backgroundColor: '#94a3b8' },
  startRecordBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  activeProcessCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraViewport: {
    width: '100%',
    height: 420,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  processSubtext: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  cancelScanBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  cancelScanBtnText: { color: '#f87171', fontSize: 13, fontWeight: 'bold' },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  resultSubTitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#1d4ed8' },
  scoreLabel: { fontSize: 10, color: '#64748b', marginTop: -2 },
  asymmetryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  asymmetryText: { fontSize: 12, color: '#0369a1' },
  feedbackSection: { marginBottom: 14 },
  feedbackHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  feedbackTitleGreen: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  feedbackTitleOrange: { fontSize: 14, fontWeight: 'bold', color: '#ea580c' },
  feedbackItem: { fontSize: 13, color: '#334155', marginLeft: 24, marginBottom: 3, lineHeight: 18 },
  recommendationBox: {
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 6,
    marginBottom: 16,
  },
  recommendationTitle: { fontSize: 13, fontWeight: 'bold', color: '#166534', marginBottom: 4 },
  recommendationText: { fontSize: 13, color: '#15803d', lineHeight: 18, fontStyle: 'italic' },
  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  saveReportBtn: {
    flex: 2,
    backgroundColor: '#eff6ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  saveReportBtnText: { color: '#1d4ed8', fontSize: 13, fontWeight: 'bold' },
  newAnalysisBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  newAnalysisBtnText: { color: '#475569', fontSize: 12, fontWeight: 'bold' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  text: { color: '#334155', fontSize: 15, textAlign: 'center', marginBottom: 15 },
  btn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});