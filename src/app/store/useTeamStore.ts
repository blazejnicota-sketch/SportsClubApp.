import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  number?: string | number;
  position?: string;
  role?: string;
  birthYear?: string | number;
  weight?: string | number;
  height?: string | number;
  preferredFoot?: string;
  medicalExpiry?: string;
  parentPhone?: string;
  notes?: string;
  [key: string]: any;
}

export interface TestResult {
  id: string;
  playerId: string;
  date: string;
  testName?: string;
  name?: string;
  testType?: string;
  resultValue?: string | number;
  value?: string | number;
  secondaryValue?: string | number;
  notes?: string;
  [key: string]: any;
}

export type PlayerTestResult = TestResult;

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  squad?: string[];
  callups?: string[];
  responses?: { [playerId: string]: string };
  attendance?: { [playerId: string]: string };
  [key: string]: any;
}

export interface FeeItem {
  id: string;
  playerId: string;
  month: string;
  amount: number;
  paid: boolean;
  [key: string]: any;
}

export const useTeamStore = create<any>((set: any, get: any) => ({
  players: [
    { id: '1', name: 'Jan Kowalski', number: '10', position: 'Pomocnik', role: 'Kapitan', birthYear: '2010' },
    { id: '2', name: 'Adam Nowak', number: '9', position: 'Napastnik', role: 'Napastnik', birthYear: '2010' },
  ],
  testResults: [
    { id: '1', playerId: '1', testName: 'Sprint 30m', name: 'Sprint 30m', testType: 'Motoryczny', resultValue: '4.25', value: '4.25', date: '2026-09-01' },
    { id: '2', playerId: '1', testName: 'Sprint 30m', name: 'Sprint 30m', testType: 'Motoryczny', resultValue: '4.15', value: '4.15', date: '2026-10-01' },
    { id: '3', playerId: '1', testName: 'Skok w dal', name: 'Skok w dal', testType: 'Motoryczny', resultValue: '210', value: '210', date: '2026-10-01' },
  ],
  events: [
    { id: '1', title: 'Mecz Wyjazdowy z Orłami', date: '2026-10-20', time: '13:00', type: 'MECZ LIGOWY', location: 'Stadion Miejski', squad: [], callups: [], responses: {}, attendance: {} },
  ],
  fees: [
    { id: '1', playerId: '1', month: 'Październik', amount: 100, paid: true },
    { id: '2', playerId: '2', month: 'Październik', amount: 100, paid: false },
  ],

  addPlayer: (player: any) => {
    set((state: any) => ({
      players: [...state.players, { id: Date.now().toString(), name: player.name ?? '', ...player }],
    }));
    return true;
  },

  updatePlayer: (updatedPlayer: any) => {
    set((state: any) => ({
      players: state.players.map((p: any) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
    }));
    return true;
  },

  removePlayer: (id: string) => {
    set((state: any) => ({
      players: state.players.filter((p: any) => p.id !== id),
    }));
    return true;
  },

  deletePlayer: (id: string) => {
    set((state: any) => ({
      players: state.players.filter((p: any) => p.id !== id),
    }));
    return true;
  },

  addTestResult: (result: any) => {
    set((state: any) => ({
      testResults: [...state.testResults, { id: Date.now().toString(), playerId: result.playerId ?? '', date: result.date || new Date().toISOString().split('T')[0], ...result }],
    }));
    return true;
  },

  removeTestResult: (id: string) => {
    set((state: any) => ({
      testResults: state.testResults.filter((t: any) => t.id !== id),
    }));
    return true;
  },

  deleteTestResult: (id: string) => {
    set((state: any) => ({
      testResults: state.testResults.filter((t: any) => t.id !== id),
    }));
    return true;
  },

  addEvent: (event: any) => {
    set((state: any) => ({
      events: [...state.events, { id: Date.now().toString(), title: event.title ?? '', date: event.date ?? '', time: event.time ?? '', type: event.type ?? 'TRENING', ...event }],
    }));
    return true;
  },

  removeEvent: (id: string) => {
    set((state: any) => ({
      events: state.events.filter((e: any) => e.id !== id),
    }));
    return true;
  },

  toggleFeePaid: (id: string) => {
    set((state: any) => ({
      fees: state.fees.map((f: any) => (f.id === id ? { ...f, paid: !f.paid } : f)),
    }));
    return true;
  },

  exportDataJSON: () => {
    const state = get();
    return JSON.stringify({ players: state.players, testResults: state.testResults, events: state.events, fees: state.fees });
  },

  importDataJSON: (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      set({ players: parsed.players || [], testResults: parsed.testResults || [], events: parsed.events || [], fees: parsed.fees || [] });
      return true;
    } catch (e) {
      console.error('Błąd importu danych:', e);
      return false;
    }
  },
}));