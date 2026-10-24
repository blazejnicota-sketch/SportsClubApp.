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
  Switch,
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
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:MM
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  type: 'Mecz' | 'Trening' | 'Inne';
  isRecurring?: boolean;
  recurringDayOfWeek?: number; // 0 = Niedziela, 1 = Poniedziałek, itd.
  squadIds: string[];
  attendance: Record<string, AttendanceStatus>;
}

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const DAY_NAMES = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

export default function KalendarzScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('miesiac');
  
  // Stan nawigacji po miesiącach
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 9, 1)); // Październik 2026
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-25');

  const curYear = currentMonthDate.getFullYear();
  const curMonth = currentMonthDate.getMonth();
  const daysInCurrentMonth = new Date(curYear, curMonth + 1, 0).getDate();

  // Baza zawodników
  const availablePlayers = MOCK_100_PLAYERS.slice(0, 24).map((p: any, idx: number) => ({
    ...p,
    firstName: p.firstName || p.name?.split(' ')[0] || 'Zawodnik',
    lastName: p.lastName || p.name?.split(' ')[1] || `#${idx + 1}`,
    year: p.year || (idx % 3 === 0 ? '2012' : idx % 3 === 1 ? '2013' : '2014'),
    number: p.number || idx + 1,
  }));

  // Wydarzenia
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Godynice Szkoła Podstawowa',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      meetingTime: '07:05',
      startTime: '08:30',
      endTime: '10:15',
      location: 'Stadion Miejski, ul. Sportowa 1',
      type: 'Mecz',
      squadIds: ['1', '2', '3', '4', '5'],
      attendance: { '1': 'present', '2': 'present', '3': 'pending', '4': 'absent', '5': 'present' },
    },
    {
      id: '2',
      title: 'Trening Cykliczny Drużyny',
      startDate: '2026-10-26', // Poniedziałek
      endDate: '2026-10-26',
      meetingTime: '17:15',
      startTime: '17:30',
      endTime: '19:00',
      location: 'Orlik ul. Szkolna 5',
      type: 'Trening',
      isRecurring: true,
      recurringDayOfWeek: 1, // Poniedziałek
      squadIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
      attendance: { '1': 'present', '2': 'present' },
    },
  ]);

  // Modale
  const [dayModalVisible, setDayModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);

  // Stany Formularza
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  
  // Daty i Godziny
  const [startDateObj, setStartDateObj] = useState<Date>(new Date(2026, 9, 25));
  const [endDateObj, setEndDateObj] = useState<Date>(new Date(2026, 9, 25));
  const [meetingTimeObj, setMeetingTimeObj] = useState<Date>(new Date(2026, 9, 25, 7, 5));
  const [startTimeObj, setStartTimeObj] = useState<Date>(new Date(2026, 9, 25, 8, 30));
  const [endTimeObj, setEndTimeObj] = useState<Date>(new Date(2026, 9, 25, 10, 0));

  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventType, setEventType] = useState<'Mecz' | 'Trening' | 'Inne'>('Mecz');
  
  // Cykliczność intuicyjna
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [squadAttendance, setSquadAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [squadYearFilter, setSquadYearFilter] = useState<string>('Wszyscy');

  // Stany Pickerów
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showMeetingTimePicker, setShowMeetingTimePicker] = useState<boolean>(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);

  const formattedStartDate = startDateObj.toISOString().split('T')[0];
  const formattedEndDate = endDateObj.toISOString().split('T')[0];
  const formattedMeetingTime = `${String(meetingTimeObj.getHours()).padStart(2, '0')}:${String(meetingTimeObj.getMinutes()).padStart(2, '0')}`;
  const formattedStartTime = `${String(startTimeObj.getHours()).padStart(2, '0')}:${String(startTimeObj.getMinutes()).padStart(2, '0')}`;
  const formattedEndTime = `${String(endTimeObj.getHours()).padStart(2, '0')}:${String(endTimeObj.getMinutes()).padStart(2, '0')}`;

  const currentDayOfWeekName = DAY_NAMES[startDateObj.getDay()];

  // Sprawdzanie czy wydarzenie występuje w danym dniu (uwzględniając cykle co tydzień)
  const isEventOnDate = (ev: EventItem, dateStr: string) => {
    if (ev.startDate <= dateStr && dateStr <= ev.endDate) return true;
    if (ev.isRecurring && ev.recurringDayOfWeek !== undefined) {
      const targetDate = new Date(dateStr);
      const startDate = new Date(ev.startDate);
      if (targetDate >= startDate) {
        return targetDate.getDay() === ev.recurringDayOfWeek;
      }
    }
    return false;
  };

  // Szablony
  const applyTemplate = (templateType: 'mecz' | 'trening' | 'turniej') => {
    if (templateType === 'mecz') {
      setEventTitle('Mecz Godynice Szkoła Podstawowa');
      setEventType('Mecz');
      setEventLocation('Stadion Miejski, ul. Sportowa 1');
      setIsRecurring(false);
      setMeetingTimeObj(new Date(startDateObj.setHours(7, 5)));
      setStartTimeObj(new Date(startDateObj.setHours(8, 30)));
      setEndTimeObj(new Date(startDateObj.setHours(10, 15)));
    } else if (templateType === 'trening') {
      setEventTitle('Trening Cykliczny Drużyny');
      setEventType('Trening');
      setEventLocation('Orlik ul. Szkolna 5');
      setIsRecurring(true);
      setMeetingTimeObj(new Date(startDateObj.setHours(17, 15)));
      setStartTimeObj(new Date(startDateObj.setHours(17, 30)));
      setEndTimeObj(new Date(startDateObj.setHours(19, 0)));
    } else if (templateType === 'turniej') {
      setEventTitle('Turniej Dwudniowy');
      setEventType('Mecz');
      setEventLocation('Hala / Kompleks Sportowy');
      setIsRecurring(false);
      setMeetingTimeObj(new Date(startDateObj.setHours(6, 45)));
      setStartTimeObj(new Date(startDateObj.setHours(8, 0)));
      setEndTimeObj(new Date(startDateObj.setHours(16, 0)));
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(curYear, curMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(curYear, curMonth + 1, 1));
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
    const baseDate = new Date(yr, mo - 1, dy);
    setStartDateObj(baseDate);
    setEndDateObj(baseDate);
    setMeetingTimeObj(new Date(yr, mo - 1, dy, 7, 5));
    setStartTimeObj(new Date(yr, mo - 1, dy, 8, 30));
    setEndTimeObj(new Date(yr, mo - 1, dy, 10, 0));
    setEventLocation('Stadion Miejski, ul. Sportowa 1');
    setEventType('Mecz');
    setIsRecurring(baseDate.getDay() === 1); // np. domyślnie podpowiadaj dla poniedziałku

    const initialSquad = availablePlayers.slice(0, 8).map((p) => String(p.id));
    setSelectedSquad(initialSquad);
    
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
    
    const [sYr, sMo, sDy] = event.startDate.split('-').map(Number);
    setStartDateObj(new Date(sYr, sMo - 1, sDy));

    const [eYr, eMo, eDy] = event.endDate.split('-').map(Number);
    setEndDateObj(new Date(eYr, eMo - 1, eDy));

    const [mHr, mMn] = event.meetingTime.split(':').map(Number);
    setMeetingTimeObj(new Date(sYr, sMo - 1, sDy, mHr, mMn));

    const [sHr, sMn] = event.startTime.split(':').map(Number);
    setStartTimeObj(new Date(sYr, sMo - 1, sDy, sHr, sMn));

    const [eHr, eMn] = event.endTime.split(':').map(Number);
    setEndTimeObj(new Date(sYr, sMo - 1, sDy, eHr, eMn));

    setEventLocation(event.location);
    setEventType(event.type);
    setIsRecurring(event.isRecurring || false);
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

    const recurringDay = isRecurring ? startDateObj.getDay() : undefined;

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEventId
            ? {
                ...ev,
                title: eventTitle,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                meetingTime: formattedMeetingTime,
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                location: eventLocation,
                type: eventType,
                isRecurring,
                recurringDayOfWeek: recurringDay,
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
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        meetingTime: formattedMeetingTime,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        location: eventLocation,
        type: eventType,
        isRecurring,
        recurringDayOfWeek: recurringDay,
        squadIds: selectedSquad,
        attendance: squadAttendance,
      };
      setEvents([newEv, ...events]);
      Alert.alert('Dodano ⚽', isRecurring ? `Dodano cykliczny trening w każde ${currentDayOfWeekName}!` : 'Nowe wydarzenie zostało zapisane.');
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

  const setPlayerStatus = (id: string, status: AttendanceStatus) => {
    if (!selectedSquad.includes(id)) {
      setSelectedSquad([...selectedSquad, id]);
    }
    setSquadAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const selectEntireYear = () => {
    const yearPlayers = filteredSquadPlayers.map((p) => String(p.id));
    const newSquad = Array.from(new Set([...selectedSquad, ...yearPlayers]));
    setSelectedSquad(newSquad);
  };

  const handleCopySquadToClipboard = async () => {
    const nominatedNames = availablePlayers
      .filter((p) => selectedSquad.includes(String(p.id)))
      .map((p) => `• ${p.firstName} ${p.lastName}`)
      .join('\n');

    const dateStr = formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} do ${formattedEndDate}`;
    const message = `📌 ${eventTitle}\n📅 Data: ${dateStr}\n⏰ Zbiórka: ${formattedMeetingTime} | Start: ${formattedStartTime} - ${formattedEndTime}\n📍 Miejsce: ${eventLocation}\n\nKADRA (${selectedSquad.length}):\n${nominatedNames}\n\nProśba o potwierdzenie obecności! 👍`;

    await Clipboard.setStringAsync(message);
    Alert.alert('Skopiowano! 📋', 'Zwięzłe powołanie skopiowane do schowka.');
  };

  const openMapLocation = (loc: string) => {
    const targetLoc = loc.trim() || eventLocation.trim();
    if (!targetLoc) {
      Alert.alert('Brak adresu', 'Wpisz lokalizację lub adres.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetLoc)}`;
    Linking.openURL(url).catch(() => Alert.alert('Błąd', 'Nie można otworzyć mapy Google.'));
  };

  const filteredSquadPlayers = availablePlayers.filter((p) => {
    if (squadYearFilter === 'Wszyscy') return true;
    return p.year === squadYearFilter;
  });

  const dayEvents = events.filter((ev) => isEventOnDate(ev, selectedDate));

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
        {/* WIDOK MIESIĄCA Z NAWIGACJĄ */}
        {viewMode === 'miesiac' && (
          <View style={styles.cardBox}>
            <View style={styles.monthNavHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavArrow}>
                <Ionicons name="chevron-back" size={18} color="#2563eb" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{MONTH_NAMES[curMonth]} {curYear}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavArrow}>
                <Ionicons name="chevron-forward" size={18} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <Text style={styles.monthSubText}>Kliknij dzień, aby zobaczyć wydarzenia</Text>

            <View style={styles.calendarGrid}>
              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((dayNum) => {
                const dayStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const hasEvent = events.some((ev) => isEventOnDate(ev, dayStr));
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
            <Text style={styles.monthTitle}>Wybrany Tydzień</Text>
            {[
              { day: 'Poniedziałek', date: '2026-10-26' },
              { day: 'Wtorek', date: '2026-10-27' },
              { day: 'Środa', date: '2026-10-28' },
              { day: 'Czwartek', date: '2026-10-29' },
              { day: 'Piątek', date: '2026-10-30' },
              { day: 'Sobota', date: '2026-10-31' },
              { day: 'Niedziela', date: '2026-11-01' },
            ].map((dayObj) => {
              const dEvents = events.filter((ev) => isEventOnDate(ev, dayObj.date));

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
                            ⏰ Zbiórka: {ev.meetingTime} | Start: {ev.startTime} - {ev.endTime}
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
                    📅 {ev.startDate} | ⏰ Zbiórka: <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{ev.meetingTime}</Text> | Start: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{ev.startTime} - {ev.endTime}</Text>
                  </Text>
                  {ev.isRecurring && (
                    <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold', marginTop: 1 }}>
                      🔄 Cykliczne (co tydzień)
                    </Text>
                  )}

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
                    👥 Powołana kadra: {ev.squadIds.length} zawodników
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
                        ⏰ Zbiórka: {ev.meetingTime} | Start: {ev.startTime} - {ev.endTime}
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

      {/* MODAL 2: FORMULARZ Z INTUICYJNYM CYCLEM I GODZINĄ ZAKOŃCZENIA */}
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
              {/* PRZEWIJANE SZABLONY */}
              <Text style={styles.inputLabel}>Szybki szablon wydarzenia:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('mecz')}>
                  <Text style={styles.templateChipText}>🚌 Wyjazd na Mecz</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('trening')}>
                  <Text style={styles.templateChipText}>⚽ Trening Cykliczny</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('turniej')}>
                  <Text style={styles.templateChipText}>🏆 Turniej Dwudniowy</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* NAZWA WYDARZENIA */}
              <Text style={styles.inputLabel}>Nazwa wydarzenia</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Mecz Godynice Szkoła Podstawowa"
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              {/* DATY */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Data początkowa</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowStartDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.pickerBoxBtnText}>{formattedStartDate}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Data końcowa</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowEndDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.pickerBoxBtnText}>{formattedEndDate}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* GODZINA ZBIÓRKI, STARTU I ZAKOŃCZENIA */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={{ flex: 1, marginRight: 4 }}>
                  <Text style={styles.inputLabel}>Zbiórka ⏰</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowMeetingTimePicker(true)}>
                    <Text style={[styles.pickerBoxBtnText, { color: '#dc2626', fontSize: 12 }]}>{formattedMeetingTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginHorizontal: 2 }}>
                  <Text style={styles.inputLabel}>Start ⚽</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={[styles.pickerBoxBtnText, { color: '#2563eb', fontSize: 12 }]}>{formattedStartTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, marginLeft: 4 }}>
                  <Text style={styles.inputLabel}>Koniec 🏁</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowEndTimePicker(true)}>
                    <Text style={[styles.pickerBoxBtnText, { color: '#059669', fontSize: 12 }]}>{formattedEndTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PICKERS */}
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowStartDatePicker(false);
                    if (d) {
                      setStartDateObj(d);
                      if (d > endDateObj) setEndDateObj(d);
                    }
                  }}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowEndDatePicker(false);
                    if (d) setEndDateObj(d);
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

              {showStartTimePicker && (
                <DateTimePicker
                  value={startTimeObj}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowStartTimePicker(false);
                    if (d) setStartTimeObj(d);
                  }}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={endTimeObj}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(evt, d) => {
                    setShowEndTimePicker(false);
                    if (d) setEndTimeObj(d);
                  }}
                />
              )}

              {/* ADRES / MIEJSCE ZBIÓRKI Z PRZYCISKIEM GOOGLE MAPS */}
              <Text style={styles.inputLabel}>Adres / Miejsce zbiórki (Kliknij ikonę mapy 🧭)</Text>
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
                  <Ionicons name="navigate-circle" size={28} color="#2563eb" />
                </TouchableOpacity>
              </View>

              {/* INTUICYJNY CYKL POWTARZANIA */}
              <View style={styles.recurringBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                      🔄 Cykl tygodniowy ({currentDayOfWeekName}s)
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748b' }}>
                      Powtarzaj automatycznie w każdy {currentDayOfWeekName.toLowerCase()}
                    </Text>
                  </View>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                    thumbColor={isRecurring ? '#2563eb' : '#f1f5f9'}
                  />
                </View>
              </View>

              {/* POWOŁANIE KADRY */}
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
                {squadYearFilter !== 'Wszyscy' && (
                  <TouchableOpacity style={styles.selectAllBtn} onPress={selectEntireYear}>
                    <Text style={styles.selectAllBtnText}>+ Zaznacz rocznik</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* LISTA ZAWODNIKÓW */}
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
                            {p.firstName} {p.lastName}
                          </Text>
                          <Text style={styles.squadChipSubText}>Rocznik {p.year}</Text>
                        </View>
                      </TouchableOpacity>

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
  
  monthNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthNavArrow: { padding: 6, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  monthTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  monthSubText: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 12, textAlign: 'center' },

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

  /* MODAL */
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
  templateChip: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 8 },
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
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  pickerBoxBtnText: { fontSize: 12, fontWeight: 'bold', color: '#1e40af' },
  mapIconButton: { marginLeft: 6, padding: 2 },

  recurringBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  squadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  copyWhatsappBtnText: { fontSize: 11, fontWeight: 'bold', color: '#16a34a' },

  yearFilterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, flexWrap: 'wrap' },
  yearFilterLabel: { fontSize: 10, color: '#64748b', marginRight: 6 },
  yearFilterChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 4 },
  yearFilterChipActive: { backgroundColor: '#2563eb' },
  yearFilterChipText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  yearFilterChipTextActive: { color: '#fff', fontWeight: 'bold' },
  selectAllBtn: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 4 },
  selectAllBtnText: { fontSize: 10, fontWeight: 'bold', color: '#1e40af' },

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