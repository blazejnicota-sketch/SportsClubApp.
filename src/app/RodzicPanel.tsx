import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function RodzicPanel() {
  const { players, updatePlayer } = usePlayers();
  const [inviteCode, setInviteCode] = useState('');

  // Symulacja podłączonego zawodnika dla rodzica
  const linkedPlayer = players.find(p => p.parentId === 'current_user_id_symulacja');

  const handleLinkAccount = () => {
    if (!inviteCode.trim()) {
      Alert.alert('Błąd', 'Wpisz kod zaproszenia od trenera.');
      return;
    }

    const playerToLink = players.find(p => p.inviteCode === inviteCode.trim().toUpperCase());
    
    if (playerToLink) {
      // Przypisanie "symulowanego" ID rodzica do zawodnika w bazie Supabase
      updatePlayer(playerToLink.id, { parentId: 'current_user_id_symulacja' });
      Alert.alert('Połączono pomyślnie!', `Masz teraz dostęp do profilu: ${playerToLink.firstName} ${playerToLink.lastName}`);
    } else {
      Alert.alert('Błędny kod', 'Nie znaleziono zaproszenia o takim kodzie.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Rodzica B2C</Text>
      </View>

      <View style={styles.content}>
        {linkedPlayer ? (
          <View style={styles.linkedBox}>
            <Ionicons name="checkmark-circle" size={48} color="#16a34a" style={{ marginBottom: 12 }} />
            <Text style={styles.linkedTitle}>Jesteś połączony z profilem:</Text>
            <Text style={styles.linkedName}>{linkedPlayer.firstName} {linkedPlayer.lastName}</Text>
            <Text style={styles.linkedDesc}>Informacje z kalendarza, obecności i statystyki z meczów będą tu widoczne.</Text>
          </View>
        ) : (
          <View style={styles.connectBox}>
            <Ionicons name="link" size={40} color="#2563eb" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.connectTitle}>Połącz profil z zawodnikiem</Text>
            <Text style={styles.connectDesc}>
              Wpisz unikalny 6-znakowy kod otrzymany SMS-em od trenera, aby uzyskać wgląd do statystyk swojego dziecka.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="np. K7X9PL"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity style={styles.btn} onPress={handleLinkAccount}>
              <Text style={styles.btnText}>Zweryfikuj kod i połącz</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  
  connectBox: { backgroundColor: '#fff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  connectTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  connectDesc: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 14, fontSize: 18, textAlign: 'center', letterSpacing: 4, fontWeight: 'bold', marginBottom: 16 },
  btn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  linkedBox: { backgroundColor: '#f0fdf4', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' },
  linkedTitle: { fontSize: 14, color: '#15803d', marginBottom: 4 },
  linkedName: { fontSize: 20, fontWeight: 'bold', color: '#166534', marginBottom: 12 },
  linkedDesc: { fontSize: 12, color: '#16a34a', textAlign: 'center' },
});
