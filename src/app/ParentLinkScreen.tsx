import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

interface ParentLinkScreenProps {
  onLinkedSuccess: () => void;
}

export default function ParentLinkScreen({ onLinkedSuccess }: ParentLinkScreenProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [parentFullName, setParentFullName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [rodoAccepted, setRodoAccepted] = useState(false);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleVerifyCode = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      showAlert('Błąd', 'Wprowadź kod zaproszenia otrzymany od Trenera.');
      return;
    }

    if (!rodoAccepted || !medicalDisclaimerAccepted) {
      showAlert(
        'Wymagane zgody RODO i Zdrowotne 🛡️',
        'Aby aktywować profil dziecka, zaznacz zgodę na przetwarzanie danych (RODO) oraz oświadczenie o braku przeciwwskazań zdrowotnych i wykonywaniu rozgrzewki.'
      );
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error('Brak aktywnej sesji logowania.');

      const currentUser = authData.user;
      const userRole = currentUser.user_metadata?.role || 'rodzic';

      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('invite_code', cleanCode)
        .maybeSingle();

      if (!player) {
        showAlert(
          'Błąd weryfikacji',
          'Nie znaleziono zawodnika z takim kodem zaproszenia. Upewnij się, że wpisujesz go poprawnie.'
        );
        setLoading(false);
        return;
      }

      if (userRole === 'rodzic') {
        const updatePayload: Record<string, any> = {
          parent_id: currentUser.id,
          health_status: 'Zgoda RODO + Medyczna (Online)',
        };
        if (parentFullName.trim()) updatePayload.parent_name = parentFullName.trim();
        if (parentPhone.trim()) updatePayload.parent_phone = parentPhone.trim();

        const { error: updateError } = await supabase
          .from('players')
          .update(updatePayload)
          .eq('id', player.id);

        if (updateError) throw updateError;
      } else if (userRole === 'zawodnik') {
        const { error: updateError } = await supabase
          .from('players')
          .update({ user_id: currentUser.id })
          .eq('id', player.id);

        if (updateError) throw updateError;
      }

      showAlert(
        'Zrobione! 🎉',
        `Pomyślnie powiązano z profilem: ${player.first_name || ''} ${player.last_name || ''} oraz zapisano zgody RODO i bezpieczeństwa zdrowotnego.`
      );
      onLinkedSuccess();
    } catch (err: any) {
      console.error('Błąd łączenia konta:', err);
      showAlert('Błąd systemowy', err.message || 'Wystąpił problem podczas przetwarzania kodu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#2563eb" style={{ alignSelf: 'center', marginBottom: 10 }} />
          <Text style={styles.title}>Aktywacja Profilu & Zgody RODO</Text>
          <Text style={styles.subtitle}>
            Wpisz 6-znakowy kod od trenera, uzupełnij kontakt alarmowy i zatwierdź wymagane zgody.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="KOD (NP. K7X9PL)"
            placeholderTextColor="#94a3b8"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />

          <Text style={styles.fieldLabel}>Imię i nazwisko Rodzica / Opiekuna:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="np. Anna Nicota"
            placeholderTextColor="#94a3b8"
            value={parentFullName}
            onChangeText={setParentFullName}
          />

          <Text style={styles.fieldLabel}>Telefon kontaktowy (Alarmowy dla Trenera):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="np. +48 500 600 700"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={parentPhone}
            onChangeText={setParentPhone}
          />

          {/* ZGODA 1: RODO */}
          <TouchableOpacity
            style={[styles.consentBox, rodoAccepted && styles.consentBoxActive]}
            onPress={() => setRodoAccepted(!rodoAccepted)}
          >
            <Ionicons
              name={rodoAccepted ? 'checkbox' : 'square-outline'}
              size={20}
              color={rodoAccepted ? '#2563eb' : '#64748b'}
            />
            <Text style={styles.consentText}>
              <Text style={{ fontWeight: 'bold' }}>[RODO] </Text>
              Wyrażam zgodę na przetwarzanie danych osobowych mojego dziecka w celu organizacji treningów, prowadzenia statystyk sportowych oraz komunikacji klubowej w aplikacji SportsClub Pro.
            </Text>
          </TouchableOpacity>

          {/* ZGODA 2: KLAUZULA ZDROWOTNA I BEZPIECZEŃSTWO ĆWICZEŃ */}
          <TouchableOpacity
            style={[styles.consentBox, medicalDisclaimerAccepted && styles.consentBoxActive]}
            onPress={() => setMedicalDisclaimerAccepted(!medicalDisclaimerAccepted)}
          >
            <Ionicons
              name={medicalDisclaimerAccepted ? 'checkbox' : 'square-outline'}
              size={20}
              color={medicalDisclaimerAccepted ? '#16a34a' : '#64748b'}
            />
            <Text style={styles.consentText}>
              <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>[Bezpieczeństwo Zdrowotne] </Text>
              Oświadczam, że dziecko nie posiada przeciwwskazań medycznych do wysiłku fizycznego. Przyjmuję do wiadomości wymóg przeprowadzenia rozgrzewki przed ćwiczeniami domowymi AI oraz zwalniam twórców aplikacji i klub z odpowiedzialności za ewentualne urazy wynikające z ćwiczeń w warunkach domowych.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>Zatwierdź Zgody i Połącz Profil</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Zaloguj na inne konto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 18 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 17 },
  codeInput: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 14,
  },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    gap: 8,
  },
  consentBoxActive: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  consentText: { flex: 1, fontSize: 11, color: '#334155', lineHeight: 16 },
  verifyBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  verifyBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: { marginTop: 16, alignItems: 'center' },
  logoutBtnText: { color: '#64748b', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
