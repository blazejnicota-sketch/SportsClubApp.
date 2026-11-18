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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../services/supabase'; // Upewnij się, że ścieżka do Twojego supabase.ts jest poprawna
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type UserRole = 'trener' | 'rodzic' | 'zawodnik';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('zawodnik');
  const router = useRouter();

  const handleAuthError = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) {
      return 'Błędny adres e-mail lub hasło.';
    }
    if (errorMsg.includes('User already registered')) {
      return 'Konto z tym adresem e-mail już istnieje.';
    }
    return errorMsg;
  };

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', 'Podaj adres e-mail i hasło.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      Alert.alert('Błąd logowania', handleAuthError(error.message));
    } else {
      router.replace('/'); // Wymusza przeładowanie routera (index.tsx)
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Błąd', 'Podaj adres e-mail i hasło.');
      return;
    }
    setLoading(true);
    // Rejestracja z dopisaniem wybranej roli do metadata w Supabase
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role } }, 
    });
    
    if (error) {
      Alert.alert('Błąd rejestracji', handleAuthError(error.message));
    } else {
      Alert.alert(
        'Sukces! 🎉', 
        'Konto zostało utworzone. Możesz się teraz zalogować i wpisać kod od Trenera!'
      );
    }
    setLoading(false);
  }

  const fillTestData = (testEmail: string, testRole: UserRole) => {
    setEmail(testEmail);
    setPassword('Haslo123!');
    setRole(testRole);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.box}>
          <Ionicons
            name="shield-checkmark"
            size={56}
            color="#2563eb"
            style={{ alignSelf: 'center', marginBottom: 16 }}
          />
          <Text style={styles.title}>SportsClub Pro</Text>
          <Text style={styles.subtitle}>Zaloguj się do platformy akademii</Text>

          <Text style={styles.roleLabel}>Wybierz swoją rolę w klubie:</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'trener' && styles.roleBtnActive]}
              onPress={() => setRole('trener')}
            >
              <Text style={[styles.roleText, role === 'trener' && styles.roleTextActive]}>📋 Trener</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'rodzic' && styles.roleBtnActive]}
              onPress={() => setRole('rodzic')}
            >
              <Text style={[styles.roleText, role === 'rodzic' && styles.roleTextActive]}>👨‍👦 Rodzic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'zawodnik' && styles.roleBtnActive]}
              onPress={() => setRole('zawodnik')}
            >
              <Text style={[styles.roleText, role === 'zawodnik' && styles.roleTextActive]}>⚽ Zawodnik</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="Adres e-mail"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Hasło"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.loginBtn} onPress={signInWithEmail} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Zaloguj się</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerBtn} onPress={signUpWithEmail} disabled={loading}>
            <Text style={styles.registerBtnText}>Nie masz konta? Utwórz nowy profil</Text>
          </TouchableOpacity>

          {/* Szybkie uzupełnianie kont testowych (Usuń przed wydaniem aplikacji) */}
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Szybki wybór konta testowego (Dev Only):</Text>
            <View style={styles.testButtonsRow}>
              <TouchableOpacity style={styles.testButton} onPress={() => fillTestData('trener@test.pl', 'trener')}>
                <Text style={styles.testButtonText}>📋 Tr.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => fillTestData('rodzic@test.pl', 'rodzic')}>
                <Text style={styles.testButtonText}>👨‍👦 Rodz.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.testButton} onPress={() => fillTestData('zawodnik@test.pl', 'zawodnik')}>
                <Text style={styles.testButtonText}>⚽ Zaw.</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, marginTop: 2 },
  roleLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8, textAlign: 'center' },
  roleRow: { flexDirection: 'row', marginBottom: 20, gap: 6 },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  roleBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  roleText: { color: '#64748b', fontWeight: 'bold', fontSize: 11 },
  roleTextActive: { color: '#2563eb' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  registerBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  registerBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
  testSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  testTitle: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  testButtonsRow: { flexDirection: 'row', gap: 8 },
  testButton: { flex: 1, backgroundColor: '#f8fafc', paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  testButtonText: { color: '#475569', fontSize: 11, fontWeight: 'bold' },
});