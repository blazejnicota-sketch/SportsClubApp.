import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase'; // Upewnij się, że ścieżka do supabase jest poprawna względem tego pliku
import { MOCK_100_PLAYERS } from '../data/mockPlayers';

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
  removePlayer: (id: string) => void;
  availableYears: string[];
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

const STORAGE_KEY = '@sports_club_players_v4';

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);

  // Inicjalizacja i pobieranie danych (Najpierw z Supabase, a w razie braku internetu z AsyncStorage / Mocków)
  useEffect(() => {
    async function loadPlayers() {
      try {
        // 1. Próba pobrania danych z Supabase
        const { data: remoteData, error } = await supabase.from('players').select('*');

        if (!error && remoteData && remoteData.length > 0) {
          // Mapowanie danych z bazy (jeśli kolumny w bazie różnią się nieco nazwą)
          const formattedRemote: Player[] = remoteData.map((p: any) => ({
            id: String(p.id),
            firstName: p.first_name || p.firstName || '',
            lastName: p.last_name || p.lastName || '',
            name: p.name || `${p.first_name} ${p.last_name}`,
            number: p.number || 0,
            year: p.year || '2012',
            position: p.position || 'Pomocnik',
            preferredFoot: p.preferred_foot || 'Prawa',
            healthStatus: p.health_status || 'Zdrowy',
            parentPhone: p.parent_phone || '',
            sprint30m: p.sprint_30m || '4.50',
            jumpCm: p.jump_cm || 200,
            beepTest: p.beep_test || '7.0',
            injuryStatus: p.injury_status || 'Zdrowy',
            coachNote: p.coach_note || '',
            matchesPlayed: p.matches_played || 0,
            goals: p.goals || 0,
            assists: p.assists || 0,
            yellowCards: p.yellow_cards || 0,
            redCards: p.red_cards || 0,
            trainingsPresent: p.trainings_present || 0,
            trainingsTotal: p.trainings_total || 0,
            tests: p.tests || [],
          }));

          setPlayers(formattedRemote);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formattedRemote));
          return;
        }

        // 2. Jeśli Supabase jest niedostępny lub pusty, sprawdzamy pamięć lokalną telefonu
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPlayers(JSON.parse(stored));
        } else {
          // 3. Fallback do domyślnych mocków, jeśli brak czegokolwiek
          const initial: Player[] = MOCK_100_PLAYERS.slice(0, 25).map((p: any, idx: number) => ({
            id: String(p.id || idx + 1),
            firstName: p.firstName || p.name?.split(' ')[0] || 'Zawodnik',
            lastName: p.lastName || p.name?.split(' ')[1] || `#${idx + 1}`,
            name: p.name || `${p.firstName || 'Zawodnik'} ${p.lastName || `#${idx + 1}`}`,
            number: p.number || idx + 1,
            year: p.year || (idx % 2 === 0 ? '2012' : '2013'),
            position: p.position || 'Pomocnik',
            preferredFoot: 'Prawa',
            healthStatus: 'Zdrowy',
            parentPhone: '+48 500 600 70',
            sprint30m: '4.50',
            jumpCm: 200,
            beepTest: '7.0',
            injuryStatus: 'Zdrowy',
            coachNote: '',
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
        console.error('Błąd ładowania zawodników:', e);
        // Awaryjne ładowanie z pamięci lokalnej przy błędzie sieci
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setPlayers(JSON.parse(stored));
      }
    }

    loadPlayers();
  }, []);

  // Pomocnicza funkcja zapisu lokalnego
  const saveToLocalAndRemote = async (updatedPlayers: Player[], actionType: 'add' | 'update' | 'remove', targetPlayer?: Player) => {
    setPlayers(updatedPlayers);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayers));

    // Synchronizacja z Supabase w tle
    try {
      if (actionType === 'add' && targetPlayer) {
        await supabase.from('players').insert([{
          id: targetPlayer.id,
          first_name: targetPlayer.firstName,
          last_name: targetPlayer.lastName,
          name: targetPlayer.name,
          number: targetPlayer.number,
          year: targetPlayer.year,
          position: targetPlayer.position,
          health_status: targetPlayer.healthStatus,
          parent_phone: targetPlayer.parentPhone,
        }]);
      } else if (actionType === 'update' && targetPlayer) {
        await supabase.from('players').update({
          first_name: targetPlayer.firstName,
          last_name: targetPlayer.lastName,
          name: targetPlayer.name,
          number: targetPlayer.number,
          year: targetPlayer.year,
          position: targetPlayer.position,
          health_status: targetPlayer.healthStatus,
          parent_phone: targetPlayer.parentPhone,
        }).eq('id', targetPlayer.id);
      } else if (actionType === 'remove' && targetPlayer) {
        await supabase.from('players').delete().eq('id', targetPlayer.id);
      }
    } catch (err) {
      console.log('Błąd synchronizacji z chmurą w tle (dane zapisane lokalnie):', err);
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
    saveToLocalAndRemote(updated, 'add', created);
  };

  const updatePlayer = (id: string, updatedData: Partial<Player>) => {
    let target: Player | undefined;
    const updated = players.map((p) => {
      if (p.id === id) {
        target = { ...p, ...updatedData };
        return target;
      }
      return p;
    });
    if (target) {
      saveToLocalAndRemote(updated, 'update', target);
    }
  };

  const removePlayer = (id: string) => {
    const target = players.find((p) => p.id === id);
    const updated = players.filter((p) => p.id !== id);
    saveToLocalAndRemote(updated, 'remove', target);
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