import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import {
  useClubSettings,
  SportDiscipline,
  SportCategory,
} from '../components/ClubSettingsContext';
import { usePlayers, HomeworkPrescription } from '../components/PlayersContext';
import MediaPipePoseScanner from '../components/MediaPipePoseScanner';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type ModuleCategory = 'Wszystkie' | 'Skoczność' | 'Zwinność' | 'Dynamiczne' | 'Statyczne' | 'Rozciągające';

interface VaultExercise {
  id: string;
  title: string;
  drillType: string;
  module: Exclude<ModuleCategory, 'Wszystkie'>;
  defaultSets: number;
  defaultRepsOrSec: number;
  unit: 'powt.' | 'sek.';
  defaultRestSec: number;
  xpPerSet: number;
  recommendedSports: SportDiscipline[];
  description: string;
}

const EXERCISE_VAULT: VaultExercise[] = [
  {
    id: 'ex-1',
    title: 'Wyskoki eksplozywne (Główka / Blok / Zbiórka)',
    drillType: 'jump_squat',
    module: 'Skoczność',
    defaultSets: 3,
    defaultRepsOrSec: 10,
    unit: 'powt.',
    defaultRestSec: 30,
    xpPerSet: 35,
    recommendedSports: ['football', 'volleyball', 'basketball', 'handball'],
    description: 'Zejdź poniżej kąta 135° w stawach kolanowych i wykonaj dynamiczny wyskok w górę.',
  },
  {
    id: 'ex-2',
    title: 'Deska (Plank) - Stabilizacja głęboka Core',
    drillType: 'plank',
    module: 'Statyczne',
    defaultSets: 3,
    defaultRepsOrSec: 45,
    unit: 'sek.',
    defaultRestSec: 30,
    xpPerSet: 40,
    recommendedSports: ['football', 'swimming', 'gym', 'cycling', 'running'],
    description: 'Utrzymaj prostą linię tułowia (barki-biodra-kostki) przez zadany czas.',
  },
  {
    id: 'ex-3',
    title: 'Pompki klasyczne z kontrolą symetrii',
    drillType: 'pushups',
    module: 'Dynamiczne',
    defaultSets: 3,
    defaultRepsOrSec: 15,
    unit: 'powt.',
    defaultRestSec: 45,
    xpPerSet: 35,
    recommendedSports: ['martial_arts', 'gym', 'handball', 'swimming'],
    description: 'Ugnij stawy łokciowe poniżej 115° z zachowaniem równej pracy prawej i lewej strony.',
  },
  {
    id: 'ex-4',
    title: 'Przeskoki boczne (Łyżwiarz / Split-Step)',
    drillType: 'agility_skater',
    module: 'Zwinność',
    defaultSets: 4,
    defaultRepsOrSec: 16,
    unit: 'powt.',
    defaultRestSec: 30,
    xpPerSet: 30,
    recommendedSports: ['tennis', 'basketball', 'football', 'handball', 'martial_arts'],
    description: 'Szybkie zmiany kierunku z kontrolą osi kolana przy lądowaniu.',
  },
  {
    id: 'ex-5',
    title: 'Mobilizacja bioder i prewencja urazów',
    drillType: 'mobility_stretch',
    module: 'Rozciągające',
    defaultSets: 2,
    defaultRepsOrSec: 10,
    unit: 'powt.',
    defaultRestSec: 20,
    xpPerSet: 40,
    recommendedSports: ['running', 'nordic_walking', 'cycling', 'football', 'volleyball'],
    description: 'Kontrolowane zejścia rozciągające grupę kulszowo-goleniową i obręcz biodrową.',
  },
];

