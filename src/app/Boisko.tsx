import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BoiskoScreen() {
  const [activeTab, setActiveTab] = useState<'tactic' | 'protocol'>('tactic');
  const [selectedFormation, setSelectedFormation] = useState('1-4-3-3');

  const [matchScore, setMatchScore] = useState({ home: 1, away: 0 });
  const [matchEvents, setMatchEvents] = useState([
    { id: '1', minute: 24, type: 'goal', player: 'Jan Kowalski (Asysta: Adam Nowak)', team: 'home' },
    { id: '2', minute: 38, type: 'yellow', player: 'Piotr Wiśniewski', team: 'home' },
  ]);

  const handleAddGoal = () => {
    setMatchScore((prev) => ({ ...prev, home: prev.home + 1 }));
    setMatchEvents([
      { id: Date.now().toString(), minute: Math.floor(Math.random() * 80) + 1, type: 'goal', player: 'Zawodnik z kadry', team: 'home' },
      ...matchEvents,
    ]);
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Centrum Boiska i Taktyki</Text>
        <Text style={styles.headerSubtitle}>Zarządzanie ustawieniem oraz protokół meczowy</Text>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tactic' && styles.activeTabBtn]}
          onPress={() => setActiveTab('tactic')}
        >
          <Ionicons name="football-outline" size={16} color={activeTab === 'tactic' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'tactic' && styles.activeTabText]}>Tablica Taktyczna</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'protocol' && styles.activeTabBtn]}
          onPress={() => setActiveTab('protocol')}
        >
          <Ionicons name="document-text-outline" size={16} color={activeTab === 'protocol' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'protocol' && styles.activeTabText]}>Protokół Meczowy</Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ */}
      {activeTab === 'tactic' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* WYBÓR FORMACJI */}
          <View style={styles.formationBar}>
            <Text style={styles.label}>Formacja:</Text>
            {['1-4-3-3', '1-4-4-2', '1-3-5-2'].map((form) => (
              <TouchableOpacity
                key={form}
                style={[styles.formChip, selectedFormation === form && styles.activeFormChip]}
                onPress={() => setSelectedFormation(form)}
              >
                <Text style={[styles.formChipText, selectedFormation === form && styles.activeFormChipText]}>
                  {form}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* WIZUALIZACJA BOISKA */}
          <View style={styles.pitchContainer}>
            <View style={styles.pitchCenterLine} />
            <View style={styles.pitchCenterCircle} />
            <View style={styles.pitchGoalTop} />
            <View style={styles.pitchGoalBottom} />

            <Text style={styles.pitchWatermark}>BOISKO TRENINGOWE ({selectedFormation})</Text>

            {/* Zawodnicy */}
            <View style={[styles.playerToken, { top: '12%', left: '45%' }]}>
              <Text style={styles.tokenText}>GK</Text>
              <Text style={styles.tokenName}>Kowal</Text>
            </View>

            <View style={[styles.playerToken, { top: '32%', left: '10%' }]}>
              <Text style={styles.tokenText}>OB</Text>
              <Text style={styles.tokenName}>Nowak</Text>
            </View>
            <View style={[styles.playerToken, { top: '32%', left: '35%' }]}>
              <Text style={styles.tokenText}>OB</Text>
              <Text style={styles.tokenName}>Wójcik</Text>
            </View>
            <View style={[styles.playerToken, { top: '32%', left: '60%' }]}>
              <Text style={styles.tokenText}>OB</Text>
              <Text style={styles.tokenName}>Zieliński</Text>
            </View>
            <View style={[styles.playerToken, { top: '32%', left: '82%' }]}>
              <Text style={styles.tokenText}>OB</Text>
              <Text style={styles.tokenName}>Kamiński</Text>
            </View>

            <View style={[styles.playerToken, { top: '55%', left: '25%' }]}>
              <Text style={styles.tokenText}>POM</Text>
              <Text style={styles.tokenName}>Mazur</Text>
            </View>
            <View style={[styles.playerToken, { top: '55%', left: '70%' }]}>
              <Text style={styles.tokenText}>POM</Text>
              <Text style={styles.tokenName}>Krawczyk</Text>
            </View>

            <View style={[styles.playerToken, { top: '75%', left: '47%' }]}>
              <Text style={styles.tokenText}>NAP</Text>
              <Text style={styles.tokenName}>Lewy</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.fullScreenTacticBtn}
            onPress={() => Alert.alert('Tablica', 'Przeciąganie zawodników i edycja pozycji')}
          >
            <Ionicons name="options-outline" size={18} color="#fff" />
            <Text style={styles.fullScreenTacticText}>Edytuj pozycje w formacji</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* WYNIK MECZU */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreSubtitle}>Mecz Ligowy • 68 minuta</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.teamNameText}>UKS Sparta</Text>
              <Text style={styles.scoreText}>
                {matchScore.home} : {matchScore.away}
              </Text>
              <Text style={styles.teamNameText}>MKS Orzeł</Text>
            </View>
            <View style={styles.matchLiveActions}>
              <TouchableOpacity style={styles.liveActionBtn} onPress={handleAddGoal}>
                <Ionicons name="football" size={16} color="#fff" />
                <Text style={styles.liveActionText}>+ Zapisz Bramkę</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TIMELINE */}
          <Text style={styles.sectionTitle}>Przebieg Spotkania (Timeline)</Text>
          {matchEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={styles.eventMinuteBadge}>
                <Text style={styles.eventMinuteText}>{event.minute}'</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.eventPlayer}>{event.player}</Text>
                <Text style={styles.eventTypeDesc}>
                  {event.type === 'goal' ? '⚽ Gol dla drużyny!' : '🟨 Żółta kartka'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeTabBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b', marginLeft: 6 },
  activeTabText: { color: '#2563eb' },

  content: { padding: 16 },

  formationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginRight: 10 },
  formChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9', marginRight: 6 },
  activeFormChip: { backgroundColor: '#2563eb' },
  formChipText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  activeFormChipText: { color: '#fff' },

  pitchContainer: {
    height: 380,
    backgroundColor: '#15803d',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#166534',
  },
  pitchCenterLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.4)', top: '50%' },
  pitchCenterCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: '50%',
    left: '50%',
    marginTop: -35,
    marginLeft: -35,
  },
  pitchGoalTop: {
    position: 'absolute',
    width: 100,
    height: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: 0,
    left: '50%',
    marginLeft: -50,
  },
  pitchGoalBottom: {
    position: 'absolute',
    width: 100,
    height: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    bottom: 0,
    left: '50%',
    marginLeft: -50,
  },
  pitchWatermark: { position: 'absolute', bottom: 8, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' },

  playerToken: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  tokenText: { fontSize: 10, fontWeight: 'bold', color: '#15803d' },
  tokenName: { fontSize: 8, fontWeight: '600', color: '#0f172a', position: 'absolute', bottom: -14, width: 60, textAlign: 'center' },

  fullScreenTacticBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  fullScreenTacticText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },

  scoreCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  scoreSubtitle: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  teamNameText: { fontSize: 14, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  scoreText: { fontSize: 32, fontWeight: 'bold', color: '#f59e0b', paddingHorizontal: 16 },
  matchLiveActions: { width: '100%' },
  liveActionBtn: { backgroundColor: '#16a34a', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  liveActionText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  eventRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventMinuteBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eventMinuteText: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },
  eventPlayer: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  eventTypeDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
});