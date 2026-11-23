import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SafetyRole = 'parent' | 'youth_13_plus' | 'adult';

export interface SafetyConsentPayload {
  role: SafetyRole;
  acceptedAt: string;
  version: string;
  acceptedTerms: boolean;
  acceptedRiskClause: boolean;
  confirmedSafeEnvironment: boolean;
}

interface SafetyOnboardingGateProps {
  visible: boolean;
  playerName?: string;
  playerBirthYear?: number | string;
  onAccept: (payload: SafetyConsentPayload) => Promise<void> | void;
  onDecline?: () => void;
}

const CONSENT_VERSION = '2026.11-v1';

export default function SafetyOnboardingGate({
  visible,
  playerName = 'Zawodnik',
  playerBirthYear,
  onAccept,
  onDecline,
}: SafetyOnboardingGateProps) {
  const [role, setRole] = useState<SafetyRole>('parent');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedRiskClause, setAcceptedRiskClause] = useState<boolean>(false);
  const [confirmedSafeEnvironment, setConfirmedSafeEnvironment] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const parsedYear = Number(playerBirthYear);
  const approxAge =
    !Number.isNaN(parsedYear) && parsedYear > 1950 && parsedYear <= 2026
      ? 2026 - parsedYear
      : null;

  const isUnder13ByYear = approxAge !== null && approxAge < 13;

  const canSubmit =
    acceptedTerms &&
    acceptedRiskClause &&
    confirmedSafeEnvironment &&
    !(isUnder13ByYear && role !== 'parent');

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleConfirm = async () => {
    if (isUnder13ByYear && role !== 'parent') {
      notify(
        'Wymagana zgoda rodzica / opiekuna',
        'Dla zawodników poniżej 13. roku życia (lub młodszych roczników) oświadczenie i zgodę musi potwierdzić rodzic lub opiekun prawny.'
      );
      return;
    }

    if (!acceptedTerms || !acceptedRiskClause || !confirmedSafeEnvironment) {
      notify(
        'Brak wymaganych potwierdzeń',
        'Aby korzystać z modułów treningowych i analizy ruchu, zaznacz wszystkie wymagane zgody i oświadczenia.'
      );
      return;
    }

    try {
      setSubmitting(true);
      await onAccept({
        role,
        acceptedAt: new Date().toISOString(),
        version: CONSENT_VERSION,
        acceptedTerms,
        acceptedRiskClause,
        confirmedSafeEnvironment,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (onDecline) onDecline();
      }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topBadgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="shield-checkmark" size={14} color="#38bdf8" />
              <Text style={styles.badgeText}>BEZPIECZEŃSTWO I ZGODY • WERSJA {CONSENT_VERSION}</Text>
            </View>
          </View>

          <Text style={styles.title}>Zanim rozpoczniesz trening</Text>
          <Text style={styles.subtitle}>
            Profil: <Text style={styles.boldWhite}>{playerName}</Text>
            {approxAge !== null ? ` (szac. wiek: ${approxAge} lat)` : ''}
          </Text>

          {/* KROK 1: WYBÓR ROLI / PRÓG WIEKOWY */}
          <Text style={styles.sectionLabel}>1. Kto potwierdza warunki korzystania?</Text>
          <View style={styles.roleGroup}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'parent' && styles.roleCardActive]}
              onPress={() => setRole('parent')}
            >
              <Ionicons
                name="people"
                size={18}
                color={role === 'parent' ? '#0f172a' : '#38bdf8'}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.roleTitle, role === 'parent' && styles.roleTextDark]}>
                  Rodzic / Opiekun prawny (zalecane dla młodszych roczników)
                </Text>
                <Text style={[styles.roleDesc, role === 'parent' && styles.roleDescDark]}>
                  Wyrażam zgodę w imieniu dziecka, zapewniam nadzór i bezpieczne warunki.
                </Text>
              </View>
            </TouchableOpacity>

            {!isUnder13ByYear && (
              <TouchableOpacity
                style={[styles.roleCard, role === 'youth_13_plus' && styles.roleCardActive]}
                onPress={() => setRole('youth_13_plus')}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={role === 'youth_13_plus' ? '#0f172a' : '#38bdf8'}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.roleTitle, role === 'youth_13_plus' && styles.roleTextDark]}>
                    Zawodnik młodzieżowy (13–17 lat — za zgodą opiekuna)
                  </Text>
                  <Text style={[styles.roleDesc, role === 'youth_13_plus' && styles.roleDescDark]}>
                    Potwierdzam, że rodzic/opiekun wyraził zgodę na moje korzystanie z aplikacji.
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {!isUnder13ByYear && (
              <TouchableOpacity
                style={[styles.roleCard, role === 'adult' && styles.roleCardActive]}
                onPress={() => setRole('adult')}
              >
                <Ionicons
                  name="checkmark-done"
                  size={18}
                  color={role === 'adult' ? '#0f172a' : '#38bdf8'}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.roleTitle, role === 'adult' && styles.roleTextDark]}>
                    Pełnoletni użytkownik (18+)
                  </Text>
                  <Text style={[styles.roleDesc, role === 'adult' && styles.roleDescDark]}>
                    Działam we własnym imieniu i na własną odpowiedzialność treningową.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* KROK 2: TREŚĆ KLAUZULI BEZPIECZEŃSTWA I RYZYKA */}
          <Text style={styles.sectionLabel}>2. Informacja o ryzyku kontuzji i charakterze aplikacji</Text>
          <View style={styles.clauseBox}>
            <Text style={styles.clauseLine}>
              • <Text style={styles.boldWhite}>Charakter narzędzia:</Text> Aplikacja ma charakter informacyjno-szkoleniowy i organizacyjny. Nie stanowi usługi medycznej, diagnozy lekarskiej, fizjoterapii ani nadzoru trenera na żywo lub opiekuna.
            </Text>
            <Text style={styles.clauseLine}>
              • <Text style={styles.boldWhite}>Ryzyko kontuzji:</Text> Każdy wysiłek fizyczny (m.in. deska/plank, pompki, przysiady, wyskoki, przeskoki boczne, zwinność, rozciąganie) niesie naturalne ryzyko kontuzji, urazu, przeciążenia, upadku lub pogorszenia samopoczucia — zwłaszcza bez rozgrzewki, przy zmęczeniu, złej technice, śliskiej nawierzchni lub ciasnej przestrzeni.
            </Text>
            <Text style={styles.clauseLine}>
              • <Text style={styles.boldWhite}>Orientacyjność analizy ruchu:</Text> Podgląd wideo, linie/szkielet ruchu, licznik powtórzeń i oceny techniki mają charakter wyłącznie pomocniczy i orientacyjny (zależą m.in. od światła, ustawienia kamery, ubioru i sprzętu) i nie gwarantują braku ryzyka urazu.
            </Text>
            <Text style={styles.clauseLine}>
              • <Text style={styles.boldWhite}>Nadzór i reakcja na ból:</Text> U młodszych zawodników wymagany jest nadzór rodzica/opiekuna. Przy bólu, zawrotach głowy lub złym samopoczuciu należy natychmiast przerwać ćwiczenie.
            </Text>
            <Text style={styles.clauseLine}>
              • <Text style={styles.boldWhite}>Zasady odpowiedzialności:</Text> Odpowiedzialność właściciela i twórców aplikacji jest wyłączona w najszerszym zakresie dopuszczalnym przez obowiązujące przepisy prawa (z wyłączeniem przypadków, których wyłączenie jest prawnie niedopuszczalne, m.in. szkody wyrządzonej umyślnie).
            </Text>
          </View>

          {/* KROK 3: WYMAGANE CHECKBOXY */}
          <Text style={styles.sectionLabel}>3. Wymagane potwierdzenia przed startem</Text>

          <TouchableOpacity
            style={[styles.checkRow, acceptedTerms && styles.checkRowChecked]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <Ionicons
              name={acceptedTerms ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedTerms ? '#4ade80' : '#94a3b8'}
            />
            <Text style={styles.checkText}>
              Akceptuję Regulamin aplikacji oraz przyjmuję do wiadomości, że aplikacja nie zastępuje lekarza, fizjoterapeuty ani nadzoru trenera na żywo.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkRow, acceptedRiskClause && styles.checkRowChecked]}
            onPress={() => setAcceptedRiskClause(!acceptedRiskClause)}
          >
            <Ionicons
              name={acceptedRiskClause ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedRiskClause ? '#4ade80' : '#94a3b8'}
            />
            <Text style={styles.checkText}>
              Zapoznałem(-am) się z Klauzulą Bezpieczeństwa i akceptuję naturalne ryzyko kontuzji oraz przeciążeń związane z ćwiczeniami fizycznymi i orientacyjnym charakterem analizy ruchu.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkRow, confirmedSafeEnvironment && styles.checkRowChecked]}
            onPress={() => setConfirmedSafeEnvironment(!confirmedSafeEnvironment)}
          >
            <Ionicons
              name={confirmedSafeEnvironment ? 'checkbox' : 'square-outline'}
              size={22}
              color={confirmedSafeEnvironment ? '#4ade80' : '#94a3b8'}
            />
            <Text style={styles.checkText}>
              Oświadczam (w imieniu własnym lub jako rodzic/opiekun), że ćwiczący nie ma znanych przeciwwskazań zdrowotnych, przed każdym ćwiczeniem wykona rozgrzewkę, ma bezpieczną przestrzeń oraz w razie bólu przerwie ćwiczenie.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || submitting) && styles.primaryBtnDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            <Ionicons name="shield-checkmark" size={18} color="#0f172a" />
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Zapisywanie zgody...' : 'Potwierdzam i przechodzę do aplikacji'}
            </Text>
          </TouchableOpacity>

          {onDecline && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDecline}>
              <Text style={styles.secondaryBtnText}>Nie akceptuję / Wyjdź</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 18, paddingBottom: 36 },
  topBadgeRow: { flexDirection: 'row', marginBottom: 10 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '900' },
  title: { fontSize: 22, fontWeight: '900', color: '#f8fafc' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginBottom: 14 },
  boldWhite: { color: '#f8fafc', fontWeight: 'bold' },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#e2e8f0', marginTop: 10, marginBottom: 8 },
  roleGroup: { gap: 8 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  roleCardActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  roleTitle: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc' },
  roleDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 15 },
  roleTextDark: { color: '#0f172a' },
  roleDescDark: { color: '#0f172a' },
  clauseBox: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  clauseLine: { fontSize: 11, color: '#cbd5e1', lineHeight: 16 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  checkRowChecked: { borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.08)' },
  checkText: { flex: 1, fontSize: 11, color: '#e2e8f0', lineHeight: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ade80',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  primaryBtnDisabled: { backgroundColor: '#475569' },
  primaryBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '900' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  secondaryBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
});
