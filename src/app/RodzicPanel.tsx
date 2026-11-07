import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from '../components/PlayersContext';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function RodzicPanel() {
  const { players, updatePlayer } = usePlayers();
  const [inviteCode, setInviteCode] = useState('');

  const linkedPlayer = players.find(p => p.parentId === 'current_user_id_symulacja');

  const handleLinkAccount = () => {
    if (!inviteCode.trim()) return Alert.alert('Wymagany Kod', 'Wpisz 6-znakowy kod z SMSa od trenera.');
    const playerToLink = players.find(p => p.inviteCode === inviteCode.trim().toUpperCase());
    
    if (playerToLink) {
      updatePlayer(playerToLink.id, { parentId: 'current_user_id_symulacja' });
      Alert.alert('Autoryzacja udana', `Uzyskałeś dostęp do profilu: ${playerToLink.firstName} ${playerToLink.lastName}`);
    } else {
      Alert.alert('Błędny Kod', 'Brak autoryzacji. Upewnij się, że kod jest poprawny.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
      <View style={styles.header}>
        <Ionicons name="people" size={28} color="#2563eb" style={{ marginRight: 12 }} />
        <Text style={styles.headerTitle}>Panel B2C Rodzica</Text>
      </View>

      <View style={styles.content}>
        {linkedPlayer ? (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}><Ionicons name="shield-checkmark" size={60} color="#16a34a" /></View>
            <Text style={styles.successTitle}>Połączenie Aktywne</Text>
            <Text style={styles.successDesc}>Jesteś oficjalnym opiekunem dla:</Text>
            <View style={styles.playerTag}>
              <Text style={styles.playerName}>{linkedPlayer.firstName} {linkedPlayer.lastName}</Text>
            </View>
            <Text style={styles.infoText}>Wszystkie statystyki, zdrowie, analizy AI oraz kalendarz treningów i meczów są teraz dla Ciebie widoczne na stronie głównej.</Text>
          </View>
        ) : (
          <View style={styles.authCard}>
            <View style={styles.authIconBox}><Ionicons name="lock-closed" size={40} color="#2563eb" /></View>
            <Text style={styles.authTitle}>Autoryzacja Dostępu</Text>
            <Text style={styles.authDesc}>Aby zobaczyć statystyki swojego dziecka, wprowadź jednorazowy kod B2C wygenerowany przez trenera akademii.</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="np. K7X9PL"
                placeholderTextColor="#94a3b8"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>
            <TouchableOpacity style={styles.verifyBtn} onPress={handleLinkAccount}>
              <Text style={styles.verifyBtnText}>Autoryzuj Konto</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  
  authCard: { backgroundColor: '#fff', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, alignItems: 'center' },
  authIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  authTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  authDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22, fontWeight: '500' },
  inputContainer: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', marginBottom: 24 },
  input: { paddingVertical: 20, fontSize: 28, textAlign: 'center', letterSpacing: 8, fontWeight: '900', color: '#0f172a' },
  verifyBtn: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  verifyBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },

  successCard: { backgroundColor: '#fff', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, alignItems: 'center', borderWidth: 2, borderColor: '#bbf7d0' },
  successIconBox: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#166534', marginBottom: 8 },
  successDesc: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 16 },
  playerTag: { backgroundColor: '#f0fdf4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#4ade80' },
  playerName: { fontSize: 20, fontWeight: '900', color: '#15803d' },
  infoText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 }
});
