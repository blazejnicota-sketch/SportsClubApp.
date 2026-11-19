import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useClubSettings } from '../components/ClubSettingsContext';
import {
  usePlayers,
  AttendanceStatus,
  IndividualSessionItem,
  KitItem,
  FULL_KIT_SIZES,
  formatDateLocal,
  parseLocalDate,
  isEventOnDateHelper,
} from '../components/PlayersContext';
import { notificationService } from '../services/notificationService';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];
const SHORT_WEEK_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

type MainSubTab = 'pulpit' | '1on1' | 'testy' | 'stroje' | 'finanse' | 'kadra' | 'ustawienia';

type MotorTestUnit = 's' | 'cm' | 'm' | 'powt.' | 'pkt';

interface MotorTestDef {
  id: string;
  name: string;
  unit: MotorTestUnit;
  betterDirection: 'lower' | 'higher'; // lower = mniej lepiej (np. sprint), higher = więcej lepiej (np. skok)
  useStopwatch: boolean;
  icon: string;
  isCustom?: boolean;
}

const DEFAULT_MOTOR_TESTS: MotorTestDef[] = [
  { id: 'sprint10', name: 'Sprint 10m', unit: 's', betterDirection: 'lower', useStopwatch: true, icon: '⚡' },
  { id: 'sprint30', name: 'Sprint 30m', unit: 's', betterDirection: 'lower', useStopwatch: true, icon: '🏃' },
  { id: 'beep', name: 'Beep Test', unit: 'pkt', betterDirection: 'higher', useStopwatch: false, icon: '🫀' },
  { id: 'jump', name: 'Skok w dal z miejsca', unit: 'cm', betterDirection: 'higher', useStopwatch: false, icon: '🦘' },
  { id: 'run100', name: 'Bieg 100m', unit: 's', betterDirection: 'lower', useStopwatch: true, icon: '⏱️' },
];

// Inteligentna normalizacja liczb: zamienia przecinek na kropkę, usuwa spacje i jednostki (np. "3,76 s" -> 3.76)
const parseNumericInput = (raw: string): number | null => {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  if (!cleaned || cleaned === '.' || cleaned === '-') return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};
type CoachWorkMode = 'both' | 'individual_only';

const AI_HOMEWORK_EXERCISES = [
  { id: 'plank', title: 'Deska (Plank) - Stabilizacja Core', category: 'Statyczne', unit: 'sek.', defaultSets: 3, defaultReps: 45, defaultRest: 30, xpPerSet: 25 },
  { id: 'pushups', title: 'Pompki klasyczne (MediaPipe)', category: 'Dynamiczne', unit: 'powt.', defaultSets: 3, defaultReps: 15, defaultRest: 45, xpPerSet: 30 },
  { id: 'squat_jump', title: 'Wyskoki z przysiadu (Plyometria)', category: 'Skoczność', unit: 'powt.', defaultSets: 5, defaultReps: 10, defaultRest: 30, xpPerSet: 25 },
  { id: 'agility_skater', title: 'Przeskoki boczne (Łyżwiarz)', category: 'Zwinność', unit: 'sek.', defaultSets: 3, defaultReps: 20, defaultRest: 30, xpPerSet: 25 },
  { id: 'mobility_hips', title: 'Mobilizacja bioder i dwugłowych', category: 'Rozciągające', unit: 'powt.', defaultSets: 2, defaultReps: 12, defaultRest: 20, xpPerSet: 20 },
];

const QUICK_TRAINING_GOALS = [
  '⚡ Szybkość i zwrotność',
  '⚽ Technika użytkowa',
  '🔥 Gra 1v1 i drybling',
  '🎯 Finalizacja i strzały',
  '💪 Motoryka i stabilizacja Core',
];

