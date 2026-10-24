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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MOCK_100_PLAYERS } from './data/mockPlayers';

type ViewMode = 'miesiac' | 'tydzien' | 'lista';
type AttendanceStatus = 'present' | 'pending' | 'absent';

interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  meetingTime: string; // HH:MM (Godzina Zbiórki)
  eventTime: string; // HH:MM (Godzina Wydarzenia / Meczu)
  location: string;
  type: 'Mecz' | 'Trening' | 'Inne';
  squadIds: string[];
  attendance: Record<string, AttendanceStatus>; // Statusy obecności dla każdego id zawodnika
}

export default function KalendarzScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('miesiac');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');

  // Przygotowanie bazy zawodników z rocznikami
  const availablePlayers = MOCK_100_PLAYERS.slice(0, 24).map((p: any, idx: number) => ({
    ...p,
    firstName: p.firstName || p.name?.split(' ')[0] || 'Zawodnik',
    lastName: p.lastName || p.name?.split(' ')[1] || `#${idx + 1}`,
    year: p.year || (idx % 3 === 0 ? '2012' : idx % 3 === 1 ? '2013' : '2014'),
    number: p.number || idx + 1,
  }));

  // Wydarzenia z początkowymi statusami obecności
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Wyjazdowy vs AP Warszawa',
      date: '2026-10-24',
      meetingTime: '07:05',
      eventTime: '08:30',
      location: 'Stadion Miejski, ul. Sportowa 1',
      type: 'Mecz',
      squadIds: ['1', '2', '3', '4', '5'],
      attendance: { '1': 'present', '2': 'present', '3': 'pending', '4': 'absent', '5': 'present' },
    },
    {
      id: '2',
      title: 'Trening Taktyczny (Stałe Fragmenty)',
      date: '2026-10-26',
      meetingTime: '17:15',
      eventTime: '17:30',
      location: 'Orlik ul. Szkolna 5',
      type: 'Trening',
      squadIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
      attendance: { '1': 'present', '2': 'present', '3': 'present' },
    },
  ]);

  // Modale
  const [dayModalVisible, setDayModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);

  // Stany Formularza Wydarzenia
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  
  // Daty i Godziny dla Pickerów
  const [eventDateObj, setEventDateObj] = useState<Date>(new Date(2026, 9, 24));
  const [meetingTimeObj, setMeetingTimeObj] = useState<Date>(new Date(2026, 9, 24, 7, 5));
  const [eventTimeObj, setEventTimeObj] = useState<Date>(new Date(2026, 9, 24, 8, 30));

  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventType, setEventType] = useState<'Mecz' | 'Trening' | 'Inne'>('Mecz');
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [squadAttendance, setSquadAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [squadYearFilter, setSquadYearFilter] = useState<string>('Wszyscy');

  // Stany Widoczności Pickerów
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showMeetingTimePicker, setShowMeetingTimePicker] = useState<boolean>(false);
  const [showEventTimePicker, setShowEventTimePicker] = useState<boolean>(false);

  // Sformatowane wartości
  const formattedDate = eventDateObj.toISOString().split('T')[0];
  const formattedMeetingTime = `${String(meetingTimeObj.getHours()).padStart(2, '0')}:${String(
    meetingTimeObj.getMinutes()
  ).padStart(2, '0')}`;
  const formattedEventTime = `${String(eventTimeObj.getHours()).padStart(2, '0')}:${String(
    eventTimeObj.getMinutes()
  ).padStart(2, '0')}`;

  // 1. STOSOWANIE SZABLONÓW WYDARZEŃ (Pkt 2)
  const applyTemplate = (templateType: 'mecz' | 'trening' | 'turniej') => {
    if (templateType === 'mecz') {
      setEventTitle('Mecz Wyjazdowy / Ligowy');
      setEventType('Mecz');
      setEventLocation('Parking przy klubie (Wyjazd Autobusu)');
      setMeetingTimeObj(new Date(eventDateObj.setHours(7, 5)));
      setEventTimeObj(new Date(eventDateObj.setHours(8, 30)));
    } else if (templateType === 'trening') {
      setEventTitle('Trening Taktyczny / Boiskowy');
      setEventType('Trening');
      setEventLocation('Szatnia Klubowa / Boisko A');
      setMeetingTimeObj(new Date(eventDateObj.setHours(17, 15)));
      setEventTimeObj(new Date(eventDateObj.setHours(17, 30)));
    } else if (templateType === 'turniej') {
      setEventTitle('Turniej Ogólnopolski (Całodniowy)');
      setEventType('Mecz');
      setEventLocation('Hala / Kompleks Sportowy');
      setMeetingTimeObj(new Date(eventDateObj.setHours(6, 45)));
      setEventTimeObj(new Date(eventDateObj.setHours(8, 0)));
    }
  };

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDayModalVisible(true);
  };

  const handleOpenCreateModal = (dateStr: string) => {
    setDayModalVisible(false);
    setEditingEventId(null);
    setEventTitle('');
    
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    setEventDateObj(new Date(yr, mo - 1, dy));
    setMeetingTimeObj(new Date(yr, mo - 1, dy, 7, 5));
    setEventTimeObj(new Date(yr, mo - 1, dy, 8, 30));
    setEventLocation('Klub / Boisko główne');
    setEventType('Mecz');

    const initialSquad = availablePlayers.slice(0, 8).map((p) => String(p.id));
    setSelectedSquad(initialSquad);
    
    // Domyślne statusy obecności: oczekuje
    const initAtt: Record<string, AttendanceStatus> = {};
    initialSquad.forEach((id) => (initAtt[id] = 'pending'));
    setSquadAttendance(initAtt);

    setSquadYearFilter('Wszyscy');
    setFormModalVisible(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setDayModalVisible(false);
    setEditingEventId(event.id);
    setEventTitle(event.title);
    
    const [yr, mo, dy] = event.date.split('-').map(Number);
    setEventDateObj(new Date(yr, mo - 1, dy));

    const [mHr, mMn] = event.meetingTime.split(':').map(Number);
    setMeetingTimeObj(new Date(yr, mo - 1, dy, mHr, mMn));

    const [eHr, eMn] = event.eventTime.split(':').map(Number);
    setEventTimeObj(new Date(yr, mo - 1, dy, eHr, eMn));

    setEventLocation(event.location);
    setEventType(event.type);
    setSelectedSquad(event.squadIds);
    setSquadAttendance(event.attendance || {});
    setSquadYearFilter('Wszyscy');
    setFormModalVisible(true);
  };

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
                date: formattedDate,
                meetingTime: formattedMeetingTime,
                eventTime: formattedEventTime,
                location: eventLocation,
                type: eventType,
                squadIds: selectedSquad,
                attendance: squadAttendance,
              }
            : ev
        )
      );
      Alert.alert('Zaktualizowano 📅', 'Wydarzenie zostało pomyślnie zmienione.');
    } else {
      const newEv: EventItem = {
        id: Date.now().toString(),
        title: eventTitle,
        date: formattedDate,
        meetingTime: formattedMeetingTime,
        eventTime: formattedEventTime,
        location: eventLocation,
        type: eventType,
        squadIds: selectedSquad,
        attendance: squadAttendance,
      };
      setEvents([newEv, ...events]);
      Alert.alert('Dodano ⚽', 'Nowe wydarzenie zostało zapisane.');
    }

    setFormModalVisible(false);
  };

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

  // Przełączanie udziału zawodnika w kadrze
  const togglePlayerSquad = (id: string) => {
    if (selectedSquad.includes(id)) {
      setSelectedSquad(selectedSquad.filter((pId) => pId !== id));
      const updated = { ...squadAttendance };
      delete updated[id];
      setSquadAttendance(updated);
    } else {
      setSelectedSquad([...selectedSquad, id]);
      setSquadAttendance({ ...squadAttendance, [id]: 'pending' });
    }
  };

  // 2. ZMIANA STATUSU OBECNOŚCI (Pkt 1)
  const setPlayerStatus = (id: string, status: AttendanceStatus) => {
    if (!selectedSquad.includes(id)) {
      setSelectedSquad([...selectedSquad, id]);
    }
    setSquadAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleCopySquadToClipboard = async () => {
    const nominatedNames = availablePlayers
      .filter((p) => selectedSquad.includes(String(p.id)))
      .map((p) => {
        const st = squadAttendance[String(p.id)] || 'pending';
        const stIcon = st === 'present' ? '✅ Obecny' : st === 'absent' ? '❌ Nieobecny' : '❓ Oczekuje';
        return `• ${p.firstName} ${p.lastName} (Roczn. ${p.year}, #${p.number}) - [${stIcon}]`;
      })
      .join('\n');

    const message = `📋 POWOŁANIE NA WYDARZENIE\n\n📌 ${eventTitle}\n📅 Data: ${formattedDate}\n⏰ Godzina Zbiórki: ${formattedMeetingTime}\n⚽ Początek Wydarzenia: ${formattedEventTime}\n📍 Miejsce: ${eventLocation}\n\nKADRA (${selectedSquad.length}):\n${nominatedNames}\n\nProśba o potwiwerdzenie obecności! 👍`;

    await Clipboard.setStringAsync(message);
    Alert.alert('Skopiowano! 📋', 'Treść powołania ze statusami obecności trafiła do schowka.');
  };

  const openMapLocation = (loc: string) => {
    if (!loc.trim()) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    Linking.openURL(url).catch(() => Alert.alert('Błąd', 'Nie można otworzyć mapy.'));
  };

  const filteredSquadPlayers = availablePlayers.filter((p) => {
    if (squadYearFilter === 'Wszyscy') return true;
    return p.year === squadYearFilter;
  });

  const dayEvents = events.filter((ev) => ev.date === selectedDate);

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
          <Text style={styles.headerSubtitle}>Terminarz, zbiórki i powołania</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenCreateModal(selectedDate)}>
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
          <Text style={[styles.toggleText, viewMode === 'miesiac' && styles.toggleTextActive]}>Miesiąc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'tydzien' && styles.toggleBtnActive]}
          onPress={() => setViewMode('tydzien')}
        >
          <Ionicons name="calendar-outline" size={14} color={viewMode === 'tydzien' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.toggleText, viewMode === 'tydzien' && styles.toggleTextActive]}>Tydzień</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'lista' && styles.toggleBtnActive]}
          onPress={() => setViewMode('lista')}
        >
          <Ionicons name="list-outline" size={14} color={viewMode === 'lista' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.toggleText, viewMode === 'lista' && styles.toggleTextActive]}>Lista</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* WIDOK MIESIĄCA */}
        {viewMode === 'miesiac' && (
          <View style={styles.cardBox}>
            <Text style={styles.monthTitle}>Październik 2026</Text>
            <Text style={styles.monthSubText}>Kliknij dzień, aby zobaczyć wydarzenia</Text>

            <View style={styles.calendarGrid}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                const dayStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const hasEvent = events.some((ev) => ev.date === dayStr);
                const isSelected = selectedDate === dayStr;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, hasEvent && styles.dayCellHasEvent]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>{dayNum}</Text>
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
              const dEvents = events.filter((ev) => ev.date === dayObj.date);

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
                    {dEvents.length > 0 ? (
                      dEvents.map((ev) => (
                        <View key={ev.id} style={styles.eventSubCard}>
                          <Text style={styles.eventSubCardTitle}>{ev.title}</Text>
                          <Text style={styles.eventSubCardMeta}>
                            ⏰ Zbiórka: {ev.meetingTime} | Meczen/Trening: {ev.eventTime}
                          </Text>
                          <TouchableOpacity
                            onPress={() => openMapLocation(ev.location)}
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
                          >
                            <Ionicons name="map-outline" size={11} color="#2563eb" style={{ marginRight: 3 }} />
                            <Text style={{ fontSize: 10, color: '#2563eb', textDecorationLine: 'underline' }}>{ev.location}</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noEventText}>Brak zajęć • Kliknij, aby dodać</Text>
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
                    📅 {ev.date} | ⏰ Zbiórka: <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{ev.meetingTime}</Text> | Wydarzenie: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{ev.eventTime}</Text>
                  </Text>

                  <TouchableOpacity
                    onPress={() => openMapLocation(ev.location)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
                  >
                    <Ionicons name="navigate-circle-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                      {ev.location} (Otwórz w Google Maps)
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.eventMetaText}>
                    👥 Powołana kadra: {ev.squadIds.length} zawodników (✅ {Object.values(ev.attendance || {}).filter(s => s === 'present').length} Potwierdzonych)
                  </Text>
                </View>

                <TouchableOpacity style={styles.listEditBtn} onPress={() => handleOpenEditModal(ev)}>
                  <Ionicons name="create-outline" size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: ZARZĄDZANIE DNIEM */}
      <Modal animationType="fade" transparent={true} visible={dayModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wydarzenia dla: {selectedDate}</Text>
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
                      <Text style={styles.dayEventSub}>
                        ⏰ Zbiórka: {ev.meetingTime} | Start: {ev.eventTime}
                      </Text>
                      <TouchableOpacity onPress={() => openMapLocation(ev.location)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Ionicons name="location-outline" size={11} color="#2563eb" />
                        <Text style={{ fontSize: 10, color: '#2563eb', marginLeft: 2, textDecorationLine: 'underline' }}>{ev.location}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.editExistingBtn} onPress={() => handleOpenEditModal(ev)}>
                      <Text style={styles.editExistingBtnText}>Edytuj</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noEventsDayText}>Brak zaplanowanych wydarzeń w tym dniu.</Text>
            )}

            <TouchableOpacity style={styles.addNewEventInDayBtn} onPress={() => handleOpenCreateModal(selectedDate)}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addNewEventInDayText}>+ Dodaj nowe wydarzenie w tym dniu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FORMULARZ Z SZABLONAMI I STATUSAMI OBECNOŚCI */}
      <Modal animationType="slide" transparent={true} visible={formModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '94%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingEventId ? 'Edytuj Wydarzenie ✏️' : 'Nowe Wydarzenie 📅'}</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* PKT 2: SZYBKIE SZABLONY WYDARZEŃ */}
              <Text style={styles.inputLabel}>Szybki szablon wydarzenia:</Text>
              <View style={styles.templateRow}>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('mecz')}>
                  <Text style={styles.templateChipText}>🚌 Wyjazd na Mecz</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('trening')}>
                  <Text style={styles.templateChipText}>⚽ Trening Domowy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('turniej')}>
                  <Text style={styles.templateChipText}>🏆 Turniej</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nazwa wydarzenia</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Mecz Ligowy / Zbiórka wyjazdowa"
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              {/* DATA I DWIE GODZINY */}
              <Text style={styles.inputLabel}>Data wydarzenia</Text>
              <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                <Text style={styles.pickerBoxBtnText}>{formattedDate}</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Godzina Zbiórki ⏰</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowMeetingTimePicker(true)}>
                    <Ionicons name="time-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                    <Text style={[styles.pickerBoxBtnText, { color: '#dc2626', fontSize: 14 }]}>{formattedMeetingTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Godzina Meczu/Zajęć ⚽</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowEventTimePicker(true)}>
                    <Ionicons name="time-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                    <Text style={[styles.pickerBoxBtnText, { color: '#2563eb', fontSize: 14 }]}>{formattedEventTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PICKERY DATY I GODZIN */}
              {showDatePicker && (
                <DateTimePicker
                  value={eventDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowDatePicker(false);
                    if (d) setEventDateObj(d);
                  }}
                />
              )}

              {showMeetingTimePicker && (
                <DateTimePicker
                  value={meetingTimeObj}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowMeetingTimePicker(false);
                    if (d) setMeetingTimeObj(d);
                  }}
                />
              )}

              {showEventTimePicker && (
                <DateTimePicker
                  value={eventTimeObj}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowEventTimePicker(false);
                    if (d) setEventTimeObj(d);
                  }}
                />
              )}

              {/* MIEJSCE ZBIÓRKI Z MAPĄ */}
              <Text style={styles.inputLabel}>Miejsce zbiórki / adres (Kliknij ikonę mapy)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="np. Stadion Miejski, ul. Sportowa 1"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
                <TouchableOpacity
                  style={styles.mapIconButton}
                  onPress={() => openMapLocation(eventLocation)}
                >
                  <Ionicons name="navigate-circle-outline" size={24} color="#2563eb" />
                </TouchableOpacity>
              </View>

              {/* POWOŁANIE KADRY I RSVS STATUSY */}
              <View style={styles.squadHeaderRow}>
                <Text style={styles.inputLabel}>Powołaj Kadrę ({selectedSquad.length})</Text>
                <TouchableOpacity onPress={handleCopySquadToClipboard}>
                  <Text style={styles.copyWhatsappBtnText}>📋 Kopiuj powołanie</Text>
                </TouchableOpacity>
              </View>

              {/* FILTR ROCZNIKÓW */}
              <View style={styles.yearFilterRow}>
                <Text style={styles.yearFilterLabel}>Filtruj rocznik:</Text>
                {['Wszyscy', '2012', '2013', '2014'].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.yearFilterChip, squadYearFilter === yr && styles.yearFilterChipActive]}
                    onPress={() => setSquadYearFilter(yr)}
                  >
                    <Text style={[styles.yearFilterChipText, squadYearFilter === yr && styles.yearFilterChipTextActive]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* PKT 1: ZAWODNICY Z PRZYCISKAMI STATUSU OBECNOŚCI */}
              <View style={{ marginTop: 4 }}>
                {filteredSquadPlayers.map((p: any) => {
                  const isSelected = selectedSquad.includes(String(p.id));
                  const status = squadAttendance[String(p.id)] || 'pending';

                  return (
                    <View key={p.id} style={[styles.playerRowCard, isSelected && styles.playerRowCardSelected]}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        onPress={() => togglePlayerSquad(String(p.id))}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={isSelected ? '#2563eb' : '#64748b'}
                        />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={[styles.squadChipText, isSelected && styles.squadChipTextSelected]}>
                            {p.firstName} {p.lastName} (#{p.number})
                          </Text>
                          <Text style={styles.squadChipSubText}>Rocznik {p.year}</Text>
                        </View>
                      </TouchableOpacity>

                      {/* WYBÓR STATUSU OBECNOŚCI */}
                      {isSelected && (
                        <View style={styles.attendanceBtnsRow}>
                          <TouchableOpacity
                            style={[styles.attBtn, status === 'present' && styles.attBtnPresent]}
                            onPress={() => setPlayerStatus(String(p.id), 'present')}
                          >
                            <Text style={styles.attBtnText}>✅</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.attBtn, status === 'pending' && styles.attBtnPending]}
                            onPress={() => setPlayerStatus(String(p.id), 'pending')}
                          >
                            <Text style={styles.attBtnText}>❓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.attBtn, status === 'absent' && styles.attBtnAbsent]}
                            onPress={() => setPlayerStatus(String(p.id), 'absent')}
                          >
                            <Text style={styles.attBtnText}>❌</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
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

  /* SZABLONY */
  templateRow: { flexDirection: 'row', marginBottom: 10 },
  templateChip: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  templateChipText: { fontSize: 11, fontWeight: 'bold', color: '#1e40af' },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 8, marginBottom: 4 },
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
  pickerBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pickerBoxBtnText: { fontSize: 13, fontWeight: 'bold', color: '#1e40af' },
  mapIconButton: { marginLeft: 6, padding: 4 },

  squadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  copyWhatsappBtnText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },

  yearFilterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  yearFilterLabel: { fontSize: 10, color: '#64748b', marginRight: 6 },
  yearFilterChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 4 },
  yearFilterChipActive: { backgroundColor: '#2563eb' },
  yearFilterChipText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  yearFilterChipTextActive: { color: '#fff', fontWeight: 'bold' },

  /* KARTA ZAWODNIKA I STATUSY */
  playerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playerRowCardSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  squadChipText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  squadChipTextSelected: { color: '#2563eb', fontWeight: 'bold' },
  squadChipSubText: { fontSize: 9, color: '#64748b' },

  attendanceBtnsRow: { flexDirection: 'row', alignItems: 'center' },
  attBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9', marginLeft: 4 },
  attBtnPresent: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  attBtnPending: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde047' },
  attBtnAbsent: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  attBtnText: { fontSize: 10 },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, alignItems: 'center' },
  deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 6 },
  cancelBtnText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});