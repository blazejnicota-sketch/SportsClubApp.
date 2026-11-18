import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../services/supabase';

export type SubscriptionPlan = 'STANDARD' | 'PRO' | 'ELITE';

export type SportDiscipline =
  | 'football'
  | 'volleyball'
  | 'basketball'
  | 'handball'
  | 'tennis'
  | 'gym'
  | 'martial_arts'
  | 'swimming'
  | 'running'
  | 'cycling'
  | 'nordic_walking';

export type SportCategory = 'Zespołowe' | 'Indywidualne i Siłowe' | 'Biegowe i Rekreacyjne (GPS)';

export interface SportMetadata {
  id: SportDiscipline;
  name: string;
  category: SportCategory;
  icon: string;
  emoji: string;
  primaryStatLabel: string;
  secondaryStatLabel: string;
  fieldTabLabel: string;
  positions: string[];
  defaultDrillTitle: string;
  defaultDrillDesc: string;
  recommendedModules: string[];
}

export const SPORTS_DICTIONARY: Record<SportDiscipline, SportMetadata> = {
  football: {
    id: 'football',
    name: 'Piłka Nożna',
    category: 'Zespołowe',
    icon: 'football-outline',
    emoji: '⚽',
    primaryStatLabel: 'TAKTYKA & GOLE',
    secondaryStatLabel: 'Asysty',
    fieldTabLabel: 'Boisko Taktyczne',
    positions: ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik'],
    defaultDrillTitle: 'Wyskoki do główki (Dynamika)',
    defaultDrillDesc: 'Wykonaj 10 dynamicznych wyskoków w wyznaczonej ramce AI.',
    recommendedModules: ['Dynamiczne', 'Zwinność', 'Skoczność', 'Stabilizacja Core'],
  },
  volleyball: {
    id: 'volleyball',
    name: 'Piłka Siatkowa',
    category: 'Zespołowe',
    icon: 'baseball-outline',
    emoji: '🏐',
    primaryStatLabel: 'BLOKI & ASY',
    secondaryStatLabel: 'Skuteczny atak',
    fieldTabLabel: 'Ustawienie 6x6',
    positions: ['Rozgrywający', 'Przyjmujący', 'Środkowy', 'Atakujący', 'Libero'],
    defaultDrillTitle: 'Wyskok do bloku przy siatce',
    defaultDrillDesc: 'Zejdź nisko na nogach (poniżej 130°) i wykonaj 10 wyskoków w górę.',
    recommendedModules: ['Skoczność', 'Mobilność barków', 'Zwinność', 'Statyczne'],
  },
  basketball: {
    id: 'basketball',
    name: 'Koszykówka',
    category: 'Zespołowe',
    icon: 'basketball-outline',
    emoji: '🏀',
    primaryStatLabel: 'PUNKTY & 3PT',
    secondaryStatLabel: 'Zbiórki / Asysty',
    fieldTabLabel: 'Parkiet 5x5',
    positions: ['Rozgrywający (PG)', 'Rzucający (SG)', 'Skrzydłowy (SF/PF)', 'Center (C)'],
    defaultDrillTitle: 'Obrona niska (Defensive Stance)',
    defaultDrillDesc: 'Zejdź do niskiej pozycji obronnej i wykonaj 10 dynamicznych wyjść w górę.',
    recommendedModules: ['Skoczność', 'Zwinność', 'Plyometria', 'Rozciągające'],
  },
  handball: {
    id: 'handball',
    name: 'Piłka Ręczna',
    category: 'Zespołowe',
    icon: 'american-football-outline',
    emoji: '🤾',
    primaryStatLabel: 'BRAMKI & RZUTY',
    secondaryStatLabel: 'Przechwyty / Bloki',
    fieldTabLabel: 'Parkiet 7x7',
    positions: ['Bramkarz', 'Rozgrywający', 'Skrzydłowy', 'Obrotowy'],
    defaultDrillTitle: 'Wyskok do rzutu z drugiej linii',
    defaultDrillDesc: 'Wykonaj 10 dynamicznych wyskoków jednonóż z pracą ramion przed kamerą AI.',
    recommendedModules: ['Skoczność', 'Zwinność', 'Siła obręczy barkowej', 'Stabilizacja Core'],
  },
  tennis: {
    id: 'tennis',
    name: 'Tenis Ziemny',
    category: 'Indywidualne i Siłowe',
    icon: 'tennisball-outline',
    emoji: '🎾',
    primaryStatLabel: 'WYGRANE SETY',
    secondaryStatLabel: 'Asy serwisowe',
    fieldTabLabel: 'Analiza Kortu',
    positions: ['Singlista', 'Deblista', 'Junior PRO'],
    defaultDrillTitle: 'Split-Step & Zejście na nogach',
    defaultDrillDesc: 'Wykonaj 10 głębokich zejść na ugiętych kolanach do odbioru serwisu.',
    recommendedModules: ['Zwinność', 'Rotacja tułowia', 'Dynamiczne', 'Rozciągające'],
  },
  gym: {
    id: 'gym',
    name: 'Siłownia & CrossFit',
    category: 'Indywidualne i Siłowe',
    icon: 'barbell-outline',
    emoji: '🏋️',
    primaryStatLabel: 'REKORDY & WOD',
    secondaryStatLabel: 'Objętość (Ton)',
    fieldTabLabel: 'Tablica WOD',
    positions: ['CrossFit RX', 'CrossFit Scaled', 'Trójbój / Siła', 'Fitness'],
    defaultDrillTitle: 'Air Squats (Technika Przysiadu)',
    defaultDrillDesc: 'Wykonaj 10 pełnych przysiadów poniżej kąta 125° z zachowaniem symetrii bioder.',
    recommendedModules: ['Siła', 'Statyczne', 'Dynamiczne', 'Mobilność bioder'],
  },
  martial_arts: {
    id: 'martial_arts',
    name: 'Sporty Walki / Sztuki Walki',
    category: 'Indywidualne i Siłowe',
    icon: 'shield-outline',
    emoji: '🥋',
    primaryStatLabel: 'WALKI & SPARINGI',
    secondaryStatLabel: 'Technika / Pasy',
    fieldTabLabel: 'Mata Treningowa',
    positions: ['Stójka (Striking)', 'Parter (Grappling)', 'MMA / Wszechstylowy', 'Kadet / Junior'],
    defaultDrillTitle: 'Sprawl & Zejścia zapaśnicze',
    defaultDrillDesc: 'Wykonaj 10 szybkich zejść biodrami z powrotem do pozycji walki.',
    recommendedModules: ['Dynamiczne', 'Zwinność', 'Rozciągające', 'Stabilizacja Core'],
  },
  swimming: {
    id: 'swimming',
    name: 'Pływanie',
    category: 'Indywidualne i Siłowe',
    icon: 'water-outline',
    emoji: '🏊',
    primaryStatLabel: 'CZASY & REKORDY',
    secondaryStatLabel: 'Dystans (m)',
    fieldTabLabel: 'Tory Pływalni',
    positions: ['Styl Dowolny', 'Styl Grzbietowy', 'Styl Klasyczny', 'Styl Motylkowy', 'Zmienny'],
    defaultDrillTitle: 'Streamline Plank & Core (Ląd)',
    defaultDrillDesc: 'Utrzymaj idealną linię ciała w podporze przodem przez 45 sekund.',
    recommendedModules: ['Statyczne', 'Rozciągające', 'Skoczność (Starty)', 'Mobilność barków'],
  },
  running: {
    id: 'running',
    name: 'Bieganie & Lekkoatletyka',
    category: 'Biegowe i Rekreacyjne (GPS)',
    icon: 'walk-outline',
    emoji: '🏃',
    primaryStatLabel: 'DYSTANS & TEMPO',
    secondaryStatLabel: 'Śr. tempo (min/km)',
    fieldTabLabel: 'Trasy GPS / Bieżnia',
    positions: ['Sprinter', 'Biegacz Średniodystansowy', 'Długodystansowiec / Maraton', 'Biegi Przełajowe'],
    defaultDrillTitle: 'Skip A & Stabilizacja kolana',
    defaultDrillDesc: 'Wykonaj ćwiczenie dynamiki biegowej oraz przysiady jednonóż przed kamerą AI.',
    recommendedModules: ['Dynamiczne', 'Skoczność', 'Rozciągające', 'Prewencja kontuzji'],
  },
  cycling: {
    id: 'cycling',
    name: 'Rower & Kolarstwo',
    category: 'Biegowe i Rekreacyjne (GPS)',
    icon: 'bicycle-outline',
    emoji: '🚴',
    primaryStatLabel: 'DYSTANS KM (GPS)',
    secondaryStatLabel: 'Przewyższenia / Śr. km/h',
    fieldTabLabel: 'Trasy Rowerowe',
    positions: ['Szosa', 'MTB / XC', 'Gravel', 'Rekreacja Rodzinna'],
    defaultDrillTitle: 'Plank boczny & Core kolarski',
    defaultDrillDesc: 'Wzmocnij mięśnie głębokie tułowia odpowiadające za stabilizację na rowerze.',
    recommendedModules: ['Statyczne', 'Mobilność bioder', 'Rozciągające'],
  },
  nordic_walking: {
    id: 'nordic_walking',
    name: 'Spacer / Szybki Marsz / Nordic Walking',
    category: 'Biegowe i Rekreacyjne (GPS)',
    icon: 'footsteps-outline',
    emoji: '🥾',
    primaryStatLabel: 'KROKI & DYSTANS',
    secondaryStatLabel: 'Aktywne minuty (Health)',
    fieldTabLabel: 'Mapa Spacerów',
    positions: ['Marsz Kondycyjny', 'Nordic Walking', 'Aktywna Rodzina', 'Rehabilitacja Ruchowa'],
    defaultDrillTitle: 'Mobilizacja kręgosłupa i bioder',
    defaultDrillDesc: 'Wykonaj płynny zestaw ćwiczeń rozciągających i oddechowych przed marszem.',
    recommendedModules: ['Rozciągające', 'Statyczne', 'Zdrowy Kręgosłup'],
  },
};

