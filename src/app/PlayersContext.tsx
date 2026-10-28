import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  number: number;
  year: string;
  position: string;
  preferredFoot?: 'Lewa' | 'Prawa' | 'Obie';
  healthStatus?: 'Zdrowy' | 'Kontuzja' | 'Rehabilitacja' | 'Chory';
  parentPhone?: string;
  sprint30m: string;
  jumpCm: number;
  beepTest: string;
  injuryStatus: string;
  coachNote: string;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  trainingsPresent?: number;
  trainingsTotal?: number;
  tests: { testName: string; result: string; date: string }[];
}

interface PlayersContextType {
  players: Player[];
  addPlayer: (newPlayer: Partial<Player>) => void;
  updatePlayer: (id: string, updatedData: Partial<Player>) => void;
  removePlayer: (id: string) => void; // <-- Dodano funkcję usuwania
  availableYears: string[];
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

const STORAGE_KEY = '@sports_club_players_v3';

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);

  // Wczytanie zapisanych zawodników z pamięci telefonu przy starcie
  useEffect(() => {
    async function loadStoredPlayers() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPlayers(JSON.parse(stored));
        } else {
          // Jeśli brak zapisu, pobierz domyślne mocki
          const initial: Player[] = MOCK_100_PLAYERS.slice(0, 25).map((p: any, idx: number) => ({
            id: String(p.id || idx + 1),
            firstName: p.firstName || p.name?.split(' ')[0] || 'Zawodnik',
            lastName: p.lastName || p.name?.split(' ')[1] || `#${idx + 1}`,
            name: p.name || `${p.firstName || 'Zawodnik'} ${p.lastName || `#${idx + 1}`}`,
            number: p.number || idx + 1,
            year: p.year || (idx % 2 === 0 ? '2012' : '2013'),
            position: p.position || (idx % 4 === 0 ? 'Bramkarz' : idx % 3 === 0 ? 'Obrońca' : idx % 2 === 0 ? 'Pomocnik' : 'Napastnik'),
            preferredFoot: (idx % 2 === 0 ? 'Prawa' : 'Lewa') as 'Lewa' | 'Prawa' | 'Obie',
            healthStatus: 'Zdrowy',
            parentPhone: '+48 500 600 70',
            sprint30m: (4.2 + (idx * 0.05) % 0.8).toFixed(2),
            jumpCm: 190 + (idx * 4) % 40,
            beepTest: `7.${idx % 9}`,
            injuryStatus: idx === 2 ? 'Naciągnięcie mięśnia dwugłowego' : 'Zdrowy',
            coachNote: idx === 1 ? 'Bardzo dobra determinacja.' : '',
            matchesPlayed: 10,
            goals: 3,
            assists: 4,
            yellowCards: 1,
            redCards: 0,
            trainingsPresent: 18,
            trainingsTotal: 20,
            tests: [],
          }));
          setPlayers(initial);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
      } catch (e) {
        console.error('Błąd wczytywania zawodników:', e);
      }
    }
    loadStoredPlayers();
  }, []);

  const saveToStorage = async (updatedPlayers: Player[]) => {
    try {
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers));
    } catch (e) {
      console.error('Błąd zapisu zawodników:', e);
    }
  };

  const addPlayer = (playerData: Partial<Player>) => {
    const created: Player = {
      id: Date.now().toString(),
      firstName: playerData.firstName || 'Nowy',
      lastName: playerData.lastName || 'Zawodnik',
      name: `${playerData.firstName || 'Nowy'} ${playerData.lastName || 'Zawodnik'}`,
      number: playerData.number || Math.floor(Math.random() * 80) + 10,
      year: playerData.year || '2016',
      position: playerData.position || 'Pomocnik',
      preferredFoot: 'Prawa',
      healthStatus: 'Zdrowy',
      parentPhone: '+48 500 000 00',
      sprint30m: '4.50',
      jumpCm: 200,
      beepTest: '7.0',
      injuryStatus: 'Zdrowy',
      coachNote: 'Nowo dodany zawodnik.',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      trainingsPresent: 0,
      trainingsTotal: 0,
      tests: [],
      ...playerData,
    };
    const updated = [created, ...players];
    saveToStorage(updated);
  };

  const updatePlayer = (id: string, updatedData: Partial<Player>) => {
    const updated = players.map((p) => (p.id === id ? { ...p, ...updatedData } : p));
    saveToStorage(updated);
  };

  // Usuwanie zawodnika z bazy i trwałej pamięci
  const removePlayer = (id: string) => {
    const updated = players.filter((p) => p.id !== id);
    saveToStorage(updated);
  };

  const availableYears = Array.from(new Set(players.map((p) => p.year))).sort();

  return (
    <PlayersContext.Provider value={{ players, addPlayer, updatePlayer, removePlayer, availableYears }}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error('usePlayers musi być użyty wewnątrz PlayersProvider');
  }
  return context;
}