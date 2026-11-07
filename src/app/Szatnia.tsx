import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, SafeAreaView, Platform, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers, Player } from '../components/PlayersContext';
import * as Clipboard from 'expo-clipboard';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type SubTab = 'zdrowie' | 'motoryka' | 'rodzice';

export default function SzatniaScreen() {
  const { players, addPlayer, updatePlayer, removePlayer, availableYears } = usePlayers();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('zdrowie');
  
  // Modale
  const [addPlayerVisible, setAddPlayerVisible] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newYear, setNewYear] = useState('2014');
  
  // Modal rodzica
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [activePlayerForInvite, setActivePlayerForInvite] = useState<Player | null>(null);

  const calculateBMI = (h?: number, w?: number) => {
    if (!h || !w || h === 0) return 0;
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleAddNewPlayer = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return Alert.alert('Błąd', 'Podaj imię i nazwisko');
    await addPlayer({
      firstName: newFirstName,
      lastName: newLastName,
      name: `${newFirstName} ${newLastName}`,
      number: Math.floor(Math.random() * 99) + 1,
      year: newYear,
      position: 'Brak',
      height: 140,
      weight: 35,
      parentPhone: '+48 000 000 000', // Domyślny, aby przypomnieć o uzupełnieniu
    });
    setAddPlayerVisible(false);
    setNewFirstName('');
    setNewLastName('');
    Alert.alert('Sukces', 'Zawodnik zapisany w bazie danych Supabase.');
  };

  const generateInvite = () => {
    if (!activePlayerForInvite) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    updatePlayer(activePlayerForInvite.id, { inviteCode: code });
    Alert.alert('Wygenerowano', `Kod: ${code}`);
  };

  const copyInvite = async () => {
    if (!activePlayerForInvite || !activePlayerForInvite.inviteCode) return;
    await Clipboard.setStringAsync(`Cześć! Kod dostępu do profilu Twojego dziecka w aplikacji to: ${activePlayerForInvite.inviteCode}`);
    Alert.alert('Skopiowano', 'Wiadomość z kodem skopiowana do schowka.');
  };
  
  const callParent = (phone?: string) => {
    if (!phone || phone.includes('000 000')) {
      Alert.alert('Brak numeru', 'Edytuj profil zawodnika i wpisz prawdziwy numer telefonu rodzica.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const textParentWhatsApp = (phone?: string) => {
    if (!phone || phone.includes('000 000')) {
      Alert.alert('Brak numeru', 'Edytuj profil zawodnika i wpisz prawdziwy numer telefonu rodzica.');
      return;
    }
    Linking.openURL(`whatsapp://send?phone=${phone.replace(/[\s+]/g, '')}`);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Szatnia & Baza Kadry</Text>
          <Text style={styles.headerSubtitle}>Zdrowie, BMI, Motoryka i Rodzice</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddPlayerVisible(true)}>
          <Ionicons name="person-add" size={14} color="#fff" />
          <Text style={styles.addBtnText}>+ Gracza</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'zdrowie' && styles.tabActive]} onPress={() => setActiveSubTab('zdrowie')}>
          <Text style={[styles.tabText, activeSubTab === 'zdrowie' && styles.tabTextActive]}>Zdrowie & BMI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'motoryka' && styles.tabActive]} onPress={() => setActiveSubTab('motoryka')}>
          <Text style={[styles.tabText, activeSubTab === 'motoryka' && styles.tabTextActive]}>Motoryka</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeSubTab === 'rodzice' && styles.tabActive]} onPress={() => setActiveSubTab('rodzice')}>
          <Text style={[styles.tabText, activeSubTab === 'rodzice' && styles.tabTextActive]}>Dostęp i Kontakt</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {players.map(p => {
          const bmi = calculateBMI(p.height, p.weight);
          const isLinked = !!p.parentId;

          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>#{p.number}</Text></View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.playerName}>{p.firstName} {p.lastName}</Text>
                  <Text style={styles.playerMeta}>Rocznik {p.year}</Text>
                </View>
                <TouchableOpacity onPress={() => removePlayer(p.id)}><Ionicons name="trash-outline" size={18} color="#dc2626" /></TouchableOpacity>
              </View>

              {activeSubTab === 'zdrowie' && (
                <View style={styles.dataRow}>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Wzrost</Text><Text style={styles.dataVal}>{p.height || '---'} cm</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Waga</Text><Text style={styles.dataVal}>{p.weight || '---'} kg</Text></View>
                  <View style={[styles.dataBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <Text style={styles.dataLabel}>BMI</Text><Text style={[styles.dataVal, { color: '#16a34a' }]}>{bmi || '---'}</Text>
                  </View>
                </View>
              )}

              {activeSubTab === 'motoryka' && (
                <View style={styles.dataRow}>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Sprint 30m</Text><Text style={styles.dataVal}>{p.sprint30m || '---'} s</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Skok</Text><Text style={styles.dataVal}>{p.jumpCm || '---'} cm</Text></View>
                  <View style={styles.dataBox}><Text style={styles.dataLabel}>Beep Test</Text><Text style={styles.dataVal}>{p.beepTest || '---'}</Text></View>
                </View>
              )}

              {activeSubTab === 'rodzice' && (
                <View style={styles.parentSection}>
                  <View style={styles.parentStatusRow}>
                    <Text style={styles.parentStatusLabel}>Status konta rodzica:</Text>
                    {isLinked ? (
                      <View style={[styles.badge, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold' }}>Powiązane ✓</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                        <Text style={{ fontSize: 10, color: '#dc2626', fontWeight: 'bold' }}>Brak dostępu</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.contactRow}>
                    <TouchableOpacity style={styles.contactBtnCall} onPress={() => callParent(p.parentPhone)}>
                      <Ionicons name="call" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.contactBtnText}>Zadzwoń</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactBtnWa} onPress={() => textParentWhatsApp(p.parentPhone)}>
                      <Ionicons name="logo-whatsapp" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.contactBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>

                  {!isLinked && (
                    <TouchableOpacity style={styles.inviteOpenBtn} onPress={() => { setActivePlayerForInvite(p); setInviteModalVisible(true); }}>
                      <Ionicons name="key-outline" size={14} color="#2563eb" style={{ marginRight: 6 }} />
                      <Text style={styles.inviteOpenBtnText}>Generuj dostęp do B2C</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Dodawania Zawodnika */}
      <Modal visible={addPlayerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nowy Zawodnik</Text>
            <TextInput style={styles.input} placeholder="Imię" value={newFirstName} onChangeText={setNewFirstName} />
            <TextInput style={styles.input} placeholder="Nazwisko" value={newLastName} onChangeText={setNewLastName} />
            <TextInput style={styles.input} placeholder="Rocznik" value={newYear} onChangeText={setNewYear} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddNewPlayer}><Text style={styles.saveBtnText}>Zapisz w Bazie</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddPlayerVisible(false)}><Text style={styles.cancelBtnText}>Anuluj</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Kodu Zaproszenia */}
      <Modal visible={inviteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kod Dostępu dla Rodzica</Text>
            <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
              Dla: {activePlayerForInvite?.firstName} {activePlayerForInvite?.lastName}
            </Text>
            
            {activePlayerForInvite?.inviteCode ? (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', letterSpacing: 4, color: '#0f172a' }}>{activePlayerForInvite.inviteCode}</Text>
                <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]} onPress={copyInvite}>
                  <Text style={styles.saveBtnText}>Kopiuj i wyślij SMS / WA</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.saveBtn} onPress={generateInvite}>
                <Text style={styles.saveBtnText}>Wygeneruj Unikalny Kod</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setInviteModalVisible(false)}><Text style={styles.cancelBtnText}>Zamknij</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, marginHorizontal: 2 },
  tabActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#2563eb', fontWeight: 'bold' },

  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b' },

  dataRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  dataBox: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  dataLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  dataVal: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },

  parentSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  parentStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  parentStatusLabel: { fontSize: 12, color: '#475569', fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  contactRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  contactBtnCall: { flex: 1, flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  contactBtnWa: { flex: 1, flexDirection: 'row', backgroundColor: '#25D366', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  contactBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  inviteOpenBtn: { flexDirection: 'row', backgroundColor: '#eff6ff', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  inviteOpenBtnText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#f8fafc' },
  saveBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#64748b' }
});
