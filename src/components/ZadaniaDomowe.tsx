import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Challenge {
  id: string;
  title: string;
  category: 'Technika' | 'Regeneracja' | 'Siła';
  xp: number;
  deadline: string;
  completed: boolean;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export default function ZadaniaDomoweScreen() {
  const [totalXP, setTotalXP] = useState(1250);
  const [playerLevel, setPlayerLevel] = useState(4);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: '300 podań o ścianę (lewa / prawa noga)',
      category: 'Technika',
      xp: 150,
      deadline: '2026-10-25',
      completed: false,
    },
    {
      id: '2',
      title: '15 minut rolowania i mobilności stawów',
      category: 'Regeneracja',
      xp: 100,
      deadline: '2026-10-26',
      completed: true,
    },
    {
      id: '3',
      title: 'Analiza wideo: pressing w 1 połowie',
      category: 'Technika',
      xp: 120,
      deadline: '2026-10-27',
      completed: false,
    },
  ]);

  const [badges] = useState<Badge[]>([
    { id: '1', name: 'Król Asyst', icon: 'flash', description: 'Wykonano 10 wyzwań technicznych', unlocked: true },
    { id: '2', name: 'Żelazne Płuco', icon: 'heart', description: '100% frekwencji przez miesiąc', unlocked: true },
    { id: '3', name: 'Master Treningu', icon: 'trophy', description: 'Zdobyto ponad 2000 punktów XP', unlocked: false },
  ]);

  const [modalVisible, setModalVisible] = useState(false);

  const handleCompleteChallenge = (id: string, xpReward: number) => {
    setChallenges(
      challenges.map((item) => {
        if (item.id === id) {
          if (!item.completed) {
            setTotalXP((prev) => prev + xpReward);
            Alert.alert('Gratulacje! 🎉', `Zdobyto +${xpReward} XP!`);
          }
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* NAGłÓWEK GAMIFIKACJI */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroSubtitle}>Strefa Wyzwań i Rozwoju</Text>
            <Text style={styles.heroTitle}>Poziom {playerLevel} Zawodnika</Text>
          </View>
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.xpText}>{totalXP} XP</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressLabel}>650 / 1000 XP do poziomu 5</Text>
        </View>
      </View>

      {/* SEKCJA ODZNAK */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zdobyte Odznaki</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
          {badges.map((badge) => (
            <View
              key={badge.id}
              style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
            >
              <View style={[styles.badgeIconCircle, badge.unlocked ? styles.iconUnlocked : styles.iconLocked]}>
                <Ionicons
                  name={badge.icon as any}
                  size={20}
                  color={badge.unlocked ? '#d97706' : '#9ca3af'}
                />
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* LISTA AKTYWNYCH WYZWAŃ */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Aktywne Wyzwania Domowe</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Nowe wyzwanie</Text>
          </TouchableOpacity>
        </View>

        {challenges.map((item) => (
          <View key={item.id} style={styles.challengeCard}>
            <View style={styles.challengeTop}>
              <View
                style={[
                  styles.categoryTag,
                  item.category === 'Technika'
                    ? { backgroundColor: '#eff6ff' }
                    : { backgroundColor: '#f0fdf4' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTagText,
                    item.category === 'Technika'
                      ? { color: '#2563eb' }
                      : { color: '#16a34a' },
                  ]}
                >
                  {item.category}
                </Text>
              </View>
              <Text style={styles.deadlineText}>Termin: {item.deadline}</Text>
            </View>

            <Text style={styles.challengeTitle}>{item.title}</Text>

            <View style={styles.challengeFooter}>
              <View style={styles.xpRewardBadge}>
                <Ionicons name="flash" size={12} color="#d97706" />
                <Text style={styles.xpRewardText}>+{item.xp} XP</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  item.completed ? styles.btnCompleted : styles.btnPending,
                ]}
                onPress={() => handleCompleteChallenge(item.id, item.xp)}
              >
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={item.completed ? '#16a34a' : '#4b5563'}
                />
                <Text
                  style={[
                    styles.statusBtnText,
                    item.completed ? { color: '#16a34a' } : { color: '#4b5563' },
                  ]}
                >
                  {item.completed ? 'Wykonane' : 'Zrób to'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Nowe Wyzwanie</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Wyzwania domowe pozwalają zawodnikom zbierać punkty XP i podnosić swoje statystyki motoryczne.
            </Text>
            <TouchableOpacity
              style={styles.saveModalBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.saveModalBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroSubtitle: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  xpText: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
  progressContainer: { marginTop: 4 },
  progressBarBg: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'right' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtnText: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' },

  badgesRow: { flexDirection: 'row', paddingBottom: 4 },
  badgeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: 130,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeLocked: { opacity: 0.5 },
  badgeIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  iconUnlocked: { backgroundColor: '#fef3c7' },
  iconLocked: { backgroundColor: '#f1f5f9' },
  badgeName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  badgeDesc: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 2 },

  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryTagText: { fontSize: 10, fontWeight: 'bold' },
  deadlineText: { fontSize: 11, color: '#64748b' },
  challengeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  xpRewardBadge: { flexDirection: 'row', alignItems: 'center' },
  xpRewardText: { fontSize: 12, fontWeight: 'bold', color: '#d97706', marginLeft: 4 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  btnCompleted: { backgroundColor: '#f0fdf4' },
  btnPending: { backgroundColor: '#f1f5f9' },
  statusBtnText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 18 },
  saveModalBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});