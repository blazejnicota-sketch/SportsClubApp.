import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

interface MatchDayModalProps {
  visible: boolean;
  onClose: () => void;
  playerId?: string;
  isCoach?: boolean;
}

export default function MatchDayModal({
  visible,
  onClose,
  playerId,
  isCoach = false,
}: MatchDayModalProps) {
  const [matchStatus, setMatchStatus] = useState<'pending' | 'attending' | 'declined'>('pending');
  const [loading, setLoading] = useState(false);

  const handleRSVP = async (status: 'attending' | 'declined') => {
    setLoading(true);
    try {
      if (playerId && playerId !== 'demo') {
        // Zapis statusu powołania w bazie Supabase (np. w tabeli zawodnika lub relacji meczowej)
        await supabase
          .from('players')
          .update({ match_rsvp_status: status })
          .eq('id', playerId);
      }
      setMatchStatus(status);
      Alert.alert(
        'Zapisano status! ⚽',
        status === 'attending' ? 'Potwierdzono obecność na meczu.' : 'Zgłoszono nieobecność.'
      );
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się zapisać statusu obecności.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="football" size={22} color="#10b981" />
              <Text style={styles.modalTitle}>MatchDay & Powołania Meczowe</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.matchCard}>
              <Text style={styles.matchLeague}>Liga Wojewódzka Młodzików • Kolejka 12</Text>
              <Text style={styles.matchTeams}>SportsClub Pro vs. Akademia Futbolu</Text>
              <Text style={styles.matchMeta}>📅 Niedziela, godz. 11:00 • Orlik Główny</Text>
            </View>

            {!isCoach ? (
              <View style={styles.rsvpSection}>
                <Text style={styles.rsvpTitle}>Potwierdź obecność zawodnika na meczu:</Text>
                <View style={styles.rsvpButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.rsvpBtnYes,
                      matchStatus === 'attending' && styles.rsvpBtnYesActive,
                    ]}
                    onPress={() => handleRSVP('attending')}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.rsvpBtnText}>Będę / Gram</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.rsvpBtnNo,
                      matchStatus === 'declined' && styles.rsvpBtnNoActive,
                    ]}
                    onPress={() => handleRSVP('declined')}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.rsvpBtnText}>Nieobecny</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.coachSummary}>
                <Text style={styles.coachSummaryTitle}>📊 Status kadry na ten mecz:</Text>
                <Text style={styles.coachSummaryText}>• Potwierdzeni: 14 zawodników</Text>
                <Text style={styles.coachSummaryText}>• Nieobecni: 2 zawodników</Text>
                <Text style={styles.coachSummaryText}>• Oczekuje na odpowiedź: 3 rodziców</Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  matchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  matchLeague: { fontSize: 11, fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase' },
  matchTeams: { fontSize: 16, fontWeight: '900', color: '#f8fafc', marginVertical: 4 },
  matchMeta: { fontSize: 12, color: '#94a3b8' },
  rsvpSection: { marginTop: 8 },
  rsvpTitle: { fontSize: 13, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
  rsvpButtonsRow: { flexDirection: 'row', gap: 10 },
  rsvpBtnYes: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  rsvpBtnYesActive: { backgroundColor: '#16a34a' },
  rsvpBtnNo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  rsvpBtnNoActive: { backgroundColor: '#dc2626' },
  rsvpBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  coachSummary: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  coachSummaryTitle: { fontSize: 13, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6 },
  coachSummaryText: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
});