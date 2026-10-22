import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_100_PLAYERS, Player } from './data/mockPlayers';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'normal' | 'important' | 'urgent';
  readByPlayerIds: string[]; // Listy ID zawodników/rodziców, którzy odczytali
}

export default function KlubScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: '⚠️ Zmiana godziny sobotniego meczu ligowego!',
      content:
        'Mecz ze zbiórką o 09:30 został przesunięty na godzinę 11:00 z powodu zły warunków atmosferycznych. Prosimy o potwierdzenie w kalendarzu.',
      date: '2026-10-22 18:30',
      author: 'Trener Błażej',
      priority: 'urgent',
      readByPlayerIds: MOCK_100_PLAYERS.slice(0, 68).map((p) => p.id),
    },
    {
      id: '2',
      title: 'Zamówienie dresów klubowych - wpłaty',
      content:
        'Prosimy o uregulowanie wpłat na nowe dresy reprezentacyjne do końca tego tygodnia. Koszt zestawu wynosi 180 zł.',
      date: '2026-10-20 12:15',
      author: 'Kierownik Drużyny',
      priority: 'important',
      readByPlayerIds: MOCK_100_PLAYERS.slice(0, 85).map((p) => p.id),
    },
    {
      id: '3',
      title: 'Harmonogram treningów na rundę jesienną',
      content:
        'Treningi odbywają się we wtorki i czwartki o godzinie 17:00 na boisku ze sztuczną nawierzchnią.',
      date: '2026-10-15 09:00',
      author: 'Zarząd Klubu',
      priority: 'normal',
      readByPlayerIds: MOCK_100_PLAYERS.slice(0, 94).map((p) => p.id),
    },
  ]);

  // Modal tworzenia komunikatu
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<
    'normal' | 'important' | 'urgent'
  >('normal');

  // Modal szczegółów odczytań
  const [readsModalVisible, setReadsModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [readFilter, setReadFilter] = useState<'read' | 'unread'>('unread');

  const handleCreateAnnouncement = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł i treść ogłoszenia.');
      return;
    }

    const created: Announcement = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      author: 'Trener Błażej',
      priority: newPriority,
      readByPlayerIds: [],
    };

    setAnnouncements([created, ...announcements]);
    setNewTitle('');
    setNewContent('');
    setNewPriority('normal');
    setModalVisible(false);
    Alert.alert('Sukces', 'Komunikat został wysłany do drużyny!');
  };

  const openReadsModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setReadsModalVisible(true);
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return { label: 'PILNE', color: '#ef4444', bg: '#fef2f2' };
      case 'important':
        return { label: 'WAŻNE', color: '#d97706', bg: '#fffbeb' };
      case 'normal':
        return { label: 'INFORMACJA', color: '#2563eb', bg: '#eff6ff' };
    }
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ogłoszenia i Komunikacja</Text>
          <Text style={styles.headerSubtitle}>
            Wiadomości do zawodników i rodziców
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="megaphone" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Napisz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {announcements.map((item) => {
          const priorityStyle = getPriorityBadge(item.priority);
          const readCount = item.readByPlayerIds.length;
          const totalPlayers = MOCK_100_PLAYERS.length;
          const readPercentage = Math.round((readCount / totalPlayers) * 100);

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityStyle.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityBadgeText,
                      { color: priorityStyle.color },
                    ]}
                  >
                    {priorityStyle.label}
                  </Text>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.contentText}>{item.content}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.authorText}>Autor: {item.author}</Text>

                {/* LICZNIK ODCZYTAŃ */}
                <TouchableOpacity
                  style={styles.readCounterBtn}
                  onPress={() => openReadsModal(item)}
                >
                  <Ionicons name="eye-outline" size={16} color="#1d4ed8" />
                  <Text style={styles.readCounterText}>
                    Odczytane:{' '}
                    <Text style={styles.readCounterBold}>
                      {readCount}/{totalPlayers}
                    </Text>{' '}
                    ({readPercentage}%)
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#1d4ed8" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* MODAL TWORZENIA KOMUNIKATU */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowy Komunikat Klubowy</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tytuł ogłoszenia *</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Zmiana boiska / Odwołany trening"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Priorytet komunikatu</Text>
            <View style={styles.prioritySelector}>
              {(['normal', 'important', 'urgent'] as const).map((p) => {
                const info = getPriorityBadge(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.prioritySelectBtn,
                      newPriority === p && { backgroundColor: info.color },
                    ]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text
                      style={[
                        styles.prioritySelectText,
                        newPriority === p && { color: '#fff' },
                      ]}
                    >
                      {info.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Treść wiadomości *</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Wpisz szczegółowe informacje..."
              multiline
              value={newContent}
              onChangeText={setNewContent}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleCreateAnnouncement}
            >
              <Ionicons
                name="send"
                size={16}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.saveBtnText}>
                Wyślij do wszystkich (100 odbiorców)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SZCZEGÓŁÓW ODCZYTAŃ */}
      <Modal visible={readsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Status odczytań ogłoszenia</Text>
              <TouchableOpacity onPress={() => setReadsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* PRZEŁĄCZNIK: PRZECZYTANE / NIEPRZECZYTANE */}
            <View style={styles.readsToggleRow}>
              <TouchableOpacity
                style={[
                  styles.readsToggleBtn,
                  readFilter === 'unread' && styles.readsToggleBtnActiveUrgent,
                ]}
                onPress={() => setReadFilter('unread')}
              >
                <Text
                  style={[
                    styles.readsToggleText,
                    readFilter === 'unread' && styles.readsToggleTextActive,
                  ]}
                >
                  Nieodczytane (
                  {100 - (selectedAnnouncement?.readByPlayerIds.length || 0)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.readsToggleBtn,
                  readFilter === 'read' && styles.readsToggleBtnActiveSuccess,
                ]}
                onPress={() => setReadFilter('read')}
              >
                <Text
                  style={[
                    styles.readsToggleText,
                    readFilter === 'read' && styles.readsToggleTextActive,
                  ]}
                >
                  Odczytane ({selectedAnnouncement?.readByPlayerIds.length || 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* LISTA ZAWODNIKÓW */}
            <ScrollView style={{ marginTop: 10 }}>
              {MOCK_100_PLAYERS.filter((player) => {
                const isRead =
                  selectedAnnouncement?.readByPlayerIds.includes(player.id);
                return readFilter === 'read' ? isRead : !isRead;
              }).map((player) => (
                <View key={player.id} style={styles.playerStatusRow}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName}
                    </Text>
                    <Text style={styles.playerMeta}>
                      Rocznik {player.birthYear} • {player.category}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusIndicator,
                      readFilter === 'read' ? styles.bgSuccess : styles.bgDanger,
                    ]}
                  >
                    <Ionicons
                      name={
                        readFilter === 'read' ? 'checkmark-done' : 'time-outline'
                      }
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.statusIndicatorText}>
                      {readFilter === 'read' ? 'Odczytane' : 'Oczekuje'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityBadgeText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { fontSize: 11, color: '#9ca3af' },
  titleText: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  contentText: { fontSize: 13, color: '#4b5563', lineHeight: 18, marginBottom: 12 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: { fontSize: 11, color: '#6b7280', fontStyle: 'italic' },
  readCounterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readCounterText: { fontSize: 11, color: '#1d4ed8', marginLeft: 4, marginRight: 2 },
  readCounterBold: { fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  prioritySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  prioritySelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  prioritySelectText: { fontSize: 11, fontWeight: 'bold', color: '#4b5563' },
  saveBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  readsToggleRow: { flexDirection: 'row', marginBottom: 10 },
  readsToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  readsToggleBtnActiveUrgent: { backgroundColor: '#ef4444' },
  readsToggleBtnActiveSuccess: { backgroundColor: '#10b981' },
  readsToggleText: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },
  readsToggleTextActive: { color: '#fff' },
  playerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  playerMeta: { fontSize: 11, color: '#6b7280' },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bgSuccess: { backgroundColor: '#10b981' },
  bgDanger: { backgroundColor: '#f59e0b' },
  statusIndicatorText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
});