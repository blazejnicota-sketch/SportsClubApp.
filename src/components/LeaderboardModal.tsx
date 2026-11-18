import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  coachId?: string;
}

export default function LeaderboardModal({
  visible,
  onClose,
  coachId,
}: LeaderboardModalProps) {
  const [loading, setLoading] = useState(true);
  const [playersRank, setPlayersRank] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      fetchLeaderboard();
    }
  }, [visible]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('players')
        .select('id, first_name, number, position, xp, year')
        .order('xp', { ascending: false })
        .limit(20);

      if (coachId) {
        query = query.eq('coach_id', coachId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setPlayersRank(data);
      } else {
        // Dane testowe w razie pustej bazy
        setPlayersRank([
          { id: '1', first_name: 'Kacper', number: 9, position: 'Napastnik', xp: 1450 },
          { id: '2', first_name: 'Filip', number: 10, position: 'Pomocnik', xp: 1280 },
          { id: '3', first_name: 'Antoni', number: 1, position: 'Bramkarz', xp: 1100 },
          { id: '4', first_name: 'Jan', number: 5, position: 'Obrońca', xp: 950 },
        ]);
      }
    } catch (err) {
      console.log('Błąd pobierania rankingu:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return '#fbbf24'; // Złoto
    if (index === 1) return '#94a3b8'; // Srebro
    if (index === 2) return '#b45309'; // Brąz
    return '#334155';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="trophy" size={22} color="#fbbf24" />
              <Text style={styles.modalTitle}>Ranking Drużyny (Leaderboard XP)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.descText}>
            Rywalizacja oparta na punktach XP za zadania AI ze skanera oraz aktywności z opasek sportowych.
          </Text>

          {loading ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#38bdf8" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {playersRank.map((player, index) => (
                <View
                  key={player.id || index}
                  style={[
                    styles.rankRow,
                    index === 0 && styles.rankRowFirst,
                  ]}
                >
                  <View
                    style={[
                      styles.positionBadge,
                      { backgroundColor: getMedalColor(index) },
                    ]}
                  >
                    <Text style={styles.positionText}>#{index + 1}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.playerName}>
                      {player.first_name} <Text style={styles.playerNum}>(#{player.number || '10'})</Text>
                    </Text>
                    <Text style={styles.playerMeta}>
                      {player.position || 'Zawodnik'} • Rocznik {player.year || '2014'}
                    </Text>
                  </View>

                  <View style={styles.xpPill}>
                    <Ionicons name="flash" size={12} color="#0f172a" />
                    <Text style={styles.xpText}>{player.xp || 0} XP</Text>
                  </View>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
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
  descText: { fontSize: 12, color: '#94a3b8', marginVertical: 12, lineHeight: 17 },
  loaderBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  rankRowFirst: { borderColor: '#fbbf24', borderWidth: 1.5 },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  playerNum: { fontSize: 12, color: '#38bdf8' },
  playerMeta: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  xpText: { fontSize: 12, fontWeight: '900', color: '#0f172a' },
});