import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function StartScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-half" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Witaj ponownie, Trenerze 👋</Text>
            <Text style={styles.headerTitle}>SportsClub Pro</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={36} color="#cbd5e1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Zaawansowany Moduł Szybkiej Obecności */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.pulsingDot} />
              <Text style={styles.attendanceTitle}>LIVE: Trening Cykliczny</Text>
            </View>
            <Text style={styles.attendanceTime}>17:30 - 19:00</Text>
          </View>
          <Text style={styles.attendanceSub}>Szybka lista obecności (przesuń aby zaznaczyć):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attendanceScroll}>
            {[ { id: 1, num: 10, name: 'Jan K.', status: 'yes' }, { id: 2, num: 7, name: 'Adam W.', status: 'none' }, { id: 3, num: 4, name: 'Michał', status: 'none' } ].map(p => (
              <View key={p.id} style={styles.playerCheck}>
                <View style={[styles.playerAvatar, p.status === 'yes' && { backgroundColor: '#16a34a' }]}>
                  <Text style={[styles.avatarText, p.status === 'yes' && { color: '#fff' }]}>#{p.num}</Text>
                </View>
                <Text style={styles.playerName}>{p.name}</Text>
                <View style={styles.checkBtns}>
                  <TouchableOpacity style={[styles.checkBtn, styles.checkBtnYes, p.status === 'yes' && { opacity: 0.5 }]}><Ionicons name="checkmark" size={16} color="#fff" /></TouchableOpacity>
                  <TouchableOpacity style={[styles.checkBtn, styles.checkBtnNo]}><Ionicons name="close" size={16} color="#fff" /></TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Moduły Premium & AI</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]} onPress={() => router.push('/AiVideoAnalysis')}>
            <Ionicons name="videocam" size={28} color="#2563eb" style={styles.gridIcon} />
            <Text style={styles.gridTitle}>Kamera AI</Text>
            <Text style={styles.gridSub}>Analiza techniki</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]} onPress={() => router.push('/MatchOptimizer')}>
            <Ionicons name="flash" size={28} color="#16a34a" style={styles.gridIcon} />
            <Text style={styles.gridTitle}>Optymalizator</Text>
            <Text style={styles.gridSub}>Kadra meczowa</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#fdf4ff', borderColor: '#fbcfe8' }]} onPress={() => router.push('/ZadaniaDomowe')}>
            <Ionicons name="trophy" size={28} color="#c026d3" style={styles.gridIcon} />
            <Text style={styles.gridTitle}>Grywalizacja</Text>
            <Text style={styles.gridSub}>Zadania B2C</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]} onPress={() => router.push('/RodzicPanel')}>
            <Ionicons name="people" size={28} color="#d97706" style={styles.gridIcon} />
            <Text style={styles.gridTitle}>B2C Rodzice</Text>
            <Text style={styles.gridSub}>Kody dostępu</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { backgroundColor: '#2563eb', padding: 10, borderRadius: 12, marginRight: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  headerGreeting: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  profileBtn: { padding: 4 },
  
  content: { padding: 16 },
  
  attendanceCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 },
  attendanceTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  attendanceTime: { fontSize: 12, fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attendanceSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  attendanceScroll: { flexDirection: 'row' },
  playerCheck: { alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 12, width: 100 },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#3730a3' },
  playerName: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 12 },
  checkBtns: { flexDirection: 'row', gap: 10 },
  checkBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  checkBtnYes: { backgroundColor: '#16a34a' },
  checkBtnNo: { backgroundColor: '#ef4444' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16, marginLeft: 4, letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, alignItems: 'flex-start' },
  gridIcon: { marginBottom: 12 },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  gridSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
});
