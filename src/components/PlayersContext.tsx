import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

export interface HomeworkPrescription {
  exerciseId: string;
  title: string;
  drillType: string;
  sets: number;
  repsOrSec: number;
  unit: 'powt.' | 'sek.';
  restSec: number;
  xpReward: number;
  requireWarmup: boolean;
  assignedAt: string;
}

export type AiTrainerLevel = 'Start' | 'Podstawowy' | 'Średni' | 'Zaawansowany';
export type AiFatigueFeedback = 'lekko' | 'w_sam_raz' | 'ciezko';
export type AiPainArea = 'brak' | 'kolano' | 'biodro' | 'plecy' | 'kostka' | 'inne';

export interface AiPlannedExercise {
  id: string;
  title: string;
  sets: number;
  repsOrSec: number;
  unit: 'powt.' | 'sek.';
  focus: string;
}

export interface AiSessionLog {
  id: string;
  date: string;
  weekNumber: number;
  completed: boolean;
  formQualityPercent: number; // 0-100 z MediaPipe
  fatigue: AiFatigueFeedback;
  painArea: AiPainArea;
  notes?: string;
}

export interface AiPersonalTrainerPlan {
  playerId: string;
  durationWeeks: 8 | 12;
  currentWeek: number;
  level: AiTrainerLevel;
  teamTrainingDays: number[]; // 0 = Nd, 1 = Pn, ..., 6 = Sb
  matchDays: number[];
  extraTrainingDays: number[]; // Wyznaczone automatycznie z buforem świeżych nóg
  baselineCompleted: boolean;
  baselineScorePercent?: number;
  weeklyLoadCap: number; // Bezpiecznik maksymalnej liczby sesji dodatkowych w tygodniu
  isDeloadWeek: boolean;
  statusMessage: string;
  exercises: AiPlannedExercise[];
  logs: AiSessionLog[];
  updatedAt: string;
}

const calculateSafeExtraDays = (
  teamDays: number[],
  matchDays: number[],
  weeklyLoadCap: number = 2
): number[] => {
  // Bufor "świeżych nóg": blokujemy dni treningów drużynowych, dni meczowe oraz dzień PRZED meczem
  const blockedDays = new Set<number>([...teamDays, ...matchDays]);
  matchDays.forEach((mDay) => {
    const dayBeforeMatch = (mDay + 6) % 7;
    blockedDays.add(dayBeforeMatch);
  });

  // Preferowana kolejność dni tygodnia (Pn-Nd)
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const freeDays = weekOrder.filter((day) => !blockedDays.has(day));
  return freeDays.slice(0, Math.max(1, Math.min(weeklyLoadCap, 3)));
};

const buildAiExercises = (level: AiTrainerLevel, isDeload: boolean): AiPlannedExercise[] => {
  const baseMap: Record<
    AiTrainerLevel,
    { sets: number; jumpReps: number; skaterReps: number; mobilitySec: number }
  > = {
    Start: { sets: 2, jumpReps: 6, skaterReps: 8, mobilitySec: 30 },
    Podstawowy: { sets: 3, jumpReps: 8, skaterReps: 10, mobilitySec: 40 },
    Średni: { sets: 3, jumpReps: 10, skaterReps: 12, mobilitySec: 45 },
    Zaawansowany: { sets: 4, jumpReps: 12, skaterReps: 14, mobilitySec: 50 },
  };

  const cfg = baseMap[level];
  const factor = isDeload ? 0.7 : 1;

  return [
    {
      id: 'squat-jumps',
      title: 'Wyskoki z przysiadu (Plyometria)',
      sets: isDeload ? Math.max(2, cfg.sets - 1) : cfg.sets,
      repsOrSec: Math.max(4, Math.round(cfg.jumpReps * factor)),
      unit: 'powt.',
      focus: 'Skoczność i miękkie lądowanie',
    },
    {
      id: 'skater-jumps',
      title: 'Przeskoki boczne (Łyżwiarz)',
      sets: isDeload ? Math.max(2, cfg.sets - 1) : cfg.sets,
      repsOrSec: Math.max(6, Math.round(cfg.skaterReps * factor)),
      unit: 'powt.',
      focus: 'Stabilizacja kolan i zwinność',
    },
    {
      id: 'hip-hamstring-mobility',
      title: 'Mobilność bioder i dwugłowych',
      sets: 2,
      repsOrSec: cfg.mobilitySec,
      unit: 'sek.',
      focus: 'Regeneracja i ochrona przed kontuzją',
    },
  ];
};

export interface TestResult {
  testName: string;
  result: string;
  date: string;
  sets?: number;
  repsOrSec?: number;
  restSec?: number;
  scorePercent?: number;
}

export type AttendanceStatus = 'present' | 'pending' | 'absent' | 'excused';

export type MentalAgeStage = '8-10' | '11-13' | '14-15' | '16-18';

export interface WellbeingLog {
  id: string;
  playerId: string;
  playerName: string;
  ageGroup: MentalAgeStage;
  moodScore: number; // 1-5
  stressLevel: number; // 1-5
  energyLevel?: number; // 1-5 (bateria energii / gotowość)
  mentalLoad?: number; // 1-5 (obciążenie szkołą i meczami dla 16-18)
  sleepHours: number;
  noPhoneBeforeSleep?: boolean;
  notes?: string;
  loggedDate: string;
}

