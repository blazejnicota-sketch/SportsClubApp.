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

const QUICK_TIMES = ['07:05', '08:00', '10:00', '16:30', '17:00', '17:45', '18:00'];

export default function KalendarzScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('tydzien');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');

  // Baza zawodników do powołań
  const availablePlayers = MOCK_100_PLAYERS.slice(0, 15);

  // Lista wydarzeń
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Wyjazdowy vs AP Warszawa',
      date: '2026-10-24',
      time: '07:05',
      location: 'Zbiórka przy klubie / Wyjazd autobusu',
      type: 'Mecz',
      squadIds: ['1', '2', '3', '4', '5'],
    },
    {
      id: '2',
      title: 'Trening Taktyczny (Stałe Fragmenty)',
      date: '2026-10-26',
      time: '17:30',
      location: 'Orlik ul. Szkolna',
      type: 'Trening',
      squadIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
    },
    {
      id: '3',
      title: 'Trening Motoryczny + Szybkość',
      date: '2026-10-28',
      time: '17:30',
      location: 'Hala Sportowa / Boisko B',
      type: 'Trening',
      squadIds: ['1', '2', '3', '6', '7'],
    },
  ]);

  // Stan Modalu Wydarzenia (Tworzenie / Edycja)
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('2026-10-24');
  const [eventTime, setEventTime] = useState<string>('07:05');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventType, setEventType] = useState<'Mecz' | 'Trening' | 'Inne'>('Mecz');
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);

  // Otwarcie modalu tworzenia/edycji
  const handleOpenCreateModal = (dateStr?: string) => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDate(dateStr || selectedDate);
    setEventTime('07:05');
    setEventLocation('Klub / Boisko A');
    setEventType('Mecz');
    setSelectedSquad(availablePlayers.slice(0, 8).map((p: any) => String(p.id)));
    setModalVisible(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventLocation(event.location);
    setEventType(event.type);
    setSelectedSquad(event.squadIds);
    setModalVisible(true);
  };

  // Zapisywanie nowego lub edytowanego wydarzenia
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
      Alert.alert('Zaktualizowano 📅', 'Wydarzenie zostało pomyślnie zmienione.');
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
      Alert.alert('Dodano ⚽', 'Nowe wydarzenie zostało zapisane w kalendarzu.');
    }

    setModalVisible(false);
  };

  // Usuwanie wydarzenia
  const handleDeleteEvent = () => {
    if (!editingEventId) return;
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć to wydarzenie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          setEvents((prev) => prev.filter((ev) => ev.id !== editingEventId));
          setModalVisible(false);
        },
      },
    ]);
  };

  // Przełączanie powołania zawodnika
  const togglePlayerSquad = (id: string) => {
    if (selectedSquad.includes(id)) {
      setSelectedSquad(selectedSquad.filter((pId) => pId !== id));
    } else {
      setSelectedSquad([...selectedSquad, id]);
    }
  };

  // Kopiowanie treści powołania
  const handleCopySquadToWhatsApp = () => {
    const nominatedNames = availablePlayers
      .filter((p: any) => selectedSquad.includes(String(p.id)))
      .map((p: any) => {
        const pName = p.firstName || p.name || 'Zawodnik';
        const pLast = p.lastName || '';
        const pNum = p.number || 10;
        return `• ${pName} ${pLast} (#${pNum})`;
      })
      .join('\n');

    const message = `📋 POWOŁANIE NA MECZ / ZBIÓRKĘ\n\n📌 Wydarzenie: ${eventTitle}\n📅 Data: ${eventDate} o godz. ${eventTime}\n📍 Miejsce: ${eventLocation}\n\nKADRA (${selectedSquad.length}):\n${nominatedNames}\n\nProśba o zbiórkę punktualnie! 👍`;

    Alert.alert('Skopiowano Powołania! 📋', 'Treść powołania została skopiowana do schowka.');
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
          <Text style={styles.headerSubtitle}>
            Terminarz, godzina odjazdu/zbiórki oraz powołania
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleOpenCreateModal()}
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
            <Text style={styles.monthSubText}>Kliknij dzień, aby zobaczyć lub dodać wydarzenie</Text>

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
                    onPress={() => {
                      setSelectedDate(dayStr);
                      handleOpenCreateModal(dayStr);
                    }}
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
                  onPress={() => handleOpenCreateModal(dayObj.date)}
                >
                  <View style={styles.weekDayHeader}>
                    <Text style={styles.weekDayName}>{dayObj.day}</Text>
                    <Text style={styles.weekDayDate}>{dayObj.date.substring(5)}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    {dayEvents.length > 0 ? (
                      dayEvents.map((ev) => (
                        <TouchableOpacity
                          key={ev.id}
                          style={styles.eventSubCard}
                          onPress={() => handleOpenEditModal(ev)}
                        >
                          <Text style={styles.eventSubCardTitle}>{ev.title}</Text>
                          <Text style={styles.eventSubCardMeta}>
                            ⏰ Godz. {ev.time} • 📍 {ev.location}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noEventText}>Brak zajęć • Tapnij, aby dodać</Text>
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
              <TouchableOpacity
                key={ev.id}
                style={styles.eventListCard}
                onPress={() => handleOpenEditModal(ev)}
              >
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>{ev.type}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.eventTitleText}>{ev.title}</Text>
                  <Text style={styles.eventMetaText}>
                    📅 {ev.date} o godz. <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{ev.time}</Text>
                  </Text>
                  <Text style={styles.eventMetaText}>📍 {ev.location}</Text>
                  <Text style={styles.eventMetaText}>👥 Powołania: {ev.squadIds.length} zawodników</Text>
                </View>
                <Ionicons name="create-outline" size={18} color="#2563eb" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL TWORZENIA / EDYCJI WYDARZENIA I POWOŁAŃ */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEventId ? 'Edytuj Wydarzenie ✏️' : 'Nowe Wydarzenie 📅'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nazwa wydarzenia</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Wyjazd na mecz / Zbiórka"
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              <Text style={styles.inputLabel}>Godzina zbiórki / odjazdu (Dokładna co do minuty)</Text>
              <TextInput
                style={[styles.modalInput, { fontSize: 16, fontWeight: 'bold', color: '#2563eb' }]}
                placeholder="np. 07:05 lub 16:42"
                value={eventTime}
                onChangeText={setEventTime}
              />

              <Text style={styles.subInputLabel}>Lub kliknij szybką sugestię:</Text>
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

              <Text style={styles.inputLabel}>Miejsce zbiórki / meczu</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Boisko A lub parking przy klubie"
                value={eventLocation}
                onChangeText={setEventLocation}
              />

              <View style={styles.squadHeaderRow}>
                <Text style={styles.inputLabel}>Powołaj Kadrę ({selectedSquad.length})</Text>
                <TouchableOpacity onPress={handleCopySquadToWhatsApp}>
                  <Text style={styles.copyWhatsappBtnText}>📋 Skopiuj treść powołania</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.squadGrid}>
                {availablePlayers.map((p: any) => {
                  const isSelected = selectedSquad.includes(String(p.id));
                  const pName = p.firstName || p.name || 'Zawodnik';
                  const pNum = p.number || 10;

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
                      <Text style={[styles.squadChipText, isSelected && styles.squadChipTextSelected]}>
                        #{pNum} {pName}
                      </Text>
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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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

  /* MODAL */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  squadChipSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  squadChipText: { fontSize: 10, color: '#64748b', marginLeft: 4 },
  squadChipTextSelected: { color: '#2563eb', fontWeight: 'bold' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, alignItems: 'center' },
  deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});