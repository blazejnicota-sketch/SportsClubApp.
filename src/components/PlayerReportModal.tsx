import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PlayerReportModalProps {
  visible: boolean;
  onClose: () => void;
  playerName?: string;
  playerNumber?: string;
  playerXp?: number;
}

export default function PlayerReportModal({
  visible,
  onClose,
  playerName = 'Zawodnik',
  playerNumber = '10',
  playerXp = 450,
}: PlayerReportModalProps) {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      // Symulacja generowania raportu PDF w chmurze / lokalnie
      await new Promise((r) => setTimeout(r, 1500));
      Alert.alert(
        'Raport PDF Gotowy! 📄✨',
        `Podsumowanie dla zawodnika #${playerNumber} ${playerName} zostało wygenerowane pomyślnie i zapisane w pamięci urządzenia.`
      );
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się wygenerować pliku PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="document-text" size={22} color="#38bdf8" />
              <Text style={styles.modalTitle}>Raport Miesięczny PDF (AI & Wearables)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.previewBox}>
              <Text style={styles.previewHeader}>SportsClub Pro • Oficjalny Raport Akademii</Text>
              <Text style={styles.previewName}>
                {playerName} (#{playerNumber})
              </Text>
              <Text style={styles.previewSub}>Okres: Listopad 2026</Text>

              <View style={styles.previewStatsRow}>
                <View style={styles.previewStat}>
                  <Text style={styles.previewVal}>{playerXp} XP</Text>
                  <Text style={styles.previewLbl}>Punkty Rozwoju</Text>
                </View>
                <View style={styles.previewStat}>
                  <Text style={styles.previewVal}>94.5%</Text>
                  <Text style={styles.previewLbl}>Technika AI</Text>
                </View>
                <View style={styles.previewStat}>
                  <Text style={styles.previewVal}>2.1%</Text>
                  <Text style={styles.previewLbl}>Asymetria</Text>
                </View>
              </View>

              <Text style={styles.previewComment}>
                „Zawodnik wykazuje wzorową regularność w zadaniach domowych ze skanera MediaPipe. Obciążenie z opasek wskazuje na optymalną regenerację.”
              </Text>
            </View>

            <TouchableOpacity
              style={styles.pdfButton}
              onPress={handleGeneratePDF}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#0f172a" />
                  <Text style={styles.pdfButtonText}>Pobierz Oficjalny Raport PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
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
  previewBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  previewHeader: { fontSize: 10, fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' },
  previewName: { fontSize: 18, fontWeight: '900', color: '#f8fafc', marginVertical: 4 },
  previewSub: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },
  previewStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  previewStat: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewVal: { fontSize: 16, fontWeight: '900', color: '#fbbf24' },
  previewLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  previewComment: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', lineHeight: 17 },
  pdfButton: {
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfButtonText: { color: '#0f172a', fontSize: 14, fontWeight: 'bold' },
});