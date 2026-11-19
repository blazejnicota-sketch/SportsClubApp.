import React, { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, MentalAgeStage } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

interface StageMeta {
  id: MentalAgeStage;
  title: string;
  shortLabel: string;
  categoryName: string;
  emoji: string;
  accent: string;
  subtitle: string;
}

const AGE_STAGES: StageMeta[] = [
  {
    id: '8-10',
    title: 'Odkrywca (8–10 lat)',
    shortLabel: '8–10',
    categoryName: 'Żak / Orlik',
    emoji: '🌟',
    accent: '#0ea5e9',
    subtitle: 'Proste emocje, zabawa w spokój i radość z gry',
  },
  {
    id: '11-13',
    title: 'Budowniczy (11–13 lat)',
    shortLabel: '11–13',
    categoryName: 'Młodzik',
    emoji: '🧱',
    accent: '#16a34a',
    subtitle: 'Energia, reset po błędzie i zdrowe nawyki',
  },
  {
    id: '14-15',
    title: 'Wojownik (14–15 lat)',
    shortLabel: '14–15',
    categoryName: 'Trampkarz',
    emoji: '⚡',
    accent: '#7c3aed',
    subtitle: 'Skok wzrostowy, hejt w sieci i odporność na presję',
  },
  {
    id: '16-18',
    title: 'Profesjonalista (16–18 lat)',
    shortLabel: '16–18',
    categoryName: 'Junior / Senior',
    emoji: '🏆',
    accent: '#0f172a',
    subtitle: 'Dziennik gotowości, wizualizacja, matura i anty-wypalenie',
  },
];

const detectAgeStageFromYear = (birthYear?: string | number): MentalAgeStage => {
  const yr = Number(birthYear);
  if (!yr || isNaN(yr)) return '11-13';
  const currentYear = new Date().getFullYear();
  const age = currentYear - yr;
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  if (age <= 15) return '14-15';
  return '16-18';
};

interface MicroLesson {
  id: string;
  title: string;
  duration: string;
  icon: string;
  tag: string;
  summary: string;
  steps: string[];
}

const KID_MOOD_OPTIONS = [
  { score: 5, emoji: '😄', label: 'Super!', bg: '#dcfce7', border: '#16a34a' },
  { score: 3, emoji: '😐', label: 'Tak sobie', bg: '#fef9c3', border: '#ca8a04' },
  { score: 1, emoji: '😢', label: 'Źle', bg: '#fee2e2', border: '#dc2626' },
];

const FULL_MOOD_OPTIONS = [
  { score: 1, emoji: '😞', label: 'Źle', color: '#dc2626' },
  { score: 2, emoji: '😰', label: 'Stres', color: '#ea580c' },
  { score: 3, emoji: '😐', label: 'Zmęczony', color: '#ca8a04' },
  { score: 4, emoji: '🙂', label: 'Dobrze', color: '#16a34a' },
  { score: 5, emoji: '😄', label: 'Super!', color: '#059669' },
];

const EXPLORER_CHALLENGES = [
  { id: 'ch-1', icon: '🖐️', text: 'Przybij piątkę 3 kolegom po treningu lub meczu.' },
  { id: 'ch-2', icon: '💬', text: 'Gdy nie wyjdzie podanie, powiedz: „Następna akcja będzie super!”.' },
  { id: 'ch-3', icon: '😊', text: 'Powiedz mamie lub tacie jedną rzecz, która była dziś fajna na boisku.' },
];

