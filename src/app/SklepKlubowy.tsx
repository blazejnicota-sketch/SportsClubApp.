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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePlayers, Player } from '../components/PlayersContext';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type TabType = 'asortyment' | 'salda';

interface ShopItem {
  id: string;
  name: string;
  price: number;
  category: 'Sprzęt' | 'Wyjazd' | 'Inne';
  isMandatory: boolean;
}

interface PlayerObligation {
  itemId: string;
  isPaid: boolean;
}

export default function SklepKlubowyScreen() {
  const router = useRouter();
  const { players } = usePlayers();

  const [activeTab, setActiveTab] = useState<TabType>('asortyment');

  // Baza dostępnych opłat / sprzętu
  const [items, setItems] = useState<ShopItem[]>([
    { id: '1', name: 'Dresy Reprezentacyjne (Komplet)', price: 180, category: 'Sprzęt', isMandatory: true },
    { id: '2', name: 'Obóz Zimowy (Zaliczka)', price: 400, category: 'Wyjazd', isMandatory: false },
    { id: '3', name: 'Koszulka Treningowa', price: 65, category: 'Sprzęt', isMandatory: true },
  ]);

  // Stan przypisanych opłat do poszczególnych zawodników (Klucz: ID zawodnika)
  // Symulacja: Przypisujemy dresy i koszulki każdemu zawodnikowi, aby pokazać działanie
  const [playerObligations, setPlayerObligations] = useState<Record<string, PlayerObligation[]>>(() => {
    const initialObs: Record<string, PlayerObligation[]> = {};
    players.forEach(p => {
      initialObs[p.id] = [
        { itemId: '1', isPaid: Math.random() > 0.5 }, // Losowo niektórzy opłacili
        { itemId: '3', isPaid: false }
      ];
    });
    return initialObs;
  });

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Funkcja obliczająca łączne saldo danego zawodnika
  const getPlayerBalance = (playerId: string) => {
    const obligations = playerObligations[playerId] || [];
    let totalDebt = 0;
    
    obligations.forEach(ob => {
      if (!ob.isPaid) {
        const item = items.find(i => i.id === ob.itemId);
        if (item) totalDebt += item.price;
      }
    });
    return totalDebt;
  };

  const handleCreateItem = () => {
    if (!newItemName || !newItemPrice) {
      Alert.alert('Błąd', 'Podaj nazwę i cenę.');
      return;
    }

    const newItem: ShopItem = {
      id: Date.now().toString(),
      name: newItemName,
      price: parseFloat(newItemPrice),
      category: 'Inne',
      isMandatory: false,
    };

    setItems([...items, newItem]);
    setCreateModalVisible(false);
    setNewItemName('');
    setNewItemPrice('');
  };

  const assignItemToAll = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      'Potwierdzenie',
      `Czy na pewno chcesz przypisać opłatę "${item.name}" (${item.price} zł) całej drużynie?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Przypisz', 
          style: 'default',
          onPress: () => {
            setPlayerObligations(prev => {
              const updated = { ...prev };
              players.forEach(p => {
                const pObs = updated[p.id] || [];
                if (!pObs.find(o => o.itemId === itemId)) {
                  updated[p.id] = [...pObs, { itemId, isPaid: false }];
                }
              });
              return updated;
            });
            Alert.alert('Sukces', 'Opłata przypisana wszystkim zawodnikom.');
          }
        }
      ]
    );
  };

  const togglePaymentStatus = (playerId: string, itemId: string) => {
    setPlayerObligations(prev => {
      const updated = { ...prev };
      const pObs = updated[playerId] || [];
      updated[playerId] = pObs.map(ob => 
        ob.itemId === itemId ? { ...ob, isPaid: !ob.isPaid } : ob
      );
      return updated;
    });
  };

  const openPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setDetailsModalVisible(true);
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
          <Text style={styles.headerTitle}>Koszyk & Rozliczenia</Text>
          <Text style={styles.headerSubtitle}>Sprzęt i opłaty dodatkowe</Text>
        </View>
        <TouchableOpacity 
          style={styles.addItemBtn} 
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK ZAKŁADEK */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'asortyment' && styles.tabBtnActive]}
          onPress={() => setActiveTab('asortyment')}
        >
          <Ionicons name="cart-outline" size={16} color={activeTab === 'asortyment' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }}/>
          <Text style={[styles.tabBtnText, activeTab === 'asortyment' && styles.tabBtnTextActive]}>Katalog Opłat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'salda' && styles.tabBtnActive]}
          onPress={() => setActiveTab('salda')}
        >
          <Ionicons name="people-outline" size={16} color={activeTab === 'salda' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }}/>
          <Text style={[styles.tabBtnText, activeTab === 'salda' && styles.tabBtnTextActive]}>Salda Zawodników</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'asortyment' && (
          <View>
            <Text style={styles.sectionTitle}>Dostępny sprzęt i wydarzenia</Text>
            
            {items.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price} zł</Text>
                </View>
                <View style={styles.itemMetaRow}>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>{item.category}</Text>
                  </View>
                  {item.isMandatory && (
                    <View style={[styles.itemBadge, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
                      <Text style={[styles.itemBadgeText, { color: '#dc2626' }]}>Obowiązkowe</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.assignAllBtn} onPress={() => assignItemToAll(item.id)}>
                  <Ionicons name="people-circle-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
                  <Text style={styles.assignAllBtnText}>Przypisz całej drużynie (Dodaj do salda)</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'salda' && (
          <View>
            <Text style={styles.sectionTitle}>Łączne zadłużenie zawodników</Text>
            <Text style={styles.subtext}>Zawiera wszystkie nieopłacone sprzęty i wyjazdy. Kliknij, aby rozwinąć koszyk.</Text>

            {players.map(p => {
              const balance = getPlayerBalance(p.id);
              const isClear = balance === 0;

              return (
                <TouchableOpacity 
                  key={p.id} 
                  style={[styles.balanceCard, isClear && { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }]}
                  onPress={() => openPlayerDetails(p)}
                >
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>#{p.number}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.playerName}>{p.firstName} {p.lastName}</Text>
                    <Text style={styles.playerMeta}>Rocznik {p.year}</Text>
                  </View>
                  <View style={[styles.balanceBox, isClear ? styles.balanceClear : styles.balanceDebt]}>
                    <Text style={[styles.balanceText, isClear ? styles.balanceTextClear : styles.balanceTextDebt]}>
                      {isClear ? 'Rozliczony' : `${balance} zł`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL: DODANIE NOWEJ OPŁATY/SPRZĘTU */}
      <Modal animationType="slide" transparent={true} visible={createModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Nową Opłatę</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nazwa (np. Obóz letni)</Text>
            <TextInput style={styles.modalInput} value={newItemName} onChangeText={setNewItemName} />

            <Text style={styles.inputLabel}>Cena (PLN)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" value={newItemPrice} onChangeText={setNewItemPrice} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateItem}>
              <Text style={styles.saveBtnText}>Dodaj do katalogu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SZCZEGÓŁY KOSZYKA ZAWODNIKA */}
      <Modal animationType="slide" transparent={true} visible={detailsModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Koszyk: {selectedPlayer?.firstName} {selectedPlayer?.lastName}</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalDebtHeader}>
              <Text style={styles.totalDebtLabel}>Łącznie do zapłaty:</Text>
              <Text style={styles.totalDebtValue}>{selectedPlayer ? getPlayerBalance(selectedPlayer.id) : 0} zł</Text>
            </View>

            <Text style={styles.inputLabel}>Rozliczenia jednostkowe (Kliknij, aby zmienić status):</Text>
            
            <ScrollView style={{ flex: 1, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {selectedPlayer && playerObligations[selectedPlayer.id]?.map((ob, idx) => {
                const item = items.find(i => i.id === ob.itemId);
                if (!item) return null;

                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.obligationRow, ob.isPaid && styles.obligationRowPaid]}
                    onPress={() => togglePaymentStatus(selectedPlayer.id, item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.obligationName, ob.isPaid && { color: '#16a34a' }]}>{item.name}</Text>
                      <Text style={styles.obligationPrice}>{item.price} zł</Text>
                    </View>
                    <View style={[styles.statusToggle, ob.isPaid ? styles.statusTogglePaid : styles.statusToggleUnpaid]}>
                      <Text style={[styles.statusToggleText, ob.isPaid && { color: '#15803d' }]}>
                        {ob.isPaid ? 'Opłacone' : 'Zaległość'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {(!selectedPlayer || !playerObligations[selectedPlayer.id] || playerObligations[selectedPlayer.id].length === 0) && (
                <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 20 }}>
                  Brak przypisanych opłat dla tego zawodnika.
                </Text>
              )}
            </ScrollView>
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
  headerSubtitle: { fontSize: 12, color: '#2563eb', fontWeight: 'bold' },
  addItemBtn: { backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  tabBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  tabBtnTextActive: { color: '#2563eb' },
  
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
  subtext: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  itemMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  itemBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  itemBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  
  assignAllBtn: { backgroundColor: '#eff6ff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  assignAllBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: 'bold' },

  balanceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  playerMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  balanceBox: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  balanceDebt: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  balanceClear: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 0 },
  balanceText: { fontSize: 13, fontWeight: 'bold' },
  balanceTextDebt: { color: '#dc2626' },
  balanceTextClear: { color: '#16a34a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6, marginTop: 8 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0f172a' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  totalDebtHeader: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalDebtLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  totalDebtValue: { fontSize: 18, fontWeight: 'bold', color: '#dc2626' },
  
  obligationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  obligationRowPaid: { opacity: 0.6 },
  obligationName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  obligationPrice: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  statusToggleUnpaid: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statusTogglePaid: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusToggleText: { fontSize: 11, fontWeight: 'bold', color: '#dc2626' },
});