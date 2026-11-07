import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TestResult {
  testName: string;
  result: string;
  date: string;
}

export interface Player {
  id: string; // W Supabase to format UUID
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
  trainingsTotal?: number;
  trainingsPresent?: number;
  height?: number;
  weight?: number;
  lastMeasurementDate?: string;
  inviteCode?: string;
  parentId?: string;
}

interface PlayersContextType {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  availableYears: string[];
  loading: boolean;
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Pobieranie danych przy starcie aplikacji i nasłuchiwanie na zmiany (Realtime)
  useEffect(() => {
    fetchPlayers();

    // Magia synchronizacji! Nasłuchujemy zmian w bazie na żywo
    const channel = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        console.log('Zmiana w bazie!', payload);
        fetchPlayers(); // Odświeżamy listę przy każdej zmianie dokonanej przez trenera lub rodzica
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Funkcja pobierająca zawodników z chmury Supabase
  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('players').select('*').order('firstName', { ascending: true });
    
    if (error) {
      console.error('Błąd pobierania bazy Supabase:', error.message);
    } else if (data) {
      setPlayers(data);
    }
    setLoading(false);
  };

  // Zapis do chmury
  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    // Nie przekazujemy ID, Supabase samo wygeneruje unikalne UUID
    const { error } = await supabase.from('players').insert([playerData]);
    if (error) {
      console.error('Błąd dodawania do Supabase:', error.message);
      alert('Nie udało się dodać zawodnika: ' + error.message);
    }
    // Nie musimy robić setPlayers, bo funkcja Realtime (nasłuchiwacz wyżej) wyłapie to i pobierze listę!
  };

  // Aktualizacja w chmurze
  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    const { error } = await supabase.from('players').update(updates).eq('id', id);
    if (error) {
      console.error('Błąd aktualizacji w Supabase:', error.message);
      alert('Błąd synchronizacji zmian.');
    }
  };

  // Usuwanie z chmury
  const removePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      console.error('Błąd usuwania w Supabase:', error.message);
    }
  };

  const availableYears = Array.from(new Set(players.map(p => String(p.year)))).sort();

  return (
    <PlayersContext.Provider value={{ players, addPlayer, updatePlayer, removePlayer, availableYears, loading }}>
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
