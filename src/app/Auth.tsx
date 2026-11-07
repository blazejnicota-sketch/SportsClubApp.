import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'trener' | 'rodzic'>('trener');
  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Błąd logowania', error.message);
    else router.replace('/');
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } } // Zapisujemy rolę w metadanych konta
    });
    if (error) Alert.alert('Błąd rejestracji', error.message);
    else Alert.alert('Sukces', 'Konto utworzone! Możesz się zalogować.');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Ionicons name="shield-checkmark" size={60} color="#2563eb" style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={styles.title}>SportsClub Pro</Text>
        <Text style={styles.subtitle}>Zaloguj się do platformy</Text>
        
        <View style={styles.roleRow}>
          <TouchableOpacity style={[styles.roleBtn, role === 'trener' && styles.roleBtnActive]} onPress={() => setRole('trener')}>
            <Text style={[styles.roleText, role === 'trener' && styles.roleTextActive]}>Jestem Trenerem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleBtn, role === 'rodzic' && styles.roleBtnActive]} onPress={() => setRole('rodzic')}>
            <Text style={[styles.roleText, role === 'rodzic' && styles.roleTextActive]}>Jestem Rodzicem</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} onChangeText={setEmail} value={email} placeholder="Adres e-mail" autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} onChangeText={setPassword} value={password} secureTextEntry placeholder="Hasło" autoCapitalize="none" />

        <TouchableOpacity style={styles.loginBtn} onPress={signInWithEmail} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Zaloguj się</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={signUpWithEmail} disabled={loading}>
          <Text style={styles.registerBtnText}>Nie masz konta? Zarejestruj się</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  roleRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  roleText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
  roleTextActive: { color: '#2563eb' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  loginBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  registerBtn: { padding: 14, alignItems: 'center', marginTop: 5 },
  registerBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 }
});