export default function ZadaniaDomoweScreen() {
  const { sport, setSport, sportConfig, allSports } = useClubSettings();
  const { players, availableYears, updatePlayer } = usePlayers();

  const [selectedSportCategory, setSelectedSportCategory] = useState<SportCategory | 'Wszystkie'>('Wszystkie');
  const [selectedModule, setSelectedModule] = useState<ModuleCategory>('Wszystkie');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('Wszyscy');
  const [requireWarmupBumper, setRequireWarmupBumper] = useState<boolean>(true);

  // Elastyczna konfiguracja serii, powtórzeń/sekund i przerw dla każdego ćwiczenia
  const [exerciseConfigs, setExerciseConfigs] = useState<
    Record<string, { sets: string; repsOrSec: string; restSec: string }>
  >(() => {
    const init: Record<string, { sets: string; repsOrSec: string; restSec: string }> = {};
    EXERCISE_VAULT.forEach((ex) => {
      init[ex.id] = {
        sets: String(ex.defaultSets),
        repsOrSec: String(ex.defaultRepsOrSec),
        restSec: String(ex.defaultRestSec),
      };
    });
    return init;
  });

  // Stany dla modalu Skanera AI z obsługą wielu serii i timera przerwy
  const [previewExercise, setPreviewExercise] = useState<VaultExercise | null>(null);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [activeSetNumber, setActiveSetNumber] = useState<number>(1);
  const [totalSetsCount, setTotalSetsCount] = useState<number>(3);
  const [targetRepsForSet, setTargetRepsForSet] = useState<number>(10);
  const [configuredRestSeconds, setConfiguredRestSeconds] = useState<number>(30);
  const [isRestingBetweenSets, setIsRestingBetweenSets] = useState<boolean>(false);
  const [restCountdown, setRestCountdown] = useState<number>(0);
  const [selectedTestPlayerId, setSelectedTestPlayerId] = useState<string>('');

  useEffect(() => {
    if (!isRestingBetweenSets) return;
    if (restCountdown <= 0) {
      setIsRestingBetweenSets(false);
      setActiveSetNumber((prev) => prev + 1);
      return;
    }
    const timer = setTimeout(() => {
      setRestCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isRestingBetweenSets, restCountdown]);

  const updateExConfig = (exId: string, field: 'sets' | 'repsOrSec' | 'restSec', value: string) => {
    setExerciseConfigs((prev) => ({
      ...prev,
      [exId]: {
        ...(prev[exId] || { sets: '3', repsOrSec: '10', restSec: '30' }),
        [field]: value,
      },
    }));
  };

  const adjustExConfig = (exId: string, field: 'sets' | 'repsOrSec' | 'restSec', delta: number, minVal: number = 1) => {
    const current = parseInt(exerciseConfigs[exId]?.[field] || '1', 10) || minVal;
    const nextVal = Math.max(minVal, current + delta);
    updateExConfig(exId, field, String(nextVal));
  };

  const applyQuickProgressionPreset = (ex: VaultExercise, level: 'start' | 'progres' | 'elite') => {
    if (level === 'start') {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '3', repsOrSec: String(ex.defaultRepsOrSec), restSec: '45' },
      }));
    } else if (level === 'progres') {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '4', repsOrSec: String(Math.round(ex.defaultRepsOrSec * 1.5)), restSec: '30' },
      }));
    } else {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '5', repsOrSec: String(ex.defaultRepsOrSec * 2), restSec: '20' },
      }));
    }
  };

  const filteredSports = useMemo(() => {
    if (selectedSportCategory === 'Wszystkie') return allSports;
    return allSports.filter((s) => s.category === selectedSportCategory);
  }, [allSports, selectedSportCategory]);

  const filteredExercises = useMemo(() => {
    return EXERCISE_VAULT.filter((ex) => {
      if (selectedModule !== 'Wszystkie' && ex.module !== selectedModule) return false;
      return true;
    }).sort((a, b) => {
      const aMatch = a.recommendedSports.includes(sport) ? 1 : 0;
      const bMatch = b.recommendedSports.includes(sport) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [selectedModule, sport]);

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleAssignToTeam = (ex: VaultExercise) => {
    const cfg = exerciseConfigs[ex.id] || {
      sets: String(ex.defaultSets),
      repsOrSec: String(ex.defaultRepsOrSec),
      restSec: String(ex.defaultRestSec),
    };
    const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
    const repsNum = Math.max(1, parseInt(cfg.repsOrSec, 10) || ex.defaultRepsOrSec);
    const restNum = Math.max(0, parseInt(cfg.restSec, 10) || ex.defaultRestSec);
    const totalXp = setsNum * ex.xpPerSet;

    const targetPlayers =
      selectedYearFilter === 'Wszyscy'
        ? players
        : players.filter((p) => String(p.year) === String(selectedYearFilter));

    const prescription: HomeworkPrescription = {
      exerciseId: ex.id,
      title: ex.title,
      drillType: ex.drillType,
      sets: setsNum,
      repsOrSec: repsNum,
      unit: ex.unit,
      restSec: restNum,
      xpReward: totalXp,
      requireWarmup: requireWarmupBumper,
      assignedAt: new Date().toLocaleDateString('pl-PL'),
    };

    targetPlayers.forEach((p) => {
      updatePlayer(p.id, { activeHomework: prescription });
    });

    showNotice(
      'Zadanie AI z Progresją Wysłane! 🚀',
      `Ćwiczenie: ${ex.title}\n` +
        `Plan: ${setsNum} serii x ${repsNum} ${ex.unit} (przerwa: ${restNum}s)\n` +
        `Nagroda za całość: +${totalXp} XP\n` +
        `Odbiorcy (${selectedYearFilter === 'Wszyscy' ? 'Cała Kadra' : `Rocznik ${selectedYearFilter}`}): ${targetPlayers.length} zawodników\n` +
        `Wymóg 3-min rozgrzewki: ${requireWarmupBumper ? 'WŁĄCZONY 🛡️' : 'Wyłączony'}`
    );
  };

  const handleStartTestScanner = (ex: VaultExercise) => {
    const cfg = exerciseConfigs[ex.id] || {
      sets: String(ex.defaultSets),
      repsOrSec: String(ex.defaultRepsOrSec),
      restSec: String(ex.defaultRestSec),
    };
    const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
    const repsNum = Math.max(1, parseInt(cfg.repsOrSec, 10) || ex.defaultRepsOrSec);
    const restNum = Math.max(0, parseInt(cfg.restSec, 10) || ex.defaultRestSec);

    setPreviewExercise(ex);
    setActiveSetNumber(1);
    setTotalSetsCount(setsNum);
    setTargetRepsForSet(repsNum);
    setConfiguredRestSeconds(restNum);
    setIsRestingBetweenSets(false);
    if (!selectedTestPlayerId && players.length > 0) {
      setSelectedTestPlayerId(String(players[0].id));
    }
    setScannerVisible(true);
  };

  const handleSetCompletedInScanner = (metrics: { reps: number; score: number; asymmetryIndex: number }) => {
    if (!previewExercise) return;

    if (activeSetNumber < totalSetsCount) {
      if (configuredRestSeconds > 0) {
        setRestCountdown(configuredRestSeconds);
        setIsRestingBetweenSets(true);
      } else {
        setActiveSetNumber((prev) => prev + 1);
      }
      return;
    }

    // Wszystkie serie ukończone -> zapisujemy wynik w historii testów zawodnika (do Tablicy Progresu!)
    setScannerVisible(false);
    const totalXp = totalSetsCount * previewExercise.xpPerSet;
    const targetPlayer = players.find((p) => String(p.id) === String(selectedTestPlayerId)) || players[0];

    if (targetPlayer) {
      const totalVolume = totalSetsCount * targetRepsForSet;
      const newEntry = {
        testName: `AI: ${previewExercise.title.split('(')[0].trim()}`,
        result: `${totalVolume} ${previewExercise.unit} (${totalSetsCount}x${targetRepsForSet})`,
        date: new Date().toLocaleDateString('pl-PL'),
        sets: totalSetsCount,
        repsOrSec: targetRepsForSet,
        restSec: configuredRestSeconds,
        scorePercent: metrics.score,
      };
      updatePlayer(targetPlayer.id, {
        tests: [newEntry, ...(targetPlayer.tests || [])],
        xp: (targetPlayer.xp || 300) + totalXp,
      });
    }

    showNotice(
      'Wszystkie Serie Ukończone! 🏆',
      `Wykonano: ${totalSetsCount} serii x ${targetRepsForSet} ${previewExercise.unit}\n` +
        `Ocena Techniki AI: ${metrics.score}% | Asymetria: ${metrics.asymmetryIndex}%\n` +
        (targetPlayer
          ? `Zapisano w Tablicy Progresu gracza ${targetPlayer.firstName} (+${totalXp} XP)!`
          : '')
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Wyzwania AI & Progresja Treningowa 🧬</Text>
          <Text style={styles.headerSubtitle}>
            Konfiguruj serie, powtórzenia/czas i przerwy oraz monitoruj postępy graczy
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. WYBÓR I FILTROWANIE DYSCYPLINY SPORTOWEJ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Aktywna Dyscyplina: {sportConfig.emoji} {sportConfig.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {(['Wszystkie', 'Zespołowe', 'Indywidualne i Siłowe', 'Biegowe i Rekreacyjne (GPS)'] as const).map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedSportCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedSportCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedSportCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredSports.map((sp) => {
              const isCurrent = sp.id === sport;
              return (
                <TouchableOpacity
                  key={sp.id}
                  style={[styles.sportCard, isCurrent && styles.sportCardActive]}
                  onPress={() => setSport(sp.id)}
                >
                  <Text style={{ fontSize: 20 }}>{sp.emoji}</Text>
                  <Text style={[styles.sportCardName, isCurrent && { color: '#2563eb', fontWeight: 'bold' }]}>
                    {sp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. BEZPIECZEŃSTWO ZDROWOTNE I FILTR ROCZNIKA DO WYSYŁKI */}
        <View style={styles.card}>
          <View style={styles.warmupRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#b45309' }}>
                🛡️ Obowiązkowa Rozgrzewka i Klauzula Zdrowotna
              </Text>
              <Text style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
                Przed włączeniem kamery dziecko i rodzic muszą zatwierdzić 3-minutową rozgrzewkę
              </Text>
            </View>
            <Switch value={requireWarmupBumper} onValueChange={setRequireWarmupBumper} />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Odbiorcy zadań domowych (Rocznik):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['Wszyscy', '2012', '2013', '2014', '2015', '2016', ...availableYears]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearPill, selectedYearFilter === yr && styles.yearPillActive]}
                  onPress={() => setSelectedYearFilter(yr)}
                >
                  <Text
                    style={[
                      styles.yearPillText,
                      selectedYearFilter === yr && { color: '#fff', fontWeight: 'bold' },
                    ]}
                  >
                    {yr === 'Wszyscy' ? `Cała kadra (${players.length})` : `Rocznik ${yr}`}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* 3. MODUŁY MOTORYCZNE */}
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>2. Wybierz Moduł Motoryczny:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(['Wszystkie', 'Skoczność', 'Zwinność', 'Dynamiczne', 'Statyczne', 'Rozciągające'] as ModuleCategory[]).map(
            (mod) => (
              <TouchableOpacity
                key={mod}
                style={[styles.modPill, selectedModule === mod && styles.modPillActive]}
                onPress={() => setSelectedModule(mod)}
              >
                <Text style={[styles.modPillText, selectedModule === mod && { color: '#fff' }]}>{mod}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* LISTA ĆWICZEŃ ZE SKARBNICY Z KREATOREM SERII / POWTÓRZEŃ / PRZERW */}
        {filteredExercises.map((ex) => {
          const isRec = ex.recommendedSports.includes(sport);
          const cfg = exerciseConfigs[ex.id] || {
            sets: String(ex.defaultSets),
            repsOrSec: String(ex.defaultRepsOrSec),
            restSec: String(ex.defaultRestSec),
          };
          const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
          const totalXp = setsNum * ex.xpPerSet;

          return (
            <View key={ex.id} style={[styles.exerciseCard, isRec && styles.exerciseCardRec]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <View style={styles.modBadge}>
                    <Text style={styles.modBadgeText}>MODUŁ: {ex.module.toUpperCase()}</Text>
                  </View>
                  {isRec && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>⭐ POLECANE DLA: {sportConfig.name.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.xpText}>+{totalXp} XP</Text>
              </View>

              <Text style={styles.exTitle}>{ex.title}</Text>
              <Text style={styles.exDesc}>{ex.description}</Text>

              {/* ELASTYCZNY KREATOR PARAMETRÓW ĆWICZENIA (SERIE, POWTÓRZENIA/SEKUNDY, PRZERWA) */}
              <View style={styles.prescriptionBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.prescriptionTitle}>⚙️ Konfiguracja Obciążenia (Periodyzacja):</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={styles.presetMiniChip} onPress={() => applyQuickProgressionPreset(ex, 'start')}>
                      <Text style={styles.presetMiniText}>Tydz. 1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.presetMiniChip} onPress={() => applyQuickProgressionPreset(ex, 'progres')}>
                      <Text style={styles.presetMiniText}>+Progres</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.presetMiniChip, { backgroundColor: '#dbeafe' }]} onPress={() => applyQuickProgressionPreset(ex, 'elite')}>
                      <Text style={[styles.presetMiniText, { color: '#1d4ed8' }]}>🔥 Miesiąc +1</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.prescriptionInputsRow}>
                  {/* LICZBA SERII */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>SERIE</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'sets', -1, 1)}>
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.sets}
                        onChangeText={(v) => updateExConfig(ex.id, 'sets', v)}
                      />
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'sets', 1, 1)}>
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* POWTÓRZENIA LUB SEKUNDY */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>{ex.unit === 'sek.' ? 'CZAS (SEK.)' : 'POWTÓRZENIA'}</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustExConfig(ex.id, 'repsOrSec', ex.unit === 'sek.' ? -5 : -2, 1)}
                      >
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.repsOrSec}
                        onChangeText={(v) => updateExConfig(ex.id, 'repsOrSec', v)}
                      />
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustExConfig(ex.id, 'repsOrSec', ex.unit === 'sek.' ? 5 : 2, 1)}
                      >
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* PRZERWA MIĘDZY SERIAMI */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>PRZERWA (S)</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'restSec', -5, 0)}>
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.restSec}
                        onChangeText={(v) => updateExConfig(ex.id, 'restSec', v)}
                      />
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'restSec', 5, 0)}>
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.prescriptionSummaryText}>
                  📋 Podsumowanie zadania: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{cfg.sets || 1} serie x {cfg.repsOrSec || 1} {ex.unit}</Text> • Przerwa między seriami: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{cfg.restSec || 0} sek.</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => handleAssignToTeam(ex)}
                >
                  <Ionicons name="paper-plane-outline" size={15} color="#fff" />
                  <Text style={styles.assignBtnText}>Zadaj ({cfg.sets}x{cfg.repsOrSec} {ex.unit})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testScannerBtn}
                  onPress={() => handleStartTestScanner(ex)}
                >
                  <Ionicons name="videocam-outline" size={16} color="#2563eb" />
                  <Text style={styles.testScannerBtnText}>Wykonaj z AI</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL SKANERA AI Z OBSŁUGĄ WIELU SERII I TIMERA PRZERWY */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
          <View style={styles.scannerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                {previewExercise?.title}
              </Text>
              <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                Seria {activeSetNumber} z {totalSetsCount} • Cel: {targetRepsForSet} {previewExercise?.unit} • Przerwa: {configuredRestSeconds}s
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setScannerVisible(false)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Wybór zawodnika, któremu zapiszemy wykonanie do Tablicy Progresu */}
          {players.length > 0 && (
            <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 14, paddingBottom: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>Zawodnik:</Text>
                {players.map((p) => {
                  const isSel = String(p.id) === String(selectedTestPlayerId);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1e293b' },
                        isSel && { backgroundColor: '#2563eb' },
                      ]}
                      onPress={() => setSelectedTestPlayerId(String(p.id))}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: isSel ? 'bold' : 'normal' }}>
                        {p.firstName} {p.lastName || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ flex: 1 }}>
            {previewExercise && (
              <>
                <View style={styles.demoVideoContainer}>
                  <Video
                    style={{ width: '100%', height: 100 }}
                    source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay
                    isMuted
                  />
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
                    Krótki filmik instruktażowy
                  </Text>
                </View>

                {isRestingBetweenSets ? (
                  <View style={styles.restOverlayBox}>
                    <Ionicons name="timer-outline" size={56} color="#38bdf8" />
                    <Text style={styles.restTitle}>Przerwa między seriami</Text>
                    <Text style={styles.restSub}>
                      Ukończono serię {activeSetNumber} z {totalSetsCount}. Przygotuj się do kolejnej serii!
                    </Text>
                    <Text style={styles.restTimerDigits}>{restCountdown} s</Text>
                    <TouchableOpacity
                      style={styles.skipRestBtn}
                      onPress={() => {
                        setIsRestingBetweenSets(false);
                        setActiveSetNumber((prev) => prev + 1);
                      }}
                    >
                      <Ionicons name="play-skip-forward" size={16} color="#fff" />
                      <Text style={styles.skipRestBtnText}>Pomiń przerwę i zacznij serię {activeSetNumber + 1}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MediaPipePoseScanner
                    key={`set-${activeSetNumber}`}
                    facing="front"
                    targetReps={targetRepsForSet}
                    drillType={previewExercise.drillType}
                    isHandheld={false}
                    onComplete={handleSetCompletedInScanner}
                  />
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catChipActive: { backgroundColor: '#0f172a' },
  catChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  catChipTextActive: { color: '#fff' },
  sportCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 95,
  },
  sportCardActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb', borderWidth: 1.5 },
  sportCardName: { fontSize: 11, color: '#334155', marginTop: 4, textAlign: 'center' },
  warmupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  yearPillActive: { backgroundColor: '#2563eb' },
  yearPillText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  modPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  modPillActive: { backgroundColor: '#2563eb' },
  modPillText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exerciseCardRec: { borderColor: '#60a5fa', borderWidth: 1.5 },
  modBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#2563eb' },
  recBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#854d0e' },
  xpText: { fontSize: 13, fontWeight: '900', color: '#16a34a' },
  exTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  exDesc: { fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 17 },

  prescriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prescriptionTitle: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  presetMiniChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetMiniText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  prescriptionInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paramCol: { flex: 1, alignItems: 'center' },
  paramLabel: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 26,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnTxt: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  paramInput: {
    width: 42,
    height: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    padding: 0,
  },
  prescriptionSummaryText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },

  assignBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  assignBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  testScannerBtn: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 5,
  },
  testScannerBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0f172a',
  },
  demoVideoContainer: {
    backgroundColor: '#1e293b',
    height: 118,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restOverlayBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  restSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6 },
  restTimerDigits: {
    fontSize: 56,
    fontWeight: '900',
    color: '#38bdf8',
    marginVertical: 20,
    fontVariant: ['tabular-nums'],
  },
  skipRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  skipRestBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
