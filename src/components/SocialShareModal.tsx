import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  achievementTitle?: string;
  playerName?: string;
  scoreOrXp?: string;
}

export default function SocialShareModal({
  visible,
  onClose,
  achievementTitle = 'Zaliczono Wyzwanie AI 🏆',
  playerName = 'Młody Sportowiec',
  scoreOrXp = '+100 XP (Ocena: 95%)',
}: SocialShareModalProps) {
  const [sharing, setSharing] = useState(false);

  const handleShareToFacebook = async () => {
    setSharing(true);
    try {
      // Symulacja przygotowania posta / otwarcia natywnego okna udostępniania
      await new Promise((r) => setTimeout(r, 1000));
      Alert.alert(
        'Sukces! 🚀',
        'Grafika osiągnięcia została przygotowana. Możesz ją teraz wkleić bezpośrednio na swoją tablicę lub grupę na Facebooku!'
      );
      onClose();
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się udostępnić w social mediach.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="share-social" size={22} color="#38bdf8" />
              <Text style={styles.modalTitle}>Pochwal się w Social Mediach 📱</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.descText}>
            Wygeneruj kartę sukcesu i udostępnij wynik swojego dziecka na Facebooku lub Instagramie!
          </Text>

          {/* PODGLĄ KARTY DO PUBLIKACJI */}
          <View style={styles.previewCard}>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>SportsClub Pro ⚽</Text>
            </View>
            <Text style={styles.previewTitle}>{achievementTitle}</Text>
            <Text style={styles.previewPlayer}>{playerName}</Text>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>{scoreOrXp}</Text>
            </View>
          </View>

          {/* PRZYCISKI AKCJONALNE */}
          <View style={styles.buttonsCol}>
            <TouchableOpacity
              style={styles.fbButton}
              onPress={handleShareToFacebook}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={20} color="#fff" />
                  <Text style={styles.fbButtonText}>Udostępnij na Facebooku</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                Alert.alert('Zapisano!', 'Grafika została pobrana do galerii zdjęć.');
                onClose();
              }}
            >
              <Ionicons name="download-outline" size={18} color="#38bdf8" />
              <Text style={styles.saveButtonText}>Zapisz grafikę w galerii</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 10 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  descText: { fontSize: 12, color: '#94a3b8', marginVertical: 12, lineHeight: 17 },
  previewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    marginBottom: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  previewBadge: { backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  previewBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' },
  previewTitle: { fontSize: 16, fontWeight: '900', color: '#f8fafc', textAlign: 'center', marginBottom: 4 },
  previewPlayer: { fontSize: 13, color: '#94a3b8', marginBottom: 14 },
  previewPill: { backgroundColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  previewPillText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  buttonsCol: { gap: 10 },
  fbButton: {
    flexDirection: 'row',
    backgroundColor: '#1877f2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fbButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold' },
});