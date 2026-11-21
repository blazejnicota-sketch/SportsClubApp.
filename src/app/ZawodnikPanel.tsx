import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useClubSettings } from '../components/ClubSettingsContext';
import {
  usePlayers,
  AiFatigueFeedback,
  AiPainArea,
  AiPlannedExercise,
} from '../components/PlayersContext';
import MediaPipePoseScanner from '../components/MediaPipePoseScanner';
import WearablesSyncModal from '../components/WearablesSyncModal';
import { registerForPushNotificationsAsync } from '../components/services/pushNotifications';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export type DrillModuleCategory = 'Wszystkie' | 'Statyczne' | 'Rozciągające' | 'Dynamiczne' | 'Skoczność' | 'Zwinność';

interface AssignedDrill {
  assignment_id: string;
  drill_id: string;
  deadline: string;
  title: string;
  drill_type: string;
  category: Exclude<DrillModuleCategory, 'Wszystkie'>;
  recommendedSports: string[];
  description: string;
  target_reps: number;
  points: number;
  level: string;
  is_completed: boolean;
  last_score?: number;
  last_asymmetry?: number;
}

interface AvatarTier {
  level: number;
  name: string;
  badge: string;
  emoji: string;
  minXp: number;
  maxXp: number;
  color: string;
  desc: string;
}

const WEEK_DAYS: { id: number; short: string }[] = [
  { id: 1, short: 'Pn' },
  { id: 2, short: 'Wt' },
  { id: 3, short: 'Śr' },
  { id: 4, short: 'Cz' },
  { id: 5, short: 'Pt' },
  { id: 6, short: 'Sb' },
  { id: 0, short: 'Nd' },
];

const FATIGUE_OPTIONS: { value: AiFatigueFeedback; label: string; emoji: string }[] = [
  { value: 'lekko', label: 'Lekko', emoji: '😊' },
  { value: 'w_sam_raz', label: 'W sam raz', emoji: '💪' },
  { value: 'ciezko', label: 'Ciężko', emoji: '🥵' },
];

const PAIN_OPTIONS: { value: AiPainArea; label: string }[] = [
  { value: 'brak', label: 'Brak bólu' },
  { value: 'kolano', label: 'Kolano' },
  { value: 'biodro', label: 'Biodro' },
  { value: 'plecy', label: 'Plecy' },
  { value: 'kostka', label: 'Kostka' },
  { value: 'inne', label: 'Inne' },
];

const AVATAR_EVOLUTION_TIERS: AvatarTier[] = [
  {
    level: 1,
    name: 'Szkieletor (Start)',
    badge: 'POZIOM 1 • BAZA BIOMECHANICZNA',
    emoji: '💀',
    minXp: 0,
    maxXp: 400,
    color: '#94a3b8',
    desc: 'AI zeskanowało Twój szkielet! Wykonuj zadania domowe, aby obudować go mięśniami.',
  },
  {
    level: 2,
    name: 'Młody Atleta',
    badge: 'POZIOM 2 • ROZGRZANY',
    emoji: '🏃',
    minXp: 400,
    maxXp: 800,
    color: '#38bdf8',
    desc: 'Twoja stabilizacja i systematyczność rosną. Widać pierwsze zarysy sylwetki!',
  },
  {
    level: 3,
    name: 'Wojownik Boiska',
    badge: 'POZIOM 3 • DYNAMIKA PRO',
    emoji: '🥋',
    minXp: 800,
    maxXp: 1400,
    color: '#4ade80',
    desc: 'Świetna skoczność i niski indeks asymetrii. Jesteś wzorem na treningach!',
  },
  {
    level: 4,
    name: 'Kulturysta / Tytan Siły',
    badge: 'POZIOM 4 • POTĘŻNA FORMA',
    emoji: '💪',
    minXp: 1400,
    maxXp: 2200,
    color: '#f59e0b',
    desc: 'Żelazny core w planku i perfekcyjne pompki. Rywale czują respekt!',
  },
  {
    level: 5,
    name: 'Superbohater Akademii',
    badge: 'POZIOM 5 • LEGENDA ELITE',
    emoji: '🦸‍♂️',
    minXp: 2200,
    maxXp: 5000,
    color: '#c084fc',
    desc: 'Maksymalny poziom ewolucji! Perfekcyjna biomechanika i mistrzowska kondycja.',
  },
];

const WARMUP_STEPS = [
  { id: 'w1', title: '1. Krążenia ramion i barków (30 sek.)', desc: 'Rozgrzej stawy barkowe przed podporami i pompkami.' },
  { id: 'w2', title: '2. Krążenia bioder i skłony tułowia (45 sek.)', desc: 'Przygotuj odcinek lędźwiowy i mięśnie dwugłowe.' },
  { id: 'w3', title: '3. Pajacyki i trucht w miejscu (60 sek.)', desc: 'Podnieś tętno i dotleń mięśnie przed wyskokami.' },
  { id: 'w4', title: '4. Półprzysiady aktywacyjne (30 sek.)', desc: 'Rozgrzej stawy kolanowe i skokowe.' },
];

const DEFAULT_Categorized_DRILLS: AssignedDrill[] = [
  {
    assignment_id: 'local-1',
    drill_id: 'drill-1',
    deadline: 'Do niedzieli',
    title: 'Wyskoki do główki / bloku (Dynamika)',
    drill_type: 'jump_squat',
    category: 'Skoczność',
    recommendedSports: ['Piłka Nożna', 'Koszykówka', 'Piłka Siatkowa', 'Piłka Ręczna'],
    description: 'Zejdź nisko na nogach i wykonaj 10 dynamicznych wyskoków w wyznaczonej ramce AI.',
    target_reps: 10,
    points: 100,
    level: 'Start',
    is_completed: false,
  },
  {
    assignment_id: 'local-2',
    drill_id: 'drill-2',
    deadline: 'Do niedzieli',
    title: 'Deska (Plank) - Żelazny Core',
    drill_type: 'plank',
    category: 'Statyczne',
    recommendedSports: ['Piłka Nożna', 'Pływanie', 'Siłownia & CrossFit', 'Rower & Kolarstwo'],
    description: 'Utrzymaj idealną linię bioder i barków w podporze przodem przed kamerą AI.',
    target_reps: 45,
    points: 120,
    level: 'Średni',
    is_completed: false,
  },
  {
    assignment_id: 'local-3',
    drill_id: 'drill-3',
    deadline: 'Codziennie',
    title: 'Pompki klasyczne z kontrolą łokci',
    drill_type: 'pushups',
    category: 'Dynamiczne',
    recommendedSports: ['Sporty Walki / Sztuki Walki', 'Piłka Ręczna', 'Siłownia & CrossFit'],
    description: 'Wykonaj 12 pełnych powtórzeń z zachowaniem symetrii barków.',
    target_reps: 12,
    points: 110,
    level: 'Średni',
    is_completed: false,
  },
  {
    assignment_id: 'local-4',
    drill_id: 'drill-4',
    deadline: 'Do niedzieli',
    title: 'Przeskoki boczne (Łyżwiarz / Zwroty)',
    drill_type: 'agility_skater',
    category: 'Zwinność',
    recommendedSports: ['Tenis Ziemny', 'Koszykówka', 'Piłka Nożna', 'Piłka Ręczna'],
    description: 'Dynamiczne przeskoki z nogi na nogę ze stabilizacją kolana w lądowaniu.',
    target_reps: 16,
    points: 115,
    level: 'Zaawansowany',
    is_completed: false,
  },
  {
    assignment_id: 'local-5',
    drill_id: 'drill-5',
    deadline: 'Po treningu',
    title: 'Mobilizacja bioder i taśmy tylnej',
    drill_type: 'mobility_stretch',
    category: 'Rozciągające',
    recommendedSports: ['Bieganie & Lekkoatletyka', 'Spacer / Szybki Marsz / Nordic Walking', 'Piłka Nożna'],
    description: 'Płynne rozciąganie chroniące przed przeciążeniami i kontuzjami mięśniowymi.',
    target_reps: 8,
    points: 80,
    level: 'Każdy',
    is_completed: false,
  },
];