export interface ClubFeatures {
  enableFinances: boolean;
  enableStore: boolean;
  enableCalendar: boolean;
  enableAiTasks: boolean;
  enableWearables: boolean; // Darmowa integracja Apple Health / Google Health Connect + Garmin
}

interface ClubSettingsContextType {
  plan: SubscriptionPlan;
  setPlan: (plan: SubscriptionPlan) => Promise<void>;
  sport: SportDiscipline;
  setSport: (sport: SportDiscipline) => Promise<void>;
  sportConfig: SportMetadata;
  allSports: SportMetadata[];
  features: ClubFeatures;
  toggleFeature: (key: keyof ClubFeatures) => Promise<void>;
  hasAiAccess: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  isSyncing: boolean;
}

const ClubSettingsContext = createContext<ClubSettingsContextType | undefined>(undefined);

export function ClubSettingsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<SubscriptionPlan>('ELITE');
  const [sport, setSportState] = useState<SportDiscipline>('football');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [features, setFeatures] = useState<ClubFeatures>({
    enableFinances: true,
    enableStore: true,
    enableCalendar: true,
    enableAiTasks: true,
    enableWearables: true,
  });

  useEffect(() => {
    resolveClubAndLoadSettings();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      resolveClubAndLoadSettings();
    });

    const channel = supabase
      .channel('public:club_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_settings' }, () => {
        resolveClubAndLoadSettings();
      })
      .subscribe();

    return () => {
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const resolveClubAndLoadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const role = user.user_metadata?.role || 'trener';
      let targetCoachId: string | null = null;

      if (role === 'trener') {
        targetCoachId = user.id;
      } else {
        const { data: playerRow } = await supabase
          .from('players')
          .select('coach_id')
          .or(`parent_id.eq.${user.id},user_id.eq.${user.id}`)
          .limit(1)
          .maybeSingle();

        targetCoachId = playerRow?.coach_id || null;
      }

      setCoachId(targetCoachId);

      let query = supabase.from('club_settings').select('*');
      if (targetCoachId) {
        query = query.eq('coach_id', targetCoachId);
      }

      const { data: settingsRow } = await query.limit(1).maybeSingle();

      if (settingsRow) {
        setPlanState((settingsRow.subscription_plan as SubscriptionPlan) || 'ELITE');
        if (settingsRow.sport_discipline && SPORTS_DICTIONARY[settingsRow.sport_discipline as SportDiscipline]) {
          setSportState(settingsRow.sport_discipline as SportDiscipline);
        }
        setFeatures({
          enableFinances: settingsRow.enable_finances ?? true,
          enableStore: settingsRow.enable_store ?? true,
          enableCalendar: settingsRow.enable_calendar ?? true,
          enableAiTasks: settingsRow.enable_ai_tasks ?? true,
          enableWearables: settingsRow.enable_wearables ?? true,
        });
      } else if (role === 'trener' && targetCoachId) {
        await supabase.from('club_settings').insert([
          {
            coach_id: targetCoachId,
            subscription_plan: 'ELITE',
            sport_discipline: 'football',
            enable_finances: true,
            enable_store: true,
            enable_calendar: true,
            enable_ai_tasks: true,
            enable_wearables: true,
          },
        ]);
      }
    } catch (err) {
      console.log('Błąd synchronizacji ustawień klubu:', err);
    }
  };

  const syncToCloud = async (
    nextPlan: SubscriptionPlan,
    nextSport: SportDiscipline,
    nextFeatures: ClubFeatures
  ) => {
    if (!coachId) return;
    setIsSyncing(true);
    try {
      await supabase.from('club_settings').upsert(
        {
          coach_id: coachId,
          subscription_plan: nextPlan,
          sport_discipline: nextSport,
          enable_finances: nextFeatures.enableFinances,
          enable_store: nextFeatures.enableStore,
          enable_calendar: nextFeatures.enableCalendar,
          enable_ai_tasks: nextFeatures.enableAiTasks,
          enable_wearables: nextFeatures.enableWearables,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'coach_id' }
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const setPlan = async (newPlan: SubscriptionPlan) => {
    setPlanState(newPlan);
    await syncToCloud(newPlan, sport, features);
  };

  const setSport = async (newSport: SportDiscipline) => {
    setSportState(newSport);
    await syncToCloud(plan, newSport, features);
  };

  const toggleFeature = async (key: keyof ClubFeatures) => {
    const updatedFeatures = { ...features, [key]: !features[key] };
    setFeatures(updatedFeatures);
    await syncToCloud(plan, sport, updatedFeatures);
  };

  const hasAiAccess = (plan === 'PRO' || plan === 'ELITE') && features.enableAiTasks;
  const sportConfig = SPORTS_DICTIONARY[sport] || SPORTS_DICTIONARY.football;
  const allSports = Object.values(SPORTS_DICTIONARY);

  return (
    <ClubSettingsContext.Provider
      value={{
        plan,
        setPlan,
        sport,
        setSport,
        sportConfig,
        allSports,
        features,
        toggleFeature,
        hasAiAccess,
        darkMode,
        setDarkMode,
        isSyncing,
      }}
    >
      {children}
    </ClubSettingsContext.Provider>
  );
}

export function useClubSettings() {
  const context = useContext(ClubSettingsContext);
  if (!context) {
    throw new Error('useClubSettings must be used within a ClubSettingsProvider');
  }
  return context;
}
