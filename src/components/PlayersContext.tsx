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

  const addWellbeingLog = (log: Omit<WellbeingLog, 'id' | 'loggedDate'>) => {
    const entry: WellbeingLog = {
      ...log,
      id: `wb-${Date.now()}`,
      loggedDate: new Date().toLocaleDateString('pl-PL'),
    };
    setWellbeingLogs((prev) => [entry, ...prev]);
  };

  const addSafeSportAlert = (alertData: Omit<SafeSportAlert, 'id' | 'createdAt' | 'resolved'>) => {
    const entry: SafeSportAlert = {
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
    setSafeSportAlerts((prev) => [entry, ...prev]);
  };

  const resolveSafeSportAlert = (alertId: string) => {
    setSafeSportAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
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

  const assignParentReporter = (player: Player | null, allowAll: boolean = false) => {
    setLiveMatchTicker((prev) => ({
      ...prev,
      isActive: true,
      reporterPlayerId: player ? String(player.id) : null,
      reporterName: player ? `Rodzic: ${player.firstName} ${player.lastName || ''}`.trim() : null,
      allowAllParentsToReport: allowAll,
    }));
  };

  const addLiveTickerEvent = (
    type: 'goal' | 'yellow' | 'red' | 'opponent_goal',
    player: Player | null,
    minuteStr: string,
    reportedBy: 'Trener' | 'Rodzic (Trybuny)'
  ) => {
    const newEv: LiveTickerEvent = {
      id: `tick-${Date.now()}`,
      type,
      playerId: player ? String(player.id) : undefined,
      playerName:
        type === 'opponent_goal'
          ? 'Bramka dla rywali'
          : player
          ? `${player.firstName} ${player.lastName || ''}`.trim() || player.name
          : 'Zawodnik',
      playerNumber: player?.number,
      minute: minuteStr || '1',
      reportedBy,
    };

    setLiveMatchTicker((prev) => ({
      ...prev,
      isActive: true,
      teamScore: type === 'goal' ? prev.teamScore + 1 : prev.teamScore,
      opponentScore: type === 'opponent_goal' ? prev.opponentScore + 1 : prev.opponentScore,
      events: [newEv, ...prev.events],
    }));

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
      return {
        ...prev,
        teamScore: target.type === 'goal' ? Math.max(0, prev.teamScore - 1) : prev.teamScore,
        opponentScore:
          target.type === 'opponent_goal' ? Math.max(0, prev.opponentScore - 1) : prev.opponentScore,
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

    const channel = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        fetchPlayers();
      })
      .subscribe();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      fetchPlayers();
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
              ? { ...o, size, playerName: fullName, playerNumber: player.number, year: pYear, updatedAt: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) }
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