export default function PanelTrenera() {
  const router = useRouter();
  const { plan, sportConfig, features, toggleFeature } = useClubSettings();

  const {
    players,
    availableYears,
    loading,
    addPlayer,
    updatePlayer,
    events,
    liveEvents,
    updateEventAttendance,
    updateEventAttendanceBatch,
    individualSessions,
    setIndividualSessions,
    liveIndividualSessions,
    markIndividualSessionCompleted,
    kits,
    setKits,
    assignPlayerKitSize,
    togglePlayerKitPaid,
  } = usePlayers();

  const [coachWorkMode, setCoachWorkMode] = useState<CoachWorkMode>('both');
  const [activeTab, setActiveTab] = useState<MainSubTab>('pulpit');
  const [simulateLiveMode, setSimulateLiveMode] = useState<boolean>(false);

  // Stany formularza 1-on-1 / Małe Grupy
  const [sessionMode, setSessionMode] = useState<'1-on-1' | 'Grupa'>('1-on-1');
  const [selectedSessionPlayerIds, setSelectedSessionPlayerIds] = useState<string[]>([]);
  const [customExternalPlayerName, setCustomExternalPlayerName] = useState<string>('');
  const [sessionDateObj, setSessionDateObj] = useState<Date>(new Date());
  const [calMonthDate, setCalMonthDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const calYear = calMonthDate.getFullYear();
  const calMonth = calMonthDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayRaw = new Date(calYear, calMonth, 1).getDay();
  const firstDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const [sessionStartObj, setSessionStartObj] = useState<Date>(new Date(new Date().setHours(16, 0, 0, 0)));
  const [sessionEndObj, setSessionEndObj] = useState<Date>(new Date(new Date().setHours(17, 0, 0, 0)));
  const [showSessionDatePicker, setShowSessionDatePicker] = useState<boolean>(false);
  const [showSessionStartPicker, setShowSessionStartPicker] = useState<boolean>(false);
  const [showSessionEndPicker, setShowSessionEndPicker] = useState<boolean>(false);

  const sessionDate = formatDateLocal(sessionDateObj);
  const sessionStartTime = `${String(sessionStartObj.getHours()).padStart(2, '0')}:${String(sessionStartObj.getMinutes()).padStart(2, '0')}`;
  const sessionEndTime = `${String(sessionEndObj.getHours()).padStart(2, '0')}:${String(sessionEndObj.getMinutes()).padStart(2, '0')}`;

  
  
  
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionRecurring, setSessionRecurring] = useState<boolean>(false);

  // Modal przypisywania Zadania Domowego AI (z konfiguracją serii, powtórzeń/czasu i przerw)
  const [homeworkModalVisible, setHomeworkModalVisible] = useState<boolean>(false);
  const [homeworkTargetSession, setHomeworkTargetSession] = useState<IndividualSessionItem | null>(null);
  const [includeWarmupRequirement, setIncludeWarmupRequirement] = useState<boolean>(true);
  const [hwSets, setHwSets] = useState<string>('5');
  const [hwRepsOrSec, setHwRepsOrSec] = useState<string>('10');
  const [hwRestSec, setHwRestSec] = useState<string>('30');

  // Stany dla modalu dodawania zawodnika (z architekturą RODO / Zgoda papierowa)
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState<boolean>(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newNumber, setNewNumber] = useState('10');
  const [newPosition, setNewPosition] = useState(sportConfig?.positions?.[0] || 'Pomocnik');
  const [newYear, setNewYear] = useState('2014');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [paperConsentSigned, setPaperConsentSigned] = useState<boolean>(false);
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Stany dla modułu Stroje (zdjęcia, tabela rozmiarów 122cm - XL, przypisanie do zawodnika i 1-klik raport)
  const [newPhotoInputs, setNewPhotoInputs] = useState<Record<string, string>>({});
  const [sizeChartInputs, setSizeChartInputs] = useState<Record<string, string>>({});
  const [kitYearFilter, setKitYearFilter] = useState<string>('Wszyscy');
  const [kitSortByYear, setKitSortByYear] = useState<'asc' | 'desc'>('asc');
  const [selectedKitRecipients, setSelectedKitRecipients] = useState<string[]>([]);
  const [newKitName, setNewKitName] = useState<string>('');
  const [newKitPrice, setNewKitPrice] = useState<string>('');

  // Stany dla Modułu Testów Motorycznych (+ Własny test + Normalizacja przecinka/kropki)
  const [motorTests, setMotorTests] = useState<MotorTestDef[]>(DEFAULT_MOTOR_TESTS);
  const [customTestModalVisible, setCustomTestModalVisible] = useState<boolean>(false);
  const [ctName, setCtName] = useState<string>('');
  const [ctUnit, setCtUnit] = useState<MotorTestUnit>('s');
  const [ctDirection, setCtDirection] = useState<'lower' | 'higher'>('lower');
  const [ctUseStopwatch, setCtUseStopwatch] = useState<boolean>(true);

  const [activeMotorTest, setActiveMotorTest] = useState<MotorTestDef | null>(null);
  const [testTargetPlayerId, setTestTargetPlayerId] = useState<string>('');
  const [testRawValue, setTestRawValue] = useState<string>('');
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [swMs, setSwMs] = useState<number>(0);

  // Stan eksportu Excel / PDF
  const [exportingReport, setExportingReport] = useState<boolean>(false);

  React.useEffect(() => {
    if (!swRunning) return;
    const start = Date.now() - swMs;
    const interval = setInterval(() => {
      setSwMs(Date.now() - start);
    }, 50);
    return () => clearInterval(interval);
  }, [swRunning]);

  // Modal podglądu gotowego raportu zamówienia dla hurtowni
  const [orderReportModalVisible, setOrderReportModalVisible] = useState<boolean>(false);
  const [generatedOrderReportText, setGeneratedOrderReportText] = useState<string>('');

  const yearOptions = useMemo(() => {
    const baseYears = ['2012', '2013', '2014', '2015', '2016'];
    const merged = Array.from(new Set([...baseYears, ...availableYears])).sort((a, b) =>
      kitSortByYear === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
    return ['Wszyscy', ...merged];
  }, [availableYears, kitSortByYear]);

  const filteredKitPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (kitYearFilter === 'Wszyscy') return true;
        return String(p.year) === String(kitYearFilter);
      })
      .sort((a, b) => {
        const yA = String(a.year || '');
        const yB = String(b.year || '');
        if (yA !== yB) {
          return kitSortByYear === 'asc' ? yA.localeCompare(yB) : yB.localeCompare(yA);
        }
        return (a.firstName || '').localeCompare(b.firstName || '');
      });
  }, [players, kitYearFilter, kitSortByYear]);

  const activeTeamLiveEvents = useMemo(() => {
    if (coachWorkMode === 'individual_only') return [];
    if (simulateLiveMode && liveEvents.length === 0 && events.length > 0) {
      return [events[0]];
    }
    return liveEvents;
  }, [coachWorkMode, simulateLiveMode, liveEvents, events]);

  const activeIndividualLiveSessions = useMemo(() => {
    if (simulateLiveMode && liveIndividualSessions.length === 0 && individualSessions.length > 0) {
      return [individualSessions[0]];
    }
    return liveIndividualSessions;
  }, [simulateLiveMode, liveIndividualSessions, individualSessions]);

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const togglePlayerForSession = (playerId: string) => {
    if (sessionMode === '1-on-1') {
      setSelectedSessionPlayerIds([playerId]);
    } else {
      setSelectedSessionPlayerIds((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const handleSaveIndividualSession = () => {
    const selectedNames = players
      .filter((p) => selectedSessionPlayerIds.includes(String(p.id)))
      .map((p) => `${p.firstName} ${p.lastName || ''}`.trim());



    if (selectedNames.length === 0) {
      showNotice('Brak zawodnika', 'Wybierz zawodnika z listy lub wpisz imię podopiecznego.');
      return;
    }

    const newSession: IndividualSessionItem = {
      id: `ind-${Date.now()}`,
      mode: sessionMode,
      playerIds: selectedSessionPlayerIds,
      playerNames: selectedNames,
      date: sessionDate,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      goal: sessionGoal.trim() || 'Technika indywidualna i motoryka',
      coachNotes: sessionNotes.trim() || 'Brak dodatkowych uwag.',
      isRecurring: sessionRecurring,
      recurringDayOfWeek: new Date().getDay(),
      status: 'Zaplanowany',
      attendance: {},
    };

    setIndividualSessions((prev) => [newSession, ...prev]);
    setSessionGoal('');
    setSessionNotes('');
    setCustomExternalPlayerName('');
    showNotice('Zapisano w harmonogramie ⚽', `Dodano trening (${sessionMode}) dla: ${selectedNames.join(', ')}`);
  };

  const handleAssignHomework = (ex: typeof AI_HOMEWORK_EXERCISES[0]) => {
    if (!homeworkTargetSession) return;

    const sCount = Math.max(1, parseInt(hwSets, 10) || ex.defaultSets);
    const rCount = Math.max(1, parseInt(hwRepsOrSec, 10) || ex.defaultReps);
    const restCount = Math.max(0, parseInt(hwRestSec, 10) || ex.defaultRest);
    const totalXp = sCount * ex.xpPerSet;

    const prescriptionStr = `${ex.title}: ${sCount} serie x ${rCount} ${ex.unit} (przerwa ${restCount}s)`;
    const fullHomeworkLabel = includeWarmupRequirement
      ? `${prescriptionStr} [+ Rozgrzewka 3 min]`
      : prescriptionStr;

    setIndividualSessions((prev) =>
      prev.map((s) =>
        s.id === homeworkTargetSession.id ? { ...s, assignedHomework: fullHomeworkLabel } : s
      )
    );

    // Zapisujemy również bezpośrednio na profilu zawodników przypisanych do tej sesji
    homeworkTargetSession.playerIds.forEach((pId) => {
      updatePlayer(String(pId), {
        activeHomework: {
          exerciseId: ex.id,
          title: ex.title,
          drillType: ex.id,
          sets: sCount,
          repsOrSec: rCount,
          unit: ex.unit as 'powt.' | 'sek.',
          restSec: restCount,
          xpReward: totalXp,
          requireWarmup: includeWarmupRequirement,
          assignedAt: new Date().toLocaleDateString('pl-PL'),
        },
      });
    });

    setHomeworkModalVisible(false);
    showNotice(
      'Zadanie Domowe AI Przypisane! 🏆',
      `Zawodnik: ${homeworkTargetSession.playerNames.join(', ')}\nPlan: ${prescriptionStr}\nNagroda za wykonanie: +${totalXp} XP do ewolucji Awatara!`
    );
  };

  const handleAddPlayer = async () => {
    if (!newFirstName.trim()) {
      showNotice('Błąd', 'Podaj imię zawodnika.');
      return;
    }

    setSavingPlayer(true);
    try {
      const code = await addPlayer({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        name: `${newFirstName.trim()} ${newLastName.trim()}`.trim(),
        number: parseInt(newNumber, 10) || 10,
        position: newPosition,
        year: parseInt(newYear, 10) || 2014,
        parentName: newParentName.trim() || undefined,
        parentPhone: newParentPhone.trim() || undefined,
        healthStatus: paperConsentSigned ? 'Zgoda papierowa RODO' : 'Oczekuje na akceptację Rodzica',
        xp: 300,
      });

      if (code) {
        showNotice(
          'Zawodnik dodany! ⚽',
          `Kod zaproszenia dla Rodzica (RODO Onboarding): ${code}\nStatus zgody: ${
            paperConsentSigned ? 'Zgoda papierowa w klubie' : 'Wymagana akceptacja w aplikacji rodzica'
          }`
        );
        setAddPlayerModalVisible(false);
        setNewFirstName('');
        setNewLastName('');
        setNewParentName('');
        setNewParentPhone('');
        setPaperConsentSigned(false);
      }
    } catch (err: any) {
      showNotice('Błąd', err.message || 'Nie udało się dodać zawodnika.');
    } finally {
      setSavingPlayer(false);
    }
  };

  // --- FUNKCJE MODUŁU STROJE (122 CM - XL, PRZYPISANIE ZAWODNIKÓW I RAPORT ZAMÓWIENIA 1-KLIK) ---
  const handleAddPhotoToKit = async (kitId: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showNotice('Brak uprawnień', 'Musisz zezwolić na dostęp do galerii, aby dodać zdjęcie.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setKits((prev) =>
          prev.map((k) => (k.id === kitId ? { ...k, photos: [...k.photos, imageUri] } : k))
        );
      }
    } catch (e) {
      showNotice('Błąd', 'Nie udało się wgrać zdjęcia.');
    }
  };

  const handleRemovePhotoFromKit = (kitId: string, photoIndex: number) => {
    setKits((prev) =>
      prev.map((k) =>
        k.id === kitId
          ? { ...k, photos: k.photos.filter((_, idx) => idx !== photoIndex) }
          : k
      )
    );
  };

  const handleUpdateSizeChart = (kitId: string) => {
    const val = (sizeChartInputs[kitId] || '').trim();
    if (!val) {
      showNotice('Brak opisu', 'Wpisz nazwę lub link do tabeli rozmiarów.');
      return;
    }
    setKits((prev) =>
      prev.map((k) => (k.id === kitId ? { ...k, sizeChartUrl: val } : k))
    );
    setSizeChartInputs((prev) => ({ ...prev, [kitId]: '' }));
  };

  const handleRemoveSizeChart = (kitId: string) => {
    setKits((prev) =>
      prev.map((k) => (k.id === kitId ? { ...k, sizeChartUrl: null } : k))
    );
  };

  const handleAddNewKitItem = () => {
    if (!newKitName.trim()) {
      showNotice('Brak nazwy', 'Wpisz nazwę nowego sprzętu (np. Dres klubowy).');
      return;
    }
    const created: KitItem = {
      id: `kit-${Date.now()}`,
      name: newKitName.trim(),
      price: newKitPrice.trim() || '120 PLN',
      photos: ['Zdjęcie główne'],
      sizeChartUrl: 'Pełna rozmiarówka Junior / Senior: 122 cm – XL',
      availableSizes: [...FULL_KIT_SIZES],
      orders: [],
    };
    setKits((prev) => [created, ...prev]);
    setNewKitName('');
    setNewKitPrice('');
  };

  const toggleKitRecipient = (playerId: string) => {
    setSelectedKitRecipients((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const selectAllFilteredKitPlayers = () => {
    const visibleIds = filteredKitPlayers.map((p) => String(p.id));
    const allSelected = visibleIds.every((id) => selectedKitRecipients.includes(id));
    if (allSelected) {
      setSelectedKitRecipients((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedKitRecipients((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const selectEntireClubForKit = () => {
    const allIds = players.map((p) => String(p.id));
    setSelectedKitRecipients(allIds);
  };

  const handleSendKitOfferToRecipients = async (kit: KitItem) => {
    if (selectedKitRecipients.length === 0) {
      showNotice(
        'Wybierz odbiorców',
        'Zaznacz zawodników z listy (lub kliknij „Wszyscy w klubie” / „Zaznacz widocznych”), do których chcesz wysłać ofertę zamówienia.'
      );
      return;
    }

    const NL = String.fromCharCode(10);
    const recipientsList = players.filter((p) => selectedKitRecipients.includes(String(p.id)));
    const recipientNames = recipientsList
      .map((p) => `• ${p.firstName} ${p.lastName || ''} (Rocznik ${p.year})`)
      .join(NL);

    const offerMessage = [
      `👕 ZAMÓWIENIE SPRZĘTU: ${kit.name}`,
      `💰 Cena: ${kit.price}`,
      `📸 Elementy w zestawie (${kit.photos.length}): ${kit.photos.join(', ')}`,
      `📐 Dostępna rozmiarówka: ${FULL_KIT_SIZES.join(', ')}`,
      '',
      'Prosimy o kliknięcie rozmiaru swojego dziecka w Panelu Rodzica!',
      `Odbiorcy (${recipientsList.length}):`,
      recipientNames,
    ].join(NL);

    await Clipboard.setStringAsync(offerMessage);

    try {
      await notificationService.sendLocalAlert(
        `👕 Nowe zamówienie: ${kit.name}`,
        `Wybierz rozmiar (od 122 cm do XL) w Panelu Rodzica (${kit.price}).`
      );
    } catch (_) {}

    showNotice(
      'Wysłano ofertę sprzętu! 📲',
      `Oferta „${kit.name}” (z pełną rozmiarówką 122 cm – XL) została wysłana do ${recipientsList.length} wybranych osób.`
    );
  };

  // 1-KLIK: Generowanie i kopiowanie imiennego + ilościowego raportu zamówienia dla hurtowni
  const handleGenerateOneClickOrderReport = async (kit: KitItem) => {
    const filteredOrders = kit.orders.filter(
      (o) => kitYearFilter === 'Wszyscy' || String(o.year) === String(kitYearFilter)
    );

    if (filteredOrders.length === 0) {
      showNotice(
        'Brak przypisanych rozmiarów',
        'Żaden zawodnik nie ma jeszcze wybranego rozmiaru w tym zestawie. Możesz kliknąć rozmiar przy zawodniku poniżej lub poczekać na wybór rodzica w Panelu Rodzica.'
      );
      return;
    }

    const NL = String.fromCharCode(10);

    // 1. Podsumowanie ilościowe wg pełnej rozmiarówki (od 122 cm do XL)
    const sizeCounts: Record<string, number> = {};
    FULL_KIT_SIZES.forEach((sz) => {
      sizeCounts[sz] = 0;
    });
    filteredOrders.forEach((o) => {
      sizeCounts[o.size] = (sizeCounts[o.size] || 0) + 1;
    });

    const summaryLines = Object.entries(sizeCounts)
      .filter(([_, count]) => count > 0)
      .map(([sz, count]) => `• Rozmiar ${sz}: ${count} szt.`)
      .join(NL);

    // 2. Lista imienna zawodników z przypisanym rozmiarem i numerem na koszulce
    const playerLines = filteredOrders
      .map((o, idx) => {
        const numPart = o.playerNumber ? `, Nr #${o.playerNumber}` : '';
        const paidPart = o.paid ? 'OPŁACONO' : 'DO WPŁATY';
        return `${idx + 1}. ${o.playerName} (Rocznik ${o.year}${numPart}) — Rozmiar: ${o.size} [${paidPart}]`;
      })
      .join(NL);

    const scopeLabel = kitYearFilter === 'Wszyscy' ? 'CAŁY KLUB' : `ROCZNIK ${kitYearFilter}`;
    const reportText = [
      '📦 RAPORT ZAMÓWIENIA SPRZĘTU — SPORTSCLUB PRO',
      `👕 Zestaw: ${kit.name} (${kit.price})`,
      `👥 Zakres: ${scopeLabel} | Łącznie sztuk: ${filteredOrders.length}`,
      `📅 Data wygenerowania: ${formatDateLocal(new Date())}`,
      '========================================',
      '📊 ZESTAWIENIE ILOŚCIOWE DLA HURTOWNI (122 cm – XL):',
      summaryLines,
      '',
      '📋 LISTA IMIENNA ZAWODNIKÓW:',
      playerLines,
      '========================================',
    ].join(NL);

    await Clipboard.setStringAsync(reportText);
    setGeneratedOrderReportText(reportText);
    setOrderReportModalVisible(true);
  };

  // --- TESTY MOTORYCZNE: KREATOR + ZAPIS Z NORMALIZACJĄ ---
  const handleCreateCustomTest = () => {
    if (!ctName.trim()) {
      showNotice('Brak nazwy', 'Wpisz nazwę własnego testu (np. Test Illinois, Żonglerka 60s).');
      return;
    }
    const newTest: MotorTestDef = {
      id: `custom-${Date.now()}`,
      name: ctName.trim(),
      unit: ctUnit,
      betterDirection: ctDirection,
      useStopwatch: ctUseStopwatch,
      icon: ctUnit === 's' ? '⏱️' : ctUnit === 'cm' || ctUnit === 'm' ? '📏' : '🎯',
      isCustom: true,
    };
    setMotorTests((prev) => [...prev, newTest]);
    setCtName('');
    setCustomTestModalVisible(false);
    showNotice('Dodano własny test! ✅', `Kafelek „${newTest.name}” (${newTest.unit}) jest już gotowy do użycia.`);
  };

  const handleOpenMotorTestModal = (test: MotorTestDef) => {
    setActiveMotorTest(test);
    setTestTargetPlayerId(players[0]?.id ? String(players[0].id) : '');
    setTestRawValue('');
    setSwRunning(false);
    setSwMs(0);
  };

  const handleSaveMotorTestResult = () => {
    if (!activeMotorTest) return;
    const targetPlayer = players.find((p) => String(p.id) === String(testTargetPlayerId));
    if (!targetPlayer) {
      showNotice('Wybierz zawodnika', 'Wybierz zawodnika z listy, aby zapisać wynik testu.');
      return;
    }
    const parsedNum = parseNumericInput(testRawValue);
    if (parsedNum === null) {
      showNotice('Niepoprawny wynik', 'Wpisz poprawną liczbę (możesz użyć kropki lub przecinka, np. 3,76 lub 3.76).');
      return;
    }

    const normalizedStr = `${parsedNum} ${activeMotorTest.unit}`;
    const newEntry = {
      testName: activeMotorTest.name,
      result: normalizedStr,
      date: formatDateLocal(new Date()),
    };

    const extraUpdates: Record<string, any> = {};
    if (activeMotorTest.id === 'sprint30') extraUpdates.sprint30m = normalizedStr;
    if (activeMotorTest.id === 'jump') extraUpdates.jumpCm = parsedNum;
    if (activeMotorTest.id === 'beep') extraUpdates.beepTest = String(parsedNum);

    updatePlayer(targetPlayer.id, {
      ...extraUpdates,
      tests: [newEntry, ...(targetPlayer.tests || [])],
    });

    setTestRawValue('');
    setSwRunning(false);
    setSwMs(0);
    showNotice(
      'Wynik zapisany! 📊',
      `${targetPlayer.firstName} ${targetPlayer.lastName || ''}
${activeMotorTest.name}: ${normalizedStr}
(Automatycznie znormalizowano do formatu liczbowego)`
    );
  };

  // --- EKSPORT DO EXCELA (.XLSX - 4 ARKUSZE) ---
  const handleExportToExcel = async () => {
    if (players.length === 0) {
      showNotice('Brak danych', 'Dodaj przynajmniej jednego zawodnika w Kadrze, aby wygenerować raport Excel.');
      return;
    }
    setExportingReport(true);
    try {
      const wb = XLSX.utils.book_new();

      // Arkusz 1: Kadra i Frekwencja
      const sheet1Data = players.map((p) => {
        const total = p.trainingsTotal || 0;
        const present = p.trainingsPresent || 0;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return {
          Numer: p.number || '',
          Imię: p.firstName,
          Nazwisko: p.lastName || '',
          Rocznik: p.year,
          Pozycja: p.position,
          'Treningi (Obecny/Razem)': `${present}/${total}`,
          'Frekwencja (%)': pct,
          'Badania lekarskie': p.medicalClearanceDate || 'Brak daty',
          'Status zdrowia': p.healthStatus || 'Zdrowy',
          'Saldo (PLN)': p.balance ?? 0,
        };
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1Data), 'Kadra i Frekwencja');

      // Arkusz 2: Statystyki Meczowe
      const sheet2Data = players.map((p) => ({
        Numer: p.number || '',
        Zawodnik: `${p.firstName} ${p.lastName || ''}`.trim(),
        Rocznik: p.year,
        Mecze: p.matchesPlayed ?? 0,
        Gole: p.goals ?? 0,
        Asysty: p.assists ?? 0,
        'Żółte kartki': p.yellowCards ?? 0,
        'Punkty XP': p.xp ?? 300,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2Data), 'Statystyki Meczowe');

      // Arkusz 3: Motoryka i Testy (w tym Własne Testy)
      const allCustomTestNames = Array.from(
        new Set(
          players.flatMap((p) => (p.tests || []).map((t) => t.testName))
        )
      );
      const sheet3Data = players.map((p) => {
        const row: Record<string, any> = {
          Zawodnik: `${p.firstName} ${p.lastName || ''}`.trim(),
          Rocznik: p.year,
          'Sprint 30m': p.sprint30m || '-',
          'Skok w dal (cm)': p.jumpCm ?? '-',
          'Beep Test': p.beepTest || '-',
        };
        allCustomTestNames.forEach((tName) => {
          const found = (p.tests || []).find((t) => t.testName === tName);
          row[tName] = found ? found.result : '-';
        });
        return row;
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet3Data), 'Motoryka i Testy');

      // Arkusz 4: Stroje i Rozliczenia
      const sheet4Data: Record<string, any>[] = [];
      kits.forEach((k) => {
        k.orders.forEach((o) => {
          sheet4Data.push({
            Zestaw: k.name,
            Cena: k.price,
            Zawodnik: o.playerName,
            Rocznik: o.year,
            Rozmiar: o.size,
            Opłacono: o.paid ? 'TAK' : 'NIE',
          });
        });
      });
      if (sheet4Data.length === 0) {
        sheet4Data.push({ Informacja: 'Brak zapisanych zamówień strojów' });
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet4Data), 'Stroje i Rozliczenia');

      const fileName = `SportsClubPro_Raport_${formatDateLocal(new Date())}.xlsx`;

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, fileName);
        showNotice('Eksport gotowy! 📊', `Plik Excel (${fileName}) został pobrany na Twój komputer.`);
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const dir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
        const fileUri = `${dir}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: 'base64' as any,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Udostępnij raport Excel (.xlsx)',
          });
        } else {
          showNotice('Zapisano plik', `Raport zapisano w: ${fileUri}`);
        }
      }
    } catch (err: any) {
      showNotice('Błąd eksportu Excel', err?.message || 'Nie udało się wygenerować pliku .xlsx.');
    } finally {
      setExportingReport(false);
    }
  };

  // --- EKSPORT DO PDF (RAPORT DRUŻYNOWY) ---
  const handleExportToPdf = async () => {
    if (players.length === 0) {
      showNotice('Brak danych', 'Dodaj przynajmniej jednego zawodnika w Kadrze, aby wygenerować raport PDF.');
      return;
    }
    setExportingReport(true);
    try {
      const rowsHtml = players
        .map(
          (p) => `
          <tr>
            <td>#${p.number || '-'}</td>
            <td><strong>${p.firstName} ${p.lastName || ''}</strong></td>
            <td>${p.year}</td>
            <td>${p.position}</td>
            <td>${p.goals ?? 0}</td>
            <td>${p.assists ?? 0}</td>
            <td>${p.sprint30m || '-'}</td>
            <td>${p.xp ?? 300} XP</td>
          </tr>`
        )
        .join('');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
              h1 { color: #1e3a8a; margin-bottom: 4px; }
              p.sub { color: #64748b; font-size: 12px; margin-top: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
              th { background: #0f172a; color: #fff; text-align: left; padding: 8px; }
              td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
              tr:nth-child(even) { background: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>SportsClub Pro — Raport Kadry i Statystyk</h1>
            <p class="sub">Data wygenerowania: ${formatDateLocal(new Date())} • Liczba zawodników: ${players.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Nr</th><th>Zawodnik</th><th>Rocznik</th><th>Pozycja</th>
                  <th>Gole</th><th>Asysty</th><th>Sprint 30m</th><th>XP</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body>
        </html>`;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Udostępnij raport PDF',
          });
        } else {
          showNotice('Zapisano PDF', `Plik PDF zapisano w: ${uri}`);
        }
      }
    } catch (err: any) {
      showNotice('Błąd eksportu PDF', err?.message || 'Nie udało się wygenerować pliku PDF.');
    } finally {
      setExportingReport(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* GÓRNY PASEK TRENERA */}
      <View style={styles.topDarkBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="shield-checkmark" size={20} color="#3b82f6" style={{ marginRight: 6 }} />
          <Text style={styles.brandTitle}>SportsClub Pro</Text>

          <View style={styles.sportPill}>
            <Text style={styles.sportPillText}>{sportConfig?.emoji || '⚽'} {sportConfig?.name || 'Piłka Nożna'}</Text>
          </View>

          <View style={styles.eliteBadge}>
            <Text style={styles.eliteBadgeText}>{plan || 'ELITE'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK TRYBU PRACY TRENERA */}
      <View style={styles.coachModeBanner}>
        <Text style={styles.coachModeLabel}>Tryb pracy trenera:</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[styles.modeSwitchChip, coachWorkMode === 'both' && styles.modeSwitchChipActive]}
            onPress={() => setCoachWorkMode('both')}
          >
            <Text style={[styles.modeSwitchText, coachWorkMode === 'both' && styles.modeSwitchTextActive]}>
              👥 Drużyna + 1-on-1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeSwitchChip, coachWorkMode === 'individual_only' && styles.modeSwitchChipActive]}
            onPress={() => setCoachWorkMode('individual_only')}
          >
            <Text style={[styles.modeSwitchText, coachWorkMode === 'individual_only' && styles.modeSwitchTextActive]}>
              🎯 Tylko 1-on-1 / Grupy
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GÓRNE ZAKŁADKI NAWIGACYJNE */}
      <View style={styles.subTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'pulpit' && styles.pillTabActive]}
            onPress={() => setActiveTab('pulpit')}
          >
            <Ionicons name="grid-outline" size={14} color={activeTab === 'pulpit' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'pulpit' && styles.pillTabTextActive]}>Pulpit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === '1on1' && styles.pillTabActive]}
            onPress={() => setActiveTab('1on1')}
          >
            <Ionicons name="person-add-outline" size={14} color={activeTab === '1on1' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === '1on1' && styles.pillTabTextActive]}>1-on-1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'testy' && styles.pillTabActive]}
            onPress={() => setActiveTab('testy')}
          >
            <Ionicons name="stopwatch-outline" size={14} color={activeTab === 'testy' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'testy' && styles.pillTabTextActive]}>Testy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'stroje' && styles.pillTabActive]}
            onPress={() => setActiveTab('stroje')}
          >
            <Ionicons name="shirt-outline" size={14} color={activeTab === 'stroje' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'stroje' && styles.pillTabTextActive]}>Stroje</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'finanse' && styles.pillTabActive]}
            onPress={() => setActiveTab('finanse')}
          >
            <Ionicons name="cash-outline" size={14} color={activeTab === 'finanse' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'finanse' && styles.pillTabTextActive]}>Finanse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'kadra' && styles.pillTabActive]}
            onPress={() => setActiveTab('kadra')}
          >
            <Ionicons name="people-outline" size={14} color={activeTab === 'kadra' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'kadra' && styles.pillTabTextActive]}>
              Kadra ({players.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pillTab, activeTab === 'ustawienia' && styles.pillTabActive]}
            onPress={() => setActiveTab('ustawienia')}
          >
            <Ionicons name="settings-outline" size={14} color={activeTab === 'ustawienia' ? '#fff' : '#475569'} />
            <Text style={[styles.pillTabText, activeTab === 'ustawienia' && styles.pillTabTextActive]}>Ustawienia</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ==================== ZAKŁADKA 1: PULPIT GŁÓWNY + WIDŻET LIVE ==================== */}
        {activeTab === 'pulpit' && (
          <View>
            <View style={styles.liveHeaderToggleRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.pageMainTitle}>Pulpit Trenera ⚡</Text>
                <Text style={styles.pageSubTitle}>
                  {coachWorkMode === 'individual_only'
                    ? 'Panel trenera przygotowania indywidualnego i małych grup'
                    : 'Centrum dowodzenia drużyną i sesjami indywidualnymi'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.simLiveBtn, simulateLiveMode && styles.simLiveBtnActive]}
                onPress={() => setSimulateLiveMode(!simulateLiveMode)}
              >
                <Ionicons name="radio-outline" size={14} color={simulateLiveMode ? '#fff' : '#dc2626'} />
                <Text style={[styles.simLiveBtnText, simulateLiveMode && { color: '#fff' }]}>
                  {simulateLiveMode ? 'LIVE: WŁ.' : 'Test LIVE'}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTeamLiveEvents.map((ev) => {
              const squadList =
                ev.squadIds.length > 0
                  ? players.filter((p) => ev.squadIds.includes(String(p.id)))
                  : players;
              const presentCount = squadList.filter((p) => ev.attendance?.[p.id] === 'present').length;

              return (
                <View key={ev.id} style={styles.liveCardTeam}>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.liveRedPill}>
                      <View style={styles.liveDotPulse} />
                      <Text style={styles.liveRedPillText}>TRENING DRUŻYNOWY LIVE</Text>
                    </View>
                    <Text style={styles.liveTimeText}>⏰ {ev.startTime} - {ev.endTime}</Text>
                  </View>

                  <Text style={styles.liveEventTitle}>{ev.title}</Text>
                  <Text style={styles.liveEventSub}>📍 {ev.location} • Obecnych: {presentCount}/{squadList.length}</Text>

                  <View style={[styles.liveQuickActionsRow, { justifyContent: 'space-between' }]}>
                    <TouchableOpacity
                      style={[styles.markAllPresentBtn, { backgroundColor: '#2563eb', borderColor: '#2563eb', paddingHorizontal: 12 }]}
                      onPress={() => router.push({ pathname: '/Boisko', params: { eventId: ev.id } })}
                    >
                      <Ionicons name="football" size={15} color="#fff" />
                      <Text style={[styles.markAllPresentText, { color: '#fff' }]}>Wirtualne Boisko (Strzelcy)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.markAllPresentBtn}
                      onPress={() => {
                        const batch: Record<string, AttendanceStatus> = {};
                        squadList.forEach((p) => {
                          batch[p.id] = 'present';
                        });
                        updateEventAttendanceBatch(ev.id, batch);
                      }}
                    >
                      <Ionicons name="checkmark-done" size={15} color="#15803d" />
                      <Text style={styles.markAllPresentText}>Wszyscy Obecni</Text>
                    </TouchableOpacity>
                  </View>

                  {squadList.length === 0 ? (
                    <Text style={styles.emptyLiveNotice}>Brak zawodników w kadrze. Dodaj ich w zakładce Kadra.</Text>
                  ) : (
                    <View style={{ marginTop: 8 }}>
                      {squadList.map((player) => {
                        const status = ev.attendance?.[player.id] || 'pending';
                        return (
                          <View key={player.id} style={styles.livePlayerRow}>
                            <Text style={styles.livePlayerName}>
                              #{player.number} {player.firstName} {player.lastName || ''}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity
                                style={[
                                  styles.attQuickBtn,
                                  status === 'present' && styles.attQuickBtnPresent,
                                ]}
                                onPress={() => updateEventAttendance(ev.id, player.id, 'present')}
                              >
                                <Text style={[styles.attQuickText, status === 'present' && { color: '#fff' }]}>
                                  Obecny
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.attQuickBtn,
                                  status === 'excused' && { backgroundColor: '#ca8a04', borderColor: '#ca8a04' },
                                ]}
                                onPress={() => updateEventAttendance(ev.id, player.id, 'excused')}
                              >
                                <Text style={[styles.attQuickText, status === 'excused' && { color: '#fff' }]}>
                                  Uspraw.
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.attQuickBtn,
                                  status === 'absent' && styles.attQuickBtnAbsent,
                                ]}
                                onPress={() => updateEventAttendance(ev.id, player.id, 'absent')}
                              >
                                <Text style={[styles.attQuickText, status === 'absent' && { color: '#fff' }]}>
                                  Brak
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {activeIndividualLiveSessions.map((sess) => (
              <View key={sess.id} style={styles.liveCardIndividual}>
                <View style={styles.liveBadgeRow}>
                  <View style={[styles.liveRedPill, { backgroundColor: '#7c3aed' }]}>
                    <View style={styles.liveDotPulse} />
                    <Text style={styles.liveRedPillText}>SESJA {sess.mode.toUpperCase()} LIVE</Text>
                  </View>
                  <Text style={styles.liveTimeText}>⏰ {sess.startTime} - {sess.endTime}</Text>
                </View>

                <Text style={styles.liveEventTitle}>{sess.playerNames.join(', ')}</Text>
                <Text style={styles.liveEventSub}>🎯 Cel: {sess.goal}</Text>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.indCompleteBtn}
                    onPress={() => {
                      markIndividualSessionCompleted(sess.id);
                      showNotice('Zrealizowano! ✅', 'Sesja indywidualna została oznaczona jako zakończona.');
                    }}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#fff" />
                    <Text style={styles.indCompleteBtnText}>
                      {sess.status === 'Zrealizowano' ? 'Zrealizowano' : 'Zakończ i Zaliczyć Obecność'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.indHomeworkBtn}
                    onPress={() => {
                      setHomeworkTargetSession(sess);
                      setHomeworkModalVisible(true);
                    }}
                  >
                    <Ionicons name="trophy-outline" size={16} color="#854d0e" />
                    <Text style={styles.indHomeworkBtnText}>Zadanie AI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTeamLiveEvents.length === 0 && activeIndividualLiveSessions.length === 0 && (
              <View style={styles.noLiveBox}>
                <Ionicons name="time-outline" size={28} color="#2563eb" />
                <Text style={styles.noLiveTitle}>Brak trwającego treningu w tej chwili</Text>
                <Text style={styles.noLiveSub}>
                  Gdy wybije godzina rozpoczęcia zaplanowanego treningu {coachWorkMode === 'both' ? 'drużynowego lub ' : ''}1-on-1 (np. 17:30), w tym miejscu automatycznie wyskoczy szybka lista obecności LIVE. Kliknij „Test LIVE” w prawym górnym rogu, aby zobaczyć podgląd już teraz!
                </Text>
              </View>
            )}

            <View style={styles.quickStatsGrid}>
              {coachWorkMode === 'both' && (
                <TouchableOpacity style={styles.statBox} onPress={() => setActiveTab('kadra')}>
                  <Text style={styles.statValue}>{players.length}</Text>
                  <Text style={styles.statLabel}>Zawodników w Kadrze</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.statBox} onPress={() => setActiveTab('1on1')}>
                <Text style={styles.statValue}>{individualSessions.length}</Text>
                <Text style={styles.statLabel}>Sesje 1-on-1 / Grupy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox} onPress={() => setActiveTab('stroje')}>
                <Text style={styles.statValue}>{kits.reduce((acc, k) => acc + k.orders.length, 0)}</Text>
                <Text style={styles.statLabel}>Przypisane Rozmiary</Text>
              </TouchableOpacity>
            </View>

            {/* CENTRUM EKSPORTU: EXCEL (.XLSX) I PDF */}
            <View style={[styles.whiteCard, { marginTop: 14 }]}>
              <Text style={styles.cardSectionTitle}>📊 Eksport Danych na Komputer (Excel / PDF)</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 10 }}>
                Pobierz pełne podsumowanie kadry, statystyk meczowych, testów motorycznych i strojów.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.exportExcelBtn}
                  onPress={handleExportToExcel}
                  disabled={exportingReport}
                >
                  <Ionicons name="document-text-outline" size={16} color="#fff" />
                  <Text style={styles.exportBtnText}>
                    {exportingReport ? 'Generowanie...' : 'Eksport Excel (.xlsx)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportPdfBtn}
                  onPress={handleExportToPdf}
                  disabled={exportingReport}
                >
                  <Ionicons name="print-outline" size={16} color="#fff" />
                  <Text style={styles.exportBtnText}>Raport PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ==================== ZAKŁADKA 2: TRENINGI INDYWIDUALNE 1-ON-1 I MAŁE GRUPY ==================== */}
        {activeTab === '1on1' && (
          <View>
            <Text style={styles.pageMainTitle}>Treningi Indywidualne i Grupy ⚽</Text>
            <Text style={styles.pageSubTitle}>Zarządzaj sesjami z inteligentnym kalendarzem i zadaniami AI</Text>
            {/* WIDOK KALENDARZA W ZAKŁADCE 1-ON-1 / GRUPY */}
            <View style={styles.whiteCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <TouchableOpacity
                  style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 6 }}
                  onPress={() => setCalMonthDate(new Date(calYear, calMonth - 1, 1))}
                >
                  <Ionicons name="chevron-back" size={18} color="#2563eb" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a' }}>
                    📅 Terminarz: {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#64748b' }}>
                    Kliknij dzień, aby wybrać datę treningu (🔴 Drużyna • 🟣 1-on-1/Grupa)
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 6 }}
                  onPress={() => setCalMonthDate(new Date(calYear, calMonth + 1, 1))}
                >
                  <Ionicons name="chevron-forward" size={18} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 }}>
                {SHORT_WEEK_DAYS.map((wd, idx) => (
                  <Text key={idx} style={{ width: '14%', textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#94a3b8' }}>
                    {wd}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: firstDayOffset }, (_, i) => (
                  <View key={`empty-1on1-${i}`} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }} />
                ))}
                {Array.from({ length: daysInCalMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const teamEvsOnDay = events.filter((ev) => isEventOnDateHelper(ev, dStr));
                  const indEvsOnDay = individualSessions.filter((s) =>
                    s.date === dStr || (s.isRecurring && s.date <= dStr && parseLocalDate(dStr).getDay() === s.recurringDayOfWeek)
                  );
                  const hasAny = teamEvsOnDay.length > 0 || indEvsOnDay.length > 0;
                  const isSel = sessionDate === dStr;

                  return (
                    <TouchableOpacity
                      key={dayNum}
                      style={[
                        {
                          width: '14.28%',
                          aspectRatio: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 8,
                          marginBottom: 4,
                        },
                        hasAny && !isSel && { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
                        isSel && { backgroundColor: '#2563eb' },
                      ]}
                      onPress={() => setSessionDateObj(parseLocalDate(dStr))}
                    >
                      <Text style={[{ fontSize: 13, color: '#334155', fontWeight: '500' }, isSel && { color: '#fff', fontWeight: 'bold' }]}>
                        {dayNum}
                      </Text>
                      {hasAny && (
                        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                          {teamEvsOnDay.length > 0 && (
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isSel ? '#fff' : '#dc2626' }} />
                          )}
                          {indEvsOnDay.length > 0 && (
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isSel ? '#fde047' : '#7c3aed' }} />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Podgląd wydarzeń w wybranym dniu (sessionDate) */}
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                  📌 Zaplanowane na dzień {sessionDate}:
                </Text>
                {events.filter((ev) => isEventOnDateHelper(ev, sessionDate)).length === 0 &&
                individualSessions.filter((s) => s.date === sessionDate || (s.isRecurring && s.date <= sessionDate && parseLocalDate(sessionDate).getDay() === s.recurringDayOfWeek)).length === 0 ? (
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                    Brak zajęć w tym dniu — wolny termin!
                  </Text>
                ) : (
                  <View style={{ gap: 4 }}>
                    {events
                      .filter((ev) => isEventOnDateHelper(ev, sessionDate))
                      .map((ev) => (
                        <View key={ev.id} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fef2f2', padding: 6, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc2626', flex: 1 }}>⚽ {ev.title} ({ev.type})</Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#991b1b' }}>{ev.startTime} - {ev.endTime}</Text>
                        </View>
                      ))}
                    {individualSessions
                      .filter((s) => s.date === sessionDate || (s.isRecurring && s.date <= sessionDate && parseLocalDate(sessionDate).getDay() === s.recurringDayOfWeek))
                      .map((s) => (
                        <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3e8ff', padding: 6, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#7c3aed', flex: 1 }}>🎯 {s.mode}: {s.playerNames.join(', ')}</Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#5b21b6' }}>{s.startTime} - {s.endTime}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </View>


            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionTitle}>Zaplanuj nowy trening</Text>
                <View style={styles.modeTogglePill}>
                  <TouchableOpacity
                    style={[styles.modeMiniBtn, sessionMode === '1-on-1' && styles.modeMiniBtnActive]}
                    onPress={() => setSessionMode('1-on-1')}
                  >
                    <Text style={[styles.modeMiniText, sessionMode === '1-on-1' && styles.modeMiniTextActive]}>
                      1-on-1
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeMiniBtn, sessionMode === 'Grupa' && styles.modeMiniBtnActive]}
                    onPress={() => setSessionMode('Grupa')}
                  >
                    <Text style={[styles.modeMiniText, sessionMode === 'Grupa' && styles.modeMiniTextActive]}>
                      Grupa
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                {players.map((p) => {
                  const isSel = selectedSessionPlayerIds.includes(String(p.id));
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.playerSelectChip, isSel && styles.playerSelectChipActive]}
                      onPress={() => togglePlayerForSession(String(p.id))}
                    >
                      <Text style={[styles.playerSelectChipText, isSel && { color: '#fff', fontWeight: 'bold' }]}>
                        {p.firstName} {p.lastName || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>



              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldMiniLabel}>DATA TRENINGU</Text>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      style={styles.lightInput}
                      value={sessionDate}
                      placeholder="YYYY-MM-DD"
                      onChangeText={(txt) => {
                        if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) {
                          setSessionDateObj(parseLocalDate(txt));
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[styles.lightInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setShowSessionDatePicker(true)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{sessionDate}</Text>
                      <Ionicons name="calendar-outline" size={16} color="#2563eb" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ width: 95 }}>
                  <Text style={styles.fieldMiniLabel}>START</Text>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      style={[styles.lightInput, { textAlign: 'center', fontWeight: 'bold' }]}
                      value={sessionStartTime}
                      onChangeText={(txt) => { const [h, m] = txt.split(':').map(Number); const d = new Date(sessionDateObj); d.setHours(h || 0, m || 0, 0, 0); setSessionStartObj(d); }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[styles.lightInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }]}
                      onPress={() => setShowSessionStartPicker(true)}
                    >
                      <Ionicons name="time-outline" size={15} color="#2563eb" />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{sessionStartTime}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ width: 95 }}>
                  <Text style={styles.fieldMiniLabel}>KONIEC</Text>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      style={[styles.lightInput, { textAlign: 'center', fontWeight: 'bold' }]}
                      value={sessionEndTime}
                      onChangeText={(txt) => { const [h, m] = txt.split(':').map(Number); const d = new Date(sessionDateObj); d.setHours(h || 0, m || 0, 0, 0); setSessionEndObj(d); }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[styles.lightInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }]}
                      onPress={() => setShowSessionEndPicker(true)}
                    >
                      <Ionicons name="time-outline" size={15} color="#2563eb" />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{sessionEndTime}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {Platform.OS !== 'web' && showSessionDatePicker && (
                <DateTimePicker
                  value={sessionDateObj}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowSessionDatePicker(false);
                    if (date) setSessionDateObj(date);
                  }}
                />
              )}

              {Platform.OS !== 'web' && showSessionStartPicker && (
                <DateTimePicker
                  value={sessionStartObj}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(_, date) => {
                    setShowSessionStartPicker(false);
                    if (date) setSessionStartObj(date);
                  }}
                />
              )}

              {Platform.OS !== 'web' && showSessionEndPicker && (
                <DateTimePicker
                  value={sessionEndObj}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(_, date) => {
                    setShowSessionEndPicker(false);
                    if (date) setSessionEndObj(date);
                  }}
                />
              )}

              <Text style={[styles.fieldMiniLabel, { marginTop: 10 }]}>CEL TRENINGOWY (KLIKNIJ SZABLON LUB WPISZ WŁASNY):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                {QUICK_TRAINING_GOALS.map((gLabel) => {
                  const isGoalSel = sessionGoal === gLabel;
                  return (
                    <TouchableOpacity
                      key={gLabel}
                      style={[
                        styles.playerSelectChip,
                        { paddingVertical: 5, paddingHorizontal: 10 },
                        isGoalSel && styles.playerSelectChipActive,
                      ]}
                      onPress={() => setSessionGoal(gLabel)}
                    >
                      <Text style={[{ fontSize: 11, color: '#334155' }, isGoalSel && { color: '#fff', fontWeight: 'bold' }]}>
                        {gLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TextInput
                style={[styles.lightInput, { marginTop: 2 }]}
                placeholder="Cel treningowy (np. Gra 1v1 i strzały z dystansu)"
                placeholderTextColor="#94a3b8"
                value={sessionGoal}
                onChangeText={setSessionGoal}
              />

              <TextInput
                style={[styles.lightInput, { marginTop: 8, minHeight: 60 }]}
                placeholder="Notatki Trenera (nad czym się skupić)"
                placeholderTextColor="#94a3b8"
                multiline
                value={sessionNotes}
                onChangeText={setSessionNotes}
              />

              <View style={styles.recurringBoxRow}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>Trening cykliczny</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Powtarzaj co tydzień</Text>
                </View>
                <Switch
                  value={sessionRecurring}
                  onValueChange={setSessionRecurring}
                  trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                  thumbColor={sessionRecurring ? '#2563eb' : '#f1f5f9'}
                />
              </View>

              <TouchableOpacity style={styles.greenSaveScheduleBtn} onPress={handleSaveIndividualSession}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.greenSaveScheduleText}>Zapisz w harmonogramie</Text>
              </TouchableOpacity>
            </View>

                        <Text style={[styles.cardSectionTitle, { marginTop: 18, marginBottom: 10 }]}>Pełny harmonogram (Drużyna + Indywidualne):</Text>

            {events.map((ev) => (
              <View key={ev.id} style={[styles.whiteCard, { borderLeftWidth: 4, borderLeftColor: '#dc2626' }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>
                    {ev.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#dc2626' }]}>{ev.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  🕒 {ev.startDate} • {ev.startTime} - {ev.endTime}
                </Text>
                <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: '600', marginTop: 4 }}>
                  📍 {ev.location}
                </Text>
              </View>
            ))}
            

            {individualSessions.map((sess) => (
              <View key={sess.id} style={styles.whiteCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1 }}>
                    {sess.playerNames.join(', ')}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      sess.status === 'Zrealizowano' && { backgroundColor: '#dcfce7', borderColor: '#86efac' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        sess.status === 'Zrealizowano' && { color: '#15803d' },
                      ]}
                    >
                      {sess.status}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  🕒 {sess.date} • {sess.startTime} - {sess.endTime} ({sess.mode})
                </Text>
                <Text style={{ fontSize: 12, color: '#0f172a', fontWeight: '600', marginTop: 4 }}>
                  🎯 Cel: {sess.goal}
                </Text>

                <View style={styles.coachNoteGrayBox}>
                  <Text style={{ fontSize: 10, color: '#64748b' }}>Notatka trenera:</Text>
                  <Text style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', marginTop: 2 }}>
                    {sess.coachNotes}
                  </Text>
                </View>

                {sess.assignedHomework && (
                  <View style={styles.assignedHomeworkBanner}>
                    <Ionicons name="trophy" size={14} color="#ca8a04" />
                    <Text style={styles.assignedHomeworkText}>
                      Zadanie AI: {sess.assignedHomework}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.blueRealizedBtn,
                      sess.status === 'Zrealizowano' && { backgroundColor: '#16a34a' },
                    ]}
                    onPress={() => markIndividualSessionCompleted(sess.id)}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#fff" />
                    <Text style={styles.blueRealizedBtnText}>Zrealizowano</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.yellowHomeworkBtn}
                    onPress={() => {
                      setHomeworkTargetSession(sess);
                      setHomeworkModalVisible(true);
                    }}
                  >
                    <Ionicons name="trophy-outline" size={16} color="#854d0e" />
                    <Text style={styles.yellowHomeworkBtnText}>Zadanie Domowe</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==================== ZAKŁADKA TESTY MOTORYCZNE (+ WŁASNY TEST) ==================== */}
        {activeTab === 'testy' && (
          <View>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageMainTitle}>Testy Motoryczne ⏱️</Text>
                <Text style={styles.pageSubTitle}>
                  Gotowe testy oraz Kreator Własnych Testów z automatyczną normalizacją liczb (przecinek/kropka)
                </Text>
              </View>
            </View>

            <View style={styles.motorGrid}>
              {motorTests.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.motorTile}
                  onPress={() => handleOpenMotorTestModal(t)}
                >
                  <Text style={{ fontSize: 26 }}>{t.icon}</Text>
                  <Text style={styles.motorTileTitle}>{t.name}</Text>
                  <Text style={styles.motorTileMeta}>
                    Jednostka: {t.unit} • {t.betterDirection === 'lower' ? '⬇️ Mniej = lepiej' : '⬆️ Więcej = lepiej'}
                  </Text>
                  {t.isCustom && (
                    <View style={styles.customTestBadge}>
                      <Text style={styles.customTestBadgeText}>WŁASNY TEST</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* KAFELEK: + WŁASNY TEST */}
              <TouchableOpacity
                style={styles.addCustomTestTile}
                onPress={() => setCustomTestModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={32} color="#2563eb" />
                <Text style={styles.addCustomTestTitle}>+ Własny test</Text>
                <Text style={styles.addCustomTestSub}>Stwórz autorski pomiar</Text>
              </TouchableOpacity>
            </View>

            {/* OSTATNIE WYNIKI TESTÓW W DRUŻYNIE */}
            <View style={[styles.whiteCard, { marginTop: 12 }]}>
              <Text style={styles.cardSectionTitle}>📋 Ostatnie zapisane wyniki w kadrze</Text>
              {players.every((p) => !p.tests || p.tests.length === 0) ? (
                <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
                  Kliknij dowolny kafelek powyżej, aby wpisać pierwszy wynik (np. 3,76 lub 3.76).
                </Text>
              ) : (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {players.flatMap((p) =>
                    (p.tests || []).slice(0, 2).map((t, idx) => (
                      <View key={`${p.id}-${idx}`} style={styles.bulkRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                            {p.firstName} {p.lastName || ''} — {t.testName}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#64748b' }}>Data: {t.date}</Text>
                        </View>
                        <View style={styles.assignedSizeBadge}>
                          <Text style={styles.assignedSizeBadgeText}>{t.result}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================== ZAKŁADKA 3: STROJE I PEŁNA ROZMIARÓWKA (122 CM – XL) ==================== */}
        {activeTab === 'stroje' && (
          <View>
            <Text style={styles.pageMainTitle}>Moduł Sprzętu i Zamówień 👕</Text>
            <Text style={styles.pageSubTitle}>
              Pełna rozmiarówka (122 cm – XL), przypisanie rozmiarów do zawodników i raport do zamówienia jednym kliknięciem
            </Text>

            {/* Szybkie dodawanie nowego zestawu sprzętu */}
            <View style={styles.whiteCard}>
              <Text style={styles.cardSectionTitle}>+ Utwórz nową ofertę sprzętu</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={[styles.lightInput, { flex: 2 }]}
                  placeholder="Nazwa (np. Dres Klubowy Jesień)"
                  placeholderTextColor="#94a3b8"
                  value={newKitName}
                  onChangeText={setNewKitName}
                />
                <TextInput
                  style={[styles.lightInput, { flex: 1 }]}
                  placeholder="Cena (np. 199 PLN)"
                  placeholderTextColor="#94a3b8"
                  value={newKitPrice}
                  onChangeText={setNewKitPrice}
                />
                <TouchableOpacity style={styles.addMorePhotoBtn} onPress={handleAddNewKitItem}>
                  <Text style={styles.addMorePhotoText}>Dodaj zestaw</Text>
                </TouchableOpacity>
              </View>
            </View>

            {kits.map((kit) => {
              // Zliczanie rozmiarów wg pełnej rozmiarówki (122 cm - XL) z uwzględnieniem filtra rocznika
              const sizeSummary: Record<string, number> = {};
              FULL_KIT_SIZES.forEach((sz) => {
                sizeSummary[sz] = 0;
              });

              const filteredOrders = kit.orders.filter(
                (o) => kitYearFilter === 'Wszyscy' || String(o.year) === String(kitYearFilter)
              );
              filteredOrders.forEach((o) => {
                sizeSummary[o.size] = (sizeSummary[o.size] || 0) + 1;
              });

              return (
                <View key={kit.id} style={styles.whiteCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardSectionTitle}>{kit.name}</Text>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#2563eb' }}>{kit.price}</Text>
                  </View>

                  {/* 1. GALERIA ZDJĘĆ Z FUNKCJĄ USUWANIA (X) */}
                  <Text style={[styles.fieldMiniLabel, { marginTop: 10 }]}>
                    ZDJĘCIA PRODUKTU ({kit.photos.length}) — kliknij ✕ na zdjęciu, aby je usunąć:
                  </Text>

                  {kit.photos.length === 0 ? (
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginVertical: 6 }}>
                      Brak zdjęć. Dodaj pierwsze zdjęcie poniżej.
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                      {kit.photos.map((ph, idx) => (
                        <View key={`${kit.id}-ph-${idx}`} style={styles.photoSlotCard}>
                          <TouchableOpacity
                            style={styles.deletePhotoBadge}
                            onPress={() => handleRemovePhotoFromKit(kit.id, idx)}
                          >
                            <Ionicons name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                          {ph.startsWith('file://') || ph.startsWith('http') || ph.startsWith('data:') ? (
                            <Image source={{ uri: ph }} style={{ width: '100%', height: '100%', borderRadius: 6 }} resizeMode="cover" />
                          ) : (
                            <>
                              <Ionicons name="image-outline" size={22} color="#2563eb" />
                              <Text style={styles.photoSlotText} numberOfLines={2}>{ph}</Text>
                            </>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.addMorePhotoBtn, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
                      onPress={() => handleAddPhotoToKit(kit.id)}
                    >
                      <Ionicons name="camera-outline" size={16} color="#fff" />
                      <Text style={styles.addMorePhotoText}>Wybierz zdjęcie produktu z galerii</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 2. PEŁNA ROZMIARÓWKA OD MŁODZIEŻOWYCH (122 CM) DO XL */}
                  <View style={styles.fullSizeRangeBox}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0369a1' }}>
                        📐 Pełna rozmiarówka w ofercie (Junior 122 cm – Senior XL):
                      </Text>
                      {kit.sizeChartUrl ? (
                        <TouchableOpacity
                          style={styles.removeSizeChartBtn}
                          onPress={() => handleRemoveSizeChart(kit.id)}
                        >
                          <Ionicons name="trash-outline" size={13} color="#dc2626" />
                          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>Usuń opis</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {FULL_KIT_SIZES.map((sz) => {
                        const countForSize = sizeSummary[sz] || 0;
                        return (
                          <View
                            key={sz}
                            style={[
                              styles.sizeTagPill,
                              countForSize > 0 && styles.sizeTagPillHasOrders,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sizeTagText,
                                countForSize > 0 && { color: '#fff', fontWeight: '900' },
                              ]}
                            >
                              {sz} {countForSize > 0 ? `(${countForSize} szt.)` : ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {!kit.sizeChartUrl && (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <TextInput
                          style={[styles.lightInput, { flex: 1, marginBottom: 0, backgroundColor: '#fff' }]}
                          placeholder="Dodatkowy opis lub link do tabeli wymiarów..."
                          placeholderTextColor="#94a3b8"
                          value={sizeChartInputs[kit.id] || ''}
                          onChangeText={(txt) => setSizeChartInputs((prev) => ({ ...prev, [kit.id]: txt }))}
                        />
                        <TouchableOpacity
                          style={[styles.addMorePhotoBtn, { backgroundColor: '#0284c7' }]}
                          onPress={() => handleUpdateSizeChart(kit.id)}
                        >
                          <Text style={styles.addMorePhotoText}>Zapisz opis</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* 3. FILTR ROCZNIKÓW I WYSYŁKA OFERTY DO RODZICÓW */}
                  <View style={styles.recipientSectionBox}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                        📣 Wyślij ofertę do rodziców / zawodników ({selectedKitRecipients.length} wybranych)
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.miniActionChip}
                          onPress={() => setKitSortByYear((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        >
                          <Ionicons name="swap-vertical" size={12} color="#2563eb" />
                          <Text style={styles.miniActionChipText}>
                            Sortuj rocznik ({kitSortByYear === 'asc' ? 'Rosnąco' : 'Malejąco'})
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.miniActionChip} onPress={selectEntireClubForKit}>
                          <Text style={styles.miniActionChipText}>Wszyscy w klubie ({players.length})</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Pasek wyboru rocznika */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 6 }}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        {yearOptions.map((yr) => (
                          <TouchableOpacity
                            key={yr}
                            style={[styles.yearFilterPill, kitYearFilter === yr && styles.yearFilterPillActive]}
                            onPress={() => setKitYearFilter(yr)}
                          >
                            <Text
                              style={[
                                styles.yearFilterPillText,
                                kitYearFilter === yr && styles.yearFilterPillTextActive,
                              ]}
                            >
                              {yr === 'Wszyscy' ? 'Wszystkie roczniki' : `Rocznik ${yr}`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <TouchableOpacity onPress={selectAllFilteredKitPlayers} style={{ marginLeft: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2563eb' }}>
                          + Zaznacz/Odznacz widocznych ({filteredKitPlayers.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.sendKitOfferBtn}
                      onPress={() => handleSendKitOfferToRecipients(kit)}
                    >
                      <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                      <Text style={styles.sendKitOfferBtnText}>
                        Wyślij ofertę sprzętu do wybranych ({selectedKitRecipients.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 4. LISTA ZAWODNIKÓW Z PRZYPISANYM ROZMIAREM (OD RODZICA LUB KLIKNIĘTYM PRZEZ TRENERA) */}
                  <View style={styles.playerSizeAssignmentSection}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                          👦 Przypisane rozmiary zawodników ({filteredOrders.length}/{filteredKitPlayers.length}):
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>
                          Rozmiar wybrany przez rodzica wpada tu automatycznie. Możesz też kliknąć rozmiar ręcznie:
                        </Text>
                      </View>
                      {players.length === 0 && (
                        <TouchableOpacity
                          style={styles.miniActionChip}
                          onPress={() => setAddPlayerModalVisible(true)}
                        >
                          <Text style={styles.miniActionChipText}>+ Dodaj zawodnika</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {filteredKitPlayers.length === 0 ? (
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
                        Brak zawodników w wybranym widoku ({kitYearFilter}). Dodaj zawodnika w zakładce Kadra, aby przypisać mu rozmiar.
                      </Text>
                    ) : (
                      <View style={{ marginTop: 8, gap: 8 }}>
                        {filteredKitPlayers.map((player) => {
                          const pId = String(player.id);
                          const isRecipientChecked = selectedKitRecipients.includes(pId);
                          const existingOrder = kit.orders.find((o) => String(o.playerId) === pId);

                          return (
                            <View key={pId} style={styles.playerKitRowCard}>
                              <View style={styles.cardHeaderRow}>
                                <TouchableOpacity
                                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
                                  onPress={() => toggleKitRecipient(pId)}
                                >
                                  <Ionicons
                                    name={isRecipientChecked ? 'checkbox' : 'square-outline'}
                                    size={18}
                                    color={isRecipientChecked ? '#2563eb' : '#94a3b8'}
                                  />
                                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                                    #{player.number} {player.firstName} {player.lastName || ''} (R. {player.year})
                                  </Text>
                                </TouchableOpacity>

                                {existingOrder ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.assignedSizeBadge}>
                                      <Text style={styles.assignedSizeBadgeText}>
                                        Rozmiar: {existingOrder.size}
                                      </Text>
                                    </View>
                                    <TouchableOpacity
                                      style={[
                                        styles.paidStatusChip,
                                        existingOrder.paid && styles.paidStatusChipActive,
                                      ]}
                                      onPress={() => togglePlayerKitPaid(kit.id, pId)}
                                    >
                                      <Text
                                        style={[
                                          styles.paidStatusChipText,
                                          existingOrder.paid && { color: '#15803d' },
                                        ]}
                                      >
                                        {existingOrder.paid ? '✅ Opłacono' : '⏳ Do wpłaty'}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '600' }}>
                                    Brak wybranego rozmiaru
                                  </Text>
                                )}
                              </View>

                              {/* Pasek szybkiego wyboru rozmiaru 122 cm - XL dla danego zawodnika */}
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginTop: 6 }}
                                contentContainerStyle={{ gap: 5 }}
                              >
                                {FULL_KIT_SIZES.map((sz) => {
                                  const isSelectedSize = existingOrder?.size === sz;
                                  return (
                                    <TouchableOpacity
                                      key={sz}
                                      style={[
                                        styles.quickSizeBtn,
                                        isSelectedSize && styles.quickSizeBtnActive,
                                      ]}
                                      onPress={() => assignPlayerKitSize(kit.id, player, sz, existingOrder?.paid ?? false)}
                                    >
                                      <Text
                                        style={[
                                          styles.quickSizeBtnText,
                                          isSelectedSize && { color: '#fff', fontWeight: 'bold' },
                                        ]}
                                      >
                                        {sz}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* 5. JEDEN KLIK TRENERA -> GOTOWY RAPORT ZAMÓWIENIA DLA HURTOWNI */}
                  <View style={styles.coachSummaryBox}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>
                        📊 Podsumowanie zamówienia ({kitYearFilter === 'Wszyscy' ? 'Cały klub' : `Rocznik ${kitYearFilter}`}: {filteredOrders.length} szt.):
                      </Text>
                    </View>

                    {filteredOrders.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
                        {FULL_KIT_SIZES.filter((sz) => sizeSummary[sz] > 0).map((sz) => (
                          <View key={sz} style={styles.sizeCountBadge}>
                            <Text style={styles.sizeCountText}>
                              {sz}: {sizeSummary[sz]} szt.
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#64748b', marginVertical: 6 }}>
                        Kliknij rozmiar przy zawodniku powyżej (lub poczekaj na wybór rodzica), aby wygenerować zestawienie.
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.oneClickReportBtn}
                      onPress={() => handleGenerateOneClickOrderReport(kit)}
                    >
                      <Ionicons name="document-text-outline" size={18} color="#fff" />
                      <Text style={styles.oneClickReportBtnText}>
                        ⚡ Generuj Raport do Zamówienia (1-Klik: Lista imienna + Ilościówka 122–XL)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

                {/* ==================== ZAKŁADKA FINANSE (DŁUŻNICY) ==================== */}
        {activeTab === 'finanse' && (
          <View>
            <Text style={styles.pageMainTitle}>Finanse i Składki 💰</Text>
            <Text style={styles.pageSubTitle}>Monitoruj wpłaty i generuj przypomnienia dla zadłużonych zawodników</Text>

            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardSectionTitle}>Zadłużenie bieżące</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#dc2626' }]}>WYMAGA AKCJI</Text>
                </View>
              </View>

              {players.filter(p => (p.balance || 0) < 0).length === 0 ? (
                <View style={[styles.emptyBox, { marginTop: 12, padding: 16 }]}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#16a34a" />
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#15803d', marginTop: 8 }}>Wszyscy mają uregulowane składki!</Text>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  {players.filter(p => (p.balance || 0) < 0).map(player => (
                    <View key={player.id} style={styles.bulkRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{player.firstName} {player.lastName || ''}</Text>
                        <Text style={{ fontSize: 11, color: '#64748b' }}>Rocznik {player.year}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#dc2626' }}>{player.balance} PLN</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.sendKitOfferBtn, { backgroundColor: '#16a34a', marginTop: 16 }]}
                    onPress={async () => {
                      const debtors = players.filter(p => (p.balance || 0) < 0);
                      const dList = debtors.map(p => `• ${p.firstName} ${p.lastName || ''} (${p.balance} PLN)`).join(String.fromCharCode(10));
                      const msg = `Drodzy Rodzice! ⚽\nUprzejmie przypominam o uregulowaniu zaległych składek członkowskich za bieżący miesiąc. Pozwala nam to na płynne opłacanie boisk i sprzętu.\n\nLista nieuregulowanych płatności:\n${dList}\n\nDziękuję i pozdrawiam serdecznie!`;
                      await Clipboard.setStringAsync(msg);
                      showNotice('Skopiowano! 📱', 'Gotowy tekst z przypomnieniem został skopiowany do schowka. Możesz go wkleić bezpośrednio na grupowego WhatsAppa lub SMSa.');
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={styles.sendKitOfferBtnText}>Generuj prośbę o wpłaty (Kopiuj do WhatsApp)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================== ZAKŁADKA 4: KADRA I RODO ONBOARDING ==================== */}
        {activeTab === 'kadra' && (
          <View>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pageMainTitle}>Kadra i Podopieczni ({players.length})</Text>
              <TouchableOpacity
                style={styles.addPlayerPrimaryBtn}
                onPress={() => setAddPlayerModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addPlayerPrimaryText}>Zaproś / Dodaj</Text>
              </TouchableOpacity>
            </View>

            {players.map((player) => (
              <View key={player.id} style={styles.whiteCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberCircleText}>#{player.number || '10'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a' }}>
                      {player.firstName} {player.lastName || ''}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>
                      {player.position} • Rocznik {player.year} • XP Awatara: {player.xp || 300}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', marginTop: 2 }}>
                      🔑 Kod parowania dla Rodzica: {player.inviteCode || 'BRAK'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ==================== ZAKŁADKA 5: USTAWIENIA KLUBU I PROFILU TRENERA ==================== */}
        {activeTab === 'ustawienia' && (
          <View style={styles.whiteCard}>
            <Text style={styles.cardSectionTitle}>Konfiguracja Profilu Trenera i Modułów</Text>

            <View style={styles.settingItemRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.settingItemTitle}>Tylko treningi indywidualne (1-on-1)</Text>
                <Text style={styles.settingItemSub}>
                  Ukrywa funkcje drużynowe na Pulpicie dla trenerów personalnych / motorycznych
                </Text>
              </View>
              <Switch
                value={coachWorkMode === 'individual_only'}
                onValueChange={(val) => setCoachWorkMode(val ? 'individual_only' : 'both')}
              />
            </View>

            <View style={styles.settingItemRow}>
              <Text style={styles.settingItemTitle}>Integracja Apple Health / Google Health Connect</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, features?.enableWearables && styles.toggleBtnActive]}
                onPress={() => toggleFeature('enableWearables')}
              >
                <Text style={styles.toggleBtnText}>{features?.enableWearables ? 'WŁĄCZONY' : 'WYŁĄCZONY'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingItemRow}>
              <Text style={styles.settingItemTitle}>Zadania AI (MediaPipe) + Ekran Rozgrzewki</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, features?.enableAiTasks && styles.toggleBtnActive]}
                onPress={() => toggleFeature('enableAiTasks')}
              >
                <Text style={styles.toggleBtnText}>{features?.enableAiTasks ? 'WŁĄCZONY' : 'WYŁĄCZONY'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: GOTOWY RAPORT ZAMÓWIENIA DLA HURTOWNI (1-KLIK) */}
      <Modal visible={orderReportModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWhiteBox}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>📦 Gotowy Raport do Zamówienia (Skopiowano!)</Text>
              <TouchableOpacity onPress={() => setOrderReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: 'bold', marginTop: 4 }}>
              ✅ Tekst raportu został automatycznie skopiowany do schowka — możesz go od razu wkleić w mailu lub wiadomości do hurtowni:
            </Text>

            <ScrollView style={styles.reportPreviewScroll}>
              <Text style={styles.reportPreviewMonoText}>{generatedOrderReportText}</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.greenSaveScheduleBtn}
              onPress={() => setOrderReportModalVisible(false)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.greenSaveScheduleText}>Zamknij podgląd raportu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ZADANIA DOMOWE AI DLA TRENINGU 1-ON-1 / GRUPY */}
      <Modal visible={homeworkModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWhiteBox}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>🏆 Przypisz Zadanie Domowe AI</Text>
              <TouchableOpacity onPress={() => setHomeworkModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748b', marginVertical: 6 }}>
              Dla: {homeworkTargetSession?.playerNames.join(', ')}
            </Text>

            <View style={styles.warmupWarningBox}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>
                  🛡️ Bezpieczeństwo Zdrowotne (Bumper Rozgrzewki)
                </Text>
                <Text style={{ fontSize: 10, color: '#92400e' }}>
                  Wymuszaj 3-minutowy moduł rozgrzewkowy i klauzulę bezpieczeństwa przed uruchomieniem kamery AI
                </Text>
              </View>
              <Switch
                value={includeWarmupRequirement}
                onValueChange={setIncludeWarmupRequirement}
              />
            </View>

            {/* KONFIGURATOR SERII, POWTÓRZEŃ/CZASU I PRZERWY DLA ZADANIA DOMOWEGO */}
            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
                ⚙️ Ustaw parametry obciążenia (Progresja):
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 3 }}>LICZBA SERII</Text>
                  <TextInput
                    style={[styles.lightInput, { textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff', paddingVertical: 6 }]}
                    keyboardType="numeric"
                    value={hwSets}
                    onChangeText={setHwSets}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 3 }}>POWT. / SEKUNDY</Text>
                  <TextInput
                    style={[styles.lightInput, { textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff', paddingVertical: 6 }]}
                    keyboardType="numeric"
                    value={hwRepsOrSec}
                    onChangeText={setHwRepsOrSec}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 3 }}>PRZERWA (SEK.)</Text>
                  <TextInput
                    style={[styles.lightInput, { textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff', paddingVertical: 6 }]}
                    keyboardType="numeric"
                    value={hwRestSec}
                    onChangeText={setHwRestSec}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <TouchableOpacity
                  style={styles.miniActionChip}
                  onPress={() => { setHwSets('3'); setHwRepsOrSec('12'); setHwRestSec('45'); }}
                >
                  <Text style={styles.miniActionChipText}>Tydz. 1 (3x12, 45s)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniActionChip}
                  onPress={() => { setHwSets('5'); setHwRepsOrSec('15'); setHwRestSec('30'); }}
                >
                  <Text style={styles.miniActionChipText}>Progres (5x15, 30s)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniActionChip}
                  onPress={() => { setHwSets('5'); setHwRepsOrSec('30'); setHwRestSec('20'); }}
                >
                  <Text style={styles.miniActionChipText}>🔥 Miesiąc +1 (5x30)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 280, marginTop: 8 }}>
              {AI_HOMEWORK_EXERCISES.map((ex) => {
                const sNum = Math.max(1, parseInt(hwSets, 10) || ex.defaultSets);
                const rNum = Math.max(1, parseInt(hwRepsOrSec, 10) || ex.defaultReps);
                const restNum = Math.max(0, parseInt(hwRestSec, 10) || ex.defaultRest);
                const calcXp = sNum * ex.xpPerSet;

                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={styles.exerciseChoiceCard}
                    onPress={() => handleAssignHomework(ex)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>{ex.title}</Text>
                      <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', marginTop: 2 }}>
                        Plan: {sNum} serie x {rNum} {ex.unit} • Przerwa: {restNum}s
                      </Text>
                    </View>
                    <View style={styles.xpPill}>
                      <Text style={styles.xpPillText}>+{calcXp} XP</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: DODAWANIE ZAWODNIKA (MINIMALIZACJA RODO + ZGODA PAPIEROWA) */}
      <Modal visible={addPlayerModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWhiteBox}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Zaproś Zawodnika (RODO Onboarding)</Text>
              <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              <Text style={styles.fieldMiniLabel}>IMIĘ ZAWODNIKA *</Text>
              <TextInput
                style={styles.lightInput}
                placeholder="np. Aleksander"
                value={newFirstName}
                onChangeText={setNewFirstName}
              />

              <Text style={styles.fieldMiniLabel}>NAZWISKO (OPCJONALNIE PRZED ZGODĄ RODZICA)</Text>
              <TextInput
                style={styles.lightInput}
                placeholder="np. Nicota"
                value={newLastName}
                onChangeText={setNewLastName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldMiniLabel}>NUMER</Text>
                  <TextInput
                    style={styles.lightInput}
                    keyboardType="numeric"
                    value={newNumber}
                    onChangeText={setNewNumber}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldMiniLabel}>ROCZNIK</Text>
                  <TextInput
                    style={styles.lightInput}
                    keyboardType="numeric"
                    value={newYear}
                    onChangeText={setNewYear}
                  />
                </View>
              </View>

              <View style={styles.recurringBoxRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                    📄 Posiadam podpisaną Zgodę Papierową (RODO)
                  </Text>
                  <Text style={{ fontSize: 10, color: '#64748b' }}>
                    Pozwala aktywować profil zanim rodzic zaloguje się kodem
                  </Text>
                </View>
                <Switch value={paperConsentSigned} onValueChange={setPaperConsentSigned} />
              </View>

              <TouchableOpacity
                style={styles.greenSaveScheduleBtn}
                onPress={handleAddPlayer}
                disabled={savingPlayer}
              >
                <Text style={styles.greenSaveScheduleText}>
                  {savingPlayer ? 'Generowanie kodu...' : 'Utwórz Profil i Wygeneruj Kod dla Rodzica'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* MODAL 4: KREATOR WŁASNEGO TESTU MOTORYCZNEGO */}
      <Modal visible={customTestModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWhiteBox}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>✨ Kreator Własnego Testu</Text>
              <TouchableOpacity onPress={() => setCustomTestModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldMiniLabel}>NAZWA TESTU *</Text>
            <TextInput
              style={styles.lightInput}
              placeholder="np. Test Illinois, Żonglerka 60s, Rzut piłką"
              value={ctName}
              onChangeText={setCtName}
            />

            <Text style={styles.fieldMiniLabel}>JEDNOSTKA POMIARU</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {(['s', 'cm', 'm', 'powt.', 'pkt'] as MotorTestUnit[]).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.quickSizeBtn, ctUnit === u && styles.quickSizeBtnActive]}
                  onPress={() => setCtUnit(u)}
                >
                  <Text style={[styles.quickSizeBtnText, ctUnit === u && { color: '#fff', fontWeight: 'bold' }]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldMiniLabel}>KIERUNEK PROGRESU (CO JEST REKORDEM?)</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                style={[styles.quickSizeBtn, { flex: 1, alignItems: 'center' }, ctDirection === 'lower' && styles.quickSizeBtnActive]}
                onPress={() => setCtDirection('lower')}
              >
                <Text style={[styles.quickSizeBtnText, ctDirection === 'lower' && { color: '#fff', fontWeight: 'bold' }]}>
                  ⬇️ Mniej = lepiej (czas)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickSizeBtn, { flex: 1, alignItems: 'center' }, ctDirection === 'higher' && styles.quickSizeBtnActive]}
                onPress={() => setCtDirection('higher')}
              >
                <Text style={[styles.quickSizeBtnText, ctDirection === 'higher' && { color: '#fff', fontWeight: 'bold' }]}>
                  ⬆️ Więcej = lepiej
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recurringBoxRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>Włącz wbudowany Stoper</Text>
                <Text style={{ fontSize: 10, color: '#64748b' }}>Przydatne przy pomiarach w sekundach</Text>
              </View>
              <Switch value={ctUseStopwatch} onValueChange={setCtUseStopwatch} />
            </View>

            <TouchableOpacity style={styles.greenSaveScheduleBtn} onPress={handleCreateCustomTest}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.greenSaveScheduleText}>Dodaj kafelek testu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: WPISYWANIE WYNIKU TESTU + STOPER + NORMALIZACJA PRZECINKA/KROPKI */}
      <Modal visible={!!activeMotorTest} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWhiteBox}>
            {activeMotorTest && (
              <>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardSectionTitle}>
                    {activeMotorTest.icon} {activeMotorTest.name} ({activeMotorTest.unit})
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSwRunning(false);
                      setActiveMotorTest(null);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldMiniLabel}>WYBIERZ ZAWODNIKA:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {players.map((p) => {
                    const isSel = String(p.id) === String(testTargetPlayerId);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerSelectChip, isSel && styles.playerSelectChipActive]}
                        onPress={() => setTestTargetPlayerId(String(p.id))}
                      >
                        <Text style={[styles.playerSelectChipText, isSel && { color: '#fff', fontWeight: 'bold' }]}>
                          #{p.number} {p.firstName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {activeMotorTest.useStopwatch && (
                  <View style={styles.stopwatchBox}>
                    <Text style={styles.stopwatchTime}>{(swMs / 1000).toFixed(2)} s</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.miniActionChip, { backgroundColor: swRunning ? '#dc2626' : '#16a34a', borderColor: 'transparent', paddingHorizontal: 14, paddingVertical: 7 }]}
                        onPress={() => {
                          if (swRunning) {
                            setSwRunning(false);
                            setTestRawValue((swMs / 1000).toFixed(2));
                          } else {
                            setSwRunning(true);
                          }
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                          {swRunning ? '⏹ Stop i wpisz' : '▶ Start'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniActionChip, { paddingHorizontal: 12, paddingVertical: 7 }]}
                        onPress={() => {
                          setSwRunning(false);
                          setSwMs(0);
                        }}
                      >
                        <Text style={styles.miniActionChipText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <Text style={styles.fieldMiniLabel}>
                  WYNIK ({activeMotorTest.unit}) — wpisz z przecinkiem lub kropką (np. 3,76 albo 3.76):
                </Text>
                <TextInput
                  style={styles.lightInput}
                  keyboardType="decimal-pad"
                  placeholder={`np. ${activeMotorTest.unit === 's' ? '3,76' : '185'}`}
                  value={testRawValue}
                  onChangeText={setTestRawValue}
                />

                {testRawValue.trim().length > 0 && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      marginTop: 4,
                      color: parseNumericInput(testRawValue) !== null ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {parseNumericInput(testRawValue) !== null
                      ? `✅ Rozpoznano jako: ${parseNumericInput(testRawValue)} ${activeMotorTest.unit}`
                      : '⚠️ Wpisz poprawną liczbę'}
                  </Text>
                )}

                <TouchableOpacity style={styles.greenSaveScheduleBtn} onPress={handleSaveMotorTestResult}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.greenSaveScheduleText}>Zapisz wynik zawodnika</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  topDarkBar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginRight: 4, flexShrink: 1 },
  sportPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
  },
  sportPillText: { fontSize: 11, color: '#38bdf8', fontWeight: 'bold' },
  eliteBadge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eliteBadgeText: { fontSize: 10, fontWeight: '900', color: '#0f172a' },
  logoutIconBtn: { padding: 6, backgroundColor: '#1e293b', borderRadius: 8 },

  coachModeBanner: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  coachModeLabel: { fontSize: 11, fontWeight: 'bold', color: '#1e40af' },
  modeSwitchChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  modeSwitchChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeSwitchText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  modeSwitchTextActive: { color: '#fff' },

  subTabsWrapper: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subTabsScroll: { paddingHorizontal: 14, gap: 8 },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    gap: 5,
  },
  pillTabActive: { backgroundColor: '#2563eb' },
  pillTabText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  pillTabTextActive: { color: '#fff' },

  content: { padding: 16 },
  pageMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flexShrink: 1 },
  pageSubTitle: { fontSize: 12, color: '#64748b', marginBottom: 12 },

  liveHeaderToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 4 },
  simLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 4,
  },
  simLiveBtnActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  simLiveBtnText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },

  liveCardTeam: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  liveCardIndividual: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#7c3aed',
    elevation: 3,
  },
  liveBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  liveRedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  liveDotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveRedPillText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  liveTimeText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  liveEventTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  liveEventSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  liveQuickActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  markAllPresentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  markAllPresentText: { fontSize: 11, fontWeight: 'bold', color: '#15803d' },
  emptyLiveNotice: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 },
  livePlayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  livePlayerName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  attQuickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  attQuickBtnPresent: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  attQuickBtnAbsent: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  attQuickText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },

  indCompleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  indCompleteBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  indHomeworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  indHomeworkBtnText: { fontSize: 12, fontWeight: 'bold', color: '#854d0e' },

  noLiveBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  noLiveTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  noLiveSub: { fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  quickStatsGrid: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#2563eb' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 2, textAlign: 'center' },

  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  cardSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  modeTogglePill: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 2 },
  modeMiniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  modeMiniBtnActive: { backgroundColor: '#2563eb' },
  modeMiniText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  modeMiniTextActive: { color: '#fff' },

  playerSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  playerSelectChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  playerSelectChipText: { fontSize: 12, color: '#334155' },

  fieldMiniLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4, marginTop: 6 },
  lightInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  recurringBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  greenSaveScheduleBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  greenSaveScheduleText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  coachNoteGrayBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginTop: 8 },
  assignedHomeworkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  assignedHomeworkText: { fontSize: 11, fontWeight: 'bold', color: '#854d0e' },
  blueRealizedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  blueRealizedBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  yellowHomeworkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  yellowHomeworkBtnText: { fontSize: 12, fontWeight: 'bold', color: '#854d0e' },

  photoSlotCard: {
    width: 120,
    height: 82,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    padding: 6,
    position: 'relative',
  },
  deletePhotoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  photoSlotText: { fontSize: 10, color: '#334155', textAlign: 'center', marginTop: 4 },
  addMorePhotoBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  addMorePhotoText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },

  fullSizeRangeBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  sizeTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  sizeTagPillHasOrders: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  sizeTagText: { fontSize: 11, fontWeight: 'bold', color: '#0369a1' },
  removeSizeChartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },

  recipientSectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  miniActionChipText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  yearFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    marginRight: 6,
  },
  yearFilterPillActive: { backgroundColor: '#2563eb' },
  yearFilterPillText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  yearFilterPillTextActive: { color: '#fff' },
  sendKitOfferBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  sendKitOfferBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  playerSizeAssignmentSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  playerKitRowCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignedSizeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assignedSizeBadgeText: { fontSize: 11, fontWeight: '900', color: '#1e40af' },
  paidStatusChip: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidStatusChipActive: { backgroundColor: '#dcfce7' },
  paidStatusChipText: { fontSize: 10, fontWeight: 'bold', color: '#b45309' },
  quickSizeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickSizeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  quickSizeBtnText: { fontSize: 11, color: '#334155', fontWeight: '600' },

  coachSummaryBox: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  sizeCountBadge: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  sizeCountText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  oneClickReportBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
    gap: 8,
  },
  oneClickReportBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  reportPreviewScroll: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    maxHeight: 340,
  },
  reportPreviewMonoText: {
    color: '#f8fafc',
    fontSize: 11,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  addPlayerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addPlayerPrimaryText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  numberCircleText: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' },

  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingItemTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  settingItemSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  toggleBtn: { backgroundColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#16a34a' },
  toggleBtnText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalWhiteBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '88%' },
  warmupWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  exerciseChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  xpPill: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  xpPillText: { fontSize: 11, fontWeight: 'bold', color: '#15803d' },

  exportExcelBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#15803d',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  motorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  motorTile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motorTileTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  motorTileMeta: { fontSize: 10, color: '#64748b', marginTop: 4 },
  customTestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  customTestBadgeText: { fontSize: 9, fontWeight: '900', color: '#2563eb' },
  addCustomTestTile: {
    width: '48%',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomTestTitle: { fontSize: 13, fontWeight: 'bold', color: '#1d4ed8', marginTop: 4 },
  addCustomTestSub: { fontSize: 10, color: '#3b82f6', marginTop: 2, textAlign: 'center' },
  stopwatchBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginVertical: 8,
  },
  stopwatchTime: { fontSize: 32, fontWeight: '900', color: '#38bdf8' },
});
