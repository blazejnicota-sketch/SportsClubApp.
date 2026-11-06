import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayers, Player } from '../components/PlayersContext';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type TabType = 'wyzwania' | 'ranking';
type ChallengeStatus = 'aktywne' | 'zakonczone';

interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  deadline: string;
  status: ChallengeStatus;
  completedBy: string[]; // Tablica ID zawodników
}

// Interfejs rozszerzający na potrzeby lokalnego stanu XP (docelowo XP będzie w tabeli players w Supabase)
interface PlayerWithXP extends Player {
  xp: number;
}

export default function ZadaniaDomoweScreen() {
  const router = useRouter();
  const { players, updatePlayer } = usePlayers();

  const [activeTab, setActiveTab] = useState<TabType>('wyzwania');
  
  // Przykładowe wyzwania (docelowo z tabeli challenges)
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1',
      title: 'Mistrz Żonglerki (100 odbić)',
      description: 'Nagraj wideo lub potwierdź wykonanie 100 odbić piłki bez upadku (tylko nogi).',
      xpReward: 150,
      deadline: 'Do końca tygodnia',
      status: 'aktywne',
      completedBy: [],
    },
    {
      id: '2',
      title: 'Bieg tlenowy (W weekend)',
      description: 'Zrób 25 minut ciągłego biegu w wolnym tempie. Wyślij screen z aplikacji (np. Strava).',
      xpReward: 100,
      deadline: 'Niedziela, 20:00',
      status: 'aktywne',
      completedBy: [],
    },
    {
      id: '3',
      title: 'Rozciąganie po meczu',
      description: 'Wykonaj pełny protokół rozciągania z naszego poradnika (15 minut).',
      xpReward: 50,
      deadline: 'Zakończone',
      status: 'zakonczone',
      completedBy: players.slice(0, 5).map(p => p.id), // Pierwszych 5 graczy
    },
  ]);

  // Stan Modali
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  
  // Formularz nowego wyzwania
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newXP, setNewXP] = useState('100');
  const [newDeadline, setNewDeadline] = useState('Do niedzieli');

  // Weryfikacja wyzwania
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Zintegruj XP do graczy (tymczasowo losujemy XP dla efektu, dopóki nie dodasz kolumny XP do Supabase)
  const playersWithXP: PlayerWithXP[] = useMemo(() => {
    return players.map((p, index) => {
      // Jeśli zawodnik ukończył zakończone wyzwanie, dostaje 50 XP, reszta losowo dla demka
      const baseXP = challenges[2].completedBy.includes(p.id) ? 50 : 0;
      const demoXP = Math.floor(Math.random() * 800) + 100; 
      return { ...p, xp: baseXP + demoXP };
    }).sort((a, b) => b.xp - a.xp);
  }, [players, challenges]);

  const getRankInfo = (xp: number) => {
    if (xp >= 800) return { title: 'Złota Piłka', color: '#eab308', icon: 'trophy' };
    if (xp >= 500) return { title: 'Srebrny But', color: '#94a3b8', icon: 'medal' };
    if (xp >= 200) return { title: 'Brązowy Talent', color: '#b45309', icon: 'star' };
    return { title: 'Początkujący', color: '#64748b', icon: 'walk' };
  };

  const handleCreateChallenge = () => {
    if (!newTitle || !newDesc) {
      alert('Wypełnij tytuł i opis wyzwania.');
      return;
    }

    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      xpReward: parseInt(newXP) || 50,
      deadline: newDeadline,
      status: 'aktywne',
      completedBy: [],
    };

    setChallenges([newChallenge, ...challenges]);
    setCreateModalVisible(false);
    setNewTitle('');
    setNewDesc('');
  };

  const toggleChallengeCompletion = (playerId: string) => {
    if (!selectedChallenge) return;
    
    setChallenges(prev => prev.map(ch => {
      if (ch.id === selectedChallenge.id) {
        const isCompleted = ch.completedBy.includes(playerId);
        const newCompletedBy = isCompleted 
          ? ch.completedBy.filter(id => id !== playerId)
          : [...ch.completedBy, playerId];
        
        return { ...ch, completedBy: newCompletedBy };
      }
      return ch;
    }));

    // Aktualizujemy lokalny stan wybranego wyzwania dla modalu
    setSelectedChallenge(prev => {
      if (!prev) return null;
      const isCompleted = prev.completedBy.includes(playerId);
      return {
        ...prev,
        completedBy: isCompleted 
          ? prev.completedBy.filter(id => id !== playerId)
          : [...prev.completedBy, playerId]
      };
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Grywalizacja & XP</Text>
          <Text style={styles.headerSubtitle}>Zadania domowe dla akademii</Text>
        </View>
        <TouchableOpacity 
          style={styles.addChallengeBtn} 
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'wyzwania' && styles.tabBtnActive]}
          onPress={() => setActiveTab('wyzwania')}
        >
          <Ionicons name="game-controller-outline" size={16} color={activeTab === 'wyzwania' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }}/>
          <Text style={[styles.tabBtnText, activeTab === 'wyzwania' && styles.tabBtnTextActive]}>Wyzwania (Questy)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ranking' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ranking')}
        >
          <Ionicons name="podium-outline" size={16} color={activeTab === 'ranking' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }}/>
          <Text style={[styles.tabBtnText, activeTab === 'ranking' && styles.tabBtnTextActive]}>Tablica Liderów</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'wyzwania' && (
          <View>
            <Text style={styles.sectionTitle}>Aktywne Wyzwania (Zadania Domowe)</Text>
            {challenges.filter(c => c.status === 'aktywne').map((ch) => (
              <View key={ch.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeTitle}>{ch.title}</Text>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>+{ch.xpReward} XP</Text>
                  </View>
                </View>
                <Text style={styles.challengeDesc}>{ch.description}</Text>
                
                <View style={styles.challengeFooter}>
                  <Text style={styles.challengeDeadline}>⏳ {ch.deadline}</Text>
                  <TouchableOpacity 
                    style={styles.verifyBtn}
                    onPress={() => {
                      setSelectedChallenge(ch);
                      setVerifyModalVisible(true);
                    }}
                  >
                    <Ionicons name="checkmark-done-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.verifyBtnText}>Weryfikuj ({ch.completedBy.length})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Zakończone</Text>
            {challenges.filter(c => c.status === 'zakonczone').map((ch) => (
              <View key={ch.id} style={[styles.challengeCard, { opacity: 0.6 }]}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeTitle}>{ch.title}</Text>
                  <Text style={styles.completedCountText}>{ch.completedBy.length} ukończyło</Text>
                </View>
                <Text style={styles.challengeDesc} numberOfLines={1}>{ch.description}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'ranking' && (
          <View>
            <View style={styles.podiumContainer}>
              <Text style={styles.podiumTitle}>Top 3 Akademików 🏆</Text>
              {playersWithXP.slice(0, 3).map((p, index) => {
                const rank = getRankInfo(p.xp);
                return (
                  <View key={p.id} style={styles.topRankRow}>
                    <View style={styles.rankPositionBox}>
                      <Text style={styles.rankPositionText}>{index + 1}</Text>
                    </View>
                    <View style={[styles.rankAvatar, { borderColor: rank.color, borderWidth: 2 }]}>
                      <Text style={styles.rankAvatarText}>#{p.number}</Text>
                    </View>
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName}>{p.firstName} {p.lastName}</Text>
                      <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
                    </View>
                    <View style={styles.rankXpBox}>
                      <Text style={styles.rankXpText}>{p.xp} XP</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Pełny Ranking (Leaderboard)</Text>
            {playersWithXP.slice(3).map((p, index) => (
              <View key={p.id} style={styles.normalRankRow}>
                <Text style={styles.normalRankPos}>{index + 4}.</Text>
                <Text style={styles.normalRankName} numberOfLines={1}>{p.firstName} {p.lastName}</Text>
                <Text style={styles.normalRankXp}>{p.xp} XP</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL: KREATOR NOWEGO WYZWANIA */}
      <Modal animationType="slide" transparent={true} visible={createModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stwórz Nowe Zadanie 🎯</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tytuł (np. Mistrz Żonglerki)</Text>
            <TextInput style={styles.modalInput} value={newTitle} onChangeText={setNewTitle} />

            <Text style={styles.inputLabel}>Opis wyzwania i jak je zgłosić</Text>
            <TextInput 
              style={[styles.modalInput, { height: 80 }]} 
              multiline 
              value={newDesc} 
              onChangeText={setNewDesc} 
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Punkty XP (Nagroda)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={newXP} onChangeText={setNewXP} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Termin (Deadline)</Text>
                <TextInput style={styles.modalInput} value={newDeadline} onChangeText={setNewDeadline} />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateChallenge}>
              <Text style={styles.saveBtnText}>Opublikuj Wyzwanie Drużynie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: WERYFIKACJA WYZWANIA */}
      <Modal animationType="slide" transparent={true} visible={verifyModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weryfikuj: {selectedChallenge?.title}</Text>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.verifySubtext}>Zatwierdź zawodników, którzy poprawnie wykonali to zadanie. Otrzymają po +{selectedChallenge?.xpReward} XP.</Text>

            <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
              {players.map(p => {
                const isCompleted = selectedChallenge?.completedBy.includes(p.id);
                return (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[styles.verifyPlayerRow, isCompleted && styles.verifyPlayerRowActive]}
                    onPress={() => toggleChallengeCompletion(p.id)}
                  >
                    <View style={styles.verifyPlayerInfo}>
                      <View style={styles.verifyAvatar}><Text style={styles.verifyAvatarText}>#{p.number}</Text></View>
                      <Text style={styles.verifyPlayerName}>{p.firstName} {p.lastName}</Text>
                    </View>
                    <View style={[styles.verifyCheckbox, isCompleted && styles.verifyCheckboxActive]}>
                      {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setVerifyModalVisible(false)}>
              <Text style={styles.saveBtnText}>Zatwierdź XP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#f59e0b', fontWeight: 'bold' },
  addChallengeBtn: { backgroundColor: '#f59e0b', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  tabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  tabBtnTextActive: { color: '#2563eb' },
  
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  
  challengeCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  challengeTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  xpBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  xpBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#d97706' },
  challengeDesc: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 },
  challengeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  challengeDeadline: { fontSize: 12, color: '#94a3b8', fontWeight: 'bold' },
  verifyBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  verifyBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  completedCountText: { fontSize: 11, color: '#64748b', fontWeight: 'bold' },

  podiumContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20 },
  podiumTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16, textAlign: 'center' },
  topRankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginBottom: 8 },
  rankPositionBox: { width: 24, alignItems: 'center' },
  rankPositionText: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8' },
  rankAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  rankAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
  rankTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  rankXpBox: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rankXpText: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc' },

  normalRankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  normalRankPos: { width: 30, fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  normalRankName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  normalRankXp: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 8 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0f172a' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  verifySubtext: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  verifyPlayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  verifyPlayerRowActive: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8 },
  verifyPlayerInfo: { flexDirection: 'row', alignItems: 'center' },
  verifyAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  verifyAvatarText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  verifyPlayerName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  verifyCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  verifyCheckboxActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
});