import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { usePlayers, Player } from './PlayersContext';

// Funkcja do generowania unikalnego 6-znakowego kodu (bez mylących znaków)
const generateUniqueInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface PlayerInviteSectionProps {
  player: Player;
}

export default function PlayerInviteSection({ player }: PlayerInviteSectionProps) {
  const { updatePlayer } = usePlayers();

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

    const message = `Dzień dobry! ⚽ Zapraszam do pobrania aplikacji naszej akademii i powiązania konta z profilem zawodnika: ${cleanFirst} ${cleanLast}.\n\nTwój unikalny kod aktywacyjny to: *${player.inviteCode}*\n\nWpisz go po zalogowaniu w aplikacji, aby śledzić kalendarz, powołania i obecności swojego dziecka! 👍`;

    await Clipboard.setStringAsync(message);
    Alert.alert(
      'Skopiowano do schowka 📋',
      'Gotowa wiadomość została skopiowana. Możesz ją wkleić bezpośrednio do wiadomości SMS lub WhatsApp do rodzica!'
    );
  };

  const isLinked = !!player.parentId;

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
          <View>
            <Text style={styles.codeLabel}>Kod zaproszenia:</Text>
            <Text style={styles.codeText}>{player.inviteCode}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyInviteMessage}>
            <Ionicons name="share-social-outline" size={15} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.copyBtnText}>Kopiuj SMS / WhatsApp</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateCode}>
        <Ionicons name="key-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.generateBtnText}>
          {player.inviteCode ? 'Wygeneruj nowy kod' : 'Generuj kod zaproszenia'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  description: { fontSize: 11, color: '#64748b', marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeLinked: { backgroundColor: '#dcfce7' },
  badgeUnlinked: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTextLinked: { color: '#15803d' },
  badgeTextUnlinked: { color: '#64748b' },
  codeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 8,
  },
  codeLabel: { fontSize: 10, color: '#64748b' },
  codeText: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', letterSpacing: 1 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  copyBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  generateBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});