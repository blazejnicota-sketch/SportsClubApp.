import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Importujemy panele ról
import ZawodnikPanelScreen from './ZawodnikPanel';
import RodzicPanelScreen from './RodzicPanel';

type UserRole = 'trener' | 'zawodnik' | 'rodzic';

export default function HomeScreen() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>('trener');

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* GÓRNY PASEK WYBORU ROLI (ZABEZPIECZONY PRZED NOTCHEM) */}
      <View style={styles.roleSwitchContainer}>
        <TouchableOpacity
          style={[styles.roleTab, currentRole === 'trener' && styles.roleTabActive]}
          onPress={() => setCurrentRole('trener')}
        >
          <Text style={[styles.roleTabText, currentRole === 'trener' && styles.roleTabTextActive]}>
            Trener
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, currentRole === 'zawodnik' && styles.roleTabActive]}
          onPress={() => setCurrentRole('zawodnik')}
        >
          <Text style={[styles.roleTabText, currentRole === 'zawodnik' && styles.roleTabTextActive]}>
            Zawodnik
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, currentRole === 'rodzic' && styles.roleTabActive]}
          onPress={() => setCurrentRole('rodzic')}
        >
          <Text style={[styles.roleTabText, currentRole === 'rodzic' && styles.roleTabTextActive]}>
            Rodzice
          </Text>
        </TouchableOpacity>
      </View>

      {/* DYNAMICZNA TREŚĆ W ZALEŻNOŚCI OD WYBRANEJ ROLI */}
      {currentRole === 'trener' && (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* NAGŁÓWEK Z BANNEREM POWITALNYM */}
          <View style={styles.headerBanner}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.welcomeSubtitle}>Witaj ponownie 👋</Text>
              <Text style={styles.welcomeTitle}>Trenerze Macieju</Text>
              <Text style={styles.teamTag}>UKS Sparta • Rocznik 2012/2013</Text>
            </View>
            <View style={styles.headerIconBox}>
              <Ionicons name="football" size={28} color="#2563eb" />
            </View>
          </View>

          <View style={styles.content}>
            {/* KARTA STATUSU ZESPOŁU */}
            <View style={styles.statusCard}>
              <Text style={styles.statusCardTitle}>Kondycja Zespołu (Październik)</Text>
              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusValue}>18 / 20</Text>
                  <Text style={styles.statusLabel}>Zdrowych graczy</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Text style={[styles.statusValue, { color: '#16a34a' }]}>92%</Text>
                  <Text style={styles.statusLabel}>Frekwencja</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Text style={[styles.statusValue, { color: '#d97706' }]}>2.msc</Text>
                  <Text style={styles.statusLabel}>W lidze</Text>
                </View>
              </View>
            </View>

            {/* ALERTY I POWIADOMIENIA */}
            <Text style={styles.sectionTitle}>Szybkie Alerty</Text>
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle" size={20} color="#d97706" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Mecz Ligowy w Sobotę!</Text>
                <Text style={styles.alertSub}>3 rodziców nie potwierdziło jeszcze obecności dziecka.</Text>
              </View>
              <TouchableOpacity
                style={styles.alertActionBtn}
                onPress={() => router.push('/Kalendarz' as any)}
              >
                <Text style={styles.alertActionText}>Sprawdź</Text>
              </TouchableOpacity>
            </View>

            {/* SZYBKIE SKRÓTY DO MODUŁÓW */}
            <Text style={styles.sectionTitle}>Centrum Dowodzenia</Text>
            
            <View style={styles.shortcutsGrid}>
              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/Boisko' as any)}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="football" size={22} color="#2563eb" />
                </View>
                <Text style={styles.shortcutTitle}>Tablica & Mecz</Text>
                <Text style={styles.shortcutDesc}>Ustawienie i protokół</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/Szatnia' as any)}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="fitness" size={22} color="#16a34a" />
                </View>
                <Text style={styles.shortcutTitle}>Szatnia & Testy</Text>
                <Text style={styles.shortcutDesc}>Zdrowie i notatki</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/Raporty' as any)}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#fdf4ff' }]}>
                  <Ionicons name="stats-chart" size={22} color="#9333ea" />
                </View>
                <Text style={styles.shortcutTitle}>Raporty & Kary</Text>
                <Text style={styles.shortcutDesc}>Statystyki i eksport PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/Finanse' as any)}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="wallet" size={22} color="#dc2626" />
                </View>
                <Text style={styles.shortcutTitle}>Finanse</Text>
                <Text style={styles.shortcutDesc}>Składki i opłaty</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {currentRole === 'zawodnik' && <ZawodnikPanelScreen />}
      {currentRole === 'rodzic' && <RodzicPanelScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  roleSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#1e293b',
  },
  roleTabActive: { backgroundColor: '#2563eb' },
  roleTabText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  roleTabTextActive: { color: '#fff' },

  headerBanner: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTextGroup: { flex: 1 },
  welcomeSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  teamTag: { fontSize: 11, color: '#2563eb', fontWeight: 'bold', marginTop: 4 },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },

  content: { padding: 16 },

  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  statusCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statusItem: { alignItems: 'center' },
  statusValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  statusLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  statusDivider: { width: 1, height: 26, backgroundColor: '#e2e8f0' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12 },

  alertBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  alertTitle: { fontSize: 13, fontWeight: 'bold', color: '#92400e' },
  alertSub: { fontSize: 11, color: '#b45309', marginTop: 2 },
  alertActionBtn: { backgroundColor: '#d97706', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  alertActionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  shortcutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  iconCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  shortcutTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  shortcutDesc: { fontSize: 10, color: '#64748b', marginTop: 2 },
});