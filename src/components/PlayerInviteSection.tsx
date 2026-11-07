import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, Player } from './PlayersContext';
import * as Clipboard from 'expo-clipboard';

interface PlayerInviteSectionProps {
  player: Player;
}

const generateUniqueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function PlayerInviteSection({ player }: PlayerInviteSectionProps) {
  const { updatePlayer } = usePlayers();
  const isLinked = !!player.parentId;

  const handleGenerateCode = () => {
    const newCode = generateUniqueInviteCode();
    updatePlayer(player.id, { inviteCode: newCode });
    Alert.alert('Wygenerowano kod 🔑', `Nowy kod zaproszenia dla rodzica: ${newCode}`);
  };

  const handleCopyInviteMessage = async () => {
    if (!player.inviteCode) {
      Alert.alert('Brak kodu', 'Najpierw wygeneruj kod zaproszenia dla tego zawodnika.');
      return;
    }
    const cleanFirst = (player.firstName || '').replace(/\s*\(\d{4}\)/g, '');
    const cleanLast = (player.lastName || '').replace(/\s*\(\d{4}\)/g, '');
    const message = `Dzień dobry! ⚽ Zapraszam do pobrania aplikacji naszej akademii i powiązania konta z profilem zawodnika: ${cleanFirst} ${cleanLast}.\n\nTwój unikalny kod aktywacyjny to: *${player.inviteCode}*\n\nWpisz go po założeniu konta rodzica, aby zyskać dostęp do kalendarza i statystyk.`;
    
    await Clipboard.setStringAsync(message);
    Alert.alert('Skopiowano 📋', 'Wiadomość została skopiowana. Możesz ją wkleić bezpośrednio do SMS lub WhatsApp do rodzica!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>🔒 Dostęp dla Rodzica (Portal B2C)</Text>
        <View style={[styles.badge, isLinked ? styles.badgeLinked : styles.badgeUnlinked]}>
          <Text style={[styles.badgeText, isLinked ? styles.badgeTextLinked : styles.badgeTextUnlinked]}>
            {isLinked ? 'Konto powiązane ✓' : 'Brak powiązania'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.description}>
        Wygeneruj kod dostępu, aby rodzic mógł śledzić statystyki i kalendarz wyłącznie swojego dziecka.
      </Text>

      {player.inviteCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Kod zaproszenia:</Text>
          <Text style={styles.codeText}>{player.inviteCode}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateCode}>
          <Ionicons name="key-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.generateBtnText}>
            {player.inviteCode ? 'Wygeneruj nowy kod' : 'Generuj kod zaproszenia'}
          </Text>
        </TouchableOpacity>

        {player.inviteCode && (
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyInviteMessage}>
            <Ionicons name="share-social-outline" size={15} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.copyBtnText}>Kopiuj SMS / WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeLinked: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  badgeUnlinked: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextLinked: { color: '#16a34a' },
  badgeTextUnlinked: { color: '#dc2626' },
  description: { fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 18 },
  codeBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, alignItems: 'center' },
  codeLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  codeText: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', letterSpacing: 3 },
  actionRow: { flexDirection: 'row', gap: 8 },
  generateBtn: { flex: 1, backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  generateBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  copyBtn: { flex: 1, backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  copyBtnText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },
});
