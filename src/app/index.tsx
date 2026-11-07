import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function StartScreen() {
  const router = useRouter();

  const handleOpenAiVideo = () => router.push('/AiVideoAnalysis');
  const handleOpenTasks = () => router.push('/ZadaniaDomowe');
  const handleOpenOptimizer = () => router.push('/MatchOptimizer');
  const handleOpen1on1 = () => router.push('/TreningiIndywidualne');
  const handleOpenShop = () => router.push('/StrojePanel');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={28} color="#2563eb" style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>SportsClub Pro</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Szybka obecność */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.redDot} />
              <Text style={styles.attendanceTitle}>Trwa Trening (17:30 - 19:00)</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/Kalendarz')} style={{ padding: 10 }}>
              <Ionicons name="expand" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.attendanceSub}>Szybka obecność jednym palcem z poziomu pulpitu:</Text>
          <View style={styles.attendanceRow}>
            {/* Zwiększone pola klikalne dla wygody trenera na boisku */}
            <View style={styles.playerCheck}>
              <View style={styles.playerAvatar}><Text style={styles.avatarText}>#10</Text></View>
              <Text style={styles.playerName}>Jan</Text>
              <View style={styles.checkBtns}>
                <TouchableOpacity style={[styles.checkBtn, styles.checkBtnYes]}><Ionicons name="checkmark" size={20} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={[styles.checkBtn, styles.checkBtnNo]}><Ionicons name="close" size={20} color="#fff" /></TouchableOpacity>
              </View>
            </View>
            <View style={styles.playerCheck}>
              <View style={styles.playerAvatar}><Text style={styles.avatarText}>#7</Text></View>
              <Text style={styles.playerName}>Adam</Text>
              <View style={styles.checkBtns}>
                <TouchableOpacity style={[styles.checkBtn, styles.checkBtnNo]}><Ionicons name="close" size={20} color="#fff" /></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Zarządzanie Zespołem & AI</Text>
        
        {/* Moduły zarządzania */}
        <TouchableOpacity style={styles.actionCard} onPress={handleOpenOptimizer}>
          <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="flash" size={20} color="#16a34a" />
          </View>
          <Text style={styles.actionText}>Optymalizator Kadry AI</Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleOpenAiVideo}>
          <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="videocam" size={20} color="#2563eb" />
          </View>
          <Text style={styles.actionText}>Analiza Wideo Techniki AI</Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleOpen1on1}>
          <View style={[styles.actionIconBox, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="people" size={20} color="#dc2626" />
          </View>
          <Text style={styles.actionText}>Treningi Indywidualne (1-on-1)</Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleOpenTasks}>
          <View style={[styles.actionIconBox, { backgroundColor: '#fdf4ff' }]}>
            <Ionicons name="trophy" size={20} color="#c026d3" />
          </View>
          <Text style={styles.actionText}>Zadania Domowe & Grywalizacja</Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleOpenShop}>
          <View style={[styles.actionIconBox, { backgroundColor: '#fffbeb' }]}>
            <Ionicons name="cart" size={20} color="#d97706" />
          </View>
          <Text style={styles.actionText}>Zamówienia Strojów</Text>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  
  attendanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
  attendanceTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  attendanceSub: { fontSize: 11, color: '#64748b', marginTop: 4, marginBottom: 12 },
  attendanceRow: { flexDirection: 'row', gap: 12 },
  playerCheck: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  avatarText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  playerName: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 10 },
  checkBtns: { flexDirection: 'row', gap: 8 },
  checkBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  checkBtnYes: { backgroundColor: '#16a34a' },
  checkBtnNo: { backgroundColor: '#ef4444' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 12, marginLeft: 4 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionIconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
});