export type SafeSportCategory =
  | 'Ktoś mi dokucza'
  | 'Boli mnie'
  | 'Boję się'
  | 'Mobbing / Hejt'
  | 'Presja / Stres'
  | 'Wypalenie'
  | 'Powrót po kontuzji'
  | 'Inne';

export interface SafeSportAlert {
  id: string;
  playerId?: string;
  senderLabel: string; // 'Anonimowy zawodnik' lub imię
  ageGroup?: MentalAgeStage;
  category: SafeSportCategory;
  recipient: 'Trener' | 'Psycholog klubowy' | 'Rodzic';
  message: string;
  createdAt: string;
  resolved: boolean;
}

export type LiveMatchPhase = 'Przed meczem' | '1. Połowa' | 'Przerwa' | '2. Połowa' | 'Koniec meczu';

export interface LiveTickerEvent {
  id: string;
  type: 'goal' | 'yellow' | 'red' | 'opponent_goal';
  playerId?: string;
  playerName: string;
  playerNumber?: number;
  minute: string;
  reportedBy?: 'Trener' | 'Rodzic (Trybuny)';
}

export interface LiveMatchTickerState {
  isActive: boolean;
  matchId: string;
  opponentName: string;
  date: string;
  location: string;
  phase: LiveMatchPhase;
  teamScore: number;
  opponentScore: number;
  currentMinute: number;
  reporterPlayerId: string | null; // ID zawodnika, którego rodzic jest wyznaczonym Reporterem z Trybun
  reporterName: string | null;
  allowAllParentsToReport: boolean; // Tryb otwarty: każdy rodzic na trybunach może kliknąć zdarzenie
  events: LiveTickerEvent[];
}

export const FULL_KIT_SIZES = [
  '122 cm',
  '128 cm',
  '134 cm',
  '140 cm',
  '146 cm',
  '152 cm',
  '158 cm',
  '164 cm',
  'S',
  'M',
  'L',
  'XL',
] as const;

export type KitSizeOption = typeof FULL_KIT_SIZES[number];

export interface KitOrderEntry {
  playerId: string;
  playerName: string;
  playerNumber?: number;
  year: string;
  size: string;
  paid: boolean;
  updatedAt?: string;
}

export interface KitItem {
  id: string;
  name: string;
  price: string;
  photos: string[];
  sizeChartUrl: string | null;
  availableSizes: string[];
  orders: KitOrderEntry[];
}

export interface EventItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:MM
  meetingLocation?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  type: string;
  isRecurring?: boolean;
  recurringDayOfWeek?: number; // 0 = Niedziela, 1 = Poniedziałek, itd.
  squadIds: string[];
  attendance: Record<string, AttendanceStatus>;
}

export interface IndividualSessionItem {
  id: string;
  mode: '1-on-1' | 'Grupa';
  playerIds: string[];
  playerNames: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  goal: string;
  coachNotes: string;
  isRecurring?: boolean;
  recurringDayOfWeek?: number;
  status: 'Zaplanowany' | 'Zrealizowano';
  attendance: Record<string, AttendanceStatus>;
  assignedHomework?: string;
}

export interface Player {
  id: string;
  coachId?: string;
  parentId?: string | null;
  userId?: string | null;
  firstName: string;
  lastName: string;
  name: string;
  number: number;
  year: string | number;
  position: string;
  sprint30m?: string;
  jumpCm?: number;
  beepTest?: string;
  healthStatus?: string;
  injuryStatus?: string;
  coachNote?: string;
  tests?: TestResult[];
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  preferredFoot?: string;
  parentPhone?: string;
  parentName?: string;
  medicalClearanceDate?: string;
  trainingsTotal?: number;
  trainingsPresent?: number;
  height?: number;
  weight?: number;
  lastMeasurementDate?: string;
  inviteCode?: string;
  balance?: number;
  monthlyFee?: number;
  xp?: number;
  kitSize?: string;
  activeHomework?: HomeworkPrescription;
  stat_dribbling?: number;
  stat_pace?: number;
  stat_shooting?: number;
  stat_passing?: number;
  stat_defending?: number;
  stat_physical?: number;
}

