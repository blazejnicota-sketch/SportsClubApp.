import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePlayers, Player } from '../components/PlayersContext';
import { useClubSettings } from '../components/ClubSettingsContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type GameFormat = '5v5' | '7v7' | '9v9' | '11v11';
type ActiveTab = 'schedule' | 'pitch' | 'matchLive';
type MatchPhase = 'Przed meczem' | '1. Połowa' | 'Przerwa' | '2. Połowa' | 'Koniec meczu';

interface CallUp {
  playerId: string;
  parentConfirmed: boolean;
  playerConfirmed: boolean;
}

interface ScheduledMatch {
  id: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  callUps: CallUp[];
}

interface PositionSlot {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow' | 'red';
  player: Player;
  minute: string;
}

interface MatchRecord {
  id: string;
  date: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  events: MatchEvent[];
}

interface MvpAward {
  id: string;
  badgeTitle: string;
  badgeEmoji: string;
  playerId: string;
  playerName: string;
  xpBonus: number;
}

const MVP_BADGES = [
  { id: 'fighter', emoji: '🔥', title: 'Walczak Meczu', xp: 50 },
  { id: 'wall', emoji: '🛡️', title: 'Mur w Obronie', xp: 50 },
  { id: 'assist', emoji: '🎯', title: 'Król Asyst', xp: 50 },
  { id: 'gk', emoji: '🧤', title: 'Złote Rękawice', xp: 50 },
];

const FORMAT_FORMATIONS: Record<GameFormat, { name: string; slots: PositionSlot[] }[]> = {
  '5v5': [{ name: '1-2-1', slots: [{ id: 'GK', label: 'Bramkarz', x: 50, y: 85 }, { id: 'CB', label: 'Obrońca', x: 50, y: 65 }, { id: 'LM', label: 'Lewy Pomocnik', x: 25, y: 40 }, { id: 'RM', label: 'Prawy Pomocnik', x: 75, y: 40 }, { id: 'ST', label: 'Napastnik', x: 50, y: 20 }] }],
  '7v7': [{ name: '1-3-2-1', slots: [{ id: 'GK', label: 'Bramkarz', x: 50, y: 85 }, { id: 'LB', label: 'Lewy Obr.', x: 20, y: 65 }, { id: 'CB', label: 'Środkowy Obr.', x: 50, y: 70 }, { id: 'RB', label: 'Prawy Obr.', x: 80, y: 65 }, { id: 'LM', label: 'Lewy Pom.', x: 25, y: 40 }, { id: 'RM', label: 'Prawy Pom.', x: 75, y: 40 }, { id: 'ST', label: 'Napastnik', x: 50, y: 20 }] }],
  '9v9': [{ name: '1-3-4-1', slots: [{ id: 'GK', label: 'Bramkarz', x: 50, y: 85 }, { id: 'LB', label: 'Lewy Obr.', x: 20, y: 68 }, { id: 'CB', label: 'Środkowy Obr.', x: 50, y: 72 }, { id: 'RB', label: 'Prawy Obr.', x: 80, y: 68 }, { id: 'LM', label: 'Lewy Pom.', x: 15, y: 45 }, { id: 'CM1', label: 'Środek', x: 38, y: 48 }, { id: 'CM2', label: 'Środek', x: 62, y: 48 }, { id: 'RM', label: 'Prawy Pom.', x: 85, y: 45 }, { id: 'ST', label: 'Napastnik', x: 50, y: 20 }] }],
  '11v11': [{ name: '1-4-3-3', slots: [{ id: 'GK', label: 'Bramkarz', x: 50, y: 85 }, { id: 'LB', label: 'Lewy Obr.', x: 15, y: 65 }, { id: 'CB1', label: 'Środkowy Obr.', x: 38, y: 70 }, { id: 'CB2', label: 'Środkowy Obr.', x: 62, y: 70 }, { id: 'RB', label: 'Prawy Obr.', x: 85, y: 65 }, { id: 'CM1', label: 'Środek Pom.', x: 30, y: 45 }, { id: 'CM2', label: 'Środek Pom.', x: 50, y: 50 }, { id: 'CM3', label: 'Środek Pom.', x: 70, y: 45 }, { id: 'LW', label: 'Lewy Skrzydłowy', x: 18, y: 20 }, { id: 'ST', label: 'Napastnik', x: 50, y: 15 }, { id: 'RW', label: 'Prawy Skrzydłowy', x: 82, y: 20 }] }],
};

