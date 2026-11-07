import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import modułów
import ZawodnikPanelScreen from '../components/ZawodnikPanel';
import RodzicPanel from '../components/RodzicPanel';
import StrojePanel from '../components/StrojePanel';
import Finanse from '../components/Finanse';
import Raporty from '../components/Raporty';
import TreningiIndywidualnePanel from '../components/TreningiIndywidualne';
import { usePlayers } from '../components/PlayersContext';

type UserRole = 'trener' | 'zawodnik' | 'rodzic';
type ActiveModule = 'home' | 'boisko' | 'szatnia' | 'kalendarz' | 'zawodnicy' | 'stroje' | 'finanse' | 'raporty' | 'treningi';

const { width } = Dimensions.get('window');

// Dynamiczny, bezpieczny margines górny dla wszystkich urządzeń (naprawa obciętego nagłówka)
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function HomeScreen() {
  const router = useRouter();
  const { players, updatePlayer } = usePlayers();

  const [currentRole, setCurrentRole] = useState<UserRole>('trener');
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');

  const teamStats = {
    totalPlayers: players.length || 16,
    upcomingMatches: 2,
    unpaidFees: 3,
    nextTraining: 'Dziś, 17:30',
  };

  // Funkcja szybkiej obecności 1 palcem z pulpitu
  const handleQuickLiveAttendance = (playerId: string, status: 'present' | 'absent') => {
    const playerObj = players.find(p => p.id === playerId);
    if (!playerObj) return;
    
    const currentTotal = playerObj.trainingsTotal || 0;
    const currentPresent = playerObj.trainingsPresent || 0;

    // Tymczasowa aktualizacja na potrzeby demonstracji 1-kliknięcia na pulpicie
    updatePlayer(playerId, {
      trainingsTotal: currentTotal + 1,
      trainingsPresent: status === 'present' ? currentPresent + 1 : currentPresent,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* GÓRNY PASEK NAWIGACYJNY */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
          <Text style={styles.brandTitle}>SportsClub Pro</Text>
        </View>

        <View style={styles.roleSelectorRow}>
          <TouchableOpacity
            style={[styles.roleChip, currentRole === 'trener' && styles.roleChipActive]}
            onPress={() => { setCurrentRole('trener'); setActiveModule('home'); }}
          >
            <Text style={[styles.roleChipText, currentRole === 'trener' && styles.roleChipTextActive]}>Trener</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleChip, currentRole === 'rodzic' && styles.roleChipActive]}
            onPress={() => { setCurrentRole('rodzic'); setActiveModule('home'); }}
          >
            <Text style={[styles.roleChipText, currentRole === 'rodzic' && styles.roleChipTextActive]}>Rodzic</Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentRole === 'rodzic' ? (
        <RodzicPanel />
      ) : (
        <View style={styles.mainContainer}>
          {/* MENU MODUŁÓW TRENERA */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moduleNavScroll} contentContainerStyle={styles.moduleNavContent}>
            <TouchableOpacity style={[styles.moduleTab, activeModule === 'home' && styles.moduleTabActive]} onPress={() => setActiveModule('home')}>
              <Ionicons name="grid-outline" size={16} color={activeModule === 'home' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'home' && styles.moduleTabTextActive]}>Pulpit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.moduleTab, activeModule === 'treningi' && styles.moduleTabActive]} onPress={() => setActiveModule('treningi')}>
              <Ionicons name="fitness-outline" size={16} color={activeModule === 'treningi' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'treningi' && styles.moduleTabTextActive]}>1-on-1</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.moduleTab, activeModule === 'stroje' && styles.moduleTabActive]} onPress={() => setActiveModule('stroje')}>
              <Ionicons name="shirt-outline" size={16} color={activeModule === 'stroje' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'stroje' && styles.moduleTabTextActive]}>Stroje & Sklep</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.moduleTab, activeModule === 'finanse' && styles.moduleTabActive]} onPress={() => setActiveModule('finanse')}>
              <Ionicons name="wallet-outline" size={16} color={activeModule === 'finanse' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'finanse' && styles.moduleTabTextActive]}>Finanse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.moduleTab, activeModule === 'raporty' && styles.moduleTabActive]} onPress={() => setActiveModule('raporty')}>
              <Ionicons name="stats-chart-outline" size={16} color={activeModule === 'raporty' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'raporty' && styles.moduleTabTextActive]}>Raporty AI</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* WIDOK PULPITU TRENERA */}
          <View style={styles.moduleContentView}>
            {activeModule === 'home' && (
              <ScrollView contentContainerStyle={styles.dashboardScroll} showsVerticalScrollIndicator={false}>
                
                {/* NOWOŚĆ: MODUŁ "LIVE: TRWAJĄCY TRENING" (Obecność 1 palcem) */}
                <View style={styles.liveActionCard}>
                  <View style={styles.liveActionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveActionTitle}>Trwa Trening (17:30 - 19:00)</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/QuickAttendance')}>
                      <Ionicons name="expand" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.liveActionSub}>Szybka obecność jednym palcem z poziomu pulpitu:</Text>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {players.slice(0, 8).map(p => (
                      <View key={p.id} style={styles.quickTapCard}>
                        <View style={styles.quickTapAvatar}>
                          <Text style={styles.quickTapAvatarText}>#{p.number}</Text>
                        </View>
                        <Text style={styles.quickTapName} numberOfLines={1}>{p.firstName}</Text>
                        <View style={styles.quickTapButtons}>
                          <TouchableOpacity style={styles.quickTapYes} onPress={() => handleQuickLiveAttendance(p.id, 'present')}>
                            <Ionicons name="checkmark" size={24} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.quickTapNo} onPress={() => handleQuickLiveAttendance(p.id, 'absent')}>
                            <Ionicons name="close" size={24} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* PODSUMOWANIE STATYSTYK */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="people-outline" size={24} color="#3b82f6" />
                    <Text style={styles.statNumber}>{teamStats.totalPlayers}</Text>
                    <Text style={styles.statLabel}>Zarejestrowanych</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="calendar-outline" size={24} color="#10b981" />
                    <Text style={styles.statNumber}>{teamStats.upcomingMatches}</Text>
                    <Text style={styles.statLabel}>Mecze w miesiącu</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="alert-circle-outline" size={24} color="#dc2626" />
                    <Text style={styles.statNumber}>{teamStats.unpaidFees}</Text>
                    <Text style={styles.statLabel}>Zaległe składki</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="flash-outline" size={24} color="#8b5cf6" />
                    <Text style={styles.statNumberText}>Tryb Pro</Text>
                    <Text style={styles.statLabel}>Aktywne moduły AI</Text>
                  </View>
                </View>

                {/* SZYBKIE SKRÓTY DO NOWYCH FUNKCJI */}
                <View style={styles.quickActionSection}>
                  <Text style={styles.sectionHeaderTitle}>Zarządzanie Zespołem & AI</Text>
                  
                  <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/MatchOptimizer')}>
                    <Ionicons name="color-wand" size={20} color="#8b5cf6" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>AI Optymalizator Kadry Meczowej</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/AiVideoAnalysis')}>
                    <Ionicons name="videocam" size={20} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>Analiza Wideo Techniki (BETA)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/ZadaniaDomowe')}>
                    <Ionicons name="trophy" size={20} color="#f59e0b" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>Zadania Domowe i Tablica Wyników (Grywalizacja)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {activeModule === 'treningi' && <TreningiIndywidualnePanel />}
            {activeModule === 'stroje' && <StrojePanel />}
            {activeModule === 'finanse' && <Finanse />}
            {activeModule === 'raporty' && <Raporty />}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#0f172a' },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  brandTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  roleSelectorRow: { flexDirection: 'row' },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 8, marginLeft: 8, borderWidth: 1, borderColor: '#334155' },
  roleChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleChipText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  roleChipTextActive: { color: '#ffffff' },
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  
  moduleNavScroll: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', maxHeight: 56 },
  moduleNavContent: { paddingHorizontal: 12, alignItems: 'center', height: 55 },
  moduleTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  moduleTabActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  moduleTabText: { color: '#475569', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  moduleTabTextActive: { color: '#ffffff' },
  
  moduleContentView: { flex: 1 },
  dashboardScroll: { padding: 16 },
  
  /* WIDŻET LIVE TRENING - BŁYSKAWICZNA OBECNOŚĆ */
  liveActionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#fee2e2', marginBottom: 16, shadowColor: '#ef4444', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  liveActionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  livePulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626', marginRight: 8 },
  liveActionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  liveActionSub: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  quickTapCard: { width: 90, backgroundColor: '#f8fafc', borderRadius: 10, padding: 8, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  quickTapAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickTapAvatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  quickTapName: { fontSize: 11, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  quickTapButtons: { flexDirection: 'row', gap: 6 },
  quickTapYes: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' },
  quickTapNo: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { width: '48%', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, alignItems: 'flex-start' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 8 },
  statNumberText: { fontSize: 16, fontWeight: 'bold', color: '#8b5cf6', marginTop: 12, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
  
  quickActionSection: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  quickActionText: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#334155' },
});