const LESSONS_BY_STAGE: Record<Exclude<MentalAgeStage, '8-10'>, MicroLesson[]> = {
  '11-13': [
    {
      id: 'b-1',
      title: 'Reset w 5 sekund po stracie piłki',
      duration: '1 min',
      icon: '🔄',
      tag: 'Reset po błędzie',
      summary: 'Każdy zawodnik traci piłkę — liczy się to, co zrobisz w kolejnych 3 sekundach.',
      steps: [
        '1. Nie spuszczaj głowy i nie machaj rękami — ciało wysyła sygnał do mózgu.',
        '2. Zrób szybki wydech i od razu rusz do odbioru lub ustaw się w obronie.',
        '3. Kolejne podanie zagraj prosto i pewnie, żeby odzyskać rytm.',
      ],
    },
    {
      id: 'b-2',
      title: 'Przestań się porównywać z innymi',
      duration: '2 min',
      icon: '📈',
      tag: 'Pewność siebie',
      summary: 'Każdy rozwija się w innym tempie. Twoim jedynym rywalem jesteś Ty z zeszłego tygodnia.',
      steps: [
        '1. Zapisz swoją jedną mocną stronę na boisku (np. lewa noga, walka, szybkość).',
        '2. Zamiast zazdrościć koledze zwodu, podpatrz jak go robi i potrenuj go w domu.',
        '3. Doceniaj małe postępy, nie tylko strzelone gole.',
      ],
    },
    {
      id: 'b-3',
      title: 'Szatnia to drużyna — jak rozwiązywać spory',
      duration: '1 min',
      icon: '🤝',
      tag: 'Relacje w grupie',
      summary: 'Zgrany zespół zawsze wygrywa z grupą obrażonych na siebie indywidualistów.',
      steps: [
        '1. Jeśli ktoś na boisku krzyknie w emocjach, porozmawiaj z nim spokojnie po treningu.',
        '2. Wspieraj kolegę, który właśnie popełnił błąd — za chwilę sam możesz potrzebować wsparcia.',
        '3. Gdy żarty przestają być śmieszne dla drugiej osoby, powiedz „stop”.',
      ],
    },
  ],
  '14-15': [
    {
      id: 'w-1',
      title: 'Skok wzrostowy i chwilowy spadek formy',
      duration: '2 min',
      icon: '📏',
      tag: 'Okres dojrzewania',
      summary: 'Gdy szybko rośniesz, koordynacja na chwilę spada. To normalna biologia, nie brak talentu.',
      steps: [
        '1. Twój mózg musi na nowo „skalibrować” dłuższe nogi i ręce — to mija po kilku miesiącach.',
        '2. Nie rezygnuj ze sportu z frustracji — skup się na mobilności i dokładności podań.',
        '3. Porozmawiaj z rodzicem lub trenerem, gdy czujesz ból kolan lub pięt podczas szybkiego wzrostu.',
      ],
    },
    {
      id: 'w-2',
      title: 'Tarcza na hejt w sieci i w szkole',
      duration: '2 min',
      icon: '🛡️',
      tag: 'Bezpieczeństwo',
      summary: 'Jak chronić swoją głowę przed złośliwymi komentarzami na TikToku, Instagramie i w klasie.',
      steps: [
        '1. Nie odpowiadaj w emocjach — zrób zrzut ekranu, zablokuj i zgłoś konto.',
        '2. Pamiętaj: anonimowy hejt świadczy o problemach piszącego, nie o Twojej wartości.',
        '3. Jeśli hejt się powtarza, powiedz o tym zaufanemu dorosłemu lub zadzwoń na 116 111.',
      ],
    },
    {
      id: 'w-3',
      title: 'Kryzys motywacji — kiedy masz dość treningów',
      duration: '2 min',
      icon: '🔥',
      tag: 'Odporność psychiczna',
      summary: 'W wieku 14–15 lat wiele osób ma gorszy moment. Zobacz, jak mądrze przetrwać dołek.',
      steps: [
        '1. Zastanów się, czy masz dość sportu, czy po prostu jesteś przemęczony szkołą i presją.',
        '2. Zrób 2–3 dni pełnego resetu głowy (bez oglądania meczów i myślenia o tabeli).',
        '3. Przypomnij sobie, dlaczego w ogóle zacząłeś trenować tę dyscyplinę.',
      ],
    },
  ],
  '16-18': [
    {
      id: 'p-1',
      title: 'Presja skautów, wyniku i walki o skład',
      duration: '2 min',
      icon: '🎯',
      tag: 'Mentalność meczowa',
      summary: 'Jak grać swoje na 100%, gdy na trybunach siedzą skauci lub waży się awans do seniorów.',
      steps: [
        '1. Przenieś uwagę z wyniku („muszę wypaść idealnie”) na proces („pierwsze 3 podania gram pewnie”).',
        '2. Zaakceptuj podwyższone tętno przed gwizdkiem — to adrenalina gotowa do działania, nie wróg.',
        '3. Przed wyjściem na murawę wykonaj 4 cykle Oddechu Pudełkowego 4-4-4-4.',
      ],
    },
    {
      id: 'p-2',
      title: 'Balans: matura, intensywne treningi i wypalenie',
      duration: '2 min',
      icon: '⚖️',
      tag: 'Anty-wypalenie',
      summary: 'Chroniczne przeciążenie psychiczne obniża regenerację mięśni i zwiększa ryzyko urazów.',
      steps: [
        '1. Monitoruj swój prywatny Wskaźnik Gotowości — sen poniżej 7h przez 3 dni to sygnał ostrzegawczy.',
        '2. Zaplanuj jeden blok w tygodniu wyłącznie na regenerację psychiczną poza sportem i nauką.',
        '3. W tygodniach z dużą liczbą egzaminów daj sobie prawo do lżejszej regeneracji.',
      ],
    },
    {
      id: 'p-3',
      title: 'Powrót do gry po kontuzji (lęk przed kontaktem)',
      duration: '2 min',
      icon: '🩹',
      tag: 'Rehabilitacja mentalna',
      summary: 'Ciało bywa gotowe szybciej niż głowa. Jak odbudować zaufanie do własnego kolana lub kostki.',
      steps: [
        '1. Codziennie przez 2 minuty wizualizuj pewne, bezbolesne wejście w pojedynek i zmianę kierunku.',
        '2. Wracaj stopniowo: najpierw trening bezkontaktowy, potem małe gry, dopiero potem pełny mecz.',
        '3. Każde udane starcie traktuj jako dowód dla mózgu, że ciało jest już silne.',
      ],
    },
  ],
};

