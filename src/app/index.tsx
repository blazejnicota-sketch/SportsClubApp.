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
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import wszystkich modułów i ekranów aplikacji
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

export default function HomeScreen() {
  const router = useRouter();
  const { players } = usePlayers();

  // Stany główne aplikacji
  const [currentRole, setCurrentRole] = useState<UserRole>('trener');
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Przykładowe statystyki do pulpitu głównego trenera
  const teamStats = {
    totalPlayers: players.length || 16,
    upcomingMatches: 2,
    unpaidFees: 3,
    nextTraining: 'Czwartek, 18:30',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* GÓRNY PASEK NAWIGACYJNY / WYBÓR ROLI */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Ionicons name="shield-outline" size={24} color="#3b82f6" />
          <Text style={styles.brandTitle}>SportsClub App</Text>
        </View>

        <View style={styles.roleSelectorRow}>
          <TouchableOpacity
            style={[styles.roleChip, currentRole === 'trener' && styles.roleChipActive]}
            onPress={() => {
              setCurrentRole('trener');
              setActiveModule('home');
            }}
          >
            <Text style={[styles.roleChipText, currentRole === 'trener' && styles.roleChipTextActive]}>
              Trener
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleChip, currentRole === 'rodzic' && styles.roleChipActive]}
            onPress={() => {
              setCurrentRole('rodzic');
              setActiveModule('home');
            }}
          >
            <Text style={[styles.roleChipText, currentRole === 'rodzic' && styles.roleChipTextActive]}>
              Rodzic
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GŁÓWNA ZAWARTOŚĆ W ZALEŻNOŚCI OD ROLI */}
      {currentRole === 'rodzic' ? (
        <RodzicPanel />
      ) : (
        <View style={styles.mainContainer}>
          {/* PASSE-PARTOUT MENU MODUŁÓW TRENERA */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moduleNavScroll}
            contentContainerStyle={styles.moduleNavContent}
          >
            <TouchableOpacity
              style={[styles.moduleTab, activeModule === 'home' && styles.moduleTabActive]}
              onPress={() => setActiveModule('home')}
            >
              <Ionicons name="home-outline" size={16} color={activeModule === 'home' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'home' && styles.moduleTabTextActive]}>Start</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moduleTab, activeModule === 'treningi' && styles.moduleTabActive]}
              onPress={() => setActiveModule('treningi')}
            >
              <Ionicons name="fitness-outline" size={16} color={activeModule === 'treningi' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'treningi' && styles.moduleTabTextActive]}>1-on-1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moduleTab, activeModule === 'stroje' && styles.moduleTabActive]}
              onPress={() => setActiveModule('stroje')}
            >
              <Ionicons name="shirt-outline" size={16} color={activeModule === 'stroje' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'stroje' && styles.moduleTabTextActive]}>Stroje</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moduleTab, activeModule === 'finanse' && styles.moduleTabActive]}
              onPress={() => setActiveModule('finanse')}
            >
              <Ionicons name="wallet-outline" size={16} color={activeModule === 'finanse' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'finanse' && styles.moduleTabTextActive]}>Finanse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moduleTab, activeModule === 'raporty' && styles.moduleTabActive]}
              onPress={() => setActiveModule('raporty')}
            >
              <Ionicons name="bar-chart-outline" size={16} color={activeModule === 'raporty' ? '#fff' : '#64748b'} />
              <Text style={[styles.moduleTabText, activeModule === 'raporty' && styles.moduleTabTextActive]}>Raporty</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* RENDEROWANIE WIDOKU TRENERA */}
          <View style={styles.moduleContentView}>
            {activeModule === 'home' && (
              <ScrollView contentContainerStyle={styles.dashboardScroll}>
                <View style={styles.welcomeCard}>
                  <Text style={styles.welcomeTitle}>Witaj, Trenerze! ⚽</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Platforma zarządzania akademią działa stabilnie. Wszystkie moduły są gotowe do pracy.
                  </Text>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Ionicons name="people-outline" size={24} color="#3b82f6" />
                    <Text style={styles.statNumber}>{teamStats.totalPlayers}</Text>
                    <Text style={styles.statLabel}>Zawodników w kadrze</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Ionicons name="calendar-outline" size={24} color="#10b981" />
                    <Text style={styles.statNumber}>{teamStats.upcomingMatches}</Text>
                    <Text style={styles.statLabel}>Nadchodzące mecze</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
                    <Text style={styles.statNumber}>{teamStats.unpaidFees}</Text>
                    <Text style={styles.statLabel}>Zaległe składki</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Ionicons name="time-outline" size={24} color="#8b5cf6" />
                    <Text style={styles.statNumberText}>{teamStats.nextTraining}</Text>
                    <Text style={styles.statLabel}>Najbliższy trening</Text>
                  </View>
                </View>

                <View style={styles.quickActionSection}>
                  <Text style={styles.sectionHeaderTitle}>Szybkie skróty operacyjne</Text>
                  
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveModule('treningi')}
                  >
                    <Ionicons name="fitness" size={20} color="#3b82f6" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>Zarządzaj treningami indywidualnymi (1-on-1)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveModule('stroje')}
                  >
                    <Ionicons name="shirt" size={20} color="#10b981" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>Sprawdź zamówienia strojów i wizualizacje</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveModule('finanse')}
                  >
                    <Ionicons name="wallet" size={20} color="#f59e0b" style={{ marginRight: 10 }} />
                    <Text style={styles.quickActionText}>Przejdź do rozliczeń i wpłat członkowskich</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  roleSelectorRow: {
    flexDirection: 'row',
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginLeft: 8,
  },
  roleChipActive: {
    backgroundColor: '#3b82f6',
  },
  roleChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  moduleNavScrollObj: {
    maxHeight: 56,
  },
  moduleNavScroll: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 56,
  },
  moduleNavContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 55,
  },
  moduleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  moduleTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  moduleTabText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  moduleTabTextActive: {
    color: '#ffffff',
  },
  moduleContentView: {
    flex: 1,
  },
  dashboardScroll: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statNumberText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 10,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  quickActionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  quickActionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});