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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

type ViewMode = 'miesiac' | 'tydzien' | 'lista';

interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  type: 'Mecz' | 'Trening' | 'Inne';
  squadIds: string[];
}

const QUICK_TIMES = ['07:05', '08:00', '10:00', '16:30', '17:00', '17:45', '18:00', '19:30'];

export default function KalendarzScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('miesiac');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');

  // Przygotowanie bazy zawodników z rocznikami
  const availablePlayers = MOCK_100_PLAYERS.slice(0, 20).map((p: any, idx: number) => ({
    ...p,
    firstName: p.firstName || p.name?.split(' ')[0] || 'Zawodnik',
    lastName: p.lastName || p.name?.split(' ')[1] || `#${idx + 1}`,
    year: p.year || (idx % 2 === 0 ? '2012' : '2013'),
    number: p.number || idx + 1,
  }));

  // Lista wydarzeń
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Wyjazdowy vs AP Warszawa',
      date: '2026-10-24',
      time: '07:05',
      location: 'Stadion Miejski, ul. Sportowa 1',
      type: 'Mecz',
      squadIds: ['1', '2', '3', '4', '5'],
    },
    {
      id: '2',
      title: 'Trening Taktyczny (Stałe Fragmenty)',
      date: '2026-10-26',
      time: '17:30',
      location: 'Orlik ul. Szkolna 5',
      type: 'Trening',
      squadIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
    },
    {
      id: '3',
      title: 'Trening Motoryczny + Szybkość',
      date: '2026-10-28',
      time: '17:30',
      location: 'Hala Sportowa, ul. Polna 12',
      type: 'Trening',
      squadIds: ['1', '2', '3', '6', '7'],
    },
  ]);

  // Stany Modali
  const [dayModalVisible, setDayModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('2026-10-24');
  const [eventTime, setEventTime] = useState<string>('07:05');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventType, setEventType] = useState<'Mecz' | 'Trening' | 'Inne'>('Mecz');
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);

  // Kliknięcie w dzień w kalendarzu -> Otwiera podsumowanie dnia
  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayModalVisible(true);
  };

  // Otwarcie formularza tworzenia wydarzenia dla wybranej daty
  const handleOpenCreateModal = (dateStr: string) => {
    setDayModalVisible(false);
    setEditingEventId(null);
    setEventTitle('');
    setEventDate(dateStr);
    setEventTime('07:05');
    setEventLocation('Klub / Boisko główne');
    setEventType('Mecz');
    setSelectedSquad(availablePlayers.slice(0, 8).map((p) => String(p.id)));
    setFormModalVisible(true);
  };

  // Otwarcie edycji istniejącego wydarzenia
  const handleOpenEditModal = (event: EventItem) => {
    setDayModalVisible(false);
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventLocation(event.location);
    setEventType(event.type);
    setSelectedSquad(event.squadIds);
    setFormModalVisible(true);
  };

  // Zapisz wydarzenie
  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę wydarzenia.');
      return;
    }

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEventId
            ? {
                ...ev,
                title: eventTitle,
                date: eventDate,
                time: eventTime,
                location: eventLocation,
                type: eventType,
                squadIds: selectedSquad,
              }
            : ev
        )
      );
      Alert.alert('Zaktualizowano 📅', 'Wydarzenie zostało zmienione.');
    } else {
      const newEv: EventItem = {
        id: Date.now().toString(),
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        type: eventType,
        squadIds: selectedSquad,
      };
      setEvents([newEv, ...events]);
      Alert.alert('Dodano ⚽', 'Nowe wydarzenie zostało zapisane.');
    }

    setFormModalVisible(false);
  };

  // Usuń wydarzenie
  const handleDeleteEvent = () => {
    if (!editingEventId) return;
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć to wydarzenie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          setEvents((prev) => prev.filter((ev) => ev.id !== editingEventId));
          setFormModalVisible(false);
        },
      },
    ]);
  };

  // Przełączanie zawodnika w kadrze
  const togglePlayerSquad = (id: string) => {
    if (selectedSquad.includes(id)) {
      setSelectedSquad(selectedSquad.filter((pId) => pId !== id));
    } else {
      setSelectedSquad([...selectedSquad, id]);
    }
  };

  // Kopiowanie powołania do faktycznego schowka systemu
  const handleCopySquadToClipboard = async () => {
    const nominatedNames = availablePlayers
      .filter((p) => selectedSquad.includes(String(p.id)))
      .map((p) => `• ${p.firstName} ${p.lastName} (Roczn. ${p.year}, #${p.number}) - Potwierdzone ✅`)
      .join('\n');

    const message = `📋 POWOŁANIE NA WYDARZENIE\n\n📌 ${eventTitle}\n📅 Data: ${eventDate} o godz. ${eventTime}\n📍 Miejsce: ${eventLocation}\n\nKADRA ZAWODNIKÓW (${selectedSquad.length}):\n${nominatedNames}\n\nProszę o punktualne przybycie! 👍`;

    await Clipboard.setStringAsync(message);
    Alert.alert('Skopiowano do Schowka! 📋', 'Treść powołania została pomyślnie skopiowana. Możesz ją wkleić bezpośrednio na WhatsApp lub Messenger.');
  };

  // Otwarcie mapy Google
  const openMapLocation = (loc: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    Linking.openURL(url).catch(() => Alert.alert('Błąd', 'Nie można otworzyć mapy.'));
  };

  const dayEvents = events.filter((ev) => ev.date === selectedDate);

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
          <Text style={styles.headerSubtitle}>
            Terminarz, zbiórki co do minuty i powołania
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleOpenCreateModal(selectedDate)}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK WIDOKU */}
      <View style={styles.viewToggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'miesiac' && styles.toggleBtnActive]}
          onPress={() => setViewMode('miesiac')}
        >
          <Ionicons name="grid-outline" size={14} color={viewMode === 'miesiac' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.toggleText, viewMode === 'miesiac' && styles.toggleTextActive]}>
            Miesiąc
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'tydzien' && styles.toggleBtnActive]}
          onPress={() => setViewMode('tydzien')}
        >
          <Ionicons name="calendar-outline" size={14} color={viewMode === 'tydzien' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.toggleText, viewMode === 'tydzien' && styles.toggleTextActive]}>
            Tydzień
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'lista' && styles.toggleBtnActive]}
          onPress={() => setViewMode('lista')}
        >
          <Ionicons name="list-outline" size={14} color={viewMode === 'lista' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.toggleText, viewMode === 'lista' && styles.toggleTextActive]}>
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* WIDOK MIESIĄCA */}
        {viewMode === 'miesiac' && (
          <View style={styles.cardBox}>
            <Text style={styles.monthTitle}>Październik 2026</Text>
            <Text style={styles.monthSubText}>Kliknij dzień, aby zobaczyć lub zarządzać wydarzeniami[cite: 12]</Text>

            <View style={styles.calendarGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const dayStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const hasEvent = events.some((ev) => ev.date === dayStr);
                const isSelected = selectedDate === dayStr;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      hasEvent && styles.dayCellHasEvent,
                    ]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasEvent && <View style={styles.eventDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* WIDOK TYGODNIA */}
        {viewMode === 'tydzien' && (
          <View style={styles.cardBox}>
            <Text style={styles.monthTitle}>Bieżący Tydzień (24 - 30 Października)</Text>
            {[
              { day: 'Sobota', date: '2026-10-24' },
              { day: 'Niedziela', date: '2026-10-25' },
              { day: 'Poniedziałek', date: '2026-10-26' },
              { day: 'Wtorek', date: '2026-10-27' },
              { day: 'Środa', date: '2026-10-28' },
              { day: 'Czwartek', date: '2026-10-29' },
              { day: 'Piątek', date: '2026-10-30' },
            ].map((dayObj) => {
              const dayEvents = events.filter((ev) => ev.date === dayObj.date);

              return (
                <TouchableOpacity
                  key={dayObj.date}
                  style={styles.weekDayRow}
                  onPress={() => handleDayPress(dayObj.date)}
                >
                  <View style={styles.weekDayHeader}>
                    <Text style={styles.weekDayName}>{dayObj.day}</Text>
                    <Text style={styles.weekDayDate}>{dayObj.date.substring(5)}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    {dayEvents.length > 0 ? (
                      dayEvents.map((ev) => (
                        <View key={ev.id} style={styles.eventSubCard}>
                          <Text style={styles.eventSubCardTitle}>{ev.title}</Text>
                          <Text style={styles.eventSubCardMeta}>
                            ⏰ {ev.time} • 📍 {ev.location}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noEventText}>Brak zajęć • Kliknij, aby zarządzać</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* WIDOK LISTY */}
        {viewMode === 'lista' && (
          <View>
            <Text style={styles.sectionTitle}>Nadchodzące Wydarzenia</Text>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventListCard}>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{ev.type}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.eventTitleText}>{ev.title}</Text>
                  <Text style={styles.eventMetaText}>
                    📅 {ev.date} o godz. <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{ev.time}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => openMapLocation(ev.location)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="location-outline" size={12} color="#2563eb" style={{ marginRight: 2 }} />
                    <Text style={{ fontSize: 11, color: '#2563eb', textDecorationLine: 'underline' }}>{ev.location}</Text>
                  </TouchableOpacity>
                  <Text style={styles.eventMetaText}>👥 Powołana kadra: {ev.squadIds.length} zawodników</Text>
                </View>
                <TouchableOpacity
                  style={styles.listEditBtn}
                  onPress={() => handleOpenEditModal(ev)}
                >
                  <Ionicons name="create-outline" size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: PODSUMOWANIE DNIA (WYŚWIETLA ZAPISANE WYDARZENIA LUB OPCJĘ DODANIA) */}
      <Modal animationType="fade" transparent={true} visible={dayModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zarządzaj dniem: {selectedDate}</Text>
              <TouchableOpacity onPress={() => setDayModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {dayEvents.length > 0 ? (
              <ScrollView style={{ maxHeight: 250 }}>
                {dayEvents.map((ev) => (
                  <View key={ev.id} style={styles.dayEventItemBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayEventTitle}>{ev.title}</Text>
                      <Text style={styles.dayEventSub}>⏰ {ev.time} • 📍 {ev.location}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editExistingBtn}
                      onPress={() => handleOpenEditModal(ev)}
                    >
                      <Text style={styles.editExistingBtnText}>Edytuj</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noEventsDayText}>Brak zaplanowanych wydarzeń w tym dniu.</Text>
            )}

            <TouchableOpacity
              style={styles.addNewEventInDayBtn}
              onPress={() => handleOpenCreateModal(selectedDate)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addNewEventInDayText}>+ Dodaj nowe wydarzenie w tym dniu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FORMULARZ TWORZENIA / EDYCJI WYDARZENIA I POWOŁAŃ */}
      <Modal animationType="slide" transparent={true} visible={formModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEventId ? 'Edytuj Wydarzenie ✏️' : 'Nowe Wydarzenie 📅'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nazwa wydarzenia</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Mecz Ligowy / Zbiórka wyjazdowa"
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              <Text style={styles.inputLabel}>Data wydarzenia (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={eventDate}
                onChangeText={setEventDate}
              />

              <Text style={styles.inputLabel}>Godzina zbiórki / odjazdu (Dokładna co do minuty)</Text>
              <TextInput
                style={[styles.modalInput, { fontSize: 16, fontWeight: 'bold', color: '#2563eb' }]}
                placeholder="np. 07:05"
                value={eventTime}
                onChangeText={setEventTime}
              />

              <Text style={styles.subInputLabel}>Szybkie sugestie godzin:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {QUICK_TIMES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, eventTime === t && styles.timeChipActive]}
                    onPress={() => setEventTime(t)}
                  >
                    <Text style={[styles.timeChipText, eventTime === t && styles.timeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Miejsce zbiórki / adres (Klikalne w mapy)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="np. Stadion Miejski, ul. Sportowa"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
                <TouchableOpacity
                  style={styles.mapIconButton}
                  onPress={() => openMapLocation(eventLocation)}
                >
                  <Ionicons name="map-outline" size={18} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View style={styles.squadHeaderRow}>
                <Text style={styles.inputLabel}>Powołaj Kadrę ({selectedSquad.length}) [z podziałem na roczniki]</Text>
                <TouchableOpacity onPress={handleCopySquadToClipboard}>
                  <Text style={styles.copyWhatsappBtnText}>📋 Kopiuj powołanie do WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.squadGrid}>
                {availablePlayers.map((p: any) => {
                  const isSelected = selectedSquad.includes(String(p.id));

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.squadChip, isSelected && styles.squadChipSelected]}
                      onPress={() => togglePlayerSquad(String(p.id))}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={14}
                        color={isSelected ? '#2563eb' : '#64748b'}
                      />
                      <View style={{ marginLeft: 6 }}>
                        <Text style={[styles.squadChipText, isSelected && styles.squadChipTextSelected]}>
                          {p.firstName} {p.lastName} (#{p.number})
                        </Text>
                        <Text style={styles.squadChipSubText}>Rocznik {p.year}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              {editingEventId && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteEvent}>
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent}>
                <Text style={styles.saveBtnText}>Zapisz Wydarzenie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  toggleBtnActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  toggleText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  toggleTextActive: { color: '#2563eb', fontWeight: 'bold' },

  content: { padding: 16 },
  cardBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  monthTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  monthSubText: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 12 },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  dayCellSelected: { backgroundColor: '#2563eb' },
  dayCellHasEvent: { backgroundColor: '#dbeafe' },
  dayCellText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  dayCellTextSelected: { color: '#fff', fontWeight: 'bold' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563eb', marginTop: 2 },

  weekDayRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekDayHeader: { width: 80 },
  weekDayName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  weekDayDate: { fontSize: 10, color: '#64748b' },
  eventSubCard: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: '#bfdbfe' },
  eventSubCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e40af' },
  eventSubCardMeta: { fontSize: 10, color: '#1e3a8a', marginTop: 2 },
  noEventText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  eventListCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eventBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  eventTitleText: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  eventMetaText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  listEditBtn: { padding: 6, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },

  /* MODALS */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  
  dayEventItemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  dayEventTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  dayEventSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  editExistingBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  editExistingBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
  noEventsDayText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginVertical: 14, fontStyle: 'italic' },
  addNewEventInDayBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginTop: 10 },
  addNewEventInDayText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 8, marginBottom: 4 },
  subInputLabel: { fontSize: 10, color: '#64748b', marginTop: 4, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
  },
  mapIconButton: { marginLeft: 6, backgroundColor: '#eff6ff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', justifyContent: 'center', alignItems: 'center' },

  timeChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 6 },
  timeChipActive: { backgroundColor: '#2563eb' },
  timeChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  timeChipTextActive: { color: '#fff', fontWeight: 'bold' },

  squadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  copyWhatsappBtnText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },
  squadGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  squadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '48%',
  },
  squadChipSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  squadChipText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  squadChipTextSelected: { color: '#2563eb', fontWeight: 'bold' },
  squadChipSubText: { fontSize: 9, color: '#64748b' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, alignItems: 'center' },
  deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});