export default function MentalSpaceScreen() {
  const { players } = usePlayers();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [manualStageOverride, setManualStageOverride] = useState<MentalAgeStage | null>(null);

  const currentPlayer = useMemo(() => {
    return players.find((p) => String(p.id) === String(selectedPlayerId)) || players[0] || null;
  }, [players, selectedPlayerId]);

  const autoDetectedStage = useMemo<MentalAgeStage>(() => {
    return detectAgeStageFromYear(currentPlayer?.year);
  }, [currentPlayer?.year]);

  const activeStage: MentalAgeStage = manualStageOverride || autoDetectedStage;
  const activeStageMeta = AGE_STAGES.find((s) => s.id === activeStage) || AGE_STAGES[1];

  // Prywatne stany lokalne (nie są nigdzie wysyłane ani zapisywane na serwerze)
  const [moodScore, setMoodScore] = useState<number>(4);
  const [energyLevel, setEnergyLevel] = useState<number>(4); // 11-13
  const [stressLevel, setStressLevel] = useState<number>(2); // 14-18
  const [mentalLoad, setMentalLoad] = useState<number>(2); // 16-18
  const [sleepHours, setSleepHours] = useState<string>('8.5');
  const [noPhoneBeforeSleep, setNoPhoneBeforeSleep] = useState<boolean>(true); // 11-13
  const [privateTip, setPrivateTip] = useState<string | null>(null);

  // 8-10: ukończone mikro-wyzwania
  const [doneChallenges, setDoneChallenges] = useState<Record<string, boolean>>({});

  // 16-18: wizualizacja 3 akcji przedmeczowych
  const [vizModalVisible, setVizModalVisible] = useState<boolean>(false);
  const [vizAction1, setVizAction1] = useState<string>('');
  const [vizAction2, setVizAction2] = useState<string>('');
  const [vizAction3, setVizAction3] = useState<string>('');

  // Modal mikronauki
  const [activeLesson, setActiveLesson] = useState<MicroLesson | null>(null);

  // Ćwiczenie oddechowe (8-10: Balonik Spokoju, 11-18: Oddech Pudełkowy 4-4-4-4)
  const [breathingVisible, setBreathingVisible] = useState<boolean>(false);
  const [breathingRunning, setBreathingRunning] = useState<boolean>(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState<number>(0);
  const [breathSecLeft, setBreathSecLeft] = useState<number>(4);

  const BREATH_PHASES =
    activeStage === '8-10'
      ? [
          { label: 'NADMUCHAJ BALONIK (WDECH NOSEM)', color: '#0ea5e9', icon: '🎈' },
          { label: 'PRZYTRZYMAJ BALONIK', color: '#8b5cf6', icon: '✨' },
          { label: 'POWOLI WYPUŚĆ POWIETRZE', color: '#16a34a', icon: '🌬️' },
          { label: 'UŚMIECH I SPOKÓJ', color: '#f59e0b', icon: '😊' },
        ]
      : [
          { label: 'WDECH NOSEM', color: '#2563eb', icon: '⬆️' },
          { label: 'ZATRZYMAJ POWIETRZE', color: '#7c3aed', icon: '⏸️' },
          { label: 'POWOLNY WYDECH', color: '#16a34a', icon: '⬇️' },
          { label: 'PAUZA / KONCENTRACJA', color: '#0284c7', icon: '🎯' },
        ];

  useEffect(() => {
    if (!breathingRunning) return;
    const timer = setTimeout(() => {
      if (breathSecLeft > 1) {
        setBreathSecLeft((prev) => prev - 1);
      } else {
        setBreathPhaseIndex((prev) => (prev + 1) % 4);
        setBreathSecLeft(4);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [breathingRunning, breathSecLeft]);

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleCallNumber = (phone: string, label: string) => {
    const url = `tel:${phone}`;
    if (Platform.OS === 'web') {
      window.alert(`${label}: zadzwoń pod numer ${phone}`);
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert(label, `Zadzwoń pod numer: ${phone}`);
    });
  };

  // Prywatny wskaźnik Readiness % dla 16-18
  const readinessPercent = useMemo(() => {
    const sleepNum = Math.min(10, Math.max(4, parseFloat(sleepHours.replace(',', '.')) || 8));
    const sleepScore = ((sleepNum - 4) / 6) * 100;
    const moodPct = (moodScore / 5) * 100;
    const stressPct = ((6 - stressLevel) / 5) * 100;
    const loadPct = ((6 - mentalLoad) / 5) * 100;
    return Math.round((moodPct + stressPct + loadPct + sleepScore) / 4);
  }, [moodScore, stressLevel, mentalLoad, sleepHours]);

  // Lokalna analiza samopoczucia — 0 danych wysyłanych do trenera i na serwer
  const handlePrivateCheckIn = () => {
    if (activeStage === '8-10') {
      if (moodScore <= 1) {
        setPrivateTip(
          'Każdy ma czasem gorszy dzień! Kliknij poniżej „Balonik Spokoju” i pobaw się chwilę w oddychanie, a potem powiedz mamie lub tacie, co Cię martwi.'
        );
      } else if (moodScore === 3) {
        setPrivateTip(
          'Dzień „tak sobie” też jest okej! Zrób 3 spokojne oddechy i spróbuj dziś zaliczyć choć jedną misję na boisku.'
        );
      } else {
        setPrivateTip('Super energia! 🌟 Baw się świetnie na treningu i przybij piątkę kolegom!');
      }
      return;
    }

    if (activeStage === '11-13') {
      if (moodScore <= 2 || energyLevel <= 2) {
        setPrivateTip(
          'Twoja bateria jest dziś niżej. Przed treningiem zrób 2 minuty Oddechu 4-4-4-4, a wieczorem połóż się spać bez telefonu.'
        );
      } else {
        setPrivateTip(
          'Dobra gotowość! Skup się na pierwszym pewnym podaniu i ciesz się grą. Pamiętaj: nikt inny nie widzi tego ekranu.'
        );
      }
      return;
    }

    if (stressLevel >= 4 || moodScore <= 2) {
      setPrivateTip(
        'Masz dziś podwyższony stres lub gorszy nastrój. Zrób teraz 4 cykle Oddechu Pudełkowego 4-4-4-4, żeby zbić tętno i oczyścić głowę przed grą.'
      );
    } else if (activeStage === '16-18' && readinessPercent < 60) {
      setPrivateTip(
        `Twój prywatny wskaźnik gotowości to ${readinessPercent}%. Zadbaj dziś o nawodnienie, dłuższą regenerację i spokojny sen.`
      );
    } else {
      setPrivateTip(
        activeStage === '16-18'
          ? `Świetna gotowość (${readinessPercent}%)! Możesz teraz odpalić Wizualizację 3 Akcji, żeby wejść w tryb meczowy.`
          : 'Głowa jest dziś gotowa do działania! Powodzenia na treningu lub meczu.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mental Space 🧠✨</Text>
          <Text style={styles.headerSubtitle}>
            Twoja prywatna strefa spokoju, koncentracji i pewności siebie
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* BANER 100% PRYWATNOŚCI */}
        <View style={styles.privacyBanner}>
          <Ionicons name="lock-closed" size={18} color="#15803d" />
          <Text style={styles.privacyText}>
            100% Prywatne: to przestrzeń wyłącznie dla Ciebie. Trener ani klub nie widzą Twoich wyborów — nic nie jest wysyłane na serwer.
          </Text>
        </View>

        {/* WYBÓR ETAPU WIEKOWEGO (AUTO Z ROCZNIKA LUB RĘCZNIE) */}
        <View style={styles.card}>
          <View style={styles.stageHeaderRow}>
            <Text style={styles.sectionTitle}>Dopasowanie do wieku (8–18 lat):</Text>
            {manualStageOverride && (
              <TouchableOpacity onPress={() => setManualStageOverride(null)}>
                <Text style={styles.resetAutoText}>Auto ({autoDetectedStage})</Text>
              </TouchableOpacity>
            )}
          </View>

          {players.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {players.map((p) => {
                const isSel = String(p.id) === String(currentPlayer?.id);
                const pStage = detectAgeStageFromYear(p.year);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, isSel && styles.playerChipActive]}
                    onPress={() => {
                      setSelectedPlayerId(String(p.id));
                      setManualStageOverride(null);
                      setPrivateTip(null);
                    }}
                  >
                    <Text style={[styles.playerChipText, isSel && styles.playerChipTextActive]}>
                      #{p.number} {p.firstName} ({pStage} lat)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.stagesGrid}>
            {AGE_STAGES.map((st) => {
              const isSel = activeStage === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.stagePill,
                    isSel && { backgroundColor: st.accent, borderColor: st.accent },
                  ]}
                  onPress={() => {
                    setManualStageOverride(st.id);
                    setPrivateTip(null);
                  }}
                >
                  <Text style={[styles.stagePillTitle, isSel && { color: '#fff' }]}>
                    {st.emoji} {st.shortLabel} lat
                  </Text>
                  <Text style={[styles.stagePillSub, isSel && { color: '#e2e8f0' }]}>
                    {st.categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.stageBanner, { borderLeftColor: activeStageMeta.accent }]}>
            <Text style={styles.stageBannerTitle}>
              {activeStageMeta.emoji} Tryb: {activeStageMeta.title}
            </Text>
            <Text style={styles.stageBannerSub}>{activeStageMeta.subtitle}</Text>
          </View>
        </View>

        {/* ================= ETAP 1: ODKRYWCA (8–10 LAT) ================= */}
        {activeStage === '8-10' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>1. Jak się dzisiaj czujesz? 🌟</Text>
              <Text style={styles.helperText}>Kliknij jedną dużą buźkę (tylko dla Ciebie):</Text>

              <View style={styles.kidMoodRow}>
                {KID_MOOD_OPTIONS.map((opt) => {
                  const isSel = moodScore === opt.score;
                  return (
                    <TouchableOpacity
                      key={opt.score}
                      style={[
                        styles.kidMoodCard,
                        { backgroundColor: opt.bg, borderColor: isSel ? opt.border : '#e2e8f0' },
                        isSel && { borderWidth: 3 },
                      ]}
                      onPress={() => {
                        setMoodScore(opt.score);
                        setPrivateTip(null);
                      }}
                    >
                      <Text style={styles.kidMoodEmoji}>{opt.emoji}</Text>
                      <Text style={styles.kidMoodLabel}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.saveCheckInBtn, { backgroundColor: '#0ea5e9' }]}
                onPress={handlePrivateCheckIn}
              >
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.saveCheckInText}>Sprawdź moją wskazówkę na dziś</Text>
              </TouchableOpacity>

              {privateTip && (
                <View style={styles.privateTipBox}>
                  <Text style={styles.privateTipText}>{privateTip}</Text>
                </View>
              )}
            </View>

            {/* ZABAWA W SPOKÓJ: BALONIK */}
            <TouchableOpacity
              style={styles.breathBanner}
              onPress={() => {
                setBreathPhaseIndex(0);
                setBreathSecLeft(4);
                setBreathingRunning(true);
                setBreathingVisible(true);
              }}
            >
              <View style={styles.breathIconCircle}>
                <Text style={{ fontSize: 22 }}>🎈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.breathTitle}>Zabawa: Balonik Spokoju</Text>
                <Text style={styles.breathSub}>
                  Gdy się złościsz lub denerwujesz — nadmuchaj balonik i wypuść złość!
                </Text>
              </View>
              <Ionicons name="play-circle" size={34} color="#0284c7" />
            </TouchableOpacity>

            {/* 1-ZDANIOWE MIKRO-WYZWANIA */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>2. Twoje Misje na Dziś ⚽</Text>
              <Text style={styles.helperText}>Zaznacz ptaszkiem misje, które udało Ci się zrobić:</Text>
              {EXPLORER_CHALLENGES.map((ch) => {
                const isDone = !!doneChallenges[ch.id];
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[styles.challengeRow, isDone && styles.challengeRowDone]}
                    onPress={() =>
                      setDoneChallenges((prev) => ({ ...prev, [ch.id]: !prev[ch.id] }))
                    }
                  >
                    <Text style={{ fontSize: 22 }}>{ch.icon}</Text>
                    <Text style={[styles.challengeText, isDone && styles.challengeTextDone]}>
                      {ch.text}
                    </Text>
                    <Ionicons
                      name={isDone ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isDone ? '#16a34a' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= ETAP 2: BUDOWNICZY (11–13 LAT) ================= */}
        {activeStage === '11-13' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>1. Prywatny Barometr & Bateria Energii 🔋</Text>
              <Text style={styles.helperText}>Sprawdź swój nastrój i baterię przed treningiem:</Text>

              <View style={styles.moodRow}>
                {FULL_MOOD_OPTIONS.map((m) => {
                  const isSel = moodScore === m.score;
                  return (
                    <TouchableOpacity
                      key={m.score}
                      style={[
                        styles.moodBtn,
                        isSel && { borderColor: m.color, backgroundColor: '#eff6ff', borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setMoodScore(m.score);
                        setPrivateTip(null);
                      }}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={styles.moodLabel} numberOfLines={1}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Poziom Twojej baterii (1 = rozładowana, 5 = pełna moc):</Text>
              <View style={styles.stressRow}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.stressPill,
                      energyLevel === lvl && {
                        backgroundColor: lvl <= 2 ? '#ea580c' : lvl === 3 ? '#ca8a04' : '#16a34a',
                      },
                    ]}
                    onPress={() => {
                      setEnergyLevel(lvl);
                      setPrivateTip(null);
                    }}
                  >
                    <Text style={[styles.stressPillText, energyLevel === lvl && { color: '#fff' }]}>
                      🔋 {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.habitRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.anonTitle}>🌙 Odłożyłem telefon 45 min przed snem</Text>
                  <Text style={styles.anonSub}>Lepszy sen = szybsze nogi na boisku</Text>
                </View>
                <Switch value={noPhoneBeforeSleep} onValueChange={setNoPhoneBeforeSleep} />
              </View>

              <TouchableOpacity style={styles.saveCheckInBtn} onPress={handlePrivateCheckIn}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.saveCheckInText}>Pokaż prywatną wskazówkę</Text>
              </TouchableOpacity>

              {privateTip && (
                <View style={styles.privateTipBox}>
                  <Text style={styles.privateTipText}>{privateTip}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.breathBanner}
              onPress={() => {
                setBreathPhaseIndex(0);
                setBreathSecLeft(4);
                setBreathingRunning(true);
                setBreathingVisible(true);
              }}
            >
              <View style={styles.breathIconCircle}>
                <Ionicons name="leaf-outline" size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.breathTitle}>Szybki Reset: Oddech 4-4-4-4</Text>
                <Text style={styles.breathSub}>Uspokój głowę przed meczem lub po trudnej akcji</Text>
              </View>
              <Ionicons name="play-circle" size={32} color="#0284c7" />
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
              2. Mikronauka Budowniczego (11–13 lat)
            </Text>
            {LESSONS_BY_STAGE['11-13'].map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => setActiveLesson(lesson)}
              >
                <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.lessonTopRow}>
                    <Text style={styles.lessonTag}>{lesson.tag}</Text>
                    <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                  </View>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSummary}>{lesson.summary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ================= ETAP 3 & 4: WOJOWNIK (14–15) & PROFESJONALISTA (16–18) ================= */}
        {(activeStage === '14-15' || activeStage === '16-18') && (
          <View>
            <View style={styles.card}>
              <View style={styles.stageHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {activeStage === '16-18'
                    ? '1. Prywatny Wskaźnik Gotowości'
                    : '1. Prywatny Check-in Mentalny'}
                </Text>
                {activeStage === '16-18' && (
                  <View
                    style={[
                      styles.readinessBadge,
                      {
                        backgroundColor:
                          readinessPercent >= 75
                            ? '#dcfce7'
                            : readinessPercent >= 50
                            ? '#fef9c3'
                            : '#fee2e2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.readinessBadgeText,
                        {
                          color:
                            readinessPercent >= 75
                              ? '#15803d'
                              : readinessPercent >= 50
                              ? '#a16207'
                              : '#dc2626',
                        },
                      ]}
                    >
                      Gotowość: {readinessPercent}%
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.helperText}>
                Sprawdź swoją głowę przed treningiem lub meczem (tylko na Twoim telefonie):
              </Text>

              <View style={styles.moodRow}>
                {FULL_MOOD_OPTIONS.map((m) => {
                  const isSel = moodScore === m.score;
                  return (
                    <TouchableOpacity
                      key={m.score}
                      style={[
                        styles.moodBtn,
                        isSel && { borderColor: m.color, backgroundColor: '#eff6ff', borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setMoodScore(m.score);
                        setPrivateTip(null);
                      }}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={styles.moodLabel} numberOfLines={1}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.metricsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Poziom stresu / presji (1–5):</Text>
                  <View style={styles.stressRow}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.stressPill,
                          stressLevel === lvl && {
                            backgroundColor: lvl >= 4 ? '#dc2626' : lvl === 3 ? '#d97706' : '#16a34a',
                          },
                        ]}
                        onPress={() => {
                          setStressLevel(lvl);
                          setPrivateTip(null);
                        }}
                      >
                        <Text style={[styles.stressPillText, stressLevel === lvl && { color: '#fff' }]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ width: 92 }}>
                  <Text style={styles.fieldLabel}>Sen (godz.):</Text>
                  <TextInput
                    style={styles.sleepInput}
                    keyboardType="numeric"
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    placeholder="8.0"
                  />
                </View>
              </View>

              {activeStage === '16-18' && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.fieldLabel}>
                    Obciążenie psychiczne (szkoła / matura / mecze, 1–5):
                  </Text>
                  <View style={styles.stressRow}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.stressPill,
                          mentalLoad === lvl && {
                            backgroundColor: lvl >= 4 ? '#7c3aed' : '#2563eb',
                          },
                        ]}
                        onPress={() => {
                          setMentalLoad(lvl);
                          setPrivateTip(null);
                        }}
                      >
                        <Text style={[styles.stressPillText, mentalLoad === lvl && { color: '#fff' }]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.saveCheckInBtn} onPress={handlePrivateCheckIn}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.saveCheckInText}>Pokaż wskazówkę dla mnie</Text>
              </TouchableOpacity>

              {privateTip && (
                <View style={styles.privateTipBox}>
                  <Text style={styles.privateTipText}>{privateTip}</Text>
                </View>
              )}
            </View>

            {/* ODDECH PUDEŁKOWY + WIZUALIZACJA 16-18 */}
            <TouchableOpacity
              style={styles.breathBanner}
              onPress={() => {
                setBreathPhaseIndex(0);
                setBreathSecLeft(4);
                setBreathingRunning(true);
                setBreathingVisible(true);
              }}
            >
              <View style={styles.breathIconCircle}>
                <Ionicons name="leaf-outline" size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.breathTitle}>Oddech Pudełkowy 4-4-4-4 (Reset Tętna)</Text>
                <Text style={styles.breathSub}>
                  Technika stosowana przez zawodowców do szybkiego wyciszenia przed startem
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color="#0284c7" />
            </TouchableOpacity>

            {activeStage === '16-18' && (
              <TouchableOpacity
                style={styles.vizBanner}
                onPress={() => setVizModalVisible(true)}
              >
                <View style={styles.breathIconCircle}>
                  <Ionicons name="eye-outline" size={24} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vizTitle}>Rutyna Przedmeczowa: Wizualizacja 3 Akcji</Text>
                  <Text style={styles.vizSub}>
                    Zaprogramuj w głowie 3 kluczowe zagrania, które wykonasz pewnie na boisku
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#7c3aed" />
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
              2. Psychologia Sportu ({activeStage} lat)
            </Text>
            {LESSONS_BY_STAGE[activeStage].map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => setActiveLesson(lesson)}
              >
                <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.lessonTopRow}>
                    <Text style={styles.lessonTag}>{lesson.tag}</Text>
                    <Text style={styles.lessonDuration}>⏱️ {lesson.duration}</Text>
                  </View>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonSummary}>{lesson.summary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* BEZPIECZNA KARTA WSPARCIA ZEWNĘTRZNEGO (ZAMIAST ALARMU DO TRENERA) */}
        <View style={styles.helpCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="call-outline" size={20} color="#0369a1" />
            <Text style={styles.helpCardTitle}>Potrzebujesz z kimś pogadać?</Text>
          </View>
          <Text style={styles.helpCardDesc}>
            Jeśli coś Cię bardzo martwi, porozmawiaj z rodzicem lub zaufanym dorosłym. Możesz też zadzwonić bezpłatnie i anonimowo do specjalistów dostępnych całą dobę:
          </Text>

          <View style={styles.helpButtonsRow}>
            <TouchableOpacity
              style={styles.helplineBtn}
              onPress={() => handleCallNumber('116111', 'Telefon Zaufania dla Dzieci i Młodzieży')}
            >
              <Ionicons name="heart-outline" size={16} color="#fff" />
              <Text style={styles.helplineBtnText}>116 111 (Telefon Zaufania)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => handleCallNumber('112', 'Numer Alarmowy')}
            >
              <Text style={styles.emergencyBtnText}>112</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimerText}>
            Aplikacja ma charakter wyłącznie edukacyjno-relaksacyjny i nie zastępuje pomocy psychologa ani lekarza.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL: MIKRONAUKA */}
      <Modal visible={!!activeLesson} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {activeLesson && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {activeLesson.icon} {activeLesson.title}
                  </Text>
                  <TouchableOpacity onPress={() => setActiveLesson(null)}>
                    <Ionicons name="close" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSummary}>{activeLesson.summary}</Text>
                {activeLesson.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepBox}>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setActiveLesson(null)}>
                  <Text style={styles.modalPrimaryBtnText}>Rozumiem! Zamknij</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: ODDECH (BALONIK SPOKOJU 8-10 / ODDECH PUDEŁKOWY 11-18) */}
      <Modal visible={breathingVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: 'center' }]}>
            <Text style={styles.modalTitle}>
              {activeStage === '8-10' ? '🎈 Balonik Spokoju' : '🧘 Oddech Pudełkowy (4-4-4-4)'}
            </Text>
            <Text style={styles.breathHint}>
              {activeStage === '8-10'
                ? 'Oddychaj spokojnie razem z balonikiem:'
                : 'Podążaj za rytmem poniżej, aby ustabilizować tętno i koncentrację:'}
            </Text>
            <View
              style={[
                styles.breathCircle,
                { borderColor: BREATH_PHASES[breathPhaseIndex].color },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{BREATH_PHASES[breathPhaseIndex].icon}</Text>
              <Text style={[styles.breathSeconds, { color: BREATH_PHASES[breathPhaseIndex].color }]}>
                {breathSecLeft}s
              </Text>
              <Text style={styles.breathPhaseLabel}>{BREATH_PHASES[breathPhaseIndex].label}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setBreathingRunning(false);
                setBreathingVisible(false);
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Zakończ ćwiczenie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: WIZUALIZACJA 3 AKCJI PRZEDMECZOWYCH (16–18 LAT) */}
      <Modal visible={vizModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👁️ Wizualizacja 3 Akcji Meczowych</Text>
              <TouchableOpacity onPress={() => setVizModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSummary}>
              Wpisz 3 konkretne zagrania, które zobaczysz oczami wyobraźni przed pierwszym gwizdkiem:
            </Text>
            <Text style={styles.fieldLabel}>Akcja 1 (Pewny początek):</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="np. Pierwsze pewne przyjęcie kierunkowe i dokładne podanie"
              value={vizAction1}
              onChangeText={setVizAction1}
            />
            <Text style={styles.fieldLabel}>Akcja 2 (Kluczowy moment):</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="np. Odważny pojedynek 1 na 1 lub czysty odbiór"
              value={vizAction2}
              onChangeText={setVizAction2}
            />
            <Text style={styles.fieldLabel}>Akcja 3 (Reakcja po błędzie):</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="np. Natychmiastowy doskok po stracie bez spuszczania głowy"
              value={vizAction3}
              onChangeText={setVizAction3}
            />
            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: '#7c3aed' }]}
              onPress={() => {
                setVizModalVisible(false);
                showNotice(
                  'Rutyna gotowa! 🎯',
                  'Zamknij oczy na 30 sekund i odtwórz w głowie swoje 3 akcje przed wyjściem na murawę.'
                );
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Zatwierdź rutynę przedmeczową</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
  },
  privacyText: { flex: 1, fontSize: 11, color: '#166534', fontWeight: '600', lineHeight: 15 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetAutoText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  helperText: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 10 },
  playerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  playerChipActive: { backgroundColor: '#0f172a' },
  playerChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  playerChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  stagePill: {
    width: '48.5%',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stagePillTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  stagePillSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  stageBanner: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
  },
  stageBannerTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  stageBannerSub: { fontSize: 11, color: '#475569', marginTop: 2 },
  kidMoodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  kidMoodCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  kidMoodEmoji: { fontSize: 36 },
  kidMoodLabel: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  challengeRowDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  challengeText: { flex: 1, fontSize: 12, color: '#0f172a', fontWeight: '600' },
  challengeTextDone: { color: '#15803d', textDecorationLine: 'line-through' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4, marginBottom: 12 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 9, color: '#334155', fontWeight: '600', marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: '#334155', marginBottom: 5, marginTop: 6 },
  stressRow: { flexDirection: 'row', gap: 6 },
  stressPill: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stressPillText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  sleepInput: {
    height: 34,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10,
  },
  anonTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  anonSub: { fontSize: 10, color: '#64748b' },
  readinessBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  readinessBadgeText: { fontSize: 11, fontWeight: '900' },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10,
  },
  saveCheckInBtn: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveCheckInText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  privateTipBox: {
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  privateTipText: { fontSize: 12, color: '#1e3a8a', fontWeight: '600', lineHeight: 17 },
  breathBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 10,
  },
  breathIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathTitle: { fontSize: 13, fontWeight: 'bold', color: '#0369a1' },
  breathSub: { fontSize: 11, color: '#0c4a6e', marginTop: 2 },
  vizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    gap: 10,
  },
  vizTitle: { fontSize: 13, fontWeight: 'bold', color: '#5b21b6' },
  vizSub: { fontSize: 11, color: '#6d28d9', marginTop: 2 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  lessonIcon: { fontSize: 26 },
  lessonTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonTag: { fontSize: 10, fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' },
  lessonDuration: { fontSize: 10, color: '#64748b' },
  lessonTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  lessonSummary: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 },
  helpCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  helpCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1' },
  helpCardDesc: { fontSize: 11, color: '#0c4a6e', lineHeight: 16, marginBottom: 12 },
  helpButtonsRow: { flexDirection: 'row', gap: 8 },
  helplineBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helplineBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  emergencyBtn: {
    width: 68,
    backgroundColor: '#dc2626',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 13 },
  disclaimerText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 16 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1, paddingRight: 8 },
  modalSummary: { fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 17 },
  stepBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepText: { fontSize: 12, color: '#0f172a', lineHeight: 17 },
  modalPrimaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  modalPrimaryBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  breathHint: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6 },
  breathCircle: {
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  breathSeconds: { fontSize: 38, fontWeight: '900', marginTop: 2 },
  breathPhaseLabel: { fontSize: 10, fontWeight: 'bold', color: '#334155', marginTop: 4, textAlign: 'center' },
});
