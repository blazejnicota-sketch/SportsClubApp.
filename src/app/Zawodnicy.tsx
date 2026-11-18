import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Share,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { usePlayers, Player, FULL_KIT_SIZES } from '../components/PlayersContext';
import { useClubSettings } from '../components/ClubSettingsContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type SubTab = 'kody' | 'statystyki' | 'fizycznosc' | 'motoryka';
const MOTORMETIC_TESTS = ['Bieg na 30m (s)', 'Skok w dal (cm)', 'Beep Test', 'Żonglerka / Technika'];

const getAvatarBadgeForXp = (xp: number = 300) => {
  if (xp < 400) return { emoji: '💀', name: 'Szkieletor (Start)', color: '#64748b' };
  if (xp < 800) return { emoji: '🏃', name: 'Młody Atleta', color: '#0284c7' };
  if (xp < 1400) return { emoji: '🥋', name: 'Wojownik Boiska', color: '#16a34a' };
  if (xp < 2200) return { emoji: '💪', name: 'Kulturysta / Tytan', color: '#d97706' };
  return { emoji: '🦸‍♂️', name: 'Superbohater ELITE', color: '#7c3aed' };
};

export default function ZawodnicyScreen() {
  const {
    players,
    addPlayer,
    updatePlayer,
    regenerateInviteCode,
    removePlayer,
    availableYears,
    kits,
    assignPlayerKitSize,
  } = usePlayers();
  const { sportConfig } = useClubSettings();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('kody');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('WSZYSTKIE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState<boolean>(false);
  const [bulkTestModalVisible, setBulkTestModalVisible] = useState<boolean>(false);
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);

  // Stan dla Karty FIFA + Ewolucji Awatara
  const [fifaCardVisible, setFifaCardVisible] = useState<boolean>(false);
  const [selectedFifaPlayer, setSelectedFifaPlayer] = useState<Player | null>(null);
  const fifaCardRef = useRef<View>(null);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newYear, setNewYear] = useState('2014');
  const [newPosition, setNewPosition] = useState(sportConfig?.positions?.[0] || 'Pomocnik');
  const [newHeight, setNewHeight] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [paperConsentSigned, setPaperConsentSigned] = useState<boolean>(false);

  const [activeTestType, setActiveTestType] = useState<string>(MOTORMETIC_TESTS[0]);

  // --- STANY STOPERA ---
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const timerRef = useRef<any>(null);

  const toggleStopwatch = () => {
    if (stopwatchRunning) {
      clearInterval(timerRef.current);
      setStopwatchRunning(false);
    } else {
      setStopwatchRunning(true);
      const startTime = Date.now() - stopwatchMs;
      timerRef.current = setInterval(() => {
        setStopwatchMs(Date.now() - startTime);
      }, 50); // Odświeżanie co 50ms
    }
  };

  const resetStopwatch = () => {
    clearInterval(timerRef.current);
    setStopwatchRunning(false);
    setStopwatchMs(0);
  };

  const formatStopwatch = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const remMs = Math.floor((ms % 1000) / 10);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')},${remMs.toString().padStart(2, '0')}`;
    return `${s.toString().padStart(2, '0')},${remMs.toString().padStart(2, '0')}`;
  };

  const [bulkResults, setBulkResults] = useState<Record<string, string>>({});

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editSprint, setEditSprint] = useState('');
  const [editJump, setEditJump] = useState('');
  const [editBeep, setEditBeep] = useState('');
  const [editNote, setEditNote] = useState('');

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(title + String.fromCharCode(10, 10) + msg);
    } else {
      Alert.alert(title, msg);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesYear = selectedYearFilter === 'WSZYSTKIE' || String(p.year) === selectedYearFilter;
      const fullName = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        String(p.number).includes(searchQuery) ||
        (p.inviteCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesYear && matchesSearch;
    });
  }, [players, searchQuery, selectedYearFilter]);

  // Helper do obliczania trendu Progres / Regres na podstawie historii wyników
  const analyzePlayerProgression = (p: Player) => {
    const history = p.tests || [];
    if (history.length < 2) return null;
    const latest = history[0];
    // Szukamy poprzedniego testu tego samego typu
    const previous = history.slice(1).find((t) => t.testName === latest.testName);
    if (!previous) return null;

    const latestNum = parseFloat(String(latest.result).replace(',', '.'));
    const prevNum = parseFloat(String(previous.result).replace(',', '.'));
    if (isNaN(latestNum) || isNaN(prevNum) || prevNum === 0) return null;

    // Dla biegu (czas w sekundach) mniej = lepiej (progres), dla reszty (cm, powtórzenia, poziom) więcej = lepiej
    const isLowerBetter = latest.testName.toLowerCase().includes('bieg') || latest.testName.toLowerCase().includes('sprint');
    const diff = isLowerBetter ? prevNum - latestNum : latestNum - prevNum;
    const pct = Math.round((diff / prevNum) * 100);

    return {
      testName: latest.testName,
      latestVal: latest.result,
      prevVal: previous.result,
      isProgress: diff > 0,
      isSame: diff === 0,
      pctChange: pct,
    };
  };

  const calculateBMI = (h?: number, w?: number) => {
    if (!h || !w || h === 0) return 0;
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleShareInviteCode = async (player: Player) => {
    const code = player.inviteCode || 'BRAK';
    const NL = String.fromCharCode(10);
    const message = [
      `Cześć! Zapraszam do aplikacji klubowej SportsClub Pro ${sportConfig.emoji}`,
      '',
      `Zawodnik: ${player.firstName} ${player.lastName || ''}`,
      `Twój 6-znakowy kod dostępu (RODO): ${code}`,
      '',
      '1. Pobierz aplikację i utwórz konto (Rodzic lub Zawodnik 13+).',
      '2. Po zalogowaniu wpisz powyższy kod i zatwierdź zgody RODO.',
    ].join(NL);

    await Clipboard.setStringAsync(message);
    if (Platform.OS === 'web') {
      window.alert(`Skopiowano zaproszenie z kodem ${code} do schowka!`);
      return;
    }
    try {
      await Share.share({ message });
    } catch (error: any) {
      Alert.alert('Kod zaproszenia skopiowany', `Kod dla ${player.firstName}: ${code}`);
    }
  };

  const handleRegenerateCode = async (player: Player) => {
    const code = await regenerateInviteCode(player.id);
    if (code) {
      if (selectedPlayer?.id === player.id) {
        setSelectedPlayer({ ...selectedPlayer, inviteCode: code });
      }
      showNotice('Nowy kod gotowy ✅', `Nowy kod zaproszenia RODO: ${code}`);
    }
  };

  const calculateOverallRating = (p: Player) => {
    let base = 65;
    if (p.goals) base += p.goals * 1.5;
    if (p.assists) base += p.assists * 1;
    if (p.sprint30m && parseFloat(p.sprint30m) < 5.0) base += 5;
    if (p.xp && p.xp > 1000) base += 5;
    return Math.min(99, Math.round(base));
  };

  const getFifaStats = (p: Player) => {
    return {
      PAC: p.sprint30m ? Math.min(99, 100 - (parseFloat(p.sprint30m) - 3.5) * 10).toFixed(0) : '75',
      SHO: p.goals ? Math.min(99, 60 + p.goals * 3).toFixed(0) : '60',
      PAS: p.assists ? Math.min(99, 60 + p.assists * 4).toFixed(0) : '65',
      DRI: p.xp ? Math.min(99, 65 + p.xp / 500).toFixed(0) : '70',
      DEF: (p.position || '').includes('Obr') ? '80' : '45',
      PHY: p.height && p.weight ? Math.min(99, 60 + p.height / 10).toFixed(0) : '72',
    };
  };

  const shareFifaCardToSocials = async () => {
    try {
      if (fifaCardRef.current) {
        const uri = await captureRef(fifaCardRef, {
          format: 'png',
          quality: 1,
        });
        if (Platform.OS === 'web') {
          showNotice('Zapis', 'Wersja Web nie obsługuje natywnego udostępniania plików obrazu. Użyj aplikacji mobilnej!');
          return;
        }
        await Sharing.shareAsync(uri, { dialogTitle: 'Pochwal się kartą zawodnika!' });
      }
    } catch (e) {
      showNotice('Błąd', 'Nie udało się udostępnić karty.');
    }
  };

  const handleAddNewPlayer = async () => {
    if (!newFirstName.trim()) {
      showNotice('Błąd', 'Podaj przynajmniej imię nowego zawodnika (RODO minimalizacja danych).');
      return;
    }

    const generatedCode = await addPlayer({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      name: `${newFirstName.trim()} ${newLastName.trim()}`.trim(),
      number: Math.floor(Math.random() * 80) + 10,
      year: newYear,
      position: newPosition,
      height: parseInt(newHeight, 10) || 0,
      weight: parseFloat(newWeight) || 0,
      injuryStatus: 'Zdrowy',
      healthStatus: paperConsentSigned ? 'Zgoda papierowa RODO' : 'Oczekuje na akceptację Rodzica',
      tests: [],
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      xp: 300,
    });

    setNewFirstName('');
    setNewLastName('');
    setPaperConsentSigned(false);
    setAddPlayerModalVisible(false);

    if (generatedCode) {
      await Clipboard.setStringAsync(generatedCode);
      showNotice(
        'Zawodnik dodany ⚽',
        `Wygenerowano i skopiowano unikalny kod zaproszenia RODO: ${generatedCode}. Przekaż go rodzicowi.`
      );
    }
  };

  const handleOpenProfile = (player: Player) => {
    setSelectedPlayer(player);
    setEditHeight(String(player.height || ''));
    setEditWeight(String(player.weight || ''));
    setEditSprint(player.sprint30m || '');
    setEditJump(String(player.jumpCm || ''));
    setEditBeep(player.beepTest || '');
    setEditNote(player.coachNote || '');
    setProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!selectedPlayer) return;
    updatePlayer(selectedPlayer.id, {
      height: parseInt(editHeight, 10) || selectedPlayer.height,
      weight: parseFloat(editWeight) || selectedPlayer.weight,
      sprint30m: editSprint,
      jumpCm: parseInt(editJump, 10) || selectedPlayer.jumpCm,
      beepTest: editBeep,
      coachNote: editNote,
    });
    setProfileModalVisible(false);
    showNotice('Sukces', 'Karta zawodnika zaktualizowana.');
  };

  const handleDeletePlayerPrompt = (player: Player) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Czy usunąć ${player.firstName} ${player.lastName || ''} z bazy?`)) {
        removePlayer(player.id);
        setProfileModalVisible(false);
      }
      return;
    }
    Alert.alert('Usuń zawodnika', `Czy usunąć ${player.firstName} ${player.lastName || ''} z bazy?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          removePlayer(player.id);
          setProfileModalVisible(false);
        },
      },
    ]);
  };

  const updatePlayerStat = (field: keyof Player, delta: number) => {
    if (!selectedPlayer) return;
    const currentVal = Number(selectedPlayer[field] || 0);
    const updatedValue = Math.max(0, currentVal + delta);
    updatePlayer(selectedPlayer.id, { [field]: updatedValue });
    setSelectedPlayer({ ...selectedPlayer, [field]: updatedValue });
  };

  const toggleHealthStatus = (newStatus: 'Zdrowy' | 'Kontuzja') => {
    if (!selectedPlayer) return;
    updatePlayer(selectedPlayer.id, { injuryStatus: newStatus, healthStatus: newStatus });
    setSelectedPlayer({ ...selectedPlayer, injuryStatus: newStatus, healthStatus: newStatus });
  };

  const handleSaveBulkResults = () => {
    players.forEach((player) => {
      const resVal = bulkResults[player.id];
      if (resVal && resVal.trim() !== '') {
        const cleanVal = resVal.trim().replace(',', '.');
        const newTest = {
          testName: activeTestType,
          result: cleanVal,
          date: new Date().toLocaleDateString('pl-PL'),
        };
        const extraUpdates: Partial<Player> = {
          tests: [newTest, ...(player.tests || [])],
        };
        if (activeTestType.includes('30m') || activeTestType.includes('Sprint')) {
          extraUpdates.sprint30m = cleanVal;
        } else if (activeTestType.includes('Skok')) {
          extraUpdates.jumpCm = parseInt(cleanVal, 10) || player.jumpCm;
        } else if (activeTestType.includes('Beep')) {
          extraUpdates.beepTest = cleanVal;
        }
        updatePlayer(player.id, extraUpdates);
      }
    });
    setBulkTestModalVisible(false);
    showNotice('Zapisano 🚀', `Wyniki dla próby "${activeTestType}" zaktualizowane na karcie i dodane do Tablicy Progresu!`);
  };

  const linkedParentsCount = players.filter(
    (p) => !!p.parentId || p.healthStatus === 'Zgoda papierowa RODO'
  ).length;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kadra & Kody Dostępu {sportConfig.emoji}</Text>
          <Text style={styles.headerSubtitle}>
            Aktywne zgody RODO (Online / Papierowe): {linkedParentsCount}/{players.length}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.addPlayerTopBtn} onPress={() => setAddPlayerModalVisible(true)}>
            <Ionicons name="person-add-outline" size={14} color="#2563eb" />
            <Text style={styles.addPlayerTopBtnText}>+ Gracz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newEntryBtn}
            onPress={() => {
              setBulkResults({});
              setBulkTestModalVisible(true);
            }}
          >
            <Ionicons name="flash-outline" size={14} color="#fff" />
            <Text style={styles.newEntryBtnText}>Testy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'kody' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('kody')}
        >
          <Ionicons
            name="key-outline"
            size={13}
            color={activeSubTab === 'kody' ? '#2563eb' : '#64748b'}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 'kody' && styles.subTabTextActive]}>Kody RODO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'statystyki' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('statystyki')}
        >
          <Ionicons
            name="trophy-outline"
            size={13}
            color={activeSubTab === 'statystyki' ? '#2563eb' : '#64748b'}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 'statystyki' && styles.subTabTextActive]}>Statystyki</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'fizycznosc' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('fizycznosc')}
        >
          <Ionicons
            name="body-outline"
            size={13}
            color={activeSubTab === 'fizycznosc' ? '#2563eb' : '#64748b'}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 'fizycznosc' && styles.subTabTextActive]}>Fizyczność</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'motoryka' && styles.subTabBtnActive, { marginRight: 0 }]}
          onPress={() => setActiveSubTab('motoryka')}
        >
          <Ionicons
            name="speedometer-outline"
            size={13}
            color={activeSubTab === 'motoryka' ? '#2563eb' : '#64748b'}
            style={{ marginRight: 3 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 'motoryka' && styles.subTabTextActive]}>Motoryka</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po nazwisku, numerze lub kodzie..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {availableYears.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <Text style={styles.filterGroupLabel}>Rocznik:</Text>
            {['WSZYSTKIE', ...availableYears].map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[styles.chipFilter, selectedYearFilter === yr && styles.chipFilterActive]}
                onPress={() => setSelectedYearFilter(yr)}
              >
                <Text style={[styles.chipText, selectedYearFilter === yr && styles.chipTextActive]}>{yr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Zawodnicy ({filteredPlayers.length})</Text>

        {filteredPlayers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Brak zawodników na liście</Text>
            <Text style={styles.emptySub}>
              Kliknij „+ Gracz” w prawym górnym rogu, aby dodać zawodnika i wygenerować kod zaproszenia dla rodzica.
            </Text>
          </View>
        ) : (
          filteredPlayers.map((player) => {
            const bmi = calculateBMI(player.height, player.weight);
            const attPercent =
              (player.trainingsTotal || 0) > 0
                ? Math.round(((player.trainingsPresent || 0) / player.trainingsTotal!) * 100)
                : 100;
            const isInjured = player.injuryStatus === 'Kontuzja' || player.healthStatus === 'Kontuzja';
            const avatarTier = getAvatarBadgeForXp(player.xp || 300);
            const kitOrder = kits[0]?.orders?.find((o) => String(o.playerId) === String(player.id));

            return (
              <TouchableOpacity key={player.id} style={styles.card} onPress={() => handleOpenProfile(player)}>
                <View style={styles.cardMainRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>#{player.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName || ''}
                    </Text>
                    <Text style={styles.playerMeta}>
                      {player.position} | R. {player.year} | {avatarTier.emoji} {avatarTier.name} ({player.xp || 300} XP)
                    </Text>
                    {kitOrder && (
                      <Text style={{ fontSize: 10, color: '#0284c7', fontWeight: 'bold', marginTop: 2 }}>
                        👕 Rozmiar stroju: {kitOrder.size}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: isInjured ? '#dc2626' : '#16a34a' }]} />

                  <TouchableOpacity
                    style={styles.fifaBtn}
                    onPress={() => {
                      setSelectedFifaPlayer(player);
                      setFifaCardVisible(true);
                    }}
                  >
                    <Ionicons name="star" size={14} color="#d97706" style={{ marginRight: 4 }} />
                    <Text style={styles.fifaBtnText}>Karta</Text>
                  </TouchableOpacity>
                </View>

                {activeSubTab === 'kody' && (
                  <View style={styles.inviteRow}>
                    <View style={styles.codeBadge}>
                      <Ionicons name="key" size={14} color="#2563eb" />
                      <Text style={styles.codeBadgeText}>{player.inviteCode || 'BRAK'}</Text>
                    </View>

                    <View style={styles.linkStatuses}>
                      <View
                        style={[
                          styles.linkPill,
                          player.parentId || player.healthStatus === 'Zgoda papierowa RODO'
                            ? styles.linkPillOk
                            : styles.linkPillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.linkPillText,
                            player.parentId || player.healthStatus === 'Zgoda papierowa RODO'
                              ? { color: '#15803d' }
                              : { color: '#64748b' },
                          ]}
                        >
                          {player.parentId
                            ? '✅ Rodzic Online'
                            : player.healthStatus === 'Zgoda papierowa RODO'
                            ? '📄 Zgoda papierowa'
                            : '⏳ Oczekuje RODO'}
                        </Text>
                      </View>
                      <View style={[styles.linkPill, player.userId ? styles.linkPillOk : styles.linkPillPending]}>
                        <Text style={[styles.linkPillText, player.userId ? { color: '#15803d' } : { color: '#64748b' }]}>
                          {player.userId ? '✅ Gracz' : '⏳ Gracz'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.shareCodeBtn} onPress={() => handleShareInviteCode(player)}>
                      <Ionicons name="share-social-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {activeSubTab === 'statystyki' && (
                  <View style={styles.dynamicRow}>
                    <Text style={styles.dynText}>
                      {sportConfig.emoji} {sportConfig.primaryStatLabel}:{' '}
                      <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>{player.goals || 0}</Text>
                    </Text>
                    <Text style={styles.dynText}>
                      🎯 {sportConfig.secondaryStatLabel}:{' '}
                      <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{player.assists || 0}</Text>
                    </Text>
                    <Text style={styles.dynText}>
                      Frekwencja: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{attPercent}%</Text>
                    </Text>
                  </View>
                )}

                {activeSubTab === 'fizycznosc' && (
                  <View style={styles.dynamicRowBoxes}>
                    <View style={styles.box}>
                      <Text style={styles.boxLbl}>Wzrost</Text>
                      <Text style={styles.boxVal}>{player.height ? `${player.height} cm` : '-'}</Text>
                    </View>
                    <View style={styles.box}>
                      <Text style={styles.boxLbl}>Waga</Text>
                      <Text style={styles.boxVal}>{player.weight ? `${player.weight} kg` : '-'}</Text>
                    </View>
                    <View style={[styles.box, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Text style={styles.boxLbl}>BMI</Text>
                      <Text style={[styles.boxVal, { color: '#16a34a' }]}>{bmi || '-'}</Text>
                    </View>
                  </View>
                )}

                {activeSubTab === 'motoryka' && (() => {
                  const prog = analyzePlayerProgression(player);
                  return (
                    <View>
                      <View style={styles.dynamicRowBoxes}>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Sprint 30m</Text>
                          <Text style={styles.boxVal}>{player.sprint30m || '-'} s</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Skok</Text>
                          <Text style={styles.boxVal}>{player.jumpCm || '-'} cm</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Beep</Text>
                          <Text style={styles.boxVal}>{player.beepTest || '-'}</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Dystans</Text>
                          <Text style={styles.boxVal}>{(player.trainingsTotal || 0) * 2.5} km</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Kroki</Text>
                          <Text style={styles.boxVal}>{(player.trainingsTotal || 0) * 3200}</Text>
                        </View>
                        <View style={styles.box}>
                          <Text style={styles.boxLbl}>Aktywne min.</Text>
                          <Text style={styles.boxVal}>{(player.trainingsTotal || 0) * 75} min</Text>
                        </View>
                      </View>
                      {prog && (
                        <View
                          style={{
                            marginTop: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: prog.isProgress ? '#f0fdf4' : prog.isSame ? '#f8fafc' : '#fef2f2',
                            borderWidth: 1,
                            borderColor: prog.isProgress ? '#bbf7d0' : prog.isSame ? '#e2e8f0' : '#fecaca',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: prog.isProgress ? '#15803d' : prog.isSame ? '#475569' : '#dc2626' }}>
                            {prog.isProgress ? '📈 PROGRES:' : prog.isSame ? '➖ BEZ ZMIAN:' : '📉 REGRES:'} {prog.testName}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: prog.isProgress ? '#16a34a' : prog.isSame ? '#64748b' : '#dc2626' }}>
                            {prog.prevVal} ➔ {prog.latestVal} ({prog.pctChange > 0 ? `+${prog.pctChange}%` : `${prog.pctChange}%`})
                          </Text>
                        </View>
                      )}
                      {player.activeHomework && (
                        <View style={{ marginTop: 6, backgroundColor: '#eff6ff', padding: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="fitness-outline" size={14} color="#2563eb" />
                          <Text style={{ fontSize: 10, color: '#1e40af', fontWeight: 'bold', flex: 1 }}>
                            Aktywne Zadanie AI: {player.activeHomework.title} ({player.activeHomework.sets}x{player.activeHomework.repsOrSec} {player.activeHomework.unit}, przerwa {player.activeHomework.restSec}s)
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- MODAL: ZŁOTA KARTA ZAWODNIKA (FIFA STYLE + AWATAR) --- */}
      <Modal animationType="fade" transparent={true} visible={fifaCardVisible}>
        <View style={styles.fifaModalOverlay}>
          {selectedFifaPlayer && (
            <View style={styles.fifaCardContainer}>
              <View ref={fifaCardRef} style={styles.fifaCardInner} collapsable={false}>
                <View style={styles.fifaTopRow}>
                  <View style={styles.fifaRatingBox}>
                    <Text style={styles.fifaOverall}>{calculateOverallRating(selectedFifaPlayer)}</Text>
                    <Text style={styles.fifaPosition}>
                      {(selectedFifaPlayer.position || 'ZAW').substring(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.fifaPortrait}>
                    <Text style={{ fontSize: 64 }}>{getAvatarBadgeForXp(selectedFifaPlayer.xp || 300).emoji}</Text>
                  </View>
                </View>

                <Text style={styles.fifaName}>
                  {(selectedFifaPlayer.lastName || selectedFifaPlayer.firstName).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 10, color: '#38bdf8', textAlign: 'center', fontWeight: 'bold' }}>
                  {getAvatarBadgeForXp(selectedFifaPlayer.xp || 300).name} • {selectedFifaPlayer.xp || 300} XP
                </Text>
                <View style={styles.fifaDivider} />

                <View style={styles.fifaStatsGrid}>
                  <View style={styles.fifaStatColumn}>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).PAC}</Text> PAC
                    </Text>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).SHO}</Text> SHO
                    </Text>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).PAS}</Text> PAS
                    </Text>
                  </View>
                  <View style={styles.fifaStatColumn}>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).DRI}</Text> DRI
                    </Text>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).DEF}</Text> DEF
                    </Text>
                    <Text style={styles.fifaStatLine}>
                      <Text style={styles.fifaStatNum}>{getFifaStats(selectedFifaPlayer).PHY}</Text> PHY
                    </Text>
                  </View>
                </View>

                <View style={styles.fifaFooter}>
                  <Text style={styles.fifaFooterText}>SPORTSCLUB PRO</Text>
                </View>
              </View>

              <View style={{flexDirection: 'row', gap: 20, marginTop: 24}}>
                <TouchableOpacity onPress={shareFifaCardToSocials} style={{alignItems: 'center'}}>
                  <View style={{width: 44, height: 44, borderRadius: 22, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center'}}>
                    <Ionicons name="share-social" size={24} color="#fff" />
                  </View>
                  <Text style={{color: '#fff', fontSize: 10, marginTop: 4, fontWeight: 'bold'}}>Udostępnij</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setFifaCardVisible(false)} style={{alignItems: 'center'}}>
                  <Ionicons name="close-circle" size={44} color="#ef4444" />
                  <Text style={{color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: 'bold'}}>Zamknij</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* --- MODAL EDYCJI PROFILU + ZARZĄDZANIE KODEM RODO I ROZMIAREM STROJU --- */}
      <Modal animationType="slide" transparent={true} visible={profileModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Karta Zawodnika 👤</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedPlayer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.profileName}>
                  {selectedPlayer.firstName} {selectedPlayer.lastName || ''}
                </Text>
                <Text style={styles.profileMeta}>
                  Nr: #{selectedPlayer.number} | {selectedPlayer.position} | Rocznik {selectedPlayer.year}
                </Text>

                {/* SEKCJA KODU ZAPROSZENIA */}
                <View style={styles.modalInviteCard}>
                  <View>
                    <Text style={styles.modalInviteLabel}>KOD ZAPROSZENIA RODO</Text>
                    <Text style={styles.modalInviteCode}>{selectedPlayer.inviteCode || 'BRAK'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.modalShareBtn}
                      onPress={() => handleShareInviteCode(selectedPlayer)}
                    >
                      <Ionicons name="share-social-outline" size={16} color="#fff" />
                      <Text style={styles.modalShareBtnText}>Wyślij / Kopiuj</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalRegenBtn}
                      onPress={() => handleRegenerateCode(selectedPlayer)}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SZYBKIE PRZYPISANIE ROZMIARU STROJU (122 CM - XL) */}
                {kits.length > 0 && (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={styles.sectionHeading}>Rozmiar Stroju Klubowego (122 cm – XL)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {FULL_KIT_SIZES.map((sz) => {
                        const existingOrder = kits[0].orders.find(
                          (o) => String(o.playerId) === String(selectedPlayer.id)
                        );
                        const isSel = existingOrder?.size === sz;
                        return (
                          <TouchableOpacity
                            key={sz}
                            style={[styles.chipFilter, isSel && styles.chipFilterActive, { paddingVertical: 6, paddingHorizontal: 10 }]}
                            onPress={() => assignPlayerKitSize(kits[0].id, selectedPlayer, sz, existingOrder?.paid ?? false)}
                          >
                            <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{sz}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Text style={styles.sectionHeading}>Statystyki Sezonu</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statEditor}>
                    <Text style={styles.statNum}>{selectedPlayer.matchesPlayed || 0}</Text>
                    <Text style={styles.statLbl}>Mecze</Text>
                    <View style={styles.statBtns}>
                      <TouchableOpacity onPress={() => updatePlayerStat('matchesPlayed', -1)} style={styles.miniBtn}>
                        <Text>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('matchesPlayed', 1)} style={styles.miniBtn}>
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.statEditor}>
                    <Text style={[styles.statNum, { color: '#16a34a' }]}>{selectedPlayer.goals || 0}</Text>
                    <Text style={styles.statLbl}>{sportConfig.primaryStatLabel}</Text>
                    <View style={styles.statBtns}>
                      <TouchableOpacity onPress={() => updatePlayerStat('goals', -1)} style={styles.miniBtn}>
                        <Text>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('goals', 1)} style={styles.miniBtn}>
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.statEditor}>
                    <Text style={[styles.statNum, { color: '#2563eb' }]}>{selectedPlayer.assists || 0}</Text>
                    <Text style={styles.statLbl}>{sportConfig.secondaryStatLabel}</Text>
                    <View style={styles.statBtns}>
                      <TouchableOpacity onPress={() => updatePlayerStat('assists', -1)} style={styles.miniBtn}>
                        <Text>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => updatePlayerStat('assists', 1)} style={styles.miniBtn}>
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Rozwój Fizyczny & Zdrowie</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.healthBtn,
                      (selectedPlayer.injuryStatus === 'Zdrowy' || selectedPlayer.healthStatus === 'Zdrowy') &&
                        styles.healthBtnActiveG,
                    ]}
                    onPress={() => toggleHealthStatus('Zdrowy')}
                  >
                    <Text
                      style={[
                        selectedPlayer.injuryStatus === 'Zdrowy' || selectedPlayer.healthStatus === 'Zdrowy'
                          ? { color: '#fff', fontWeight: 'bold' }
                          : { color: '#64748b' },
                      ]}
                    >
                      W Pełni Zdrowy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.healthBtn,
                      (selectedPlayer.injuryStatus === 'Kontuzja' || selectedPlayer.healthStatus === 'Kontuzja') &&
                        styles.healthBtnActiveR,
                    ]}
                    onPress={() => toggleHealthStatus('Kontuzja')}
                  >
                    <Text
                      style={[
                        selectedPlayer.injuryStatus === 'Kontuzja' || selectedPlayer.healthStatus === 'Kontuzja'
                          ? { color: '#fff', fontWeight: 'bold' }
                          : { color: '#64748b' },
                      ]}
                    >
                      Kontuzja
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Wzrost (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editHeight}
                      onChangeText={setEditHeight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Waga (kg)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editWeight}
                      onChangeText={setEditWeight}
                    />
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Aktualne Rekordy Motoryczne</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Sprint (s)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editSprint}
                      onChangeText={setEditSprint}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Skok (cm)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={editJump}
                      onChangeText={setEditJump}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Beep</Text>
                    <TextInput style={styles.modalInput} value={editBeep} onChangeText={setEditBeep} />
                  </View>
                </View>

                {/* TABLICA STATYSTYCZNA PROGRESU / REGRESU ZAWODNIKA */}
                <Text style={styles.sectionHeading}>📊 Tablica Statystyczna Progresu (Motoryka & AI)</Text>
                <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  {(selectedPlayer.tests || []).length === 0 ? (
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 6 }}>
                      Brak zapisanych pomiarów w historii. Wprowadź wyniki przez przycisk „Testy” lub „Wykonaj z AI”, aby śledzić progres!
                    </Text>
                  ) : (
                    (selectedPlayer.tests || []).map((t, idx) => {
                      const olderSameTest = (selectedPlayer.tests || [])
                        .slice(idx + 1)
                        .find((oldItem) => oldItem.testName === t.testName);
                      let badgeText = 'NOWY POMIAR';
                      let badgeBg = '#e2e8f0';
                      let badgeColor = '#475569';

                      if (olderSameTest) {
                        const curVal = parseFloat(String(t.result).replace(',', '.'));
                        const oldVal = parseFloat(String(olderSameTest.result).replace(',', '.'));
                        if (!isNaN(curVal) && !isNaN(oldVal) && oldVal !== 0) {
                          const lowerBetter =
                            t.testName.toLowerCase().includes('bieg') || t.testName.toLowerCase().includes('sprint');
                          const delta = lowerBetter ? oldVal - curVal : curVal - oldVal;
                          const pct = Math.round((delta / oldVal) * 100);
                          if (delta > 0) {
                            badgeText = `📈 PROGRES +${pct}%`;
                            badgeBg = '#dcfce7';
                            badgeColor = '#15803d';
                          } else if (delta < 0) {
                            badgeText = `📉 REGRES ${pct}%`;
                            badgeBg = '#fee2e2';
                            badgeColor = '#dc2626';
                          } else {
                            badgeText = '➖ UTRZYMANIE';
                          }
                        }
                      }

                      return (
                        <View
                          key={`${t.testName}-${idx}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 7,
                            borderBottomWidth: idx < (selectedPlayer.tests || []).length - 1 ? 1 : 0,
                            borderBottomColor: '#e2e8f0',
                          }}
                        >
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{t.testName}</Text>
                            <Text style={{ fontSize: 10, color: '#64748b' }}>
                              📅 {t.date} {t.restSec !== undefined ? `• Przerwa: ${t.restSec}s` : ''}{' '}
                              {t.scorePercent !== undefined ? `• Technika AI: ${t.scorePercent}%` : ''}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 13, fontWeight: '900', color: '#2563eb' }}>{t.result}</Text>
                            <View style={{ backgroundColor: badgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 }}>
                              <Text style={{ fontSize: 9, fontWeight: 'bold', color: badgeColor }}>{badgeText}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>

                <Text style={styles.sectionHeading}>Notatka / Uwagi dla trenera</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  multiline
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="Wpisz uwagi o zawodniku..."
                />

                <TouchableOpacity style={styles.saveBtnFull} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnFullText}>Zapisz wszystkie zmiany w Karcie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 16, alignItems: 'center' }}
                  onPress={() => handleDeletePlayerPrompt(selectedPlayer)}
                >
                  <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>Usuń zawodnika z klubu</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODAL: DODAJ ZAWODNIKA (Z PRZEŁĄCZNIKIEM ZGODY PAPIEROWEJ RODO) --- */}
      <Modal animationType="slide" transparent={true} visible={addPlayerModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zaproś Nowego Zawodnika (RODO)</Text>
              <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Imię *</Text>
                <TextInput style={styles.modalInput} value={newFirstName} onChangeText={setNewFirstName} placeholder="np. Aleksander" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Nazwisko (opcjonalnie)</Text>
                <TextInput style={styles.modalInput} value={newLastName} onChangeText={setNewLastName} placeholder="np. Nicota" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Rocznik</Text>
                <TextInput style={styles.modalInput} value={newYear} onChangeText={setNewYear} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pozycja / Rola</Text>
                <TextInput style={styles.modalInput} value={newPosition} onChangeText={setNewPosition} />
              </View>
            </View>

            <View style={styles.paperConsentBox}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                  📄 Posiadam podpisaną Zgodę Papierową (RODO)
                </Text>
                <Text style={{ fontSize: 10, color: '#64748b' }}>
                  Aktywuje profil od razu (zanim rodzic zaloguje się 6-znakowym kodem)
                </Text>
              </View>
              <Switch value={paperConsentSigned} onValueChange={setPaperConsentSigned} />
            </View>

            <TouchableOpacity style={[styles.saveBtnFull, { marginTop: 14 }]} onPress={handleAddNewPlayer}>
              <Text style={styles.saveBtnFullText}>Stwórz Kartę i Wygeneruj Kod dla Rodzica</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: SZYBKI TEST MASOWY --- */}
      <Modal animationType="slide" transparent={true} visible={bulkTestModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '88%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Szybki Skaner Testów</Text>
              <TouchableOpacity onPress={() => setBulkTestModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Wybierz próbę motoryczną:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 45, marginBottom: 10 }}>
              {MOTORMETIC_TESTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.testTypeChip, activeTestType === t && styles.testTypeChipActive]}
                  onPress={() => setActiveTestType(t)}
                >
                  <Text style={[styles.testTypeChipText, activeTestType === t && styles.testTypeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Wpisz wynik i zjedź w dół. Zapiszemy wszystko jednym kliknięciem.
            </Text>

            <View style={styles.stopwatchContainer}>
              <View style={styles.stopwatchDisplay}>
                <Ionicons name="timer-outline" size={24} color="#38bdf8" />
                <Text style={styles.stopwatchTime}>{formatStopwatch(stopwatchMs)}</Text>
                <Text style={styles.stopwatchLabel}>s</Text>
              </View>
              <View style={styles.stopwatchActions}>
                <TouchableOpacity 
                  style={[styles.stopwatchBtn, stopwatchRunning ? styles.stopwatchBtnStop : styles.stopwatchBtnStart]} 
                  onPress={toggleStopwatch}
                >
                  <Ionicons name={stopwatchRunning ? "pause" : "play"} size={16} color="#fff" />
                  <Text style={styles.stopwatchBtnText}>{stopwatchRunning ? "Stop" : "Start"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopwatchBtnReset} onPress={resetStopwatch}>
                  <Ionicons name="refresh" size={16} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {filteredPlayers.map((p) => (
                <View key={p.id} style={styles.bulkRow}>
                  <Text style={styles.bulkPlayerName}>
                    #{p.number} {p.firstName} {p.lastName || ''}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#eff6ff',
                      borderWidth: 1,
                      borderColor: '#bfdbfe',
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderRadius: 6,
                      marginRight: 6,
                    }}
                    onPress={() =>
                      setBulkResults({
                        ...bulkResults,
                        [p.id]: formatStopwatch(stopwatchMs).replace(',', '.'),
                      })
                    }
                  >
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2563eb' }}>⏱️ Wstaw stoper</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.bulkInput}
                    placeholder="Wynik"
                    keyboardType="numeric"
                    value={bulkResults[p.id] || ''}
                    onChangeText={(val) => setBulkResults({ ...bulkResults, [p.id]: val })}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtnFull} onPress={handleSaveBulkResults}>
              <Text style={styles.saveBtnFullText}>Zapisz Wyniki całej grupy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addPlayerTopBtn: {
    backgroundColor: '#eff6ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addPlayerTopBtnText: { color: '#2563eb', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
  newEntryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newEntryBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
  },
  subTabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  subTabText: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  subTabTextActive: { color: '#2563eb', fontWeight: 'bold' },

  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a', padding: 0 },
  filterGroupLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', alignSelf: 'center', marginRight: 6 },
  chipFilter: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9', marginRight: 4 },
  chipFilterActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },

  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  emptyBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 18 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardMainRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },

  fifaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  fifaBtnText: { fontSize: 11, fontWeight: 'bold', color: '#d97706', marginLeft: 2 },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 5,
  },
  codeBadgeText: { fontSize: 13, fontWeight: '900', color: '#1e3a8a', letterSpacing: 1.5 },
  linkStatuses: { flexDirection: 'row', gap: 6 },
  linkPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  linkPillOk: { backgroundColor: '#dcfce7' },
  linkPillPending: { backgroundColor: '#f1f5f9' },
  linkPillText: { fontSize: 10, fontWeight: 'bold' },
  shareCodeBtn: {
    backgroundColor: '#2563eb',
    padding: 7,
    borderRadius: 8,
  },

  dynamicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dynText: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 4,
    minWidth: '30%',
    flexShrink: 1,
    textAlign: 'center',
  },
  dynamicRowBoxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  box: {
    width: '31%',
    minWidth: 75,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  boxLbl: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  boxVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 3,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  profileMeta: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 14 },

  modalInviteCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInviteLabel: { fontSize: 9, fontWeight: 'bold', color: '#2563eb' },
  modalInviteCode: { fontSize: 20, fontWeight: '900', color: '#1e3a8a', letterSpacing: 2, marginTop: 2 },
  modalShareBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  modalShareBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  modalRegenBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  paperConsentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
  },

  sectionHeading: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 14, marginBottom: 6, textTransform: 'uppercase' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statEditor: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statLbl: { fontSize: 10, color: '#64748b', marginTop: 2 },
  statBtns: { flexDirection: 'row', gap: 6, marginTop: 6 },
  miniBtn: { width: 24, height: 24, backgroundColor: '#e2e8f0', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },

  healthBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  healthBtnActiveG: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  healthBtnActiveR: { backgroundColor: '#dc2626', borderColor: '#dc2626' },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 6 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },

  saveBtnFull: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  saveBtnFullText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  testTypeChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    height: 32,
  },
  testTypeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  testTypeChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  testTypeChipTextActive: { color: '#fff', fontWeight: 'bold' },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bulkPlayerName: { fontSize: 12, fontWeight: '600', color: '#1e293b', flex: 1 },
  bulkInput: {
    width: 70,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: 'center',
    color: '#1e293b',
  },

  fifaModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  fifaCardContainer: { width: 280, height: 450, alignItems: 'center' },
  fifaCardInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#fbbf24',
    padding: 16,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  fifaTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 },
  fifaRatingBox: { alignItems: 'center' },
  fifaOverall: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fcd34d',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  fifaPosition: { fontSize: 18, fontWeight: 'bold', color: '#fbbf24', marginTop: -5 },
  fifaPortrait: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  fifaName: { fontSize: 22, fontWeight: '900', color: '#fbbf24', textAlign: 'center', marginTop: 8, letterSpacing: 1 },
  fifaDivider: { height: 2, backgroundColor: '#fbbf24', opacity: 0.5, marginVertical: 10 },
  fifaStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  fifaStatColumn: { flex: 1 },
  fifaStatLine: { fontSize: 16, color: '#fcd34d', fontWeight: 'bold', marginBottom: 6 },
  fifaStatNum: { fontSize: 18, fontWeight: '900', color: '#fff' },
  fifaFooter: {
    marginTop: 'auto',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 191, 36, 0.3)',
    paddingTop: 10,
  },
  fifaFooterText: { fontSize: 10, fontWeight: 'bold', color: '#fbbf24', letterSpacing: 2, opacity: 0.8 },
  fifaCloseBtn: { marginTop: 24 },

  stopwatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stopwatchDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stopwatchTime: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  stopwatchLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  stopwatchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  stopwatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  stopwatchBtnStart: {
    backgroundColor: '#16a34a',
  },
  stopwatchBtnStop: {
    backgroundColor: '#dc2626',
  },
  stopwatchBtnReset: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  stopwatchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});