export default function ZawodnikPanel() {
  const router = useRouter();
  const { hasAiAccess, features, sportConfig } = useClubSettings();
  const {
    aiTrainerPlans,
    setupAiTrainerPlan,
    completeAiBaselineTest,
    logAiTrainingSession,
    voiceCoachEnabled,
    toggleVoiceCoach,
  } = usePlayers();

  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'ai_trainer' | 'avatar' | 'progress' | 'stats'>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<DrillModuleCategory>('Wszystkie');
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);

  const [assignedDrills, setAssignedDrills] = useState<AssignedDrill[]>(DEFAULT_Categorized_DRILLS);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [totalXP, setTotalXP] = useState<number>(300);
  const [playerStats, setPlayerStats] = useState({ goals: 0, assists: 0, mvp: 0, form: '9.2' });

  // Ekran pomostowy bezpieczeństwa zdrowotnego i obowiązkowej rozgrzewki przed kamerą AI
  const [warmupModalVisible, setWarmupModalVisible] = useState<boolean>(false);
  const [checkedWarmupSteps, setCheckedWarmupSteps] = useState<string[]>([]);
  const [healthDisclaimerAccepted, setHealthDisclaimerAccepted] = useState<boolean>(false);

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [wearablesModalVisible, setWearablesModalVisible] = useState<boolean>(false);
  const [activeDrill, setActiveDrill] = useState<AssignedDrill | null>(null);
  const [scannerContextMode, setScannerContextMode] = useState<'standard' | 'ai_plan' | 'ai_baseline'>('standard');
  const [isHandheldMode, setIsHandheldMode] = useState<boolean>(true);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');

  // Stan konfiguracji Trenera Personalnego AI (8-12 tyg. + bufor świeżych nóg)
  const [editingAiSchedule, setEditingAiSchedule] = useState<boolean>(false);
  const [planDurationWeeks, setPlanDurationWeeks] = useState<8 | 12>(8);
  const [selectedTeamDays, setSelectedTeamDays] = useState<number[]>([1, 3, 5]);
  const [selectedMatchDays, setSelectedMatchDays] = useState<number[]>([6]);
  const [weeklyLoadCap, setWeeklyLoadCap] = useState<number>(2);

  // Stan próby wstępnej (manualny lub po skanie AI)
  const [baselineJumps, setBaselineJumps] = useState<number>(8);
  const [baselinePlankSec, setBaselinePlankSec] = useState<number>(30);

  // Stan modalu Strażnika Regeneracji i Bólu po zakończeniu sesji AI
  const [fatigueModalVisible, setFatigueModalVisible] = useState<boolean>(false);
  const [lastAiScanScore, setLastAiScanScore] = useState<number>(86);
  const [selectedFatigue, setSelectedFatigue] = useState<AiFatigueFeedback>('w_sam_raz');
  const [selectedPainArea, setSelectedPainArea] = useState<AiPainArea>('brak');

  useEffect(() => {
    fetchCurrentZawodnik();
  }, []);

  const activePlayerId = String(currentPlayer?.id || 'demo');
  const activeAiPlan = aiTrainerPlans[activePlayerId];

  const currentAvatarTier = useMemo(() => {
    return (
      AVATAR_EVOLUTION_TIERS.find((t) => totalXP >= t.minXp && totalXP < t.maxXp) ||
      AVATAR_EVOLUTION_TIERS[AVATAR_EVOLUTION_TIERS.length - 1]
    );
  }, [totalXP]);

  const nextAvatarTier = useMemo(() => {
    const idx = AVATAR_EVOLUTION_TIERS.findIndex((t) => t.level === currentAvatarTier.level);
    return idx >= 0 && idx + 1 < AVATAR_EVOLUTION_TIERS.length ? AVATAR_EVOLUTION_TIERS[idx + 1] : null;
  }, [currentAvatarTier]);

  const avatarProgressPercent = useMemo(() => {
    const span = currentAvatarTier.maxXp - currentAvatarTier.minXp;
    const earnedInTier = Math.max(0, totalXP - currentAvatarTier.minXp);
    return Math.min(100, Math.round((earnedInTier / span) * 100));
  }, [totalXP, currentAvatarTier]);

  const filteredDrills = useMemo(() => {
    return assignedDrills
      .filter((d) => selectedCategory === 'Wszystkie' || d.category === selectedCategory)
      .sort((a, b) => {
        const aRec = a.recommendedSports.includes(sportConfig.name) ? 1 : 0;
        const bRec = b.recommendedSports.includes(sportConfig.name) ? 1 : 0;
        return bRec - aRec;
      });
  }, [assignedDrills, selectedCategory, sportConfig.name]);

  const fetchCurrentZawodnik = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (player) {
          setCurrentPlayer(player);
          registerForPushNotificationsAsync(String(player.id)).catch(() => {});
          await fetchPlayerData(String(player.id), player);
        } else {
          setCurrentPlayer({ id: 'demo', first_name: 'Zawodnik', number: 10, xp: 300 });
          setLoading(false);
        }
      } else {
        setCurrentPlayer({ id: 'demo', first_name: 'Zawodnik', number: 10, xp: 300 });
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchPlayerData = async (playerId: string, playerObj: any) => {
    try {
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId)
        .maybeSingle();

      if (statsData) {
        setPlayerStats({
          goals: statsData.goals || 0,
          assists: statsData.assists || 0,
          mvp: statsData.mvp_count || 0,
          form: statsData.form_score || '9.2',
        });
      }

      const { data: resultsData } = await supabase
        .from('player_task_results')
        .select('*')
        .eq('player_id', playerId)
        .order('completed_at', { ascending: false });

      const playerResults = resultsData || [];
      setAiHistory(playerResults);

      const { data: assignmentsData } = await supabase
        .from('weekly_assignments')
        .select(`id, drill_id, deadline, coach_drills (id, title, drill_type, description, target_reps_default, points, level)`)
        .eq('is_active', true);

      if (assignmentsData && assignmentsData.length > 0) {
        const mappedDrills: AssignedDrill[] = assignmentsData.map((a: any, idx: number) => {
          const d = a.coach_drills || {};
          const done = playerResults.find((r: any) => r.assignment_id === a.id || r.drill_id === d.id);
          const fallbackCategory: Exclude<DrillModuleCategory, 'Wszystkie'> =
            d.drill_type === 'plank'
              ? 'Statyczne'
              : idx % 4 === 0
              ? 'Skoczność'
              : idx % 3 === 0
              ? 'Zwinność'
              : 'Dynamiczne';

          return {
            assignment_id: a.id,
            drill_id: d.id || a.drill_id,
            deadline: a.deadline || 'Do niedzieli',
            title: d.title || 'Zadanie AI',
            drill_type: d.drill_type || 'jump_squat',
            category: fallbackCategory,
            recommendedSports: [sportConfig.name, 'Koszykówka', 'Piłka Ręczna'],
            description: d.description || 'Wykonaj ćwiczenie przed obiektywem kamery.',
            target_reps: d.target_reps_default || 10,
            points: d.points || 100,
            level: d.level || 'Podstawowy',
            is_completed: !!done,
            last_score: done?.score,
            last_asymmetry: done?.asymmetry_index,
          };
        });
        setAssignedDrills([...mappedDrills, ...DEFAULT_Categorized_DRILLS]);
      }

      setTotalXP(playerObj?.xp || 300);
    } catch (err) {
      console.log('Błąd danych zawodnika:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const toggleDayInList = (dayId: number, setter: React.Dispatch<React.SetStateAction<number[]>>) => {
    setter((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]));
  };

  const handleSaveAiSchedule = () => {
    setupAiTrainerPlan(activePlayerId, {
      durationWeeks: planDurationWeeks,
      teamTrainingDays: selectedTeamDays,
      matchDays: selectedMatchDays,
      weeklyLoadCap,
    });
    setEditingAiSchedule(false);
  };

  // Zamiast od razu odpalać kamerę, otwieramy Ekran Pomostowy Rozgrzewki i Bezpieczeństwa Zdrowotnego
  const handleInitiateDrillWithWarmup = (
    drill: AssignedDrill,
    mode: 'standard' | 'ai_plan' | 'ai_baseline' = 'standard'
  ) => {
    if (!hasAiAccess) {
      router.push('/ZadaniaDomowe');
      return;
    }
    setScannerContextMode(mode);
    setActiveDrill(drill);
    setWarmupModalVisible(true);
  };

  const handleStartAiPlannedExercise = (ex: AiPlannedExercise) => {
    const drillTypeMap: Record<string, string> = {
      'squat-jumps': 'jump_squat',
      'skater-jumps': 'agility_skater',
      'hip-hamstring-mobility': 'mobility_stretch',
    };
    const mappedDrill: AssignedDrill = {
      assignment_id: `ai-plan-${ex.id}`,
      drill_id: ex.id,
      deadline: 'Trener AI',
      title: ex.title,
      drill_type: drillTypeMap[ex.id] || 'jump_squat',
      category: ex.id === 'hip-hamstring-mobility' ? 'Rozciągające' : 'Skoczność',
      recommendedSports: [sportConfig.name],
      description: `${ex.sets} serie × ${ex.repsOrSec} ${ex.unit} • Cel: ${ex.focus}`,
      target_reps: ex.repsOrSec,
      points: 110,
      level: activeAiPlan?.level || 'Start',
      is_completed: false,
    };
    handleInitiateDrillWithWarmup(mappedDrill, 'ai_plan');
  };

  const handleStartAiBaselineCamera = () => {
    const baselineDrill: AssignedDrill = {
      assignment_id: 'ai-baseline-test',
      drill_id: 'ai-baseline',
      deadline: 'Próba wstępna',
      title: 'Próba wstępna AI (Wyskoki z przysiadu)',
      drill_type: 'jump_squat',
      category: 'Skoczność',
      recommendedSports: [sportConfig.name],
      description: 'Wykonaj spokojnie 10 powtórzeń z dobrą techniką. AI oceni Twój poziom startowy.',
      target_reps: 10,
      points: 100,
      level: 'Start',
      is_completed: false,
    };
    handleInitiateDrillWithWarmup(baselineDrill, 'ai_baseline');
  };

  const toggleWarmupStep = (stepId: string) => {
    setCheckedWarmupSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    );
  };

  const handleConfirmWarmupAndLaunchCamera = () => {
    if (!healthDisclaimerAccepted) {
      if (Platform.OS === 'web') {
        window.alert('Potwierdź brak przeciwwskazań zdrowotnych oraz bezpieczne miejsce do ćwiczeń przed uruchomieniem kamery AI.');
      } else {
        Alert.alert(
          'Bezpieczeństwo przede wszystkim! 🛡️',
          'Zaznacz potwierdzenie, że czujesz się dobrze i masz bezpieczną przestrzeń do ćwiczeń.'
        );
      }
      return;
    }
    setWarmupModalVisible(false);
    setCameraFacing(isHandheldMode ? 'back' : 'front');
    setScannerVisible(true);
  };

  const handleScannerComplete = async (metrics: {
    reps: number;
    score: number;
    asymmetryIndex: number;
    detectedErrors: string[];
  }) => {
    setScannerVisible(false);
    if (!activeDrill || !currentPlayer) return;

    const warmupBonus = checkedWarmupSteps.length === WARMUP_STEPS.length ? 25 : 0;
    const totalEarned = activeDrill.points + warmupBonus;

    try {
      if (currentPlayer.id !== 'demo') {
        const isVirtualAssignment =
          activeDrill.assignment_id.startsWith('local-') ||
          activeDrill.assignment_id.startsWith('ai-');
        await supabase.from('player_task_results').insert([
          {
            player_id: currentPlayer.id,
            assignment_id: isVirtualAssignment ? null : activeDrill.assignment_id,
            reps_completed: metrics.reps,
            score: metrics.score,
            asymmetry_index: metrics.asymmetryIndex,
            completed_at: new Date().toISOString(),
          },
        ]);

        const updatedXp = totalXP + totalEarned;
        await supabase.from('players').update({ xp: updatedXp }).eq('id', currentPlayer.id);
      }

      if (scannerContextMode === 'standard') {
        setAssignedDrills((prev) =>
          prev.map((d) =>
            d.assignment_id === activeDrill.assignment_id
              ? { ...d, is_completed: true, last_score: metrics.score, last_asymmetry: metrics.asymmetryIndex }
              : d
          )
        );
      }

      setTotalXP((prev) => prev + totalEarned);

      if (scannerContextMode === 'ai_baseline') {
        completeAiBaselineTest(activePlayerId, {
          jumpReps: metrics.reps,
          plankSec: baselinePlankSec,
          formQualityPercent: metrics.score,
        });
        Alert.alert(
          'Próba wstępna zaliczona! 🎯',
          `AI oceniło technikę na ${metrics.score}% i dobrało bezpieczny plan startowy (+${totalEarned} XP).`
        );
        return;
      }

      if (scannerContextMode === 'ai_plan') {
        setLastAiScanScore(metrics.score);
        setSelectedFatigue('w_sam_raz');
        setSelectedPainArea('brak');
        setFatigueModalVisible(true);
        return;
      }

      Alert.alert(
        'Zadanie Zaliczone! Awatar Rośnie! 🏆🔥',
        `Zdobywasz +${totalEarned} XP (w tym +${warmupBonus} XP za pełną rozgrzewkę)!\n\nOcena Techniki AI: ${metrics.score}%\nAsymetria ciała: ${metrics.asymmetryIndex}%`
      );
    } catch (err) {
      Alert.alert('Sukces!', 'Zadanie ukończone.');
    }
  };

  const handleSubmitFatigueGuard = () => {
    logAiTrainingSession(activePlayerId, {
      completed: true,
      formQualityPercent: lastAiScanScore,
      fatigue: selectedFatigue,
      painArea: selectedPainArea,
    });
    setFatigueModalVisible(false);
    Alert.alert(
      selectedPainArea !== 'brak'
        ? 'Strażnik Bezpieczeństwa Aktywny 🛡️'
        : 'Sesja zapisana w Trenerze AI! ✅',
      selectedPainArea !== 'brak'
        ? 'Zgłoszono dyskomfort — progres został zablokowany, a kolejne ćwiczenia przełączono na lżejszy tryb regeneracyjny.'
        : 'Plan został przeliczony z uwzględnieniem Twojej techniki i regeneracji.'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </SafeAreaView>
    );
  }

  const avgAiScore =
    aiHistory.length > 0
      ? Math.round(aiHistory.reduce((acc, r) => acc + (r.score || 0), 0) / aiHistory.length)
      : 92;
  const avgAiAsymmetry =
    aiHistory.length > 0
      ? Math.round((aiHistory.reduce((acc, r) => acc + (r.asymmetry_index || 0), 0) / aiHistory.length) * 10) / 10
      : 3.4;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* GÓRNY PASEK GRYWALIZACJI */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Strefa Zawodnika {sportConfig.emoji}⚡</Text>
          <Text style={styles.headerSubtitle}>Trener AI, ewolucja Awatara i rozgrzewka</Text>
        </View>
        <TouchableOpacity style={styles.xpPill} onPress={() => setActiveTab('avatar')}>
          <Ionicons name="flash" size={14} color="#0f172a" />
          <Text style={styles.xpPillText}>{totalXP} XP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentPlayer && (
          <>
            {/* KARTA EWOLUCJI AWATARA (OD SZKIELETORA DO SUPERBOHATERA) */}
            <TouchableOpacity
              style={[styles.profileCard, { borderColor: currentAvatarTier.color }]}
              onPress={() => setActiveTab('avatar')}
              activeOpacity={0.9}
            >
              <View style={[styles.avatarLarge, { borderColor: currentAvatarTier.color }]}>
                <Text style={{ fontSize: 28 }}>{currentAvatarTier.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.avatarTierBadge, { color: currentAvatarTier.color }]}>
                    {currentAvatarTier.badge}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#fbbf24' }}>
                    #{currentPlayer.number || '10'}
                  </Text>
                </View>

                <Text style={styles.profileName}>
                  {currentPlayer.first_name || currentPlayer.name || 'Zawodnik'} • {currentAvatarTier.name}
                </Text>

                {/* Pasek postępu do kolejnej formy Awatara */}
                <View style={styles.xpBarBg}>
                  <View
                    style={[
                      styles.xpBarFill,
                      { width: `${avatarProgressPercent}%`, backgroundColor: currentAvatarTier.color },
                    ]}
                  />
                </View>
                <Text style={styles.xpNextText}>
                  {nextAvatarTier
                    ? `Do formy „${nextAvatarTier.emoji} ${nextAvatarTier.name}”: brakuje ${
                        nextAvatarTier.minXp - totalXP
                      } XP`
                    : 'Osiągnięto maksymalną formę Superbohatera! 🏆'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ZAKŁADKI */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'tasks' && styles.tabBtnActive]}
                onPress={() => setActiveTab('tasks')}
              >
                <Ionicons name="videocam-outline" size={13} color={activeTab === 'tasks' ? '#0f172a' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, activeTab === 'tasks' && styles.tabBtnTextActive]}>Ćwiczenia</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'ai_trainer' && styles.tabBtnActive]}
                onPress={() => setActiveTab('ai_trainer')}
              >
                <Ionicons name="sparkles-outline" size={13} color={activeTab === 'ai_trainer' ? '#0f172a' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, activeTab === 'ai_trainer' && styles.tabBtnTextActive]}>Trener AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'avatar' && styles.tabBtnActive]}
                onPress={() => setActiveTab('avatar')}
              >
                <Ionicons name="body-outline" size={13} color={activeTab === 'avatar' ? '#0f172a' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, activeTab === 'avatar' && styles.tabBtnTextActive]}>Awatar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'progress' && styles.tabBtnActive]}
                onPress={() => setActiveTab('progress')}
              >
                <Ionicons name="trending-up-outline" size={13} color={activeTab === 'progress' ? '#0f172a' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, activeTab === 'progress' && styles.tabBtnTextActive]}>Bio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]}
                onPress={() => setActiveTab('stats')}
              >
                <Ionicons name="trophy-outline" size={13} color={activeTab === 'stats' ? '#0f172a' : '#94a3b8'} />
                <Text style={[styles.tabBtnText, activeTab === 'stats' && styles.tabBtnTextActive]}>Sezon</Text>
              </TouchableOpacity>
            </View>

            {/* ==================== ZAKŁADKA 1: SKARBNICA ĆWICZEŃ WG MODUŁÓW I DYSCYPLIN ==================== */}
            {activeTab === 'tasks' && (
              <>
                {/* DARMOWA INTEGRACJA APPLE HEALTH / GOOGLE HEALTH CONNECT + GARMIN */}
                {features.enableWearables && (
                  <TouchableOpacity
                    style={styles.featureCard}
                    onPress={() => setWearablesModalVisible(true)}
                  >
                    <View style={styles.featureIconBox}>
                      <Ionicons name="fitness" size={22} color="#38bdf8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureCardTitle}>Apple Health / Google Health & Zegarki GPS</Text>
                      <Text style={styles.featureCardSub}>
                        Darmowa synchronizacja biegów, roweru i spacerów (+XP do Kondycji Awatara)
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}

                {/* FILTROWANIE PO MODUŁACH */}
                <Text style={styles.sectionTitle}>Moduły Treningowe (Dopasowane pod: {sportConfig.name}):</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {(['Wszystkie', 'Skoczność', 'Zwinność', 'Dynamiczne', 'Statyczne', 'Rozciągające'] as DrillModuleCategory[]).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                        onPress={() => setSelectedCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>

                <View style={styles.modeSelectorCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.modeSelectorTitle, { marginBottom: 0 }]}>Tryb nagrywania i Lektor AI:</Text>
                    <TouchableOpacity
                      style={[
                        styles.voiceMiniBtn,
                        voiceCoachEnabled ? styles.voiceMiniBtnOn : styles.voiceMiniBtnOff,
                      ]}
                      onPress={toggleVoiceCoach}
                    >
                      <Text style={styles.voiceMiniBtnText}>
                        {voiceCoachEnabled ? '🔊 Lektor: WŁ.' : '🔇 Lektor: WYŁ.'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modeButtonsRow}>
                    <TouchableOpacity
                      style={[styles.modeBtn, isHandheldMode && styles.modeBtnActive]}
                      onPress={() => setIsHandheldMode(true)}
                    >
                      <Ionicons
                        name="hand-left-outline"
                        size={16}
                        color={isHandheldMode ? '#38bdf8' : '#94a3b8'}
                      />
                      <Text style={[styles.modeBtnText, isHandheldMode && styles.modeBtnTextActive]}>
                        Rodzic trzyma
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeBtn, !isHandheldMode && styles.modeBtnActive]}
                      onPress={() => setIsHandheldMode(false)}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={16}
                        color={!isHandheldMode ? '#38bdf8' : '#94a3b8'}
                      />
                      <Text style={[styles.modeBtnText, !isHandheldMode && styles.modeBtnTextActive]}>
                        Na statywie
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {filteredDrills.map((drill) => {
                  const isRecommendedForCurrentSport = drill.recommendedSports.includes(sportConfig.name);

                  return (
                    <View
                      key={drill.assignment_id}
                      style={[styles.taskCard, drill.is_completed && styles.taskCardCompleted]}
                    >
                      <View style={styles.taskTopRow}>
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                          <View style={styles.drillBadge}>
                            <Text style={styles.drillBadgeText}>MODUŁ: {drill.category.toUpperCase()}</Text>
                          </View>
                          {isRecommendedForCurrentSport && (
                            <View style={styles.sportRecBadge}>
                              <Text style={styles.sportRecBadgeText}>
                                ⭐ POLECANE: {sportConfig.name.toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.pointsBadge}>+{drill.points} XP</Text>
                      </View>

                      <Text style={styles.taskTitle}>{drill.title}</Text>
                      <Text style={styles.taskDesc}>{drill.description}</Text>
                      <Text style={styles.recSportsSub}>
                        🎯 Przydatne w: {drill.recommendedSports.join(' • ')}
                      </Text>

                      {drill.is_completed && (
                        <View style={styles.aiResultPill}>
                          <Ionicons name="checkmark-done-circle" size={16} color="#4ade80" />
                          <Text style={styles.aiResultPillText}>
                            Zaliczone! Ocena AI: {drill.last_score}% | Asymetria: {drill.last_asymmetry}%
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.startScannerBtn,
                          drill.is_completed && styles.startScannerBtnRepeat,
                          !hasAiAccess && { backgroundColor: '#f59e0b' },
                        ]}
                        onPress={() => handleInitiateDrillWithWarmup(drill, 'standard')}
                      >
                        <Ionicons
                          name={hasAiAccess ? 'shield-checkmark-outline' : 'lock-closed'}
                          size={16}
                          color="#0f172a"
                        />
                        <Text style={styles.startScannerBtnText}>
                          {!hasAiAccess
                            ? 'Odblokuj Skaner AI (Pakiet PRO)'
                            : drill.is_completed
                            ? 'Rozgrzewka & Popraw wynik w AI'
                            : 'Rozgrzewka & Uruchom Skaner AI'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}

            {/* ==================== ZAKŁADKA 2: TRENER PERSONALNY AI (8-12 TYG. + STRAŻNIK REGENERACJI) ==================== */}
            {activeTab === 'ai_trainer' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Trener Personalny AI 🤖🛡️</Text>
                  <TouchableOpacity
                    style={[
                      styles.voiceMiniBtn,
                      voiceCoachEnabled ? styles.voiceMiniBtnOn : styles.voiceMiniBtnOff,
                    ]}
                    onPress={toggleVoiceCoach}
                  >
                    <Text style={styles.voiceMiniBtnText}>
                      {voiceCoachEnabled ? '🔊 Lektor: WŁ.' : '🔇 Lektor: WYŁ.'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* KROK 1: KONFIGURACJA GRAFIKU TYGODNIA I BUFORA ŚWIEŻYCH NÓG */}
                {(!activeAiPlan || editingAiSchedule) && (
                  <View style={styles.aiCard}>
                    <Text style={styles.aiCardTitle}>📅 Ułóż bezpieczny plan wokół drużyny</Text>
                    <Text style={styles.aiCardSub}>
                      Zaznacz dni treningów drużynowych i meczów. Algorytm automatycznie zostawi wolny dzień przed meczem (bufor świeżych nóg) i wpasuje lekkie sesje dodatkowe.
                    </Text>

                    <Text style={styles.aiFieldLabel}>Długość programu:</Text>
                    <View style={styles.aiRowGap}>
                      {([8, 12] as (8 | 12)[]).map((wks) => (
                        <TouchableOpacity
                          key={wks}
                          style={[styles.aiSelectChip, planDurationWeeks === wks && styles.aiSelectChipActive]}
                          onPress={() => setPlanDurationWeeks(wks)}
                        >
                          <Text
                            style={[
                              styles.aiSelectChipText,
                              planDurationWeeks === wks && styles.aiSelectChipTextActive,
                            ]}
                          >
                            {wks} tygodni
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.aiFieldLabel}>Dni treningów drużynowych (⚽):</Text>
                    <View style={styles.weekDaysRow}>
                      {WEEK_DAYS.map((d) => {
                        const active = selectedTeamDays.includes(d.id);
                        return (
                          <TouchableOpacity
                            key={`team-${d.id}`}
                            style={[styles.dayChip, active && styles.dayChipTeam]}
                            onPress={() => toggleDayInList(d.id, setSelectedTeamDays)}
                          >
                            <Text style={[styles.dayChipText, active && { color: '#0f172a' }]}>{d.short}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.aiFieldLabel}>Dni meczowe (🏆 – dzień przed nimi chronimy):</Text>
                    <View style={styles.weekDaysRow}>
                      {WEEK_DAYS.map((d) => {
                        const active = selectedMatchDays.includes(d.id);
                        return (
                          <TouchableOpacity
                            key={`match-${d.id}`}
                            style={[styles.dayChip, active && styles.dayChipMatch]}
                            onPress={() => toggleDayInList(d.id, setSelectedMatchDays)}
                          >
                            <Text style={[styles.dayChipText, active && { color: '#0f172a' }]}>{d.short}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.aiFieldLabel}>Maksymalnie dodatkowych sesji w tygodniu (bezpiecznik):</Text>
                    <View style={styles.aiRowGap}>
                      {[1, 2, 3].map((cap) => (
                        <TouchableOpacity
                          key={cap}
                          style={[styles.aiSelectChip, weeklyLoadCap === cap && styles.aiSelectChipActive]}
                          onPress={() => setWeeklyLoadCap(cap)}
                        >
                          <Text
                            style={[
                              styles.aiSelectChipText,
                              weeklyLoadCap === cap && styles.aiSelectChipTextActive,
                            ]}
                          >
                            {cap} {cap === 1 ? 'sesja' : 'sesje'} / tydz.
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.startScannerBtn} onPress={handleSaveAiSchedule}>
                      <Ionicons name="shield-checkmark" size={16} color="#0f172a" />
                      <Text style={styles.startScannerBtnText}>Ułóż harmonogram z buforem regeneracji</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* KROK 2: PRÓBA WSTĘPNA (BASELINE) */}
                {activeAiPlan && !editingAiSchedule && !activeAiPlan.baselineCompleted && (
                  <View style={[styles.aiCard, { borderColor: '#fbbf24' }]}>
                    <Text style={[styles.aiCardTitle, { color: '#fbbf24' }]}>🎯 Krok 2: Próba Wstępna (Baseline)</Text>
                    <Text style={styles.aiCardSub}>
                      Wykonaj krótki test startowy, aby Trener AI dobrał bezpieczną liczbę serii i powtórzeń. Jakość ruchu jest ważniejsza niż liczba powtórzeń!
                    </Text>

                    <TouchableOpacity style={styles.startScannerBtn} onPress={handleStartAiBaselineCamera}>
                      <Ionicons name="videocam" size={16} color="#0f172a" />
                      <Text style={styles.startScannerBtnText}>Wykonaj próbę wstępną z kamerą AI</Text>
                    </TouchableOpacity>

                    <View style={styles.aiDivider} />
                    <Text style={styles.aiFieldLabel}>Lub wpisz wynik próby z trenerem / rodzicem:</Text>

                    <View style={styles.baselineRow}>
                      <Text style={styles.baselineLabel}>Wyskoki z przysiadu (powt.):</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setBaselineJumps((v) => Math.max(3, v - 1))}
                        >
                          <Text style={styles.stepperBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperVal}>{baselineJumps}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setBaselineJumps((v) => Math.min(20, v + 1))}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.baselineRow}>
                      <Text style={styles.baselineLabel}>Deska / Plank (sekundy):</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setBaselinePlankSec((v) => Math.max(10, v - 5))}
                        >
                          <Text style={styles.stepperBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperVal}>{baselinePlankSec}s</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setBaselinePlankSec((v) => Math.min(90, v + 5))}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.startScannerBtn, { backgroundColor: '#4ade80' }]}
                      onPress={() =>
                        completeAiBaselineTest(activePlayerId, {
                          jumpReps: baselineJumps,
                          plankSec: baselinePlankSec,
                          formQualityPercent: 80,
                        })
                      }
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#0f172a" />
                      <Text style={styles.startScannerBtnText}>Zapisz próbę i wygeneruj plan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* KROK 3: AKTYWNY PLAN TRENERA AI + STRAŻNIK REGENERACJI */}
                {activeAiPlan && !editingAiSchedule && activeAiPlan.baselineCompleted && (
                  <>
                    <View
                      style={[
                        styles.aiCard,
                        { borderColor: activeAiPlan.isDeloadWeek ? '#f59e0b' : '#22c55e' },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={styles.drillBadge}>
                          <Text style={styles.drillBadgeText}>
                            TYDZIEŃ {activeAiPlan.currentWeek} / {activeAiPlan.durationWeeks} • POZIOM:{' '}
                            {activeAiPlan.level.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => setEditingAiSchedule(true)}>
                          <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: 'bold' }}>⚙️ Zmień grafik</Text>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.guardBanner,
                          activeAiPlan.isDeloadWeek ? styles.guardBannerWarn : styles.guardBannerOk,
                        ]}
                      >
                        <Text style={styles.guardBannerTitle}>
                          {activeAiPlan.isDeloadWeek
                            ? '🛡️ Tryb regeneracyjny (Deload aktywny)'
                            : '✅ Strażnik regeneracji: Zielone światło'}
                        </Text>
                        <Text style={styles.guardBannerMsg}>{activeAiPlan.statusMessage}</Text>
                      </View>

                      <Text style={styles.aiFieldLabel}>Twój bezpieczny tydzień (bufor przed meczem):</Text>
                      <View style={styles.weekDaysRow}>
                        {WEEK_DAYS.map((d) => {
                          const isMatch = activeAiPlan.matchDays.includes(d.id);
                          const isTeam = activeAiPlan.teamTrainingDays.includes(d.id);
                          const isExtra = activeAiPlan.extraTrainingDays.includes(d.id);
                          const isDayBeforeMatch = activeAiPlan.matchDays.some((m) => (m + 6) % 7 === d.id);

                          let tag = 'Wolne';
                          let chipStyle = styles.dayChip;
                          if (isMatch) {
                            tag = '🏆';
                            chipStyle = { ...styles.dayChip, ...styles.dayChipMatch };
                          } else if (isExtra) {
                            tag = '🤖';
                            chipStyle = { ...styles.dayChip, ...styles.dayChipAi };
                          } else if (isTeam) {
                            tag = '⚽';
                            chipStyle = { ...styles.dayChip, ...styles.dayChipTeam };
                          } else if (isDayBeforeMatch) {
                            tag = '🛡️';
                          }

                          return (
                            <View key={`sched-${d.id}`} style={[chipStyle, { paddingVertical: 7 }]}>
                              <Text
                                style={[
                                  styles.dayChipText,
                                  (isMatch || isExtra || isTeam) && { color: '#0f172a' },
                                ]}
                              >
                                {d.short}
                              </Text>
                              <Text style={{ fontSize: 10, marginTop: 2 }}>{tag}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                        ⚽ Drużyna • 🏆 Mecz • 🛡️ Świeże nogi (dzień przed meczem) • 🤖 Sesja AI
                      </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Dzisiejszy zestaw Trenera AI:</Text>
                    {activeAiPlan.exercises.map((ex) => (
                      <View key={ex.id} style={styles.taskCard}>
                        <View style={styles.taskTopRow}>
                          <View style={styles.drillBadge}>
                            <Text style={styles.drillBadgeText}>
                              {ex.sets} SERIE × {ex.repsOrSec} {ex.unit.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.pointsBadge}>+110 XP</Text>
                        </View>
                        <Text style={styles.taskTitle}>{ex.title}</Text>
                        <Text style={styles.taskDesc}>🎯 Cel: {ex.focus}</Text>

                        <TouchableOpacity
                          style={styles.startScannerBtn}
                          onPress={() => handleStartAiPlannedExercise(ex)}
                        >
                          <Ionicons name="videocam-outline" size={16} color="#0f172a" />
                          <Text style={styles.startScannerBtnText}>Rozgrzewka & Uruchom z Lektorem AI</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={[styles.startScannerBtn, { backgroundColor: '#fbbf24', marginBottom: 14 }]}
                      onPress={() => {
                        setLastAiScanScore(85);
                        setSelectedFatigue('w_sam_raz');
                        setSelectedPainArea('brak');
                        setFatigueModalVisible(true);
                      }}
                    >
                      <Ionicons name="heart-outline" size={16} color="#0f172a" />
                      <Text style={styles.startScannerBtnText}>Zakończ sesję i oceń zmęczenie / ból</Text>
                    </TouchableOpacity>

                    {activeAiPlan.logs.length > 0 && (
                      <View style={styles.aiCard}>
                        <Text style={styles.aiCardTitle}>📋 Ostatnie sesje Trenera AI</Text>
                        {activeAiPlan.logs.slice(0, 3).map((lg) => (
                          <View key={lg.id} style={styles.logRow}>
                            <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: 'bold' }}>
                              Tydz. {lg.weekNumber} ({lg.date})
                            </Text>
                            <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                              Technika: {lg.formQualityPercent}% • Zmęczenie: {lg.fatigue} • Ból: {lg.painArea}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* ==================== ZAKŁADKA 3: DRZEWKO EWOLUCJI AWATARA ==================== */}
            {activeTab === 'avatar' && (
              <View>
                <Text style={styles.sectionTitle}>Od Szkieletora do Superbohatera 🧬🦸‍♂️</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14, lineHeight: 18 }}>
                  Kamera AI (MediaPipe) śledzi Twój cyfrowy szkielet. Każde poprawne powtórzenie w planku, pompkach czy wyskokach dodaje punkty XP i rozbudowuje Twoją postać!
                </Text>

                {AVATAR_EVOLUTION_TIERS.map((tier) => {
                  const isUnlocked = totalXP >= tier.minXp;
                  const isCurrent = currentAvatarTier.level === tier.level;

                  return (
                    <View
                      key={tier.level}
                      style={[
                        styles.tierRowCard,
                        isCurrent && { borderColor: tier.color, borderWidth: 2 },
                        !isUnlocked && { opacity: 0.5 },
                      ]}
                    >
                      <View style={[styles.tierEmojiBox, { borderColor: tier.color }]}>
                        <Text style={{ fontSize: 26 }}>{tier.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={[styles.tierTitleText, { color: isUnlocked ? '#f8fafc' : '#94a3b8' }]}>
                            Poziom {tier.level}: {tier.name}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: tier.color }}>
                            od {tier.minXp} XP
                          </Text>
                        </View>
                        <Text style={styles.tierDescText}>{tier.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ==================== ZAKŁADKA 4: BIOMECHANIKA ==================== */}
            {activeTab === 'progress' && (
              <View>
                <Text style={styles.sectionTitle}>Twój Balans i Biomechanika (MediaPipe) 🧬</Text>
                <View style={styles.bioSummaryRow}>
                  <View style={styles.bioCard}>
                    <Text style={styles.bioCardVal}>{avgAiScore}%</Text>
                    <Text style={styles.bioCardLbl}>Średnia Technika</Text>
                  </View>
                  <View style={styles.bioCard}>
                    <Text style={[styles.bioCardVal, { color: avgAiAsymmetry > 10 ? '#f87171' : '#4ade80' }]}>
                      {avgAiAsymmetry}%
                    </Text>
                    <Text style={styles.bioCardLbl}>Indeks Asymetrii</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== ZAKŁADKA 5: STATYSTYKI SEZONU ==================== */}
            {activeTab === 'stats' && (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxNum}>{sportConfig.emoji} {playerStats.goals}</Text>
                  <Text style={styles.statBoxLabel}>{sportConfig.primaryStatLabel}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxNum}>🎯 {playerStats.assists}</Text>
                  <Text style={styles.statBoxLabel}>{sportConfig.secondaryStatLabel}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxNum}>⭐ {playerStats.mvp}</Text>
                  <Text style={styles.statBoxLabel}>Wyróżnienia MVP</Text>
                </View>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: EKRAN POMOSTOWY BEZPIECZEŃSTWA ZDROWOTNEGO I OBOWIĄZKOWEJ ROZGRZEWKI */}
      <Modal visible={warmupModalVisible} animationType="fade" transparent={true}>
        <View style={styles.warmupOverlay}>
          <View style={styles.warmupBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.warmupMainTitle}>🛑 Zatrzymaj się! Czas na Rozgrzewkę</Text>
              <TouchableOpacity onPress={() => setWarmupModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.warmupSubtitle}>
              Zanim uruchomisz kamerę dla ćwiczenia „{activeDrill?.title}”, przygotuj mięśnie i stawy, aby uniknąć kontuzji (+25 XP bonusu za pełną rozgrzewkę):
            </Text>

            {activeDrill && (activeDrill.drill_type === 'pushups' || activeDrill.drill_type === 'agility_skater' || activeDrill.drill_type === 'mobility_stretch') && (
              <View style={styles.mpPreviewBanner}>
                <Video
                  style={{ width: '100%', height: 110, borderRadius: 10 }}
                  source={{
                    uri:
                      activeDrill.drill_type === 'pushups'
                        ? 'http://googleusercontent.com/generated_video_content/5797546079038096363'
                        : activeDrill.drill_type === 'agility_skater'
                        ? 'http://googleusercontent.com/generated_video_content/10283269573213398132'
                        : 'http://googleusercontent.com/generated_video_content/9565356140825529223',
                  }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay
                  isMuted
                />
                <Text style={styles.mpPreviewCaption}>
                  Podgląd wzorca + szkielet MediaPipe: {activeDrill.title}
                </Text>
              </View>
            )}

            <View style={{ marginVertical: 10 }}>
              {WARMUP_STEPS.map((st) => {
                const isDone = checkedWarmupSteps.includes(st.id);
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.warmupStepRow, isDone && styles.warmupStepRowDone]}
                    onPress={() => toggleWarmupStep(st.id)}
                  >
                    <Ionicons
                      name={isDone ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isDone ? '#4ade80' : '#94a3b8'}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.warmupStepTitle}>{st.title}</Text>
                      <Text style={styles.warmupStepDesc}>{st.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* KLAUZULA BEZPIECZEŃSTWA ZDROWOTNEGO (MEDICAL DISCLAIMER) */}
            <TouchableOpacity
              style={styles.disclaimerCheckBox}
              onPress={() => setHealthDisclaimerAccepted(!healthDisclaimerAccepted)}
            >
              <Ionicons
                name={healthDisclaimerAccepted ? 'checkbox' : 'square-outline'}
                size={20}
                color={healthDisclaimerAccepted ? '#fbbf24' : '#f87171'}
              />
              <Text style={styles.disclaimerText}>
                Oświadczam, że wykonałem rozgrzewkę, nie odczuwam bólu ani przeciwwskazań zdrowotnych oraz mam wolną przestrzeń wokół siebie. Ćwiczenia wykonuję z zachowaniem ostrożności.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.launchCameraAfterWarmupBtn,
                !healthDisclaimerAccepted && { backgroundColor: '#334155' },
              ]}
              onPress={handleConfirmWarmupAndLaunchCamera}
            >
              <Ionicons name="videocam" size={18} color="#0f172a" />
              <Text style={styles.launchCameraAfterWarmupText}>
                Jestem rozgrzany — Uruchom Skaner AI
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: STRAŻNIK REGENERACJI I BÓLU PO SESJI AI */}
      <Modal visible={fatigueModalVisible} animationType="fade" transparent={true}>
        <View style={styles.warmupOverlay}>
          <View style={[styles.warmupBox, { borderColor: '#38bdf8' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.warmupMainTitle, { color: '#38bdf8' }]}>🛡️ Strażnik Regeneracji AI</Text>
              <TouchableOpacity onPress={() => setFatigueModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.warmupSubtitle}>
              Ocena techniki z MediaPipe: {lastAiScanScore}%. Powiedz, jak się czujesz — dzięki temu algorytm nie dopuści do przeciążenia.
            </Text>

            <Text style={styles.aiFieldLabel}>Jak oceniasz trudność tej sesji?</Text>
            <View style={styles.aiRowGap}>
              {FATIGUE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.aiSelectChip, selectedFatigue === opt.value && styles.aiSelectChipActive]}
                  onPress={() => setSelectedFatigue(opt.value)}
                >
                  <Text
                    style={[
                      styles.aiSelectChipText,
                      selectedFatigue === opt.value && styles.aiSelectChipTextActive,
                    ]}
                  >
                    {opt.emoji} {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.aiFieldLabel}>Czy pojawił się ból lub dyskomfort?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {PAIN_OPTIONS.map((opt) => {
                const isSelected = selectedPainArea === opt.value;
                const isWarning = opt.value !== 'brak' && isSelected;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.painChip,
                      isSelected && styles.painChipOk,
                      isWarning && styles.painChipWarn,
                    ]}
                    onPress={() => setSelectedPainArea(opt.value)}
                  >
                    <Text
                      style={[
                        styles.painChipText,
                        isSelected && { color: '#0f172a', fontWeight: 'bold' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.startScannerBtn} onPress={handleSubmitFatigueGuard}>
              <Ionicons name="checkmark-done" size={18} color="#0f172a" />
              <Text style={styles.startScannerBtnText}>Zapisz sesję i przelicz plan AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: OPASKI I WEARABLES */}
      <WearablesSyncModal
        visible={wearablesModalVisible}
        onClose={() => setWearablesModalVisible(false)}
        playerId={currentPlayer?.id || ''}
        onActivitySynced={() => {
          fetchCurrentZawodnik();
        }}
      />

      {/* MODAL 4: SKANER AI */}
      <Modal animationType="slide" visible={scannerVisible} onRequestClose={() => setScannerVisible(false)}>
        <SafeAreaView style={styles.scannerModalContainer}>
          <View style={styles.scannerTopBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scannerTitle}>{activeDrill?.title}</Text>
              <Text style={styles.scannerSub}>
                {isHandheldMode ? '🤳 Tryb: Rodzic trzyma' : '📌 Tryb: Statyw'} • Zadbaj o dobre oświetlenie z przodu
              </Text>
            </View>
            <TouchableOpacity
              style={styles.switchCamBtn}
              onPress={() => setCameraFacing((p) => (p === 'front' ? 'back' : 'front'))}
            >
              <Ionicons name="camera-reverse-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeScannerBtn} onPress={() => setScannerVisible(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {activeDrill && (
              <MediaPipePoseScanner
                facing={cameraFacing}
                targetReps={activeDrill.target_reps}
                drillType={activeDrill.drill_type}
                isHandheld={isHandheldMode}
                onComplete={handleScannerComplete}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  headerSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  xpPillText: { fontSize: 13, fontWeight: '900', color: '#0f172a', marginLeft: 4 },
  logoutBtn: {
    padding: 7,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },

  content: { padding: 16 },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarTierBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc', marginTop: 2 },
  xpBarBg: {
    height: 7,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  xpBarFill: { height: '100%', borderRadius: 4 },
  xpNextText: { fontSize: 10, color: '#94a3b8', marginTop: 4 },

  featureCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284c7',
    marginBottom: 14,
    gap: 12,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#f8fafc' },
  featureCardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 3,
  },
  tabBtnActive: { backgroundColor: '#38bdf8' },
  tabBtnText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8' },
  tabBtnTextActive: { color: '#0f172a' },

  voiceMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  voiceMiniBtnOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  voiceMiniBtnOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  voiceMiniBtnText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: 'bold',
  },

  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  categoryChipText: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
  categoryChipTextActive: { color: '#0f172a' },

  modeSelectorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  modeSelectorTitle: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  modeButtonsRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  modeBtnActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)' },
  modeBtnText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  modeBtnTextActive: { color: '#38bdf8', fontWeight: 'bold' },

  aiCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  aiCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc' },
  aiCardSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 17 },
  aiFieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#cbd5e1', marginTop: 12, marginBottom: 6 },
  aiRowGap: { flexDirection: 'row', gap: 8 },
  aiSelectChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  aiSelectChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  aiSelectChipText: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
  aiSelectChipTextActive: { color: '#0f172a' },
  weekDaysRow: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  dayChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  dayChipTeam: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  dayChipMatch: { backgroundColor: '#fbbf24', borderColor: '#fbbf24' },
  dayChipAi: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  dayChipText: { fontSize: 11, fontWeight: 'bold', color: '#cbd5e1' },
  aiDivider: { height: 1, backgroundColor: '#334155', marginVertical: 14 },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  baselineLabel: { fontSize: 12, color: '#f8fafc', fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { color: '#38bdf8', fontSize: 16, fontWeight: 'bold' },
  stepperVal: { color: '#fff', fontSize: 13, fontWeight: 'bold', minWidth: 32, textAlign: 'center' },
  guardBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  guardBannerOk: { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: '#22c55e' },
  guardBannerWarn: { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: '#f59e0b' },
  guardBannerTitle: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc' },
  guardBannerMsg: { fontSize: 11, color: '#cbd5e1', marginTop: 3, lineHeight: 16 },
  logRow: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  painChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  painChipOk: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  painChipWarn: { backgroundColor: '#f87171', borderColor: '#ef4444' },
  painChipText: { fontSize: 11, color: '#cbd5e1' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10, marginTop: 4 },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskCardCompleted: { borderColor: '#22c55e' },
  taskTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  drillBadge: { backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  drillBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#38bdf8' },
  sportRecBadge: { backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sportRecBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fbbf24' },
  pointsBadge: { fontSize: 13, fontWeight: '900', color: '#fbbf24' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  taskDesc: { fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 17 },
  recSportsSub: { fontSize: 10, color: '#38bdf8', marginTop: 6, fontWeight: '600' },
  aiResultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  aiResultPillText: { fontSize: 11, fontWeight: 'bold', color: '#4ade80' },
  startScannerBtn: {
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  startScannerBtnRepeat: { backgroundColor: '#4ade80' },
  startScannerBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '900' },

  tierRowCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tierEmojiBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  tierTitleText: { fontSize: 14, fontWeight: 'bold' },
  tierDescText: { fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 16 },

  bioSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  bioCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bioCardVal: { fontSize: 20, fontWeight: '900', color: '#38bdf8' },
  bioCardLbl: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statBoxNum: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  statBoxLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },

  warmupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  warmupBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warmupMainTitle: { fontSize: 16, fontWeight: 'bold', color: '#fbbf24', flex: 1 },
  warmupSubtitle: { fontSize: 12, color: '#cbd5e1', marginTop: 6, lineHeight: 17 },
  warmupStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  warmupStepRowDone: { borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.08)' },
  warmupStepTitle: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc' },
  warmupStepDesc: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  disclaimerCheckBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: 6,
    gap: 8,
  },
  disclaimerText: { flex: 1, fontSize: 10, color: '#fde68a', lineHeight: 14 },
  launchCameraAfterWarmupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  launchCameraAfterWarmupText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },

  scannerModalContainer: { flex: 1, backgroundColor: '#000' },
  scannerTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0f172a' },
  scannerTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  scannerSub: { color: '#38bdf8', fontSize: 11, marginTop: 2 },
  switchCamBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  closeScannerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  mpPreviewBanner: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  mpPreviewCaption: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
