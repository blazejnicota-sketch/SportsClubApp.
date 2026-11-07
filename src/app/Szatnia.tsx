import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, SafeAreaView, Platform, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, Player } from '../components/PlayersContext';
import * as Clipboard from 'expo-clipboard';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;
type SubTab = 'zdrowie' | 'motoryka' | 'rodzice';

export default function SzatniaScreen() {
  const { players, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('zdrowie');
  
  // Modale
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newYear, setNewYear] = useState('2014');
  
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);

  const calculateBMI = (h?: number, w?: number) => {
    if (!h || !w || h === 0) return 0;
    return (w / Math.pow(h / 100, 2)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi === 0) return { text: 'Brak danych', color: '#94a3b8' };
    if (bmi < 15) return { text: 'Niedowaga', color: '#eab308' };
    if (bmi > 22) return { text: 'Nadwaga', color: '#ef4444' };
    return { text: 'Prawidłowe', color: '#16a34a' };
  };

  const handleAddPlayer = async () => {
    if (!newFirstName || !newLastName) return Alert.alert('Błąd', 'Wpisz imię i nazwisko');
    await addPlayer({
      firstName: newFirstName, lastName: newLastName, name: `${newFirstName} ${newLastName}`,
      number: Math.floor(Math.random() * 99) + 1, year: newYear, position: 'Brak', height: 145, weight: 38, parentPhone: '+48 600 000 000'
    });
    setAddPlayerVisible(false); setNewFirstName(''); setNewLastName('');
  };

  const generateInvite = () => {
    if (!activePlayer) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    updatePlayer(activePlayer.id, { inviteCode: code });
  };

  const copyInvite = async () => {
    if (!activePlayer?.inviteCode) return;
    await Clipboard.setStringAsync(`Kod dostępu do aplikacji SportsClub dla Twojego dziecka to: ${activePlayer.inviteCode}`);
    Alert.alert('Skopiowano', 'Możesz teraz wkleić wiadomość w SMS lub WhatsApp.');
  };
  
  const openWhatsApp = (phone?: string) => {
    if (!phone) return Alert.alert('Brak numeru', 'Uzupełnij numer w profilu.');
    Linking.openURL(`whatsapp://send?phone=${phone.replace(/\s+/g, '')}`);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Szatnia & Kartoteki</Text>
          <Text style={styles.headerSubtitle}>Zdrowie, BMI, Motoryka, B2C</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddPlayerVisible(true)}>
          <Ionicons name="person-add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Nowy Gracz</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'zdrowie' && styles.tabActive]} onPress={() => setActiveSubTab('zdrowie')}>
          <Ionicons name="medkit" size={16} color={activeSubTab === 'zdrowie' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeSubTab === 'zdrowie' && styles.tabTextActive]}>Zdrowie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'motoryka' && styles.tabActive]} onPress={() => setActiveSubTab('motoryka')}>
          <Ionicons name="barbell" size={16} color={activeSubTab === 'motoryka' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeSubTab === 'motoryka' && styles.tabTextActive]}>Motoryka</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'rodzice' && styles.tabActive]} onPress={() => setActiveSubTab('rodzice')}>
          <Ionicons name="people" size={16} color={activeSubTab === 'rodzice' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeSubTab === 'rodzice' && styles.tabTextActive]}>Rodzice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.listCounter}>Zarejestrowani zawodnicy: {players.length}</Text>
        {players.map(p => {
          const bmiVal = Number(calculateBMI(p.height, p.weight));
          const bmiCat = getBMICategory(bmiVal);
          const isLinked = !!p.parentId;

          return (
            <View key={p.id} style={styles.playerCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>#{p.number}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.playerName}>{p.firstName} {p.lastName}</Text>
                  <Text style={styles.playerMeta}>Rocznik {p.year} • {p.position}</Text>
                </View>
                <TouchableOpacity onPress={() => removePlayer(p.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>

              {activeSubTab === 'zdrowie' && (
                <View style={styles.dataGrid}>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Wzrost</Text><Text style={styles.dataVal}>{p.height || '--'} cm</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Waga</Text><Text style={styles.dataVal}>{p.weight || '--'} kg</Text></View>
                  <View style={[styles.dataBox, { backgroundColor: '#f8fafc', borderColor: bmiCat.color, borderWidth: 2 }]}>
                    <Text style={styles.dataLabel}>Wskaźnik BMI</Text>
                    <Text style={[styles.dataVal, { color: bmiCat.color, fontSize: 18 }]}>{bmiVal || '--'}</Text>
                    <Text style={{ fontSize: 9, color: bmiCat.color, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' }}>{bmiCat.text}</Text>
                  </View>
                </View>
              )}

              {activeSubTab === 'motoryka' && (
                <View style={styles.dataGrid}>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Sprint 30m</Text><Text style={styles.dataVal}>{p.sprint30m || '--'}s</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Skok w dal</Text><Text style={styles.dataVal}>{p.jumpCm || '--'}cm</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Beep Test</Text><Text style={styles.dataVal}>{p.beepTest || '--'}</Text></View>
                </View>
              )}

              {activeSubTab === 'rodzice' && (
                <View style={styles.parentSection}>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Portal Rodzica (B2C):</Text>
                    {isLinked ? (
                      <View style={[styles.badge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}><Text style={[styles.badgeText, { color: '#16a34a' }]}>Powiązane ✓</Text></View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}><Text style={[styles.badgeText, { color: '#dc2626' }]}>Brak dostępu</Text></View>
                    )}
                  </View>

                  <View style={styles.contactRow}>
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={() => openWhatsApp(p.parentPhone)}>
                      <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                      <Text style={styles.contactBtnText}>Napisz WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#0f172a' }]} onPress={() => Linking.openURL(`tel:${p.parentPhone}`)}>
                      <Ionicons name="call" size={16} color="#fff" />
                      <Text style={styles.contactBtnText}>Zadzwoń</Text>
                    </TouchableOpacity>
                  </View>

                  {!isLinked && (
                    <TouchableOpacity style={styles.inviteBtn} onPress={() => { setActivePlayer(p); setInviteModalVisible(true); }}>
                      <Ionicons name="key-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                      <Text style={styles.inviteBtnText}>Generuj i wyślij kod dostępu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal Kodu */}
      <Modal visible={inviteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kod B2C dla Rodzica</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Zawodnik: <Text style={{ fontWeight: 'bold' }}>{activePlayer?.firstName} {activePlayer?.lastName}</Text></Text>
            
            {activePlayer?.inviteCode ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{activePlayer.inviteCode}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyInvite}>
                  <Ionicons name="copy" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.copyBtnText}>Skopiuj treść wiadomości SMS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.generateBtn} onPress={generateInvite}>
                <Text style={styles.generateBtnText}>Wygeneruj Unikalny Kod</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 5 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 6 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f8fafc', marginHorizontal: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#1d4ed8', shadowColor: '#2563eb', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  tabText: { fontSize: 12, fontWeight: '800', color: '#64748b', marginLeft: 6 },
  tabTextActive: { color: '#fff' },

  content: { padding: 16 },
  listCounter: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  
  playerCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bfdbfe' },
  avatarText: { fontSize: 14, fontWeight: '900', color: '#1e40af' },
  playerName: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  playerMeta: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  deleteBtn: { backgroundColor: '#fef2f2', padding: 10, borderRadius: 10 },

  dataGrid: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  dataBox: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  dataLabel: { fontSize: 11, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  dataVal: { fontSize: 16, fontWeight: '900', color: '#0f172a' },

  parentSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusLabel: { fontSize: 13, color: '#475569', fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  contactBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 12, elevation: 2 },
  contactBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', marginLeft: 8 },
  inviteBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 14, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: '#bfdbfe', borderStyle: 'dashed' },
  inviteBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  codeBox: { alignItems: 'center' },
  codeText: { fontSize: 40, fontWeight: '900', letterSpacing: 8, color: '#2563eb', backgroundColor: '#eff6ff', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  copyBtn: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', width: '100%', justifyContent: 'center' },
  copyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  generateBtn: { backgroundColor: '#2563eb', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
