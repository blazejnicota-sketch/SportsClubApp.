import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTeamStore } from './store/useTeamStore';

interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'TRENING' | 'MECZ LIGOWY' | 'SPARING' | 'INNE';
  location?: string;
  callups: string[]; // Identyfikatory powołanych zawodników
  attendance: { [playerId: string]: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' };
}

export default function KalendarzScreen() {
  const router = useRouter();
  const { players } = useTeamStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<string>('WSZYSTKIE');
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  // Przykładowe/początkowe wydarzenia
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Wyjazdowy z Orłami',
      date: '2026-10-20',
      time: '13:00',
      type: 'MECZ LIGOWY',
      location: 'Stadion Miejski',
      callups: [],
      attendance: {},
    },
  ]);

  // Stany dla modala dodawania nowego wydarzenia
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'TRENING' | 'MECZ LIGOWY' | 'SPARING' | 'INNE'>('TRENING');
  const [eventLocation, setEventLocation] = useState('');

  // Stany dla wyboru daty i godziny za pomocą ROLKI (DateTimePicker)
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Stany dla modala szczegółów / obecności / powołań
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CALLUPS' | 'ATTENDANCE'>('DETAILS');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const changeMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const handleAddEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Błąd', 'Wpisz tytuł wydarzenia.');
      return;
    }

    const formattedDate = selectedDateTime.toISOString().split('T')[0];
    const formattedTime = selectedDateTime.toTimeString().substring(0, 5);

    const newEv: EventItem = {
      id: Date.now().toString(),
      title: eventTitle,
      date: formattedDate,
      time: formattedTime,
      type: eventType,
      location: eventLocation,
      callups: [],
      attendance: {},
    };

    setEvents([...events, newEv]);
    setAddModalVisible(false);
    setEventTitle('');
    setEventLocation('');
  };

  const toggleCallup = (playerId: string) => {
    if (!selectedEvent) return;
    const isCallup = selectedEvent.callups.includes(playerId);
    const updatedCallups = isCallup
      ? selectedEvent.callups.filter((id) => id !== playerId)
      : [...selectedEvent.callups, playerId];

    const updatedEvent = { ...selectedEvent, callups: updatedCallups };
    setSelectedEvent(updatedEvent);
    setEvents(events.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
  };

  const setPlayerAttendance = (playerId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    if (!selectedEvent) return;
    const updatedAttendance = { ...selectedEvent.attendance, [playerId]: status };
    const updatedEvent = { ...selectedEvent, attendance: updatedAttendance };
    setSelectedEvent(updatedEvent);
    setEvents(events.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)));
  };

  const filteredEvents = events.filter((ev) => {
    if (filter === 'WSZYSTKIE') return true;
    return ev.type === filter;
  });

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      const dayEvents = filteredEvents.filter((e) => e.date === dayDateString);

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => {
            if (dayEvents.length > 0) {
              setSelectedEvent(dayEvents[0]);
              setActiveTab('DETAILS');
              setDetailsModalVisible(true);
            }
          }}
        >
          <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
            {day}
          </Text>
          {dayEvents.map((ev) => (
            <View key={ev.id} style={styles.eventBadge}>
              <Text style={styles.eventBadgeText} numberOfLines={1}>
                {ev.title}
              </Text>
            </View>
          ))}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      {/* Nagłówek Górny */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={18} color="#2f81f7" />
          <Text style={styles.backBtnText}>Strona główna</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Wydarzenie</Text>
        </TouchableOpacity>
      </View>

      {/* Nawigacja Miesiąca */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color="#8b949e" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color="#8b949e" />
        </TouchableOpacity>
      </View>

      {/* Filtry Typów Wydarzeń */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['WSZYSTKIE', 'TRENING', 'MECZ LIGOWY', 'SPARING'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.activeFilterChip]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.activeFilterChipText]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Przełącznik Widoku (Miesiąc / Lista) */}
      <View style={styles.viewToggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'month' && styles.activeToggleBtn]}
          onPress={() => setViewMode('month')}
        >
          <Ionicons name="calendar-outline" size={16} color={viewMode === 'month' ? '#fff' : '#8b949e'} />
          <Text style={[styles.toggleBtnText, viewMode === 'month' && styles.activeToggleBtnText]}>Miesiąc</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.activeToggleBtn]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#fff' : '#8b949e'} />
          <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.activeToggleBtnText]}>Lista</Text>
        </TouchableOpacity>
      </View>

      {/* Główna Zawartość: Kalendarz lub Lista */}
      {viewMode === 'month' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.weekDaysRow}>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sob', 'Nd'].map((d, index) => (
              <Text key={index} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>
          <ScrollView contentContainerStyle={styles.calendarGrid}>
            {renderDays()}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, marginTop: 10 }}>
          {filteredEvents.map((ev) => (
            <TouchableOpacity
              key={ev.id}
              style={styles.listItemCard}
              onPress={() => {
                setSelectedEvent(ev);
                setActiveTab('DETAILS');
                setDetailsModalVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.listItemTitle}>{ev.title}</Text>
                <Text style={styles.listItemBadge}>{ev.type}</Text>
              </View>
              <Text style={styles.listItemSub}>📅 {ev.date} o godz. {ev.time}</Text>
              {ev.location ? <Text style={styles.listItemSub}>📍 {ev.location}</Text> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* MODAL: DODAWANIE WYDARZENIA (Z ROLKĄ) */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nowe Wydarzenie</Text>

            <TextInput
              style={styles.input}
              placeholder="Nazwa wydarzenia"
              placeholderTextColor="#8b949e"
              value={eventTitle}
              onChangeText={setEventTitle}
            />

            {/* Przycisk otwierający Rolkę Daty */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#2f81f7" />
              <Text style={styles.pickerButtonText}>
                Data: {selectedDateTime.toISOString().split('T')[0]}
              </Text>
            </TouchableOpacity>

            {/* Przycisk otwierający Rolkę Godziny */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#2f81f7" />
              <Text style={styles.pickerButtonText}>
                Godzina: {selectedDateTime.toTimeString().substring(0, 5)}
              </Text>
            </TouchableOpacity>

            {/* Natywne Rolki DateTimePicker */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDateTime}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDateTime(date);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={selectedDateTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) setSelectedDateTime(date);
                }}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Lokalizacja (opcjonalnie)"
              placeholderTextColor="#8b949e"
              value={eventLocation}
              onChangeText={setEventLocation}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleAddEvent}
              >
                <Text style={styles.saveBtnText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SZCZEGÓŁY / POWOŁANIA / OBECNOŚĆ */}
      <Modal visible={detailsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            {selectedEvent && (
              <>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>

                {/* Zakładki Modala */}
                <View style={styles.modalTabsRow}>
                  <TouchableOpacity
                    style={[styles.modalTab, activeTab === 'DETAILS' && styles.activeModalTab]}
                    onPress={() => setActiveTab('DETAILS')}
                  >
                    <Text style={styles.modalTabText}>Szczegóły</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalTab, activeTab === 'CALLUPS' && styles.activeModalTab]}
                    onPress={() => setActiveTab('CALLUPS')}
                  >
                    <Text style={styles.modalTabText}>Powołania ({selectedEvent.callups.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalTab, activeTab === 'ATTENDANCE' && styles.activeModalTab]}
                    onPress={() => setActiveTab('ATTENDANCE')}
                  >
                    <Text style={styles.modalTabText}>Obecność</Text>
                  </TouchableOpacity>
                </View>

                {/* Zakładka: Szczegóły */}
                {activeTab === 'DETAILS' && (
                  <View style={{ paddingVertical: 10 }}>
                    <Text style={styles.detailText}>📅 Data: {selectedEvent.date}</Text>
                    <Text style={styles.detailText}>⏰ Godzina: {selectedEvent.time}</Text>
                    <Text style={styles.detailText}>🏷️ Typ: {selectedEvent.type}</Text>
                    {selectedEvent.location ? (
                      <Text style={styles.detailText}>📍 Miejsce: {selectedEvent.location}</Text>
                    ) : null}
                  </View>
                )}

                {/* Zakładka: Powołania na Mecz / Trening */}
                {activeTab === 'CALLUPS' && (
                  <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
                    {players.map((p: any) => {
                      const isCalled = selectedEvent.callups.includes(p.id);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.playerRow, isCalled && styles.playerRowSelected]}
                          onPress={() => toggleCallup(p.id)}
                        >
                          <Text style={styles.playerRowName}>
                            #{p.number || '-'} {p.name} ({p.position})
                          </Text>
                          <Ionicons
                            name={isCalled ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isCalled ? '#238636' : '#8b949e'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Zakładka: Lista Obecności */}
                {activeTab === 'ATTENDANCE' && (
                  <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
                    {players.map((p: any) => {
                      const status = selectedEvent.attendance[p.id] || 'ABSENT';
                      return (
                        <View key={p.id} style={styles.attendanceRow}>
                          <Text style={styles.playerRowName}>#{p.number || '-'} {p.name}</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                              style={[styles.attBtn, status === 'PRESENT' && styles.attBtnPresent]}
                              onPress={() => setPlayerAttendance(p.id, 'PRESENT')}
                            >
                              <Text style={styles.attBtnText}>Obecny</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.attBtn, status === 'ABSENT' && styles.attBtnAbsent]}
                              onPress={() => setPlayerAttendance(p.id, 'ABSENT')}
                            >
                              <Text style={styles.attBtnText}>Nieobecny</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { marginTop: 15, alignSelf: 'flex-end' }]}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Zamknij</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: 45,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  backBtnText: {
    color: '#2f81f7',
    fontWeight: '600',
    marginLeft: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#238636',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    marginBottom: 8,
  },
  monthTitle: {
    color: '#c9d1d9',
    fontSize: 16,
    fontWeight: '700',
  },
  navBtn: {
    padding: 4,
  },
  filterBar: {
    maxHeight: 40,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#161b22',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#30363d',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#1f6beb',
    borderColor: '#388bfd',
  },
  filterChipText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggleBtn: {
    backgroundColor: '#21262d',
  },
  toggleBtnText: {
    color: '#8b949e',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  activeToggleBtnText: {
    color: '#fff',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  weekDayText: {
    color: '#8b949e',
    width: '13%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14%',
    height: 75,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#21262d',
    padding: 2,
  },
  emptyDayCell: {
    width: '14%',
    height: 75,
    backgroundColor: '#0d1117',
  },
  todayCell: {
    borderColor: '#2f81f7',
    borderWidth: 2,
    backgroundColor: '#1c2128',
  },
  dayNumber: {
    color: '#c9d1d9',
    fontSize: 12,
    fontWeight: '600',
    margin: 2,
  },
  todayNumber: {
    color: '#58a6ff',
    fontWeight: '700',
  },
  eventBadge: {
    backgroundColor: '#1f6beb',
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginTop: 2,
  },
  eventBadgeText: {
    color: '#fff',
    fontSize: 9,
  },
  listItemCard: {
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    marginBottom: 10,
  },
  listItemTitle: {
    color: '#c9d1d9',
    fontSize: 15,
    fontWeight: '700',
  },
  listItemBadge: {
    color: '#58a6ff',
    fontSize: 11,
    fontWeight: '600',
  },
  listItemSub: {
    color: '#8b949e',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  modalTitle: {
    color: '#c9d1d9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#0d1117',
    color: '#c9d1d9',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pickerButtonText: {
    color: '#c9d1d9',
    marginLeft: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelBtn: {
    backgroundColor: '#21262d',
  },
  cancelBtnText: {
    color: '#c9d1d9',
  },
  saveBtn: {
    backgroundColor: '#238636',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    marginBottom: 10,
  },
  modalTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeModalTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2f81f7',
  },
  modalTabText: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: '600',
  },
  detailText: {
    color: '#c9d1d9',
    fontSize: 14,
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  playerRowSelected: {
    borderColor: '#238636',
  },
  playerRowName: {
    color: '#c9d1d9',
    fontSize: 13,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  attBtn: {
    backgroundColor: '#21262d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 6,
  },
  attBtnPresent: {
    backgroundColor: '#238636',
  },
  attBtnAbsent: {
    backgroundColor: '#da3633',
  },
  attBtnText: {
    color: '#fff',
    fontSize: 11,
  },
});