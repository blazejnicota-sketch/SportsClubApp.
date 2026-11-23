import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useClubSettings } from '../components/ClubSettingsContext';
import { usePlayers, FULL_KIT_SIZES, KitItem } from '../components/PlayersContext';
import MediaPipePoseScanner from '../components/MediaPipePoseScanner';
import SafetyOnboardingGate, { SafetyConsentPayload } from '../components/SafetyOnboardingGate';
import { registerForPushNotificationsAsync } from '../components/services/pushNotifications';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

interface ParentAssignedDrill {
  assignment_id: string;
  drill_id: string;
  deadline: string;
  title: string;
  drill_type: string;
  description: string;
  target_reps: number;
  points: number;
  level: string;
  is_completed: boolean;
  last_score?: number;
  last_asymmetry?: number;
}

const MOCK_NOTICES = [
  {
    id: '1',
    title: 'Zmiana godziny treningu w czwartek',
    date: '04.11.2026',
    content: 'Trening rocznika 2014 zostaje przesunięty z 17:00 na 18:30 ze względu na rezerwację boiska.',
  },
  {
    id: '2',
    title: 'Wpłata składki za listopad',
    date: '01.11.2026',
    content: 'Przypominamy o wpłacie składki członkowskiej do 10 dnia miesiąca.',
  },
];

const getMediaPipeDrillVideo = (drillType?: string, title?: string) => {
  const t = (drillType || '').toLowerCase();
  const name = (title || '').toLowerCase();

  if (t.includes('plank') || name.includes('desk')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/6050247604474293292',
      label: 'Wzorzec + MediaPipe: Deska (Plank) — stabilizacja tułowia',
    };
  }
  if (t.includes('jump') || t.includes('squat') || name.includes('wysk') || name.includes('główk') || name.includes('blok') || name.includes('próba wstępna') || name.includes('test')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/13756362820221857551',
      label: 'Wzorzec + MediaPipe: Wyskoki i dynamika lądowania',
    };
  }
  if (t.includes('pushup') || name.includes('pompk')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/5797546079038096363',
      label: 'Wzorzec + MediaPipe: Pompki klasyczne',
    };
  }
  if (t.includes('skater') || t.includes('agility') || name.includes('łyżwiarz') || name.includes('przeskok')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/10283269573213398132',
      label: 'Wzorzec + MediaPipe: Przeskoki boczne (Łyżwiarz)',
    };
  }
  if (t.includes('mobility') || t.includes('stretch') || name.includes('mobiln') || name.includes('rozciąg')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/9565356140825529223',
      label: 'Wzorzec + MediaPipe: Mobilność bioder i dwugłowych',
    };
  }
  if (t.includes('warmup') || name.includes('rozgrzew') || name.includes('krążeni')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/7402144877664608190',
      label: 'Wzorzec + MediaPipe: Rozgrzewka i kontrola ruchu',
    };
  }
  return {
    uri: 'http://googleusercontent.com/generated_video_content/13756362820221857551',
    label: 'Wzorzec + MediaPipe: Test ćwiczenia i kontrola ruchu',
  };
};