const DraggablePlayerNode = ({ slot, assignedPlayer, onAssignPress, onRemoveLongPress, onPositionChange }: any) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [currentPos, setCurrentPos] = useState({ x: slot.x, y: slot.y });
  
  useEffect(() => {
    setCurrentPos({ x: slot.x, y: slot.y });
    pan.setValue({ x: 0, y: 0 });
  }, [slot.x, slot.y]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        if (onPositionChange) onPositionChange(slot.id, { dx: (pan.x as any)._value, dy: (pan.y as any)._value });
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.playerNode,
        { left: `${currentPos.x}%`, top: `${currentPos.y}%`, transform: [{ translateX: Animated.add(pan.x, -24) }, { translateY: Animated.add(pan.y, -24) }] },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={() => onAssignPress(slot)}
        onLongPress={() => assignedPlayer && onRemoveLongPress(slot.id)}
        delayLongPress={500}
      >
        <View style={[styles.nodeAvatar, assignedPlayer ? styles.nodeAssigned : styles.nodeEmpty]}>
          {assignedPlayer ? <Text style={styles.nodeNumber}>#{assignedPlayer.number}</Text> : <Ionicons name="add" size={18} color="#64748b" />}
        </View>
        <Text style={styles.nodeLabel} numberOfLines={1}>
          {assignedPlayer ? `${assignedPlayer.name.split(' ')[0]}` : slot.label.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BoiskoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params?.eventId as string;

  const {
    players,
    availableYears,
    updatePlayer,
    events,
    liveMatchTicker,
    setLiveMatchTicker,
    assignParentReporter,
    addLiveTickerEvent,
    removeLiveTickerEvent,
  } = usePlayers();

  const selectedEvent = useMemo(() => {
    if (!eventId || !events) return null;
    return events.find(e => String(e.id) === String(eventId));
  }, [eventId, events]);

  const { sportConfig } = useClubSettings();
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');

  const initialMatches = useMemo(() => {
    if (selectedEvent) {
      const mappedCallUps: CallUp[] = (selectedEvent.squadIds || []).map(sId => ({
        playerId: sId,
        parentConfirmed: selectedEvent.attendance?.[sId] === 'present',
        playerConfirmed: selectedEvent.attendance?.[sId] === 'present',
      }));
      return [{
        id: selectedEvent.id,
        opponent: selectedEvent.title.replace('Mecz', '').trim() || 'Przeciwnik',
        date: selectedEvent.startDate,
        time: selectedEvent.startTime,
        location: selectedEvent.location,
        callUps: mappedCallUps,
      }];
    }
    return [
      { id: '1', opponent: 'Przeciwnik sparingowy', date: '2026-11-17', time: '10:00', location: 'Orlik Główny', callUps: [] }
    ];
  }, [selectedEvent]);

  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>(initialMatches);
  const [activeSchedMatchId, setActiveSchedMatchId] = useState<string | null>(initialMatches[0]?.id || '1');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [callUpModalVisible, setCallUpModalVisible] = useState(false);
  const [newOpponent, setNewOpponent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [filterYear, setFilterYear] = useState<string>('WSZYSTKIE');
  const [tempSelectedPlayers, setTempSelectedPlayers] = useState<string[]>([]);

  const activeSchedMatch = scheduledMatches.find(m => m.id === activeSchedMatchId);

  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('7v7');
  const [formationIndex, setFormationIndex] = useState<number>(0);
  const [lineup, setLineup] = useState<Record<string, Player>>({});
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<PositionSlot | null>(null);

  const activeMatchObj = scheduledMatches.find(m => m.id === activeSchedMatchId);
  const [opponentName, setOpponentName] = useState<string>(activeMatchObj?.opponent || 'Przeciwnik');
  const [teamScore, setTeamScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState<MatchRecord | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState<boolean>(false);
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'yellow' | 'red'>('goal');
  const [editEventModalVisible, setEditEventModalVisible] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<MatchEvent | null>(null);
  const [editEventMinute, setEditEventMinute] = useState('');
  const [editEventPlayer, setEditEventPlayer] = useState<Player | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string>('live');
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('Przed meczem');
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [halfDuration, setHalfDuration] = useState<string>('45');

  // Licznik Minut na Boisku (Fair Play Tracker) — sekundy gry każdego zawodnika
  const [playerPlaySeconds, setPlayerPlaySeconds] = useState<Record<string, number>>({});
  const [subModalVisible, setSubModalVisible] = useState<boolean>(false);
  const [subOutSlotId, setSubOutSlotId] = useState<string | null>(null);

  // Karta Po Meczu & Odznaki MVP (+50 XP)
  const [mvpModalVisible, setMvpModalVisible] = useState<boolean>(false);
  const [selectedMvpBadge, setSelectedMvpBadge] = useState(MVP_BADGES[0]);
  const [matchMvpAwards, setMatchMvpAwards] = useState<MvpAward[]>([]);

  const filteredPlayersForCallUp = useMemo(() => {
    return players.filter(p => filterYear === 'WSZYSTKIE' || String(p.year) === filterYear);
  }, [players, filterYear]);

  const handleCreateSchedMatch = () => {
    if (!newOpponent || !newDate) {
      Alert.alert('Błąd', 'Podaj przeciwnika i datę!');
      return;
    }
    const newMatch: ScheduledMatch = { id: Date.now().toString(), opponent: newOpponent, date: newDate, time: newTime, location: newLocation, callUps: [] };
    setScheduledMatches([newMatch, ...scheduledMatches]);
    setActiveSchedMatchId(newMatch.id);
    setCreateModalVisible(false);
    setNewOpponent(''); setNewDate(''); setNewTime(''); setNewLocation('');
  };

  const openCallUpModal = () => {
    if (!activeSchedMatch) return;
    const currentCallUpIds = activeSchedMatch.callUps.map(c => c.playerId);
    setTempSelectedPlayers(currentCallUpIds);
    setCallUpModalVisible(true);
  };

  const togglePlayerSelection = (playerId: string) => {
    setTempSelectedPlayers(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
  };

  const selectAllVisible = () => {
    const visibleIds = filteredPlayersForCallUp.map(p => p.id);
    const allSelected = visibleIds.every(id => tempSelectedPlayers.includes(id));
    if (allSelected) setTempSelectedPlayers(prev => prev.filter(id => !visibleIds.includes(id)));
    else setTempSelectedPlayers(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const saveCallUps = () => {
    if (!activeSchedMatch) return;
    const newCallUps: CallUp[] = tempSelectedPlayers.map(id => {
      const existing = activeSchedMatch.callUps.find(c => c.playerId === id);
      return existing ? existing : { playerId: id, parentConfirmed: false, playerConfirmed: false };
    });
    setScheduledMatches(scheduledMatches.map(m => m.id === activeSchedMatch.id ? { ...m, callUps: newCallUps } : m));
    setCallUpModalVisible(false);
  };

  const toggleConfirmation = (playerId: string, type: 'parent' | 'player') => {
    if (!activeSchedMatch) return;
    const updated = activeSchedMatch.callUps.map(c => {
      if (c.playerId === playerId) {
        return { ...c, parentConfirmed: type === 'parent' ? !c.parentConfirmed : c.parentConfirmed, playerConfirmed: type === 'player' ? !c.playerConfirmed : c.playerConfirmed };
      }
      return c;
    });
    setScheduledMatches(scheduledMatches.map(m => m.id === activeSchedMatch.id ? { ...m, callUps: updated } : m));
  };

  const handleExportWhatsAppCallUps = async () => {
    if (!activeSchedMatch || activeSchedMatch.callUps.length === 0) {
      if (Platform.OS === 'web') window.alert('Najpierw powołaj zawodników!');
      else Alert.alert('Brak danych', 'Najpierw powołaj zawodników!');
      return;
    }
    const NL = String.fromCharCode(10);
    const lines = [
      `${sportConfig.emoji} *POWOŁANIA NA MECZ / ZAWODY*`,
      `🏆 Przeciwnik: ${activeSchedMatch.opponent}`,
      `📅 Data: ${activeSchedMatch.date} | ⏰ ${activeSchedMatch.time || 'Do ustalenia'}`,
      `📍 Miejsce: ${activeSchedMatch.location || 'Do ustalenia'}`,
      '',
      '*POWOŁANA KADRA:*',
    ];
    activeSchedMatch.callUps.forEach((callUp, index) => {
      const p = players.find((player) => player.id === callUp.playerId);
      if (p) lines.push(`${index + 1}. ${p.firstName} ${p.lastName || ''} (#${p.number})`);
    });
    lines.push('', 'Proszę o potwierdzenie obecności w aplikacji!');
    const msg = lines.join(NL);
    await Clipboard.setStringAsync(msg);
    if (Platform.OS === 'web') window.alert('Lista powołań skopiowana do schowka!');
    else Alert.alert('Skopiowano! 📱', 'Lista powołań gotowa do wysłania na WhatsApp.');
  };

  const handleSelectFormat = (format: GameFormat) => {
    setSelectedFormat(format);
    setFormationIndex(0);
    setLineup({});
  };

  const lineupRef = useRef(lineup);
  useEffect(() => {
    lineupRef.current = lineup;
  }, [lineup]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => {
          const nextSec = prev + 1;
          const curMin = Math.max(1, Math.floor(nextSec / 60));
          setLiveMatchTicker((tPrev) => ({ ...tPrev, currentMinute: curMin }));
          return nextSec;
        });
        const onPitchPlayers = Object.values(lineupRef.current);
        if (onPitchPlayers.length > 0) {
          setPlayerPlaySeconds((prevSecs) => {
            const next = { ...prevSecs };
            onPitchPlayers.forEach((pl) => {
              const pId = String(pl.id);
              next[pId] = (next[pId] || 0) + 1;
            });
            return next;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Synchronizacja wyniku i zdarzeń z Asystentem z Trybun (gdy rodzic-reporter kliknie gola lub kartkę w swoim panelu)
  useEffect(() => {
    setTeamScore(liveMatchTicker.teamScore);
    setOpponentScore(liveMatchTicker.opponentScore);
    if (liveMatchTicker.phase !== matchPhase) {
      setMatchPhase(liveMatchTicker.phase);
    }
  }, [liveMatchTicker.teamScore, liveMatchTicker.opponentScore, liveMatchTicker.phase]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePhaseChange = () => {
    if (matchPhase === 'Przed meczem') {
      setMatchPhase('1. Połowa');
      setIsTimerRunning(true);
      setLiveMatchTicker((prev) => ({ ...prev, isActive: true, opponentName, phase: '1. Połowa' }));
    } else if (matchPhase === '1. Połowa') {
      setMatchPhase('Przerwa');
      setIsTimerRunning(false);
      setLiveMatchTicker((prev) => ({ ...prev, phase: 'Przerwa' }));
    } else if (matchPhase === 'Przerwa') {
      setMatchPhase('2. Połowa');
      setSecondsElapsed(parseInt(halfDuration) * 60);
      setIsTimerRunning(true);
      setLiveMatchTicker((prev) => ({ ...prev, phase: '2. Połowa' }));
    } else if (matchPhase === '2. Połowa') {
      setMatchPhase('Koniec meczu');
      setIsTimerRunning(false);
      setLiveMatchTicker((prev) => ({ ...prev, phase: 'Koniec meczu' }));
      const newRecord: MatchRecord = {
        id: Date.now().toString(),
        date:
          new Date().toLocaleDateString('pl-PL') +
          ' ' +
          new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        opponentName,
        teamScore,
        opponentScore,
        events: [...matchEvents],
      };
      setMatchHistory([newRecord, ...matchHistory]);
    } else {
      Alert.alert('Reset', 'Zresetować mecz i rozpocząć nowe spotkanie?', [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Tak',
          onPress: () => {
            setMatchPhase('Przed meczem');
            setSecondsElapsed(0);
            setTeamScore(0);
            setOpponentScore(0);
            setMatchEvents([]);
            setLiveMatchTicker((prev) => ({
              ...prev,
              phase: 'Przed meczem',
              teamScore: 0,
              opponentScore: 0,
              currentMinute: 1,
              events: [],
            }));
          },
        },
      ]);
    }
  };

  const availableFormations = FORMAT_FORMATIONS[selectedFormat];
  const currentFormation = availableFormations[formationIndex] || availableFormations[0];
  const currentSlots = currentFormation.slots;

  const handleQuickSubstitute = (incomingPlayer: Player) => {
    if (!subOutSlotId) return;
    setLineup((prev) => ({ ...prev, [subOutSlotId]: incomingPlayer }));
    setSubModalVisible(false);
    setSubOutSlotId(null);
  };

  const handleAwardMvp = (player: Player) => {
    const newAward: MvpAward = {
      id: `mvp-${Date.now()}`,
      badgeTitle: selectedMvpBadge.title,
      badgeEmoji: selectedMvpBadge.emoji,
      playerId: String(player.id),
      playerName: `${player.firstName} ${player.lastName || ''}`.trim() || player.name,
      xpBonus: selectedMvpBadge.xp,
    };
    setMatchMvpAwards((prev) => [newAward, ...prev]);
    updatePlayer(player.id, { xp: (player.xp || 300) + selectedMvpBadge.xp });
    setMvpModalVisible(false);
    const msg = `Przyznano odznakę ${selectedMvpBadge.emoji} ${selectedMvpBadge.title} dla ${newAward.playerName} (+${selectedMvpBadge.xp} XP do Karty FIFA)!`;
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Odznaka MVP Przyznana! 🏆', msg);
  };

  const handleAssignPlayer = (player: Player) => {
    if (!activeSlot) return;
    setLineup((prev) => ({ ...prev, [activeSlot.id]: player }));
    setModalVisible(false);
    setActiveSlot(null);
  };

  const handleAddEventSubmit = (player: Player) => {
    const currentMinute = Math.floor(secondsElapsed / 60);
    const minStr = String(currentMinute === 0 ? 1 : currentMinute);
    const newEvent: MatchEvent = { id: Date.now().toString(), type: selectedEventType, player, minute: minStr };
    setMatchEvents([newEvent, ...matchEvents]);
    addLiveTickerEvent(selectedEventType, player, minStr, 'Trener');
    setEventModalVisible(false);
  };

  const handleOpenEditEvent = (ev: MatchEvent, matchId: string) => {
    setEventToEdit(ev); setEditEventMinute(ev.minute); setEditEventPlayer(ev.player); setEditingMatchId(matchId); setEditEventModalVisible(true);
  };

  const handleSaveEditEvent = () => {
    if (!eventToEdit || !editEventPlayer) return;
    const updated = { ...eventToEdit, minute: editEventMinute, player: editEventPlayer };
    if (editingMatchId === 'live') {
      setMatchEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
    } else {
      setMatchHistory(prev => prev.map(m => m.id === editingMatchId ? { ...m, events: m.events.map(e => e.id === updated.id ? updated : e) } : m));
      if (selectedHistoryMatch && selectedHistoryMatch.id === editingMatchId) {
         setSelectedHistoryMatch(prev => prev ? { ...prev, events: prev.events.map(e => e.id === updated.id ? updated : e) } : null);
      }
    }
    setEditEventModalVisible(false);
  };

  const handleDeleteEvent = (ev: MatchEvent, matchId: string) => {
    if (matchId === 'live') {
      if (ev.type === 'goal') setTeamScore(Math.max(0, teamScore - 1));
      setMatchEvents(matchEvents.filter(item => item.id !== ev.id));
    } else {
      setMatchHistory(prev => prev.map(m => {
        if (m.id === matchId) {
          const newEvents = m.events.filter(item => item.id !== ev.id);
          const newScore = ev.type === 'goal' ? Math.max(0, m.teamScore - 1) : m.teamScore;
          return { ...m, events: newEvents, teamScore: newScore };
        }
        return m;
      }));
      if (selectedHistoryMatch && selectedHistoryMatch.id === matchId) {
         setSelectedHistoryMatch(prev => prev ? { ...prev, events: prev.events.filter(item => item.id !== ev.id), teamScore: ev.type === 'goal' ? Math.max(0, prev.teamScore - 1) : prev.teamScore } : null);
      }
    }
  };

  const generateReportLiveMatch = async (matchInfo: { teamScore: number; opponentScore: number; opponentName: string; events: MatchEvent[] }) => {
    const NL = String.fromCharCode(10);
    const goals = matchInfo.events.filter((e) => e.type === 'goal').sort((a, b) => parseInt(a.minute, 10) - parseInt(b.minute, 10));
    const yellowCards = matchInfo.events.filter((e) => e.type === 'yellow');
    const redCards = matchInfo.events.filter((e) => e.type === 'red');

    const lines = [
      `${sportConfig.emoji} *WYNIK KOŃCOWY*`,
      `*Nasza Drużyna* ${matchInfo.teamScore} : ${matchInfo.opponentScore} *${matchInfo.opponentName}*`,
      '',
    ];
    if (goals.length > 0) {
      lines.push(`🎯 *ZDOBYTE PUNKTY / BRAMKI:*`);
      goals.forEach((g) => lines.push(`- ${g.minute}' ${g.player.name}`));
      lines.push('');
    }
    if (yellowCards.length > 0 || redCards.length > 0) {
      lines.push('🛑 *KARTKI / KARY:*');
      yellowCards.forEach((y) => lines.push(`🟨 ${y.minute}' ${y.player.name}`));
      redCards.forEach((r) => lines.push(`🟥 ${r.minute}' ${r.player.name}`));
      lines.push('');
    }
    lines.push('💪 *Dobra robota, drużyno!*', '_Wygenerowano z aplikacji SportsClub Pro_');

    await Clipboard.setStringAsync(lines.join(NL));
    if (Platform.OS === 'web') window.alert('Podsumowanie meczu skopiowane do schowka!');
    else Alert.alert('Sukces 📋', 'Podsumowanie meczu skopiowane do schowka!');
  };

  const renderEventRow = (ev: MatchEvent, matchId: string) => (
    <View key={ev.id} style={styles.eventRow}>
      <Text style={styles.eventMinute}>{ev.minute}'</Text>
      <Text style={styles.eventIcon}>{ev.type === 'goal' ? '⚽' : ev.type === 'yellow' ? '🟨' : '🟥'}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={styles.eventPlayerName}>#{ev.player.number} {ev.player.name}</Text>
        <Text style={styles.eventDesc}>{ev.type === 'goal' ? 'Bramka' : ev.type === 'yellow' ? 'Żółta kartka' : 'Czerwona kartka'}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginRight: 6 }}>
        <TouchableOpacity onPress={() => handleOpenEditEvent(ev, matchId)}><Ionicons name="pencil" size={18} color="#2563eb" /></TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteEvent(ev, matchId)}><Ionicons name="trash-outline" size={18} color="#dc2626" /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Centrum Meczowe ⚽</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'schedule' ? 'Zarządzanie powołaniami' : activeTab === 'pitch' ? `Format: ${selectedFormat} | ${currentFormation.name}` : 'Live & Historia'}
          </Text>
        </View>
        
        {activeTab === 'schedule' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Nowy</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'pitch' && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setLineup({})}>
            <Ionicons name="trash-outline" size={16} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mainTabRow}>
        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'schedule' && styles.mainTabBtnActive]} onPress={() => setActiveTab('schedule')}>
          <Ionicons name="calendar-outline" size={14} color={activeTab === 'schedule' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.mainTabText, activeTab === 'schedule' && styles.mainTabTextActive]}>Kadra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'pitch' && styles.mainTabBtnActive]} onPress={() => setActiveTab('pitch')}>
          <Ionicons name="football-outline" size={14} color={activeTab === 'pitch' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.mainTabText, activeTab === 'pitch' && styles.mainTabTextActive]}>Taktyka</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'matchLive' && styles.mainTabBtnActive]} onPress={() => setActiveTab('matchLive')}>
          <Ionicons name="stats-chart-outline" size={14} color={activeTab === 'matchLive' ? '#2563eb' : '#64748b'} style={{ marginRight: 4 }} />
          <Text style={[styles.mainTabText, activeTab === 'matchLive' && styles.mainTabTextActive]}>LIVE</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'schedule' && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16 }}>
              {scheduledMatches.map(match => (
                <TouchableOpacity key={match.id} style={[styles.matchTabBtn, activeSchedMatchId === match.id && styles.matchTabBtnActive]} onPress={() => setActiveSchedMatchId(match.id)}>
                  <Text style={[styles.matchTabText, activeSchedMatchId === match.id && styles.matchTabTextActive]}>vs {match.opponent}</Text>
                  <Text style={[styles.matchTabDate, activeSchedMatchId === match.id && styles.matchTabTextActive]}>{match.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeSchedMatch ? (
              <>
                <View style={styles.eventCard}>
                  <View style={styles.eventHeaderRow}>
                    <Ionicons name="football" size={24} color="#2563eb" />
                    <Text style={styles.eventOpponent}>WKS Wieluń vs {activeSchedMatch.opponent}</Text>
                  </View>
                  <View style={styles.eventDetailsGrid}>
                    <View style={styles.eventDetailItem}><Ionicons name="calendar-outline" size={14} color="#64748b" /><Text style={styles.eventDetailText}>{activeSchedMatch.date}</Text></View>
                    <View style={styles.eventDetailItem}><Ionicons name="time-outline" size={14} color="#64748b" /><Text style={styles.eventDetailText}>{activeSchedMatch.time || '---'}</Text></View>
                    <View style={styles.eventDetailItem}><Ionicons name="location-outline" size={14} color="#64748b" /><Text style={styles.eventDetailText}>{activeSchedMatch.location || '---'}</Text></View>
                  </View>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.callUpBtn} onPress={openCallUpModal}><Ionicons name="people-outline" size={16} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.callUpBtnText}>Edytuj Powołania</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.waBtn} onPress={handleExportWhatsAppCallUps}><Ionicons name="logo-whatsapp" size={16} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.waBtnText}>Wyślij Kadrę</Text></TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.sectionHeader}>Powołana Kadra ({activeSchedMatch.callUps.length})</Text>
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle" size={16} color="#2563eb" />
                  <Text style={styles.infoBannerText}>Zaznacz ręcznie, gdy ktoś potwierdzi przybycie SMSem.</Text>
                </View>

                {activeSchedMatch.callUps.map(callUp => {
                  const p = players.find(player => player.id === callUp.playerId);
                  if (!p) return null;
                  return (
                    <View key={p.id} style={styles.playerRow}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.numberBadge}><Text style={styles.numberText}>#{p.number}</Text></View>
                        <View><Text style={styles.playerName}>{p.firstName} {p.lastName}</Text><Text style={styles.playerMeta}>Rocznik {p.year}</Text></View>
                      </View>
                      <View style={styles.confirmationBox}>
                        <TouchableOpacity
                          style={[
                            styles.confirmBtn,
                            String(liveMatchTicker.reporterPlayerId) === String(p.id) && {
                              backgroundColor: '#7c3aed',
                              borderColor: '#7c3aed',
                            },
                          ]}
                          onPress={() => {
                            const isAlready = String(liveMatchTicker.reporterPlayerId) === String(p.id);
                            assignParentReporter(isAlready ? null : p, false);
                            const msg = isAlready
                              ? 'Odwołano funkcję Reportera z Trybun.'
                              : `Rodzic zawodnika ${p.firstName} ${p.lastName || ''} został wyznaczony jako 🎙️ Reporter z Trybun (Live-Ticker)!`;
                            if (Platform.OS === 'web') window.alert(msg);
                            else Alert.alert('Asystent z Trybun 🎙️', msg);
                          }}
                        >
                          <Ionicons
                            name="radio-outline"
                            size={12}
                            color={String(liveMatchTicker.reporterPlayerId) === String(p.id) ? '#fff' : '#7c3aed'}
                          />
                          <Text
                            style={[
                              styles.confirmText,
                              { color: String(liveMatchTicker.reporterPlayerId) === String(p.id) ? '#fff' : '#7c3aed' },
                            ]}
                          >
                            {String(liveMatchTicker.reporterPlayerId) === String(p.id) ? '🎙️ Reporter' : 'Reporter'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmBtn, callUp.parentConfirmed && styles.confirmBtnActive]} onPress={() => toggleConfirmation(p.id, 'parent')}><Ionicons name="person" size={12} color={callUp.parentConfirmed ? '#fff' : '#64748b'} /><Text style={[styles.confirmText, callUp.parentConfirmed && { color: '#fff' }]}>Rodzic</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.confirmBtn, callUp.playerConfirmed && styles.confirmBtnActive]} onPress={() => toggleConfirmation(p.id, 'player')}><Ionicons name="walk" size={12} color={callUp.playerConfirmed ? '#fff' : '#64748b'} /><Text style={[styles.confirmText, callUp.playerConfirmed && { color: '#fff' }]}>Gracz</Text></TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                {activeSchedMatch.callUps.length === 0 && <Text style={styles.noEventsText}>Brak powołań. Kliknij "Edytuj Powołania".</Text>}
                <View style={{ height: 60 }} />
              </>
            ) : <Text style={styles.noEventsText}>Brak zaplanowanych meczów. Utwórz nowy mecz.</Text>}
          </ScrollView>
        </View>
      )}

      {activeTab === 'pitch' && (
        <>
          <View style={styles.formatRow}>
            {(['5v5', '7v7', '9v9', '11v11'] as GameFormat[]).map((fmt) => (
              <TouchableOpacity key={fmt} style={[styles.formatChip, selectedFormat === fmt && styles.formatChipActive]} onPress={() => handleSelectFormat(fmt)}>
                <Text style={[styles.formatChipText, selectedFormat === fmt && styles.formatChipTextActive]}>{fmt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formationRow}>
            {availableFormations.map((formObj, idx) => (
              <TouchableOpacity key={formObj.name} style={[styles.formationChip, formationIndex === idx && styles.formationChipActive]} onPress={() => setFormationIndex(idx)}>
                <Text style={[styles.formationChipText, formationIndex === idx && styles.formationChipTextActive]}>{formObj.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pitchContainer}>
            <View style={styles.pitchCenterCircle} /><View style={styles.pitchCenterLine} />
            <View style={styles.pitchPenaltyBoxTop} /><View style={styles.pitchGoalBoxTop} />
            {currentSlots.map((slot) => (
              <DraggablePlayerNode 
                key={slot.id} slot={slot} assignedPlayer={lineup[slot.id]} 
                onAssignPress={(s: PositionSlot) => { setActiveSlot(s); setModalVisible(true); }}
                onRemoveLongPress={(id: string) => { const copy = {...lineup}; delete copy[id]; setLineup(copy); }}
              />
            ))}
          </View>
        </>
      )}

      {activeTab === 'matchLive' && (
        <ScrollView style={styles.liveContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.timerCard}>
            <View style={styles.timerHeaderRow}>
              <View>
                <Text style={styles.timerPhaseText}>{matchPhase}</Text>
                {matchPhase === 'Przed meczem' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Czas połowy (min): </Text>
                    <TextInput style={styles.halfDurationInput} value={halfDuration} onChangeText={setHalfDuration} keyboardType="numeric" />
                  </View>
                )}
              </View>
              <Text style={styles.timerClockText}>{formatTime(secondsElapsed)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.timerActionBtn, matchPhase === 'Koniec meczu' ? {backgroundColor: '#ef4444'} : {backgroundColor: '#2563eb'}]} onPress={handlePhaseChange}>
                <Ionicons name={matchPhase === 'Koniec meczu' ? 'refresh' : (isTimerRunning ? 'pause' : 'play')} size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.timerActionBtnText}>
                  {matchPhase === 'Przed meczem' ? 'Rozpocznij Mecz' : matchPhase === '1. Połowa' ? 'Zakończ 1. Połowę (Przerwa)' : matchPhase === 'Przerwa' ? 'Rozpocznij 2. Połowę' : matchPhase === '2. Połowa' ? 'Zakończ Mecz' : 'Zresetuj Stoper'}
                </Text>
              </TouchableOpacity>
              {matchPhase !== 'Przed meczem' && (
                <TouchableOpacity style={styles.reportBtn} onPress={() => generateReportLiveMatch({ teamScore, opponentScore, opponentName, events: matchEvents })}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* PANEL STEROWANIA: ASYSTENT Z TRYBUN (LIVE-TICKER DLA RODZICÓW) */}
          <View
            style={{
              backgroundColor: '#f5f3ff',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#ddd6fe',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="radio" size={18} color="#7c3aed" />
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4c1d95' }}>
                  🎙️ Asystent z Trybun (Live-Ticker Rodziców)
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: liveMatchTicker.allowAllParentsToReport ? '#7c3aed' : '#e2e8f0',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                }}
                onPress={() =>
                  setLiveMatchTicker((prev) => ({
                    ...prev,
                    allowAllParentsToReport: !prev.allowAllParentsToReport,
                  }))
                }
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: liveMatchTicker.allowAllParentsToReport ? '#fff' : '#475569',
                  }}
                >
                  {liveMatchTicker.allowAllParentsToReport ? 'Tryb Otwarty: WŁ.' : 'Tylko Wyznaczony'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#5b21b6', marginTop: 4 }}>
              {liveMatchTicker.reporterName
                ? `Wyznaczony reporter: ${liveMatchTicker.reporterName}`
                : liveMatchTicker.allowAllParentsToReport
                ? 'Każdy zalogowany rodzic może dodawać gole i kartki na żywo z trybun.'
                : 'Wybierz rodzica-reportera z listy poniżej lub w zakładce Kadra:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {players.map((p) => {
                const isRep = String(liveMatchTicker.reporterPlayerId) === String(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isRep ? '#7c3aed' : '#fff',
                      borderWidth: 1,
                      borderColor: isRep ? '#7c3aed' : '#c4b5fd',
                      marginRight: 6,
                    }}
                    onPress={() => assignParentReporter(isRep ? null : p, false)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: isRep ? '#fff' : '#5b21b6' }}>
                      {isRep ? '🎙️ ' : ''}Rodzic: {p.firstName} #{p.number}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.scoreCard}>
            <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.teamTitle}>Nasza Drużyna</Text><Text style={styles.scoreText}>{teamScore}</Text></View>
            <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={styles.vsText}>VS</Text>
              <TextInput
                style={styles.opponentInput}
                value={opponentName}
                onChangeText={(txt) => {
                  setOpponentName(txt);
                  setLiveMatchTicker((prev) => ({ ...prev, opponentName: txt }));
                }}
                placeholder="Przeciwnik"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TouchableOpacity
                  style={styles.scoreAdjBtn}
                  onPress={() => {
                    const nextScore = Math.max(0, opponentScore - 1);
                    setOpponentScore(nextScore);
                    setLiveMatchTicker((prev) => ({ ...prev, opponentScore: nextScore }));
                  }}
                >
                  <Text style={styles.scoreAdjText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.scoreText, { marginHorizontal: 12, fontSize: 24 }]}>{opponentScore}</Text>
                <TouchableOpacity
                  style={styles.scoreAdjBtn}
                  onPress={() => {
                    const nextScore = opponentScore + 1;
                    setOpponentScore(nextScore);
                    addLiveTickerEvent('opponent_goal', null, String(Math.max(1, Math.floor(secondsElapsed / 60))), 'Trener');
                  }}
                >
                  <Text style={styles.scoreAdjText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Dodaj zdarzenie:</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => { setSelectedEventType('goal'); setEventModalVisible(true); }}><Ionicons name="football" size={16} color="#fff" style={{ marginRight: 4 }} /><Text style={styles.actionBtnText}>+ Bramka</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ca8a04' }]} onPress={() => { setSelectedEventType('yellow'); setEventModalVisible(true); }}><Text style={styles.cardYellow}>🟨</Text><Text style={[styles.actionBtnText, { color: '#fff' }]}>Żółta</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={() => { setSelectedEventType('red'); setEventModalVisible(true); }}><Text style={styles.cardRed}>🟥</Text><Text style={styles.actionBtnText}>Czerwona</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Przebieg spotkania (Protokół Trenera + Relacja z Trybun):</Text>
          {liveMatchTicker.events.length > 0 ? (
            liveMatchTicker.events.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventMinute}>{ev.minute}'</Text>
                <Text style={styles.eventIcon}>
                  {ev.type === 'goal' ? '⚽' : ev.type === 'opponent_goal' ? '🥅' : ev.type === 'yellow' ? '🟨' : '🟥'}
                </Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.eventPlayerName}>
                    {ev.playerNumber ? `#${ev.playerNumber} ` : ''}{ev.playerName}
                  </Text>
                  <Text style={styles.eventDesc}>
                    {ev.type === 'goal'
                      ? 'Bramka dla nas'
                      : ev.type === 'opponent_goal'
                      ? 'Bramka dla rywali'
                      : ev.type === 'yellow'
                      ? 'Żółta kartka'
                      : 'Czerwona kartka'}{' '}
                    • 🎙️ {ev.reportedBy || 'Trener'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeLiveTickerEvent(ev.id)}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))
          ) : matchEvents.length > 0 ? (
            matchEvents.map((ev) => renderEventRow(ev, 'live'))
          ) : (
            <Text style={styles.noEventsText}>Brak zarejestrowanych zdarzeń w tym meczu.</Text>
          )}
          
          {/* LICZNIK MINUT NA BOISKU (FAIR PLAY TRACKER) */}
          <View style={styles.fairPlayCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fairPlayTitle}>⏱️ Licznik Minut (Fair Play Tracker)</Text>
                <Text style={styles.fairPlaySub}>
                  Automatycznie zlicza czas gry zawodników ustawionych w zakładce Taktyka
                </Text>
              </View>
              <TouchableOpacity
                style={styles.mvpTriggerBtn}
                onPress={() => setMvpModalVisible(true)}
              >
                <Ionicons name="trophy" size={14} color="#854d0e" />
                <Text style={styles.mvpTriggerBtnText}>Odznaka MVP</Text>
              </TouchableOpacity>
            </View>

            {Object.keys(lineup).length === 0 ? (
              <Text style={styles.noEventsText}>
                Ustaw skład w zakładce „Taktyka”, aby stoper automatycznie zliczał minuty gry na boisku.
              </Text>
            ) : (
              <View style={{ gap: 6 }}>
                {Object.entries(lineup).map(([slotId, pl]) => {
                  const secs = playerPlaySeconds[String(pl.id)] || 0;
                  const mins = Math.floor(secs / 60);
                  const remSecs = secs % 60;
                  return (
                    <View key={slotId} style={styles.fairPlayRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fairPlayPlayerName}>
                          🟢 #{pl.number} {pl.firstName} {pl.lastName || ''} ({slotId})
                        </Text>
                      </View>
                      <Text style={styles.fairPlayMinutes}>
                        {mins}:{String(remSecs).padStart(2, '0')} min
                      </Text>
                      <TouchableOpacity
                        style={styles.quickSubBtn}
                        onPress={() => {
                          setSubOutSlotId(slotId);
                          setSubModalVisible(true);
                        }}
                      >
                        <Ionicons name="swap-horizontal" size={14} color="#2563eb" />
                        <Text style={styles.quickSubBtnText}>Zmiana</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ławka rezerwowych z licznikiem minut */}
            {players.filter((p) => !Object.values(lineup).some((lp) => String(lp.id) === String(p.id))).length > 0 && (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                  🪑 Ławka rezerwowych (zagrane minuty):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {players
                    .filter((p) => !Object.values(lineup).some((lp) => String(lp.id) === String(p.id)))
                    .map((bp) => {
                      const bMin = Math.floor((playerPlaySeconds[String(bp.id)] || 0) / 60);
                      return (
                        <View key={bp.id} style={styles.benchChip}>
                          <Text style={styles.benchChipText}>
                            #{bp.number} {bp.firstName}: {bMin} min
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </View>
            )}

            {/* Przyznane Odznaki MVP w tym meczu */}
            {matchMvpAwards.length > 0 && (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fde047' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#854d0e', marginBottom: 4 }}>
                  🏆 Wyróżnienia MVP w tym meczu:
                </Text>
                {matchMvpAwards.map((aw) => (
                  <Text key={aw.id} style={{ fontSize: 12, color: '#0f172a', fontWeight: '600', marginBottom: 2 }}>
                    {aw.badgeEmoji} {aw.badgeTitle}: {aw.playerName} (+{aw.xpBonus} XP)
                  </Text>
                ))}
              </View>
            )}
          </View>

          {matchHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionHeader}>Historia Ostatnich Spotkań:</Text>
              {matchHistory.map((m) => (
                <TouchableOpacity key={m.id} style={styles.historyCard} onPress={() => { setSelectedHistoryMatch(m); setHistoryModalVisible(true); }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View><Text style={styles.historyOpponent}>vs {m.opponentName}</Text><Text style={styles.historyDate}>{m.date}</Text></View>
                    <Text style={styles.historyScore}>{m.teamScore} : {m.opponentScore}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Wybierz do: {activeSlot?.label}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={22} color="#64748b" /></TouchableOpacity></View>
            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
              {players.map((p) => (
                <TouchableOpacity key={p.id} style={styles.playerSelectRow} onPress={() => handleAssignPlayer(p)}>
                  <View style={styles.selectAvatar}><Text style={styles.selectAvatarText}>#{p.number}</Text></View>
                  <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.selectPlayerName}>{p.name}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={eventModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Kto brał udział?</Text><TouchableOpacity onPress={() => setEventModalVisible(false)}><Ionicons name="close" size={22}/></TouchableOpacity></View>
            <ScrollView style={styles.playerList}>
              {players.map((p) => (
                <TouchableOpacity key={p.id} style={styles.playerSelectRow} onPress={() => handleAddEventSubmit(p)}>
                  <View style={styles.selectAvatar}><Text style={styles.selectAvatarText}>#{p.number}</Text></View>
                  <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.selectPlayerName}>{p.name}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={editEventModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Edytuj Zdarzenie ✏️</Text><TouchableOpacity onPress={() => setEditEventModalVisible(false)}><Ionicons name="close" size={22}/></TouchableOpacity></View>
            <Text style={styles.inputLabel}>Minuta zdarzenia:</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={editEventMinute} onChangeText={setEditEventMinute} />
            <Text style={styles.inputLabel}>Zmień przypisanego zawodnika:</Text>
            <ScrollView style={{ maxHeight: 200, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 4 }}>
              {players.map(p => (
                <TouchableOpacity key={p.id} style={[styles.playerSelectRow, {paddingHorizontal: 10}, editEventPlayer?.id === p.id && {backgroundColor: '#eff6ff'}]} onPress={() => setEditEventPlayer(p)}>
                  <Text style={{fontWeight: editEventPlayer?.id === p.id ? 'bold' : 'normal', color: editEventPlayer?.id === p.id ? '#2563eb' : '#0f172a'}}>#{p.number} {p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtnFull} onPress={handleSaveEditEvent}><Text style={styles.saveBtnFullText}>Zapisz Zmiany</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={historyModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            {selectedHistoryMatch && (
              <>
                <View style={styles.modalHeader}><Text style={styles.modalTitle}>Archiwum Spotkań</Text><TouchableOpacity onPress={() => setHistoryModalVisible(false)}><Ionicons name="close" size={22}/></TouchableOpacity></View>
                <View style={styles.scoreCard}>
                  <View style={{ alignItems: 'center', flex: 1 }}><Text style={styles.teamTitle}>Nasza Drużyna</Text><Text style={styles.scoreText}>{selectedHistoryMatch.teamScore}</Text></View>
                  <View style={{ alignItems: 'center', paddingHorizontal: 10 }}><Text style={styles.vsText}>VS</Text><Text style={styles.teamTitle}>{selectedHistoryMatch.opponentName}</Text><Text style={[styles.scoreText, { fontSize: 24 }]}>{selectedHistoryMatch.opponentScore}</Text></View>
                </View>
                <TouchableOpacity style={[styles.saveBtnFull, {backgroundColor: '#10b981', marginBottom: 16}]} onPress={() => generateReportLiveMatch(selectedHistoryMatch)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.saveBtnFullText}>Generuj Raport Pomeczowy</Text>
                </TouchableOpacity>
                <Text style={styles.sectionHeader}>Protokół Meczowy (Możliwość edycji):</Text>
                <ScrollView>
                  {selectedHistoryMatch.events.length > 0 ? selectedHistoryMatch.events.map(ev => renderEventRow(ev, selectedHistoryMatch.id)) : <Text style={styles.noEventsText}>Brak zdarzeń.</Text>}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={createModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Zaplanuj Wydarzenie ⚽</Text><TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity></View>
            <Text style={styles.inputLabel}>Przeciwnik (Klub)</Text>
            <TextInput style={styles.modalInput} placeholder="np. KS Warta" value={newOpponent} onChangeText={setNewOpponent} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.inputLabel}>Data</Text><TextInput style={styles.modalInput} placeholder="np. 15 Listopada" value={newDate} onChangeText={setNewDate} /></View>
              <View style={{ flex: 1 }}><Text style={styles.inputLabel}>Godzina</Text><TextInput style={styles.modalInput} placeholder="np. 10:00" value={newTime} onChangeText={setNewTime} /></View>
            </View>
            <Text style={styles.inputLabel}>Miejsce (Stadion / Orlik)</Text>
            <TextInput style={styles.modalInput} placeholder="np. Stadion Główny" value={newLocation} onChangeText={setNewLocation} />
            <TouchableOpacity style={styles.saveBtnFull} onPress={handleCreateSchedMatch}><Text style={styles.saveBtnFullText}>Utwórz Mecz</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={callUpModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '90%' }]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Wybierz Kadrę 📋</Text><TouchableOpacity onPress={() => setCallUpModalVisible(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['WSZYSTKIE', ...availableYears].map(yr => (
                <TouchableOpacity key={yr} style={[styles.filterChip, filterYear === yr && styles.filterChipActive]} onPress={() => setFilterYear(yr)}>
                  <Text style={[styles.filterChipText, filterYear === yr && styles.filterChipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllVisible}>
              <Ionicons name="checkmark-done" size={16} color="#2563eb" style={{ marginRight: 6 }} /><Text style={styles.selectAllBtnText}>Zaznacz / Odznacz wszystkich</Text>
            </TouchableOpacity>
            <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
              {filteredPlayersForCallUp.map(p => {
                const isSelected = tempSelectedPlayers.includes(p.id);
                return (
                  <TouchableOpacity key={p.id} style={[styles.selectionRow, isSelected && styles.selectionRowActive]} onPress={() => togglePlayerSelection(p.id)}>
                    <View style={{ flex: 1 }}><Text style={styles.selectionName}>{p.firstName} {p.lastName}</Text><Text style={styles.selectionMeta}>Rocznik: {p.year} | {p.position}</Text></View>
                    <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={isSelected ? "#2563eb" : "#cbd5e1"} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.saveBtnFull, {backgroundColor: '#10b981'}]} onPress={saveCallUps}><Text style={styles.saveBtnFullText}>Zapisz Powołania ({tempSelectedPlayers.length})</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SZYBKA ZMIANA (FAIR PLAY TRACKER) */}
      <Modal animationType="slide" transparent={true} visible={subModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔄 Szybka Zmiana (Pozycja: {subOutSlotId})</Text>
              <TouchableOpacity onPress={() => setSubModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              Wybierz rezerwowego, który wchodzi na boisko (jego czas zacznie się naliczać automatycznie):
            </Text>
            <ScrollView style={styles.playerList}>
              {players
                .filter((p) => !Object.values(lineup).some((lp) => String(lp.id) === String(p.id)))
                .map((p) => {
                  const pMin = Math.floor((playerPlaySeconds[String(p.id)] || 0) / 60);
                  return (
                    <TouchableOpacity key={p.id} style={styles.playerSelectRow} onPress={() => handleQuickSubstitute(p)}>
                      <View style={styles.selectAvatar}>
                        <Text style={styles.selectAvatarText}>#{p.number}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.selectPlayerName}>{p.firstName} {p.lastName || ''}</Text>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>Dotychczas na boisku: {pMin} min</Text>
                      </View>
                      <Ionicons name="arrow-forward-circle" size={22} color="#16a34a" />
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: KARTA PO MECZU & ODZNAKI MVP (+50 XP) */}
      <Modal animationType="slide" transparent={true} visible={mvpModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 Przyznaj Odznakę MVP (+50 XP)</Text>
              <TouchableOpacity onPress={() => setMvpModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>1. Wybierz kategorię wyróżnienia:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {MVP_BADGES.map((b) => {
                const isSel = selectedMvpBadge.id === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.mvpBadgePill, isSel && styles.mvpBadgePillActive]}
                    onPress={() => setSelectedMvpBadge(b)}
                  >
                    <Text style={[styles.mvpBadgePillText, isSel && { color: '#fff' }]}>
                      {b.emoji} {b.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>2. Kliknij zawodnika, który otrzymuje odznakę:</Text>
            <ScrollView style={styles.playerList}>
              {players.map((p) => (
                <TouchableOpacity key={p.id} style={styles.playerSelectRow} onPress={() => handleAwardMvp(p)}>
                  <View style={styles.selectAvatar}>
                    <Text style={styles.selectAvatarText}>#{p.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.selectPlayerName}>{p.firstName} {p.lastName || ''}</Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>Obecne XP: {p.xp || 300}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#16a34a' }}>+{selectedMvpBadge.xp} XP</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  clearBtn: { padding: 8, backgroundColor: '#ffeeef', borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  addBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  
  mainTabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  mainTabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  mainTabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  mainTabText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  mainTabTextActive: { color: '#2563eb', fontWeight: 'bold' },
  
  formatRow: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff', paddingTop: 8, paddingBottom: 4 },
  formatChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  formatChipActive: { backgroundColor: '#0284c7' },
  formatChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  formatChipTextActive: { color: '#fff' },
  formationRow: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fff', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  formationChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: '#f1f5f9', marginHorizontal: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  formationChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  formationChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  formationChipTextActive: { color: '#fff', fontWeight: 'bold' },
  pitchContainer: { flex: 1, backgroundColor: '#15803d', margin: 12, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#16a34a' },
  pitchCenterCircle: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', top: '50%', left: '50%', transform: [{ translateX: -45 }, { translateY: -45 }] },
  pitchCenterLine: { position: 'absolute', height: 2, backgroundColor: 'rgba(255,255,255,0.4)', top: '50%', left: 0, right: 0 },
  pitchPenaltyBoxTop: { position: 'absolute', width: 160, height: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', top: 0, left: '50%', transform: [{ translateX: -80 }] },
  pitchGoalBoxTop: { position: 'absolute', width: 70, height: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', top: 0, left: '50%', transform: [{ translateX: -35 }] },
  playerNode: { position: 'absolute', alignItems: 'center', width: 48, zIndex: 10 },
  nodeAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  nodeEmpty: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  nodeAssigned: { backgroundColor: '#fef08a', borderColor: '#eab308' },
  nodeNumber: { fontSize: 12, fontWeight: 'bold', color: '#854d0e' },
  nodeLabel: { fontSize: 10, fontWeight: 'bold', color: '#fff', marginTop: 2, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  
  liveContainer: { flex: 1, padding: 16 },
  timerCard: { backgroundColor: '#0f172a', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  timerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timerPhaseText: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  timerClockText: { color: '#fff', fontSize: 32, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  halfDurationInput: { backgroundColor: '#1e293b', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 12, width: 40, textAlign: 'center' },
  timerActionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  timerActionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  reportBtn: { width: 48, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  scoreCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  teamTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  scoreText: { fontSize: 36, fontWeight: 'bold', color: '#0f172a' },
  vsText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
  opponentInput: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#0f172a', paddingVertical: 2, width: 90 },
  scoreAdjBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  scoreAdjText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginHorizontal: 3 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardYellow: { fontSize: 12, marginRight: 4 },
  cardRed: { fontSize: 12, marginRight: 4 },
  eventRow: { backgroundColor: '#fff', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  eventMinute: { fontSize: 12, fontWeight: 'bold', color: '#64748b', width: 28 },
  eventIcon: { fontSize: 16, marginRight: 6 },
  eventPlayerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  eventDesc: { fontSize: 10, color: '#64748b' },
  noEventsText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
  historySection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  historyCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8 },
  historyOpponent: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  historyDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  historyScore: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },

  content: { padding: 16 },
  matchTabBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  matchTabBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  matchTabText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  matchTabTextActive: { color: '#fff' },
  matchTabDate: { fontSize: 10, color: '#64748b', marginTop: 2 },
  eventCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  eventHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eventOpponent: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginLeft: 8 },
  eventDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  eventDetailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  eventDetailText: { fontSize: 11, color: '#475569', marginLeft: 4, fontWeight: '600' },
  actionButtonsRow: { flexDirection: 'row', gap: 10 },
  callUpBtn: { flex: 1, backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  callUpBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  waBtn: { flex: 1, backgroundColor: '#16a34a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 8 },
  waBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 10, borderRadius: 8, marginBottom: 12 },
  infoBannerText: { fontSize: 11, color: '#1d4ed8', marginLeft: 6, flex: 1 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  numberBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  numberText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  playerName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b' },
  confirmationBox: { flexDirection: 'row', gap: 6 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  confirmBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  confirmText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerList: { maxHeight: 320 },
  playerSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  selectAvatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  selectPlayerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 4, marginTop: 10 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0f172a' },
  saveBtnFull: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center' },
  saveBtnFullText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  filterScroll: { maxHeight: 40, marginBottom: 12, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterChipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  selectAllBtnText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  selectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectionRowActive: { backgroundColor: '#f8fafc' },
  selectionName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  selectionMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },

  fairPlayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  fairPlayTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  fairPlaySub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  fairPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  fairPlayPlayerName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  fairPlayMinutes: { fontSize: 12, fontWeight: '900', color: '#16a34a' },
  quickSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  quickSubBtnText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  benchChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  benchChipText: { fontSize: 10, fontWeight: '600', color: '#475569' },
  mvpTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde047',
    gap: 4,
  },
  mvpTriggerBtnText: { fontSize: 11, fontWeight: 'bold', color: '#854d0e' },
  mvpBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  mvpBadgePillActive: { backgroundColor: '#ca8a04', borderColor: '#ca8a04' },
  mvpBadgePillText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
});