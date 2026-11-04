import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function ParentLinkScreen({ onLinkedSuccess }: { onLinkedSuccess?: () => void }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyAndLink = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 6) {
      Alert.alert('Błędny kod', 'Wpisz poprawny, co najmniej 6-znakowy kod zaproszenia otrzymany od trenera.');
      return;
    }

    setLoading(true);
    try {
      // 1. Pobierz aktualnie zalogowanego użytkownika (rodzica) z Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        Alert.alert('Błąd autoryzacji', 'Musisz być zalogowany, aby powiązać konto.');
        setLoading(false);
        return;
      }

      const parentId = authData.user.id;

      // 2. Sprawdź, czy zawodnik z takim kodem istnieje w bazie
      const { data: playerRows, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('invite_code', cleanCode)
        .single();

      if (fetchError || !playerRows) {
        Alert.alert('Nie znaleziono', 'Podany kod zaproszenia jest nieprawidłowy lub został już wykorzystany.');
        setLoading(false);
        return;
      }

      // 3. Przypisz ID rodzica do tabeli zawodnika w Supabase
      const { error: updateError } = await supabase
        .from('players')
        .update({ parent_id: parentId })
        .eq('id', playerRows.id);

      if (updateError) {
        Alert.alert('Błąd zapisu', 'Nie udało się powiązać konta. Spróbuj ponownie.');
        setLoading(false);
        return;
      }

      Alert.alert(
        'Sukces! 🎉',
        `Konto zostało pomyślnie powiązane z zawodnikiem: ${playerRows.first_name} ${playerRows.last_name}[cite: 1]. Masz teraz wgląd w jego kalendarz i powołania.`
      );
      
      setInviteCode('');
      if (onLinkedSuccess) onLinkedSuccess();

    } catch (err) {
      console.error('Błąd podczas wiązania konta:', err);
      Alert.alert('Błąd', 'Wystąpił nieoczekiwany błąd sieci.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={32} color="#2563eb" />
        </View>

        <Text style={styles.title}>Aktywuj profil dziecka</Text>
        <Text style={styles.subtitle}>
          Wpisz unikalny kod zaproszenia otrzymany od trenera SMS-em lub WhatsAppem, aby odblokować dostęp[cite: 1].
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Wpisz kod (np. K7X9PL)"
          placeholderTextColor="#94a3b8"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          maxLength={8}
        />

        <TouchableOpacity style={styles.button} onPress={handleVerifyAndLink} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="link-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.buttonText}>Powiąż konto z zawodnikiem</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});