interface PlayersContextType {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => Promise<string | null>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  regenerateInviteCode: (id: string) => Promise<string | null>;
  removePlayer: (id: string) => Promise<void>;
  availableYears: string[];
  loading: boolean;
  // Wydarzenia drużynowe (Kalendarz + Pulpit Live)
  events: EventItem[];
  setEvents: React.Dispatch<React.SetStateAction<EventItem[]>>;
  updateEventAttendance: (eventId: string, playerId: string, status: AttendanceStatus) => void;
  updateEventAttendanceBatch: (eventId: string, newAttendanceMap: Record<string, AttendanceStatus>) => void;
  liveEvents: EventItem[];
  // Treningi indywidualne 1-on-1 / Małe grupy (1-on-1 + Pulpit Live)
  individualSessions: IndividualSessionItem[];
  setIndividualSessions: React.Dispatch<React.SetStateAction<IndividualSessionItem[]>>;
  updateIndividualSessionAttendance: (sessionId: string, playerId: string, status: AttendanceStatus) => void;
  markIndividualSessionCompleted: (sessionId: string) => void;
  liveIndividualSessions: IndividualSessionItem[];
  // Moduł Strojów i Zamówień (Wspólny dla Trenera i Rodzica)
  kits: KitItem[];
  setKits: React.Dispatch<React.SetStateAction<KitItem[]>>;
  assignPlayerKitSize: (kitId: string, player: Player, size: string, paid?: boolean) => void;
  togglePlayerKitPaid: (kitId: string, playerId: string) => void;
  // Moduł Asystenta z Trybun (Live-Ticker Meczowy dla Rodziców i Trenera)
  liveMatchTicker: LiveMatchTickerState;
  setLiveMatchTicker: React.Dispatch<React.SetStateAction<LiveMatchTickerState>>;
  assignParentReporter: (player: Player | null, allowAll?: boolean) => void;
  addLiveTickerEvent: (
    type: 'goal' | 'yellow' | 'red' | 'opponent_goal',
    player: Player | null,
    minuteStr: string,
    reportedBy: 'Trener' | 'Rodzic (Trybuny)'
  ) => void;
  removeLiveTickerEvent: (eventId: string) => void;
  // Moduł Wsparcia Psychologicznego (Mental Space & Safe Sport)
  wellbeingLogs: WellbeingLog[];
  addWellbeingLog: (log: Omit<WellbeingLog, 'id' | 'loggedDate'>) => void;
  safeSportAlerts: SafeSportAlert[];
  addSafeSportAlert: (alert: Omit<SafeSportAlert, 'id' | 'createdAt' | 'resolved'>) => void;
  resolveSafeSportAlert: (alertId: string) => void;
  // Moduł Trenera Personalnego AI (8-12 tyg. + Strażnik regeneracji)
  aiTrainerPlans: Record<string, AiPersonalTrainerPlan>;
  setupAiTrainerPlan: (
    playerId: string,
    config: {
      durationWeeks: 8 | 12;
      teamTrainingDays: number[];
      matchDays: number[];
      weeklyLoadCap?: number;
    }
  ) => void;
  completeAiBaselineTest: (
    playerId: string,
    results: { jumpReps: number; plankSec: number; formQualityPercent: number }
  ) => void;
  logAiTrainingSession: (
    playerId: string,
    log: Omit<AiSessionLog, 'id' | 'date' | 'weekNumber'>
  ) => void;
  // Przełącznik Lektora Głosowego AI (TTS WŁ./WYŁ.)
  voiceCoachEnabled: boolean;
  setVoiceCoachEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toggleVoiceCoach: () => void;
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const formatDateLocal = (date: Date): string => {
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const dy = String(date.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  return new Date(yr, mo - 1, dy, 12, 0, 0);
};

const timeToMinutes = (timeStr: string): number => {
  const [hr, mn] = (timeStr || '00:00').split(':').map(Number);
  return (hr || 0) * 60 + (mn || 0);
};

export const isEventOnDateHelper = (ev: EventItem, dateStr: string): boolean => {
  if (!ev.isRecurring) {
    return ev.startDate <= dateStr && dateStr <= ev.endDate;
  }
  if (ev.isRecurring && ev.recurringDayOfWeek !== undefined) {
    if (dateStr >= ev.startDate) {
      const targetDate = parseLocalDate(dateStr);
      return targetDate.getDay() === ev.recurringDayOfWeek;
    }
  }
  return false;
};

const isValidUuid = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

const mapDbToWellbeingLog = (row: any): WellbeingLog => ({
  id: String(row.id),
  playerId: row.player_id ? String(row.player_id) : 'local-player',
  playerName: row.player_name || 'Zawodnik',
  ageGroup: row.age_group || '11-13',
  moodScore: Number(row.mood_score ?? 4),
  stressLevel: Number(row.stress_level ?? 2),
  energyLevel: row.energy_level !== null && row.energy_level !== undefined ? Number(row.energy_level) : undefined,
  mentalLoad: row.mental_load !== null && row.mental_load !== undefined ? Number(row.mental_load) : undefined,
  sleepHours: Number(row.sleep_hours ?? 8.5),
  noPhoneBeforeSleep: row.no_phone_before_sleep ?? undefined,
  notes: row.notes || undefined,
  loggedDate: row.logged_date
    ? new Date(row.logged_date).toLocaleDateString('pl-PL')
    : new Date().toLocaleDateString('pl-PL'),
});

const mapDbToSafeSportAlert = (row: any): SafeSportAlert => ({
  id: String(row.id),
  playerId: row.player_id ? String(row.player_id) : undefined,
  senderLabel: row.sender_label || 'Anonimowy zawodnik',
  ageGroup: row.age_group || undefined,
  category: (row.category || 'Inne') as SafeSportCategory,
  recipient: row.recipient || 'Psycholog klubowy',
  message: row.message || '',
  createdAt: row.created_at
    ? new Date(row.created_at).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '',
  resolved: Boolean(row.resolved),
});

const mapDbToTickerEvent = (row: any): LiveTickerEvent => ({
  id: String(row.id),
  type: row.event_type || 'goal',
  playerId: row.player_id ? String(row.player_id) : undefined,
  playerName: row.player_name || 'Zawodnik',
  playerNumber: row.player_number !== null && row.player_number !== undefined ? Number(row.player_number) : undefined,
  minute: String(row.minute || '1'),
  reportedBy: row.reported_by || 'Rodzic (Trybuny)',
});

const mapDbToPlayer = (row: any): Player => {
  const fName = row.first_name ?? row.firstName ?? '';
  const lName = row.last_name ?? row.lastName ?? '';
  return {
    ...row,
    id: row.id,
    coachId: row.coach_id ?? row.coachId,
    parentId: row.parent_id ?? row.parentId ?? null,
    userId: row.user_id ?? row.userId ?? null,
    firstName: fName,
    lastName: lName,
    name: row.name || `${fName} ${lName}`.trim(),
    inviteCode: row.invite_code ?? row.inviteCode ?? '',
    number: row.number ?? 10,
    year: row.year ?? 2014,
    position: row.position ?? 'Pomocnik',
    xp: row.xp ?? 300,
    injuryStatus: row.injury_status ?? row.injuryStatus ?? 'Zdrowy',
    healthStatus: row.health_status ?? row.healthStatus ?? 'Zdrowy',
    goals: row.goals ?? 0,
    assists: row.assists ?? 0,
    matchesPlayed: row.matches_played ?? row.matchesPlayed ?? 0,
    trainingsTotal: row.trainings_total ?? row.trainingsTotal ?? 0,
    trainingsPresent: row.trainings_present ?? row.trainingsPresent ?? 0,
    parentPhone: row.parent_phone ?? row.parentPhone ?? '',
    parentName: row.parent_name ?? row.parentName ?? '',
  };
};

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const today = new Date();
  const todayStr = formatDateLocal(today);

  const [kits, setKits] = useState<KitItem[]>([
    {
      id: 'kit-1',
      name: 'Komplet Meczowy Pro (Koszulka + Spodenki)',
      price: '149 PLN',
      photos: ['Przód koszulki', 'Tył z numerem', 'Spodenki'],
      sizeChartUrl: 'Pełna rozmiarówka Junior / Senior: 122 cm – XL',
      availableSizes: [...FULL_KIT_SIZES],
      orders: [],
    },
  ]);

  const [events, setEvents] = useState<EventItem[]>([]);

  const [individualSessions, setIndividualSessions] = useState<IndividualSessionItem[]>([]);

  const [wellbeingLogs, setWellbeingLogs] = useState<WellbeingLog[]>([]);
  const [safeSportAlerts, setSafeSportAlerts] = useState<SafeSportAlert[]>([]);

  const [aiTrainerPlans, setAiTrainerPlans] = useState<Record<string, AiPersonalTrainerPlan>>({});
  const [voiceCoachEnabled, setVoiceCoachEnabled] = useState<boolean>(true);

  const toggleVoiceCoach = () => {
    setVoiceCoachEnabled((prev) => !prev);
  };

  const setupAiTrainerPlan = (
    playerId: string,
    config: {
      durationWeeks: 8 | 12;
      teamTrainingDays: number[];
      matchDays: number[];
      weeklyLoadCap?: number;
    }
  ) => {
    const cap = config.weeklyLoadCap ?? 2;
    const safeExtraDays = calculateSafeExtraDays(config.teamTrainingDays, config.matchDays, cap);

    const newPlan: AiPersonalTrainerPlan = {
      playerId,
      durationWeeks: config.durationWeeks,
      currentWeek: 1,
      level: 'Start',
      teamTrainingDays: config.teamTrainingDays,
      matchDays: config.matchDays,
      extraTrainingDays: safeExtraDays,
      baselineCompleted: false,
      weeklyLoadCap: cap,
      isDeloadWeek: false,
      statusMessage:
        'Harmonogram gotowy (z buforem świeżych nóg przed meczem). Wykonaj próbę wstępną, aby dobrać obciążenie.',
      exercises: buildAiExercises('Start', false),
      logs: [],
      updatedAt: new Date().toISOString(),
    };

    setAiTrainerPlans((prev) => ({ ...prev, [playerId]: newPlan }));
  };

  const completeAiBaselineTest = (
    playerId: string,
    results: { jumpReps: number; plankSec: number; formQualityPercent: number }
  ) => {
    setAiTrainerPlans((prev) => {
      const existing = prev[playerId];
      if (!existing) return prev;

      // Jakość ruchu ma priorytet nad liczbą powtórzeń
      let assignedLevel: AiTrainerLevel = 'Start';
      if (results.formQualityPercent >= 85 && results.jumpReps >= 12 && results.plankSec >= 45) {
        assignedLevel = 'Zaawansowany';
      } else if (results.formQualityPercent >= 75 && results.jumpReps >= 9 && results.plankSec >= 30) {
        assignedLevel = 'Średni';
      } else if (results.formQualityPercent >= 65 && results.jumpReps >= 6) {
        assignedLevel = 'Podstawowy';
      }

      return {
        ...prev,
        [playerId]: {
          ...existing,
          level: assignedLevel,
          baselineCompleted: true,
          baselineScorePercent: results.formQualityPercent,
          isDeloadWeek: false,
          exercises: buildAiExercises(assignedLevel, false),
          statusMessage: `Próba wstępna zaliczona (technika ${results.formQualityPercent}%). Dobrany poziom: ${assignedLevel}.`,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const logAiTrainingSession = (
    playerId: string,
    log: Omit<AiSessionLog, 'id' | 'date' | 'weekNumber'>
  ) => {
    setAiTrainerPlans((prev) => {
      const plan = prev[playerId];
      if (!plan) return prev;

      const newLog: AiSessionLog = {
        ...log,
        id: `ai-log-${Date.now()}`,
        date: formatDateLocal(new Date()),
        weekNumber: plan.currentWeek,
      };

      const updatedLogs = [newLog, ...plan.logs];
      let nextDeload = false;
      let nextExercises = plan.exercises;
      let nextMessage = 'Dobra robota! Utrzymujemy aktualny, bezpieczny poziom obciążeń.';

      // 1. STRAŻNIK BÓLU: natychmiastowa blokada progresu i obniżenie obciążeń
      if (log.painArea !== 'brak') {
        nextDeload = true;
        nextExercises = buildAiExercises(plan.level, true);
        nextMessage = `Zgłoszono dyskomfort (${log.painArea}). Progres zablokowany — przełączono na lżejszy tryb regeneracyjny.`;
      }
      // 2. STRAŻNIK ZMĘCZENIA I JAKOŚCI RUCHU: brak dokładania przy słabej technice lub zmęczeniu
      else if (log.fatigue === 'ciezko' || log.formQualityPercent < 70) {
        nextDeload = true;
        nextExercises = buildAiExercises(plan.level, true);
        nextMessage =
          'Wykryto wysokie zmęczenie lub spadek jakości ruchu. Zostawiamy lżejszą wersję, żeby uniknąć przeciążenia.';
      }
      // 3. BEZPIECZNY PROGRES: dobra technika (>= 80%) i niskie/średnie zmęczenie
      else if (log.completed && log.formQualityPercent >= 80) {
        nextDeload = false;
        nextExercises = plan.exercises.map((ex) => ({
          ...ex,
          repsOrSec:
            ex.unit === 'powt.'
              ? Math.min(ex.repsOrSec + 1, 18) // Bezpieczny sufit powtórzeń
              : Math.min(ex.repsOrSec + 5, 75), // Bezpieczny sufit sekund
        }));
        nextMessage =
          'Świetna kontrola ruchu i regeneracja! W kolejnej sesji dokładamy lekki, bezpieczny progres.';
      }

      const sessionsInCurrentWeek = updatedLogs.filter((l) => l.weekNumber === plan.currentWeek).length;
      const shouldAdvanceWeek = sessionsInCurrentWeek >= plan.extraTrainingDays.length;
      const nextWeek = shouldAdvanceWeek
        ? Math.min(plan.durationWeeks, plan.currentWeek + 1)
        : plan.currentWeek;

      return {
        ...prev,
        [playerId]: {
          ...plan,
          currentWeek: nextWeek,
          isDeloadWeek: nextDeload,
          exercises: nextExercises,
          statusMessage: nextMessage,
          logs: updatedLogs,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const fetchWellbeingLogs = async () => {
    const { data, error } = await supabase
      .from('player_wellbeing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) {
      setWellbeingLogs(data.map(mapDbToWellbeingLog));
    }
  };

  const fetchSafeSportAlerts = async () => {
    const { data, error } = await supabase
      .from('safe_sport_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) {
      setSafeSportAlerts(data.map(mapDbToSafeSportAlert));
    }
  };

  const addWellbeingLog = (log: Omit<WellbeingLog, 'id' | 'loggedDate'>) => {
    const tempEntry: WellbeingLog = {
      ...log,
      id: `wb-${Date.now()}`,
      loggedDate: new Date().toLocaleDateString('pl-PL'),
    };
    setWellbeingLogs((prev) => [tempEntry, ...prev]);

    supabase
      .from('player_wellbeing_logs')
      .insert([
        {
          player_id: isValidUuid(log.playerId) ? log.playerId : null,
          player_name: log.playerName,
          age_group: log.ageGroup,
          mood_score: log.moodScore,
          stress_level: log.stressLevel,
          energy_level: log.energyLevel ?? null,
          mental_load: log.mentalLoad ?? null,
          sleep_hours: log.sleepHours,
          no_phone_before_sleep: log.noPhoneBeforeSleep ?? null,
          notes: log.notes ?? null,
        },
      ])
      .then(({ error }) => {
        if (error) console.error('Błąd zapisu wellbeing_logs:', error.message);
        else fetchWellbeingLogs();
      });
  };

  const addSafeSportAlert = (alertData: Omit<SafeSportAlert, 'id' | 'createdAt' | 'resolved'>) => {
    const tempEntry: SafeSportAlert = {
      ...alertData,
      id: `ss-${Date.now()}`,
      createdAt: new Date().toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      resolved: false,
    };
    setSafeSportAlerts((prev) => [tempEntry, ...prev]);

    supabase
      .from('safe_sport_alerts')
      .insert([
        {
          player_id: isValidUuid(alertData.playerId) ? alertData.playerId : null,
          sender_label: alertData.senderLabel,
          age_group: alertData.ageGroup ?? null,
          category: alertData.category,
          recipient: alertData.recipient,
          message: alertData.message,
          resolved: false,
        },
      ])
      .then(({ error }) => {
        if (error) console.error('Błąd zapisu safe_sport_alerts:', error.message);
        else fetchSafeSportAlerts();
      });
  };

  const resolveSafeSportAlert = (alertId: string) => {
    setSafeSportAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );

    if (isValidUuid(alertId)) {
      supabase
        .from('safe_sport_alerts')
        .update({ resolved: true })
        .eq('id', alertId)
        .then(({ error }) => {
          if (error) console.error('Błąd aktualizacji safe_sport_alerts:', error.message);
        });
    }
  };

  const [liveMatchTicker, setLiveMatchTicker] = useState<LiveMatchTickerState>({
    isActive: true,
    matchId: 'live-1',
    opponentName: 'Przeciwnik ligowy',
    date: todayStr,
    location: 'Boisko Główne',
    phase: 'Przed meczem',
    teamScore: 0,
    opponentScore: 0,
    currentMinute: 1,
    reporterPlayerId: null,
    reporterName: null,
    allowAllParentsToReport: true,
    events: [],
  });

  const fetchLiveMatchTicker = async () => {
    const { data: tickerRow, error } = await supabase
      .from('live_match_tickers')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !tickerRow) return;

    const { data: evRows } = await supabase
      .from('live_ticker_events')
      .select('*')
      .eq('ticker_id', tickerRow.id)
      .order('created_at', { ascending: false });

    setLiveMatchTicker({
      isActive: Boolean(tickerRow.is_active),
      matchId: String(tickerRow.id),
      opponentName: tickerRow.opponent_name || 'Przeciwnik ligowy',
      date: tickerRow.match_date || todayStr,
      location: tickerRow.location || 'Boisko Główne',
      phase: (tickerRow.phase || 'Przed meczem') as LiveMatchPhase,
      teamScore: Number(tickerRow.team_score ?? 0),
      opponentScore: Number(tickerRow.opponent_score ?? 0),
      currentMinute: Number(tickerRow.current_minute ?? 1),
      reporterPlayerId: tickerRow.reporter_player_id ? String(tickerRow.reporter_player_id) : null,
      reporterName: tickerRow.reporter_name || null,
      allowAllParentsToReport: Boolean(tickerRow.allow_all_parents_to_report),
      events: (evRows || []).map(mapDbToTickerEvent),
    });
  };

  const ensureActiveTickerRow = async (snapshot: LiveMatchTickerState): Promise<string | null> => {
    if (isValidUuid(snapshot.matchId)) return snapshot.matchId;

    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('live_match_tickers')
      .insert([
        {
          coach_id: authData?.user?.id || null,
          opponent_name: snapshot.opponentName,
          location: snapshot.location,
          phase: snapshot.phase,
          team_score: snapshot.teamScore,
          opponent_score: snapshot.opponentScore,
          current_minute: snapshot.currentMinute,
          reporter_player_id: isValidUuid(snapshot.reporterPlayerId) ? snapshot.reporterPlayerId : null,
          reporter_name: snapshot.reporterName,
          allow_all_parents_to_report: snapshot.allowAllParentsToReport,
          is_active: true,
        },
      ])
      .select('id')
      .single();

    if (error || !data) {
      console.error('Błąd tworzenia live_match_tickers:', error?.message);
      return null;
    }

    const newId = String(data.id);
    setLiveMatchTicker((prev) => ({ ...prev, matchId: newId }));
    return newId;
  };

  const assignParentReporter = (player: Player | null, allowAll: boolean = false) => {
    const nextRepId = player ? String(player.id) : null;
    const nextRepName = player ? `Rodzic: ${player.firstName} ${player.lastName || ''}`.trim() : null;

    setLiveMatchTicker((prev) => {
      const updated: LiveMatchTickerState = {
        ...prev,
        isActive: true,
        reporterPlayerId: nextRepId,
        reporterName: nextRepName,
        allowAllParentsToReport: allowAll,
      };
      ensureActiveTickerRow(updated).then((tickerId) => {
        if (!tickerId) return;
        supabase
          .from('live_match_tickers')
          .update({
            reporter_player_id: isValidUuid(nextRepId) ? nextRepId : null,
            reporter_name: nextRepName,
            allow_all_parents_to_report: allowAll,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tickerId)
          .then(({ error }) => {
            if (error) console.error('Błąd aktualizacji reportera:', error.message);
          });
      });
      return updated;
    });
  };

  const addLiveTickerEvent = (
    type: 'goal' | 'yellow' | 'red' | 'opponent_goal',
    player: Player | null,
    minuteStr: string,
    reportedBy: 'Trener' | 'Rodzic (Trybuny)'
  ) => {
    const pName =
      type === 'opponent_goal'
        ? 'Bramka dla rywali'
        : player
        ? `${player.firstName} ${player.lastName || ''}`.trim() || player.name
        : 'Zawodnik';

    const newEv: LiveTickerEvent = {
      id: `tick-${Date.now()}`,
      type,
      playerId: player ? String(player.id) : undefined,
      playerName: pName,
      playerNumber: player?.number,
      minute: minuteStr || '1',
      reportedBy,
    };

    setLiveMatchTicker((prev) => {
      const nextTeamScore = type === 'goal' ? prev.teamScore + 1 : prev.teamScore;
      const nextOppScore = type === 'opponent_goal' ? prev.opponentScore + 1 : prev.opponentScore;
      const updated: LiveMatchTickerState = {
        ...prev,
        isActive: true,
        teamScore: nextTeamScore,
        opponentScore: nextOppScore,
        events: [newEv, ...prev.events],
      };

      ensureActiveTickerRow(updated).then((tickerId) => {
        if (!tickerId) return;
        supabase
          .from('live_ticker_events')
          .insert([
            {
              ticker_id: tickerId,
              event_type: type,
              player_id: player && isValidUuid(String(player.id)) ? String(player.id) : null,
              player_name: pName,
              player_number: player?.number ?? null,
              minute: minuteStr || '1',
              reported_by: reportedBy,
            },
          ])
          .then(({ error }) => {
            if (error) console.error('Błąd zapisu live_ticker_events:', error.message);
          });

        supabase
          .from('live_match_tickers')
          .update({
            team_score: nextTeamScore,
            opponent_score: nextOppScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tickerId)
          .then(({ error }) => {
            if (error) console.error('Błąd aktualizacji wyniku live_match_tickers:', error.message);
          });
      });

      return updated;
    });

    if (type === 'goal' && player) {
      updatePlayer(player.id, {
        goals: (player.goals || 0) + 1,
        xp: (player.xp || 300) + 50,
      });
    } else if (type === 'yellow' && player) {
      updatePlayer(player.id, {
        yellowCards: (player.yellowCards || 0) + 1,
      });
    }
  };

  const removeLiveTickerEvent = (eventId: string) => {
    setLiveMatchTicker((prev) => {
      const target = prev.events.find((e) => e.id === eventId);
      if (!target) return prev;
      const nextTeamScore = target.type === 'goal' ? Math.max(0, prev.teamScore - 1) : prev.teamScore;
      const nextOppScore =
        target.type === 'opponent_goal' ? Math.max(0, prev.opponentScore - 1) : prev.opponentScore;

      if (isValidUuid(eventId)) {
        supabase.from('live_ticker_events').delete().eq('id', eventId).then(() => {});
      }
      if (isValidUuid(prev.matchId)) {
        supabase
          .from('live_match_tickers')
          .update({
            team_score: nextTeamScore,
            opponent_score: nextOppScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prev.matchId)
          .then(() => {});
      }

      return {
        ...prev,
        teamScore: nextTeamScore,
        opponentScore: nextOppScore,
        events: prev.events.filter((e) => e.id !== eventId),
      };
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchWellbeingLogs();
    fetchSafeSportAlerts();
    fetchLiveMatchTicker();

    const channel = supabase
      .channel('public:sportsclub_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchPlayers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_wellbeing_logs' }, () => {
        fetchWellbeingLogs();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safe_sport_alerts' }, () => {
        fetchSafeSportAlerts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_match_tickers' }, () => {
        fetchLiveMatchTicker();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_ticker_events' }, () => {
        fetchLiveMatchTicker();
      })
      .subscribe();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      fetchPlayers();
      fetchWellbeingLogs();
      fetchSafeSportAlerts();
      fetchLiveMatchTicker();
    });

    return () => {
      supabase.removeChannel(channel);
      authSub.subscription.unsubscribe();
    };
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Błąd pobierania bazy Supabase:', error.message);
    } else if (data) {
      setPlayers(data.map(mapDbToPlayer));
    }
    setLoading(false);
  };

  const addPlayer = async (playerData: Omit<Player, 'id'>): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    const newCode = playerData.inviteCode || generateRandomCode();

    const dbPayload = {
      coach_id: user?.id || null,
      first_name: playerData.firstName.trim(),
      last_name: playerData.lastName.trim(),
      year: Number(playerData.year) || 2014,
      position: playerData.position || 'Pomocnik',
      number: Number(playerData.number) || Math.floor(Math.random() * 80) + 10,
      invite_code: newCode,
      xp: playerData.xp ?? 300,
    };

    const { data, error } = await supabase
      .from('players')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error('Błąd dodawania do Supabase:', error.message);
      alert('Nie udało się dodać zawodnika: ' + error.message);
      return null;
    }

    if (data) {
      await supabase.from('player_stats').insert([{ player_id: data.id }]);
      await fetchPlayers();
    }

    return newCode;
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.year !== undefined) dbUpdates.year = Number(updates.year);
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.number !== undefined) dbUpdates.number = Number(updates.number);
    if (updates.inviteCode !== undefined) dbUpdates.invite_code = updates.inviteCode;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.trainingsTotal !== undefined) dbUpdates.trainings_total = updates.trainingsTotal;
    if (updates.trainingsPresent !== undefined) dbUpdates.trainings_present = updates.trainingsPresent;
    if (updates.parentPhone !== undefined) dbUpdates.parent_phone = updates.parentPhone;
    if (updates.parentName !== undefined) dbUpdates.parent_name = updates.parentName;
    if (updates.healthStatus !== undefined) dbUpdates.health_status = updates.healthStatus;
    if (updates.injuryStatus !== undefined) dbUpdates.injury_status = updates.injuryStatus;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('players').update(dbUpdates).eq('id', id);
      if (error) {
        console.error('Błąd aktualizacji w Supabase:', error.message);
      }
    }

    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const regenerateInviteCode = async (id: string): Promise<string | null> => {
    const newCode = generateRandomCode();
    const { error } = await supabase
      .from('players')
      .update({ invite_code: newCode })
      .eq('id', id);

    if (error) {
      alert('Błąd generowania nowego kodu: ' + error.message);
      return null;
    }
    await fetchPlayers();
    return newCode;
  };

  const removePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      console.error('Błąd usuwania w Supabase:', error.message);
      alert('Nie udało się usunąć zawodnika: ' + error.message);
      return;
    }
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Przypisanie wybranego rozmiaru (122 cm - XL) do konkretnego zawodnika w danym zestawie strojów
  const assignPlayerKitSize = (kitId: string, player: Player, size: string, paid: boolean = false) => {
    const pId = String(player.id);
    const fullName = `${player.firstName || ''} ${player.lastName || ''}`.trim() || player.name || 'Zawodnik';
    const pYear = String(player.year || '2014');

    setKits((prev) =>
      prev.map((kit) => {
        if (kit.id !== kitId) return kit;
        const existingIdx = kit.orders.findIndex((o) => String(o.playerId) === pId);
        let updatedOrders: KitOrderEntry[];

        if (existingIdx >= 0) {
          updatedOrders = kit.orders.map((o, idx) =>
            idx === existingIdx
              ? {
                  ...o,
                  size,
                  playerName: fullName,
                  playerNumber: player.number,
                  year: pYear,
                  updatedAt: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                }
              : o
          );
        } else {
          updatedOrders = [
            ...kit.orders,
            {
              playerId: pId,
              playerName: fullName,
              playerNumber: player.number,
              year: pYear,
              size,
              paid,
              updatedAt: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        }

        return { ...kit, orders: updatedOrders };
      })
    );
  };

  const togglePlayerKitPaid = (kitId: string, playerId: string) => {
    setKits((prev) =>
      prev.map((kit) => {
        if (kit.id !== kitId) return kit;
        return {
          ...kit,
          orders: kit.orders.map((o) =>
            String(o.playerId) === String(playerId) ? { ...o, paid: !o.paid } : o
          ),
        };
      })
    );
  };

  const updateEventAttendance = (eventId: string, playerId: string, status: AttendanceStatus) => {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, attendance: { ...ev.attendance, [playerId]: status } }
          : ev
      )
    );
  };

  const updateEventAttendanceBatch = (eventId: string, newAttendanceMap: Record<string, AttendanceStatus>) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === eventId ? { ...ev, attendance: newAttendanceMap } : ev))
    );
  };

  const updateIndividualSessionAttendance = (sessionId: string, playerId: string, status: AttendanceStatus) => {
    setIndividualSessions((prev) =>
      prev.map((sess) =>
        sess.id === sessionId
          ? { ...sess, attendance: { ...sess.attendance, [playerId]: status } }
          : sess
      )
    );
  };

  const markIndividualSessionCompleted = (sessionId: string) => {
    setIndividualSessions((prev) =>
      prev.map((sess) => (sess.id === sessionId ? { ...sess, status: 'Zrealizowano' } : sess))
    );
  };

  const liveEvents = useMemo(() => {
    const nowDateStr = formatDateLocal(currentTime);
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    return events.filter((ev) => {
      if (!isEventOnDateHelper(ev, nowDateStr)) return false;
      const startMins = timeToMinutes(ev.startTime) - 15;
      const endMins = timeToMinutes(ev.endTime);
      return nowMins >= startMins && nowMins <= endMins;
    });
  }, [events, currentTime]);

  const liveIndividualSessions = useMemo(() => {
    const nowDateStr = formatDateLocal(currentTime);
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    return individualSessions.filter((sess) => {
      const isToday =
        sess.date === nowDateStr ||
        (sess.isRecurring &&
          sess.date <= nowDateStr &&
          parseLocalDate(nowDateStr).getDay() === sess.recurringDayOfWeek);
      if (!isToday) return false;
      const startMins = timeToMinutes(sess.startTime) - 15;
      const endMins = timeToMinutes(sess.endTime);
      return nowMins >= startMins && nowMins <= endMins;
    });
  }, [individualSessions, currentTime]);

  const availableYears = Array.from(new Set(players.map((p) => String(p.year)))).sort();

  return (
    <PlayersContext.Provider
      value={{
        players,
        addPlayer,
        updatePlayer,
        regenerateInviteCode,
        removePlayer,
        availableYears,
        loading,
        events,
        setEvents,
        updateEventAttendance,
        updateEventAttendanceBatch,
        liveEvents,
        individualSessions,
        setIndividualSessions,
        updateIndividualSessionAttendance,
        markIndividualSessionCompleted,
        liveIndividualSessions,
        kits,
        setKits,
        assignPlayerKitSize,
        togglePlayerKitPaid,
        liveMatchTicker,
        setLiveMatchTicker,
        assignParentReporter,
        addLiveTickerEvent,
        removeLiveTickerEvent,
        wellbeingLogs,
        addWellbeingLog,
        safeSportAlerts,
        addSafeSportAlert,
        resolveSafeSportAlert,
        aiTrainerPlans,
        setupAiTrainerPlan,
        completeAiBaselineTest,
        logAiTrainingSession,
        voiceCoachEnabled,
        setVoiceCoachEnabled,
        toggleVoiceCoach,
      }}
    >
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayersProvider');
  }
  return context;
}