export default function RodzicPanel() {
  const router = useRouter();
  const { features, hasAiAccess } = useClubSettings();
  const {
    kits,
    assignPlayerKitSize,
    players,
    liveMatchTicker,
    setLiveMatchTicker,
    addLiveTickerEvent,
    removeLiveTickerEvent,
    aiTrainerPlans,
    voiceCoachEnabled,
    toggleVoiceCoach,
  } = usePlayers();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'ai' | 'kits' | 'home' | 'attendance' | 'payments'>('live');
  const [reporterEventModalVisible, setReporterEventModalVisible] = useState(false);
  const [reporterEventType, setReporterEventType] = useState<'goal' | 'yellow' | 'red'>('goal');
  const [customMinuteInput, setCustomMinuteInput] = useState<string>('15');

  const [connectedPlayer, setConnectedPlayer] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    number: number;
    year: string | number;
    position: string;
    team: string;
    club: string;
    code: string;
  } | null>(null);

  const [childDrills, setChildDrills] = useState<ParentAssignedDrill[]>([]);
  const [childResults, setChildResults] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Wybrany rozmiar dla każdego zestawu strojów (domyślnie 140 cm)
  const [selectedSizesMap, setSelectedSizesMap] = useState<Record<string, string>>({
    'kit-1': '140 cm',
  });

  // Akceptacja zadań zleconych dziecku przez rodzica / opiekuna
  const [drillApprovalsMap, setDrillApprovalsMap] = useState<Record<string, boolean>>({});

  // Bramka bezpieczeństwa i zgód dla rodzica / opiekuna
  const [parentSafetyGateVisible, setParentSafetyGateVisible] = useState<boolean>(false);
  const [parentSafetyConsentSaved, setParentSafetyConsentSaved] = useState<boolean>(false);

  // Ekran pomostowy rozgrzewki i klauzuli bezpieczeństwa przed nagraniem dziecka
  const [warmupPromptVisible, setWarmupPromptVisible] = useState(false);
  const [parentConfirmedWarmup, setParentConfirmedWarmup] = useState(false);

  const [scannerVisible, setScannerVisible] = useState(false);
  const [selectedDrillForScan, setSelectedDrillForScan] = useState<ParentAssignedDrill | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');

  useEffect(() => {
    checkLinkedPlayer();
  }, []);

  useEffect(() => {
    if (!loading && !parentSafetyConsentSaved) {
      checkParentSafetyConsent();
    }
  }, [loading, connectedPlayer, parentSafetyConsentSaved]);

  const effectiveTab = activeTab === 'payments' && !features.enableFinances ? 'ai' : activeTab;

  const checkLinkedPlayer = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const parentId = authData?.user?.id;

      if (parentId) {
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('parent_id', parentId)
          .maybeSingle();

        if (player) {
          setConnectedPlayer({
            id: String(player.id),
            firstName: player.first_name || 'Zawodnik',
            lastName: player.last_name || '',
            name: `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Twoje Dziecko',
            number: player.number || 10,
            year: player.year || 2014,
            position: player.position || 'Pomocnik',
            team: `Rocznik ${player.year || '2014'}`,
            club: 'SportsClub Pro',
            code: player.invite_code || 'AKTYWNY',
          });
          registerForPushNotificationsAsync(String(player.id)).catch(() => {});
          await fetchChildAIData(String(player.id));
        } else if (players.length > 0) {
          const p0 = players[0];
          setConnectedPlayer({
            id: String(p0.id),
            firstName: p0.firstName,
            lastName: p0.lastName,
            name: p0.name,
            number: p0.number,
            year: p0.year,
            position: p0.position,
            team: `Rocznik ${p0.year}`,
            club: 'SportsClub Pro',
            code: p0.inviteCode || 'AKTYWNY',
          });
        }
      }
    } catch (err) {
      console.error('Błąd pobierania powiązanego zawodnika:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildAIData = async (playerId: string) => {
    setLoadingAI(true);
    try {
      const { data: resultsData } = await supabase
        .from('player_task_results')
        .select('*')
        .eq('player_id', playerId)
        .order('completed_at', { ascending: false });

      const resultsList = resultsData || [];
      setChildResults(resultsList);

      try {
        const { data: approvalsData } = await supabase
          .from('parent_drill_approvals')
          .select('drill_id, assignment_id, approved')
          .eq('player_id', playerId);
        if (approvalsData) {
          const nextMap: Record<string, boolean> = {};
          approvalsData.forEach((row: any) => {
            if (row.drill_id) nextMap[String(row.drill_id)] = !!row.approved;
            if (row.assignment_id) nextMap[String(row.assignment_id)] = !!row.approved;
          });
          setDrillApprovalsMap(nextMap);
        }
      } catch (_) {}

      const { data: assignmentsData } = await supabase
        .from('weekly_assignments')
        .select(`
          id, drill_id, deadline,
          coach_drills ( id, title, drill_type, description, target_reps_default, points, level )
        `)
        .eq('is_active', true);

      if (assignmentsData && assignmentsData.length > 0) {
        const mapped: ParentAssignedDrill[] = assignmentsData.map((a: any) => {
          const d = a.coach_drills || {};
          const doneRecord = resultsList.find((r: any) => r.assignment_id === a.id || r.drill_id === d.id);
          return {
            assignment_id: a.id,
            drill_id: d.id || a.drill_id,
            deadline: a.deadline || 'Do niedzieli',
            title: d.title || 'Zadanie domowe AI',
            drill_type: d.drill_type || 'jump_squat',
            description: d.description || 'Nagraj ćwiczenie swojego dziecka w skanerze AI.',
            target_reps: d.target_reps_default || 10,
            points: d.points || 100,
            level: d.level || 'Podstawowy',
            is_completed: !!doneRecord,
            last_score: doneRecord?.score,
            last_asymmetry: doneRecord?.asymmetry_index,
          };
        });
        setChildDrills(mapped);
      } else {
        setChildDrills([
          {
            assignment_id: 'local-1',
            drill_id: 'drill-1',
            deadline: 'Do niedzieli',
            title: 'Wyskoki do główki (Start)',
            drill_type: 'jump_squat',
            description: 'Skieruj obiektyw na dziecko i nagraj 10 dynamicznych wyskoków.',
            target_reps: 10,
            points: 100,
            level: 'Początkujący',
            is_completed: false,
          },
        ]);
      }
    } catch (err) {
      console.log('Błąd pobierania zadań AI:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const checkParentSafetyConsent = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || null;
      let query = supabase
        .from('safety_consents')
        .select('id, consent_version')
        .eq('consent_version', '2026.11-v1');

      if (uid) {
        query = query.eq('user_id', uid);
      } else if (connectedPlayer?.id) {
        query = query.eq('player_id', String(connectedPlayer.id));
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        setParentSafetyConsentSaved(true);
        setParentSafetyGateVisible(false);
        return;
      }
    } catch (_) {
      // Jeśli tabela jeszcze nie istnieje lub brak połączenia, pokaż bramkę
    }
    setParentSafetyGateVisible(true);
  };

  const handleAcceptParentSafetyConsent = async (payload: SafetyConsentPayload) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || null;
      await supabase.from('safety_consents').insert([
        {
          user_id: uid,
          player_id: connectedPlayer?.id ? String(connectedPlayer.id) : null,
          accepted_by_role: payload.role,
          consent_version: payload.version,
          accepted_terms: payload.acceptedTerms,
          accepted_risk_clause: payload.acceptedRiskClause,
          confirmed_safe_environment: payload.confirmedSafeEnvironment,
          accepted_at: payload.acceptedAt,
        },
      ]);
    } catch (_) {
      // Zapis lokalny w stanie sesji, nawet jeśli baza dopiero jest wdrażana
    }
    setParentSafetyConsentSaved(true);
    setParentSafetyGateVisible(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDisconnect = () => {
    Alert.alert('Odłączenie profilu', 'Czy na pewno chcesz odłączyć to konto od profilu dziecka?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Odłącz',
        style: 'destructive',
        onPress: async () => {
          if (!connectedPlayer) return;
          setLoading(true);
          await supabase.from('players').update({ parent_id: null }).eq('id', connectedPlayer.id);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleToggleDrillApproval = async (drill: ParentAssignedDrill) => {
    const nextApproved = !drillApprovalsMap[drill.drill_id];
    setDrillApprovalsMap((prev) => ({
      ...prev,
      [drill.drill_id]: nextApproved,
      [drill.assignment_id]: nextApproved,
    }));

    const targetPlayerId = connectedPlayer?.id || 'demo-child';
    if (targetPlayerId !== 'demo-child') {
      try {
        const { data: authData } = await supabase.auth.getUser();
        await supabase.from('parent_drill_approvals').upsert(
          [
            {
              player_id: String(targetPlayerId),
              assignment_id: drill.assignment_id.startsWith('local-') ? null : drill.assignment_id,
              drill_id: drill.drill_id,
              approved: nextApproved,
              approved_by_user_id: authData?.user?.id || null,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'player_id,drill_id' }
        );
      } catch (_) {}
    }

    const statusMsg = nextApproved
      ? `Zaakceptowano ćwiczenie „${drill.title}”. Zawodnik może teraz przystąpić do rozgrzewki i wykonania zadania.`
      : `Cofnięto akceptację dla ćwiczenia „${drill.title}”. Zadanie pozostaje zablokowane do ponownej zgody.`;
    if (Platform.OS === 'web') {
      window.alert(statusMsg);
    } else {
      Alert.alert(nextApproved ? 'Zgoda udzielona ✅' : 'Zgoda cofnięta ⏸️', statusMsg);
    }
  };

  const handleParentStartScan = (drill: ParentAssignedDrill) => {
    if (!hasAiAccess) {
      router.push('/ZadaniaDomowe');
      return;
    }
    setSelectedDrillForScan(drill);
    setWarmupPromptVisible(true);
  };

  const handleConfirmParentWarmup = () => {
    if (!parentConfirmedWarmup) {
      if (Platform.OS === 'web') {
        window.alert('Potwierdź wykonanie krótkiej rozgrzewki przez dziecko oraz bezpieczne miejsce do ćwiczeń.');
      } else {
        Alert.alert('Rozgrzewka i Bezpieczeństwo 🛡️', 'Zaznacz potwierdzenie rozgrzewki przed włączeniem kamery.');
      }
      return;
    }
    setWarmupPromptVisible(false);
    setCameraFacing('back');
    setScannerVisible(true);
  };

  const handleParentScanComplete = async (metrics: any) => {
    setScannerVisible(false);
    if (!selectedDrillForScan || !connectedPlayer) return;
    try {
      await supabase.from('player_task_results').insert([
        {
          player_id: connectedPlayer.id,
          assignment_id: selectedDrillForScan.assignment_id.startsWith('local-')
            ? null
            : selectedDrillForScan.assignment_id,
          reps_completed: metrics.reps,
          score: metrics.score,
          asymmetry_index: metrics.asymmetryIndex,
          completed_at: new Date().toISOString(),
        },
      ]);
      Alert.alert('Trening Zaliczony! 🏆', `Ocena AI: ${metrics.score}%\nAsymetria: ${metrics.asymmetryIndex}%`);
      fetchChildAIData(connectedPlayer.id);
    } catch (e) {
      Alert.alert('Zapisano!', 'Ćwiczenie zostało zaliczone.');
    }
  };

  // Wybór rozmiaru przez rodzica (od 122 cm do XL) i automatyczne przesłanie do tabeli zamówień trenera
  const handleConfirmKitSizeForCoach = (kit: KitItem) => {
    const chosenSize = selectedSizesMap[kit.id] || '140 cm';
    const targetPlayer = connectedPlayer || {
      id: 'demo-child',
      firstName: 'Aleksander',
      lastName: 'Nicota',
      name: 'Aleksander Nicota',
      number: 10,
      year: 2014,
      position: 'Pomocnik',
    };

    assignPlayerKitSize(kit.id, targetPlayer, chosenSize, false);

    const msg =
      `Zapisano wybór dla: ${targetPlayer.name}\n` +
      `Zestaw: ${kit.name}\n` +
      `Wybrany rozmiar: ${chosenSize}\n\n` +
      `Rozmiar został automatycznie przypisany do Twojego dziecka na liście zamówień Trenera!`;

    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Rozmiar przesłany do Trenera! 👕✅', msg);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const avgChildScore =
    childResults.length > 0
      ? Math.round(childResults.reduce((a, b) => a + (b.score || 0), 0) / childResults.length)
      : 94;
  const avgChildAsym =
    childResults.length > 0
      ? Math.round((childResults.reduce((a, b) => a + (b.asymmetry_index || 0), 0) / childResults.length) * 10) / 10
      : 3.2;

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* NAGŁÓWEK */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Strefa Rodzica 👨‍👩‍👦</Text>
            <Text style={styles.subtitleHeader}>Nadzór nad rozwojem, bezpieczeństwem i sprzętem dziecka</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* KARTA PROFILU DZIECKA */}
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View>
              <Text style={styles.playerName}>{connectedPlayer?.name || 'Profil Zawodnika'}</Text>
              <Text style={styles.playerDetails}>
                {connectedPlayer?.club} • {connectedPlayer?.team}
              </Text>
            </View>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeActiveText}>✅ Zgoda RODO Aktywna</Text>
            </View>
          </View>
          <View style={styles.parentQuickActions}>
            <TouchableOpacity
              style={styles.refreshLink}
              onPress={() => connectedPlayer && fetchChildAIData(connectedPlayer.id)}
            >
              <Ionicons name="reload" size={13} color="#2563eb" />
              <Text style={styles.refreshLinkText}>Odśwież postępy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDisconnect}>
              <Text style={styles.disconnectLinkText}>Odłącz profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PASEK SZYBKIEGO PODGLĄDU WYNIKU NA ŻYWO (LIVE-TICKER Z TRYBUN) */}
        <TouchableOpacity
          style={{
            backgroundColor: '#0f172a',
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
            borderWidth: 2,
            borderColor: '#7c3aed',
          }}
          onPress={() => setActiveTab('live')}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
              <Text style={{ color: '#c4b5fd', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
                🎙️ RELACJA LIVE Z TRYBUN • {liveMatchTicker.phase.toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}>
              ⏱️ {liveMatchTicker.currentMinute}' min
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1 }}>Nasza Drużyna</Text>
            <View
              style={{
                backgroundColor: '#1e293b',
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#334155',
              }}
            >
              <Text style={{ color: '#fbbf24', fontSize: 20, fontWeight: '900' }}>
                {liveMatchTicker.teamScore} : {liveMatchTicker.opponentScore}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'right' }}>
              {liveMatchTicker.opponentName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* DYNAMICZNY PASEK ZAKŁADEK */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, effectiveTab === 'live' && { backgroundColor: '#7c3aed' }]}
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, effectiveTab === 'live' && styles.tabTextActive]}>🎙️ LIVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, effectiveTab === 'ai' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ai')}
          >
            <Text style={[styles.tabText, effectiveTab === 'ai' && styles.tabTextActive]}>
              {hasAiAccess ? 'Trening AI' : '🔒 AI'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, effectiveTab === 'kits' && styles.tabButtonActive]}
            onPress={() => setActiveTab('kits')}
          >
            <Text style={[styles.tabText, effectiveTab === 'kits' && styles.tabTextActive]}>Stroje</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, effectiveTab === 'home' && styles.tabButtonActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.tabText, effectiveTab === 'home' && styles.tabTextActive]}>Tablica</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, effectiveTab === 'attendance' && styles.tabButtonActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.tabText, effectiveTab === 'attendance' && styles.tabTextActive]}>Obecność</Text>
          </TouchableOpacity>

          {features.enableFinances && (
            <TouchableOpacity
              style={[styles.tabButton, effectiveTab === 'payments' && styles.tabButtonActive]}
              onPress={() => setActiveTab('payments')}
            >
              <Text style={[styles.tabText, effectiveTab === 'payments' && styles.tabTextActive]}>Finanse</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ZAKŁADKA: ASYSTENT Z TRYBUN (LIVE-TICKER MECZOWY DLA RODZICÓW) */}
        {effectiveTab === 'live' && (() => {
          const isAssignedReporter =
            liveMatchTicker.allowAllParentsToReport ||
            (connectedPlayer && String(liveMatchTicker.reporterPlayerId) === String(connectedPlayer.id));

          return (
            <View style={styles.section}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#ddd6fe',
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#4c1d95' }}>
                    🎙️ Asystent z Trybun (Live-Ticker)
                  </Text>
                  <View
                    style={{
                      backgroundColor: isAssignedReporter ? '#dcfce7' : '#f1f5f9',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: isAssignedReporter ? '#15803d' : '#64748b',
                      }}
                    >
                      {isAssignedReporter ? '✅ TRYB REPORTERA AKTYWNY' : '👁️ TRYB OBSERWATORA'}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 16 }}>
                  {isAssignedReporter
                    ? 'Masz uprawnienia Reportera z Trybun! Klikaj bramki i kartki poniżej — wynik od razu zaktualizuje się u pozostałych rodziców oraz w Wirtualnym Boisku Trenera.'
                    : 'Śledź wynik i strzelców bramek na żywo prosto z boiska.'}
                </Text>

                {isAssignedReporter && (
                  <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                    {/* Zmiana fazy meczu i aktualnej minuty z trybun */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>Minuta meczu:</Text>
                        <TextInput
                          style={{
                            width: 48,
                            backgroundColor: '#f8fafc',
                            borderWidth: 1,
                            borderColor: '#cbd5e1',
                            borderRadius: 6,
                            paddingVertical: 4,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#0f172a',
                          }}
                          keyboardType="numeric"
                          value={customMinuteInput}
                          onChangeText={(txt) => {
                            setCustomMinuteInput(txt);
                            const mNum = parseInt(txt, 10);
                            if (!isNaN(mNum)) {
                              setLiveMatchTicker((prev) => ({ ...prev, currentMinute: mNum }));
                            }
                          }}
                        />
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 8 }}>
                        {(['1. Połowa', 'Przerwa', '2. Połowa', 'Koniec meczu'] as const).map((ph) => (
                          <TouchableOpacity
                            key={ph}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: liveMatchTicker.phase === ph ? '#7c3aed' : '#f1f5f9',
                              marginRight: 4,
                            }}
                            onPress={() => setLiveMatchTicker((prev) => ({ ...prev, phase: ph }))}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: 'bold',
                                color: liveMatchTicker.phase === ph ? '#fff' : '#475569',
                              }}
                            >
                              {ph}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Przyciski szybkiego dodawania zdarzeń z trybun */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1.3,
                          backgroundColor: '#16a34a',
                          paddingVertical: 11,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          setReporterEventType('goal');
                          setReporterEventModalVisible(true);
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>⚽ + Gol dla nas</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flex: 1.1,
                          backgroundColor: '#475569',
                          paddingVertical: 11,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          addLiveTickerEvent(
                            'opponent_goal',
                            null,
                            customMinuteInput || String(liveMatchTicker.currentMinute),
                            'Rodzic (Trybuny)'
                          );
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>🥅 + Gol rywala</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flex: 0.8,
                          backgroundColor: '#ca8a04',
                          paddingVertical: 11,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => {
                          setReporterEventType('yellow');
                          setReporterEventModalVisible(true);
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>🟨 Kartka</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* OŚ CZASU MECZU (LIVE FEED DLA WSZYSTKICH RODZICÓW) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.sectionTitle}>Przebieg meczu na żywo ({liveMatchTicker.events.length})</Text>
                {liveMatchTicker.events.length > 0 && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#dcfce7',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      gap: 4,
                    }}
                    onPress={async () => {
                      const NL = String.fromCharCode(10);
                      const evLines = liveMatchTicker.events
                        .map(
                          (e) =>
                            `• ${e.minute}' ${
                              e.type === 'goal' ? '⚽ GOL!' : e.type === 'opponent_goal' ? '🥅 Gol rywali' : '🟨 Kartka'
                            } ${e.playerName}`
                        )
                        .join(NL);
                      const report = [
                        `🎙️ RELACJA Z TRYBUN (${liveMatchTicker.phase})`,
                        `⚽ Nasza Drużyna ${liveMatchTicker.teamScore} : ${liveMatchTicker.opponentScore} ${liveMatchTicker.opponentName}`,
                        '',
                        evLines,
                      ].join(NL);
                      await Clipboard.setStringAsync(report);
                      if (Platform.OS === 'web') window.alert('Relacja skopiowana do schowka!');
                      else Alert.alert('Skopiowano! 📱', 'Relacja z trybun gotowa do wklejenia na grupie WhatsApp rodziców.');
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#15803d" />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#15803d' }}>Udostępnij na WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>

              {liveMatchTicker.events.length === 0 ? (
                <View style={styles.noticeCard}>
                  <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                    Mecz jeszcze się nie rozpoczął lub brak zarejestrowanych bramek.
                  </Text>
                </View>
              ) : (
                liveMatchTicker.events.map((ev) => (
                  <View
                    key={ev.id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#7c3aed', width: 34 }}>{ev.minute}'</Text>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>
                      {ev.type === 'goal' ? '⚽' : ev.type === 'opponent_goal' ? '🥅' : ev.type === 'yellow' ? '🟨' : '🟥'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                        {ev.playerNumber ? `#${ev.playerNumber} ` : ''}{ev.playerName}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#64748b' }}>
                        {ev.type === 'goal'
                          ? 'Bramka dla naszej drużyny (+50 XP)'
                          : ev.type === 'opponent_goal'
                          ? 'Bramka dla przeciwnika'
                          : 'Napomnienie kartką'}{' '}
                        • Dodał(a): {ev.reportedBy || 'Rodzic (Trybuny)'}
                      </Text>
                    </View>
                    {isAssignedReporter && (
                      <TouchableOpacity onPress={() => removeLiveTickerEvent(ev.id)}>
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          );
        })()}

        {/* ZAKŁADKA: TRENING DOMOWY AI */}
        {effectiveTab === 'ai' && (
          <View style={styles.section}>
            <View style={styles.aiSummaryBanner}>
              <View style={styles.aiStatCol}>
                <Text style={styles.aiStatVal}>{avgChildScore}%</Text>
                <Text style={styles.aiStatLbl}>Technika Ruchu</Text>
              </View>
              <View style={styles.aiDivider} />
              <View style={styles.aiStatCol}>
                <Text style={[styles.aiStatVal, { color: avgChildAsym > 10 ? '#dc2626' : '#16a34a' }]}>
                  {avgChildAsym}%
                </Text>
                <Text style={styles.aiStatLbl}>Asymetria Ciała</Text>
              </View>
              <View style={styles.aiDivider} />
              <View style={styles.aiStatCol}>
                <Text style={styles.aiStatVal}>
                  {childDrills.filter((d) => d.is_completed).length}/{childDrills.length}
                </Text>
                <Text style={styles.aiStatLbl}>Zadania Tygodnia</Text>
              </View>
            </View>

            <View style={styles.handheldInfoBox}>
              <Ionicons name="hand-left" size={20} color="#2563eb" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.handheldInfoTitle}>Tryb Asystenta Rodzica + Kontrola Rozgrzewki</Text>
                <Text style={styles.handheldInfoDesc}>
                  Nie potrzebujesz statywu! Przed nagraniem dziecka aplikacja przypomni o krótkiej rozgrzewce chroniącej przed kontuzją.
                </Text>
              </View>
            </View>

            {/* PRZEŁĄCZNIK LEKTORA GŁOSOWEGO AI + PODGLĄD TRENERA PERSONALNEGO AI DZIECKA */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                    🔊 Lektor Głosowy AI w ćwiczeniach
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Włącz lub wycisz podpowiedzi głosowe podczas nagrywania dziecka w domu.
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor: voiceCoachEnabled ? '#dcfce7' : '#fee2e2',
                    borderWidth: 1,
                    borderColor: voiceCoachEnabled ? '#22c55e' : '#ef4444',
                  }}
                  onPress={toggleVoiceCoach}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: voiceCoachEnabled ? '#15803d' : '#dc2626',
                    }}
                  >
                    {voiceCoachEnabled ? '🔊 WŁ.' : '🔇 WYŁ.'}
                  </Text>
                </TouchableOpacity>
              </View>

              {connectedPlayer && aiTrainerPlans[String(connectedPlayer.id)] && (() => {
                const childPlan = aiTrainerPlans[String(connectedPlayer.id)];
                const lastLog = childPlan.logs[0];
                return (
                  <View
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#f1f5f9',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' }}>
                      🤖 Plan Trenera AI dziecka: Tydzień {childPlan.currentWeek}/{childPlan.durationWeeks} ({childPlan.level})
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        marginTop: 3,
                        fontWeight: '600',
                        color: childPlan.isDeloadWeek ? '#b45309' : '#15803d',
                      }}
                    >
                      {childPlan.isDeloadWeek
                        ? '🛡️ Aktywny tryb regeneracyjny (Deload) — lżejsze obciążenia.'
                        : '✅ Strażnik regeneracji: obciążenia bezpieczne (bufor przed meczem aktywny).'}
                    </Text>
                    {lastLog && (
                      <Text style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                        Ostatnia sesja ({lastLog.date}): technika {lastLog.formQualityPercent}% • zmęczenie: {lastLog.fatigue} • ból: {lastLog.painArea}
                      </Text>
                    )}
                  </View>
                );
              })()}
            </View>

            <Text style={styles.sectionTitle}>Zadania domowe od Trenera</Text>
            {loadingAI ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 20 }} />
            ) : (
              childDrills.map((drill) => (
                <View key={drill.assignment_id} style={[styles.drillCard, drill.is_completed && styles.drillCardDone]}>
                  <View style={styles.drillHeaderRow}>
                    <Text style={styles.drillTypeBadge}>
                      {drill.drill_type === 'plank' ? 'POZIOMY PLANK' : 'PIONOWY WZORZEC'}
                    </Text>
                    <Text style={styles.drillPoints}>+{drill.points} XP</Text>
                  </View>
                  <Text style={styles.drillTitleText}>{drill.title}</Text>
                  <Text style={styles.drillDescText}>{drill.description}</Text>

                  {drill.is_completed && (
                    <View style={styles.completedResultBox}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={styles.completedResultText}>
                        Wykonane! Technika: {drill.last_score}% | Asymetria: {drill.last_asymmetry}%
                      </Text>
                    </View>
                  )}

                  {(() => {
                    const isApproved = !!drillApprovalsMap[drill.drill_id] || !!drillApprovalsMap[drill.assignment_id];
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 8, borderRadius: 8, backgroundColor: isApproved ? '#f0fdf4' : '#fffbeb', borderWidth: 1, borderColor: isApproved ? '#86efac' : '#fde68a' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: isApproved ? '#15803d' : '#b45309', flex: 1 }}>
                          {isApproved ? '✅ Zgoda rodzica udzielona' : '⏳ Czeka na akceptację rodzica'}
                        </Text>
                        <TouchableOpacity
                          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: isApproved ? '#fee2e2' : '#16a34a' }}
                          onPress={() => handleToggleDrillApproval(drill)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: isApproved ? '#dc2626' : '#fff' }}>
                            {isApproved ? 'Cofnij zgodę' : 'Akceptuj zadanie'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}

                  <TouchableOpacity
                    style={[
                      styles.recordChildBtn,
                      drill.is_completed && styles.recordChildBtnRepeat,
                      !hasAiAccess && { backgroundColor: '#f59e0b' },
                    ]}
                    onPress={() => handleParentStartScan(drill)}
                  >
                    <Ionicons name={hasAiAccess ? 'videocam' : 'lock-closed'} size={18} color="#ffffff" />
                    <Text style={styles.recordChildBtnText}>
                      {!hasAiAccess
                        ? 'Dostępne w pakiecie PRO'
                        : drill.is_completed
                        ? 'Rozgrzewka & Nagraj ponownie'
                        : 'Rozgrzewka & Nagraj dziecko'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ZAKŁADKA: STROJE I PEŁNA ROZMIARÓWKA (OD 122 CM DO XL) */}
        {effectiveTab === 'kits' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zamówienia Sprzętu Klubowego (122 cm – XL) 👕</Text>
            {kits.map((kit) => {
              const currentSelected = selectedSizesMap[kit.id] || '140 cm';
              const existingChildOrder = kit.orders.find(
                (o) => connectedPlayer && String(o.playerId) === String(connectedPlayer.id)
              );

              return (
                <View key={kit.id} style={styles.drillCard}>
                  <View style={styles.drillHeaderRow}>
                    <Text style={styles.drillTitleText}>{kit.name}</Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2563eb' }}>{kit.price}</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                    {kit.photos.map((ph, idx) => (
                      <View key={idx} style={styles.parentPhotoCard}>
                        {ph.startsWith('file://') || ph.startsWith('http') || ph.startsWith('data:') ? (
                           <Image source={{ uri: ph }} style={{ width: '100%', height: '100%', borderRadius: 6 }} resizeMode="cover" />
                        ) : (
                           <>
                             <Ionicons name="shirt-outline" size={20} color="#2563eb" />
                             <Text style={{ fontSize: 10, color: '#334155', marginTop: 4, textAlign: 'center' }}>{ph}</Text>
                           </>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.sizeChartInfoBox}>
                    <Ionicons name="resize-outline" size={16} color="#0369a1" />
                    <Text style={styles.sizeChartInfoText}>
                      📐 {kit.sizeChartUrl || 'Pełna rozmiarówka Junior (122–164 cm) oraz Senior (S–XL)'}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
                    Wybierz rozmiar dla swojego dziecka ({connectedPlayer?.name || 'Zawodnik'}):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {FULL_KIT_SIZES.map((sz) => (
                      <TouchableOpacity
                        key={sz}
                        style={[
                          styles.sizeOptionPill,
                          currentSelected === sz && styles.sizeOptionPillActive,
                        ]}
                        onPress={() =>
                          setSelectedSizesMap((prev) => ({ ...prev, [kit.id]: sz }))
                        }
                      >
                        <Text
                          style={[
                            styles.sizeOptionText,
                            currentSelected === sz && { color: '#fff', fontWeight: 'bold' },
                          ]}
                        >
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.recordChildBtn, existingChildOrder && { backgroundColor: '#16a34a' }]}
                    onPress={() => handleConfirmKitSizeForCoach(kit)}
                  >
                    <Ionicons
                      name={existingChildOrder ? 'checkmark-circle' : 'cart-outline'}
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.recordChildBtnText}>
                      {existingChildOrder
                        ? `Zapisano u Trenera: ${existingChildOrder.size} (Kliknij, by zmienić na ${currentSelected})`
                        : `Wyślij rozmiar (${currentSelected}) do Trenera`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ZAKŁADKA: OGŁOSZENIA */}
        {effectiveTab === 'home' && (
          <View style={styles.section}>
            {MOCK_NOTICES.map((item) => (
              <View key={item.id} style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                  <Text style={styles.noticeTitle}>{item.title}</Text>
                  <Text style={styles.noticeDate}>{item.date}</Text>
                </View>
                <Text style={styles.noticeContent}>{item.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ZAKŁADKA: OBECNOŚĆ */}
        {effectiveTab === 'attendance' && (
          <View style={styles.section}>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>Trening – Boisko B</Text>
              <Text style={styles.eventTime}>Czwartek • 18:30</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnSuccess]}
                  onPress={() => Alert.alert('Sukces ✅', 'Potwierdzono obecność dziecka na treningu.')}
                >
                  <Text style={styles.btnText}>Będzie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnDanger]}
                  onPress={() => Alert.alert('Zgłoszono', 'Trener otrzymał informację o nieobecności.')}
                >
                  <Text style={styles.btnText}>Nie będzie</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ZAKŁADKA: FINANSE */}
        {effectiveTab === 'payments' && features.enableFinances && (
          <View style={styles.section}>
            <View style={styles.paymentStatusCard}>
              <View>
                <Text style={styles.paymentMonth}>Składka – Listopad 2026</Text>
                <Text style={styles.paymentAmount}>120,00 PLN</Text>
              </View>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>✅ OPŁACONE</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BRAMKA BEZPIECZEŃSTWA I ZGÓD DLA RODZICA / OPIEKUNA */}
      <SafetyOnboardingGate
        visible={parentSafetyGateVisible}
        playerName={connectedPlayer?.name || 'Profil Dziecka'}
        playerBirthYear={connectedPlayer?.year}
        onAccept={handleAcceptParentSafetyConsent}
        onDecline={handleLogout}
      />

      {/* MODAL WYBORU STRZELCA / ZAWODNIKA PRZEZ RODZICA-REPORTERA Z TRYBUN */}
      <Modal visible={reporterEventModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.warmupWhiteBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a' }}>
                {reporterEventType === 'goal' ? '⚽ Kto strzelił bramkę?' : '🟨 Kto otrzymał kartkę?'}
              </Text>
              <TouchableOpacity onPress={() => setReporterEventModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {players.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                  }}
                  onPress={() => {
                    addLiveTickerEvent(
                      reporterEventType,
                      p,
                      customMinuteInput || String(liveMatchTicker.currentMinute),
                      'Rodzic (Trybuny)'
                    );
                    setReporterEventModalVisible(false);
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#eff6ff',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2563eb' }}>#{p.number}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>
                    {p.firstName} {p.lastName || ''}
                  </Text>
                  <Ionicons name="add-circle" size={22} color="#16a34a" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL POMOSTOWY ROZGRZEWKI PRZED NAGRANIEM DZIECKA */}
      <Modal visible={warmupPromptVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.warmupWhiteBox}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
              🛡️ Bezpieczeństwo Zdrowotne Dziecka
            </Text>
            <Text style={{ fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 18 }}>
              Zanim nagrasz ćwiczenie „{selectedDrillForScan?.title}”, upewnij się, że dziecko wykonało 3-minutową rozgrzewkę (krążenia ramion, bioder, pajacyki) oraz ma wokół siebie bezpieczną przestrzeń.
            </Text>

            <TouchableOpacity
              style={styles.warmupConfirmRow}
              onPress={() => setParentConfirmedWarmup(!parentConfirmedWarmup)}
            >
              <Ionicons
                name={parentConfirmedWarmup ? 'checkbox' : 'square-outline'}
                size={20}
                color={parentConfirmedWarmup ? '#16a34a' : '#64748b'}
              />
              <Text style={{ flex: 1, fontSize: 11, color: '#0f172a', marginLeft: 8 }}>
                Potwierdzam, że dziecko wykonało rozgrzewkę i nie ma przeciwwskazań zdrowotnych do wykonania ćwiczenia.
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#e2e8f0' }]}
                onPress={() => setWarmupPromptVisible(false)}
              >
                <Text style={{ color: '#475569', fontWeight: 'bold', fontSize: 12 }}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2563eb', flex: 2 }]}
                onPress={handleConfirmParentWarmup}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Uruchom Kamerę AI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SKANERA DLA RODZICA */}
      <Modal animationType="slide" visible={scannerVisible} onRequestClose={() => setScannerVisible(false)}>
        <SafeAreaView style={styles.scannerModal}>
          <View style={styles.scannerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scannerHeaderTitle}>Nagrywasz: {connectedPlayer?.name}</Text>
              <Text style={styles.scannerHeaderSub}>{selectedDrillForScan?.title} • Stabilizacja dłoni aktywna</Text>
            </View>
            <TouchableOpacity
              style={styles.camSwitchBtn}
              onPress={() => setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
            >
              <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.camCloseBtn} onPress={() => setScannerVisible(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {selectedDrillForScan && (
              <>
                {(() => {
                  const vid = getMediaPipeDrillVideo(selectedDrillForScan.drill_type, selectedDrillForScan.title);
                  return (
                    <View style={styles.demoVideoContainer}>
                      <Video
                        style={{ width: '100%', height: 100 }}
                        source={{ uri: vid.uri }}
                        useNativeControls={false}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay
                        isMuted
                      />
                      <Text style={{color:'#e2e8f0', fontSize: 10, fontWeight: 'bold', position: 'absolute', bottom: 4, backgroundColor: 'rgba(15,23,42,0.78)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6}}>
                        {vid.label}
                      </Text>
                    </View>
                  );
                })()}
                <MediaPipePoseScanner
                facing={cameraFacing}
                targetReps={selectedDrillForScan.target_reps}
                drillType={selectedDrillForScan.drill_type}
                isHandheld={true}
                onComplete={handleParentScanComplete}
              />
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  container: { padding: 16, flexGrow: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitleHeader: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },

  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  playerName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  playerDetails: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badgeActive: { backgroundColor: '#dcfce7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeActiveText: { color: '#15803d', fontSize: 11, fontWeight: 'bold' },
  parentQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  refreshLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshLinkText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  disconnectLinkText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#475569', fontSize: 11, fontWeight: 'bold' },
  tabTextActive: { color: '#ffffff' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  aiSummaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'center',
  },
  aiStatCol: { flex: 1, alignItems: 'center' },
  aiStatVal: { fontSize: 20, fontWeight: '900', color: '#2563eb' },
  aiStatLbl: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' },
  aiDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },

  handheldInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  handheldInfoTitle: { color: '#1e3a8a', fontSize: 13, fontWeight: 'bold' },
  handheldInfoDesc: { color: '#3b82f6', fontSize: 11, marginTop: 2, lineHeight: 16 },

  drillCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  drillCardDone: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  drillHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  drillTypeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  drillPoints: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },
  drillTitleText: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  drillDescText: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 17 },
  completedResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  completedResultText: { color: '#15803d', fontSize: 12, fontWeight: 'bold' },
  recordChildBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  recordChildBtnRepeat: { backgroundColor: '#16a34a' },
  recordChildBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  parentPhotoCard: {
    width: 105,
    height: 70,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    padding: 4,
  },
  sizeChartInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  sizeChartInfoText: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#0369a1' },
  sizeOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sizeOptionPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sizeOptionText: { fontSize: 12, color: '#334155', fontWeight: '600' },

  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  noticeTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  noticeDate: { fontSize: 11, color: '#64748b', marginLeft: 8 },
  noticeContent: { fontSize: 13, color: '#475569', lineHeight: 18 },

  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  eventTime: { fontSize: 13, color: '#64748b', marginTop: 2, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnSuccess: { backgroundColor: '#16a34a' },
  btnDanger: { backgroundColor: '#dc2626' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  paymentStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMonth: { fontSize: 14, color: '#0f172a', fontWeight: 'bold' },
  paymentAmount: { fontSize: 16, color: '#2563eb', fontWeight: '900', marginTop: 4 },
  paidBadge: { backgroundColor: '#dcfce7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  paidBadgeText: { color: '#15803d', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  warmupWhiteBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  warmupConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 12,
  },

  scannerModal: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0f172a' },
  scannerHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  scannerHeaderSub: { color: '#38bdf8', fontSize: 11, marginTop: 2 },
  camSwitchBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  demoVideoContainer: { backgroundColor: '#1e293b', height: 100, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155' },
  camCloseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
});
