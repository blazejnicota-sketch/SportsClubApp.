import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, Player } from './PlayersContext';
import { supabase } from '../services/supabase';

interface QuickAttendanceProps {
  trainingId?: string; // ID aktualnego treningu z bazy
  onClose?: () => void;
}

export default function QuickAttendance({ trainingId = 'default-training', onClose }: QuickAttendanceProps) {
  const { players, updatePlayer } = usePlayers();
  
  // Lokalny stan obecności dla widoku: { [playerId]: 'present' | 'absent' | 'late' | 'excused' }
  const [attendanceState, setAttendanceState] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    players.forEach(p => {
      initial[p.id] = 'present'; // Domyślnie każdy obecny, trener tylko koryguje
    });
    return initial;
  });

  const handleStatusChange = (playerId: string, status: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [playerId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      // Przykład zapisu statystyk obecności do bazy Supabase lub lokalnie
      for (const player of players) {
        const status = attendanceState[player.id];
        if (status === 'present') {
          const currentPresent = player.trainingsPresent || 0;
          const currentTotal = player.trainingsTotal || 0;
          updatePlayer(player.id, {
            trainingsPresent: currentPresent + 1,
            trainingsTotal: currentTotal + 1,
          });
        } else if (status === 'absent' || status === 'excused') {
          const currentTotal = player.trainingsTotal || 0;
          updatePlayer(player.id, {
            trainingsTotal: currentTotal + 1,
          });
        }
      }

      Alert.alert('Sukces! ⚽', 'Zapisano obecności na treningu.');
      if (onClose) onClose();
    } catch (err) {
      console.error('Błąd zapisu obecności:', err);
      Alert.alert('Błąd', 'Nie udało się zapisać obecności.');
    }
  };

  const renderItem = ({ item }: { item: Player }) => {
    const currentStatus = attendanceState[item.id] || 'present';

    return (
      <View style={styles.playerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.playerName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.playerSub}>Nr: {item.number} • {item.position}</Text>
        </View>

        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            style={[styles.statusBtn, currentStatus === 'present' && styles.btnPresentActive]}
            onPress={() => handleStatusChange(item.id, 'present')}
          >
            <Text style={[styles.btnText, currentStatus === 'present' && styles.textActive]}>Obecny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusBtn, currentStatus === 'absent' && styles.btnAbsentActive]}
            onPress={() => handleStatusChange(item.id, 'absent')}
          >
            <Text style={[styles.btnText, currentStatus === 'absent' && styles.textActive]}>Nieobecny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusBtn, currentStatus === 'late' && styles.btnLateActive]}
            onPress={() => handleStatusChange(item.id, 'late')}
          >
            <Text style={[styles.btnText, currentStatus === 'late' && styles.textActive]}>Spóźniony</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Szybka Obecność ⏱️</Text>
          <Text style={styles.subtitle}>Kliknij status zawodnika, aby zmienić</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveAttendance}>
        <Ionicons name="checkmark-done-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.saveButtonText}>Zapisz obecności zespołu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    paddingBottom: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  playerRow: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  playerName: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  playerSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  buttonsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  btnPresentActive: { backgroundColor: '#16a34a' },
  btnAbsentActive: { backgroundColor: '#dc2626' },
  btnLateActive: { backgroundColor: '#d97706' },
  btnText: { fontSize: 11, color: '#9ca3af', fontWeight: 'bold' },
  textActive: { color: '#fff' },
  saveButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});