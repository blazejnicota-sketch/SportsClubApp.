import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Obsługa logowania / rejestracji w Supabase
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Proszę wprowadzić e-mail oraz hasło.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        alert('Błąd rejestracji: ' + error.message);
      } else {
        alert('Konto zostało utworzone! Sprawdź e-mail lub zaloguj się.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        alert('Błąd logowania: ' + error.message);
      } else {
        // Po udanym logowaniu przechodzimy do Kalendarza / Strony głównej
        router.push('/Calendar');
      }
    }

    setLoading(false);
  };

  // Ustawienie danych testowych
  const fillTestData = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSignUp ? '📝 Utwórz Konto' : '⚽ Logowanie Do Klubu'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Wypełnij dane, aby dołączyć'
            : 'Zaloguj się, aby uzyskać dostęp do panelu'}
        </Text>

        <Text style={styles.label}>Adres E-mail:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Hasło:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#666"
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isSignUp ? 'Zarejestruj się' : 'Zaloguj się'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp
              ? 'Masz już konto? Zaloguj się'
              : 'Nie masz konta? Zarejestruj się'}
          </Text>
        </TouchableOpacity>

        {/* Sekcja Szybkiego Logowania Testowego */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Szybkie uzupełnianie testowe:</Text>

          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => fillTestData('trener@test.pl', 'Trener123!')}
            >
              <Text style={styles.testButtonText}>📋 Trener</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={() => fillTestData('zawodnik@test.pl', 'Zawodnik123!')}
            >
              <Text style={styles.testButtonText}>🏃 Zawodnik</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#8b949e',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#c9d1d9',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1f6feb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#58a6ff',
    fontSize: 13,
  },
  testSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
  },
  testTitle: {
    color: '#8b949e',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#21262d',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
  },
  testButtonText: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: '600',
  },
});