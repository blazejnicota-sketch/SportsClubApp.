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
  Switch,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePlayers } from '../components/PlayersContext';
import { notificationService } from '../services/notificationService';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type ViewMode = 'miesiac' | 'tydzien' | 'lista';
type AttendanceStatus = 'present' | 'pending' | 'absent';

interface EventItem {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:MM
  meetingLocation?: string; // Adres zbiórki
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string; // Adres wydarzenia
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
const SHORT_WEEK_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

const getEventTypeConfig = (type: 'Mecz' | 'Trening' | 'Inne') => {
  switch (type) {
    case 'Mecz':
      return { bg: '#fee2e2', text: '#dc2626', border: '#f87171', badge: '⚽ Mecz' };
    case 'Trening':
      return { bg: '#dbeafe', text: '#2563eb', border: '#60a5fa', badge: '🏃 Trening' };
    case 'Inne':
      return { bg: '#f3e8ff', text: '#7c3aed', border: '#c084fc', badge: '📌 Inne' };
  }
};

export default function KalendarzScreen() {
  const { players: availablePlayers, updatePlayer } = usePlayers();
  const [viewMode, setViewMode] = useState<ViewMode>('miesiac');
  
  // Stan filtru typu wydarzenia na głównym ekranie
  const [filterType, setFilterType] = useState<string>('Wszystkie');
  
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );

  const curYear = currentMonthDate.getFullYear();
  const curMonth = currentMonthDate.getMonth();
  const daysInCurrentMonth = new Date(curYear, curMonth + 1, 0).getDate();

  const firstDayIndexRaw = new Date(curYear, curMonth, 1).getDay();
  const firstDayOffset = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1;

  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Godynice Szkoła Podstawowa',
      startDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      endDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      meetingTime: '07:05',
      meetingLocation: 'Klub Sportowy, ul. Sportowa 1 (Szatnia)',
      startTime: '08:30',
      endTime: '10:15',
      location: 'Stadion Miejski, ul. Sportowa 1',
      type: 'Mecz',
      squadIds: [],
      attendance: {},
    },
    {
      id: '2',
      title: 'Trening Cykliczny Drużyny',
      startDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      endDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      meetingTime: '17:15',
      meetingLocation: 'Orlik ul. Szkolna 5',
      startTime: '17:30',
      endTime: '19:00',
      location: 'Orlik ul. Szkolna 5',
      type: 'Trening',
      isRecurring: true,
      recurringDayOfWeek: 1,
      squadIds: [],
      attendance: {},
    },
  ]);

  const [dayModalVisible, setDayModalVisible] = useState<boolean>(false);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  
  const [startDateObj, setStartDateObj] = useState<Date>(new Date());
  const [endDateObj, setEndDateObj] = useState<Date>(new Date());
  const [meetingTimeObj, setMeetingTimeObj] = useState<Date>(new Date());
  const [startTimeObj, setStartTimeObj] = useState<Date>(new Date());
  const [endTimeObj, setEndTimeObj] = useState<Date>(new Date());

  const [eventLocation, setEventLocation] = useState<string>('');
  const [meetingLocation, setMeetingLocation] = useState<string>('');
  const [eventType, setEventType] = useState<'Mecz' | 'Trening' | 'Inne'>('Mecz');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [squadAttendance, setSquadAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [squadYearFilter, setSquadYearFilter] = useState<string>('Wszyscy');

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

  const applyTemplate = (templateType: 'mecz' | 'trening' | 'turniej') => {
    if (templateType === 'mecz') {
      setEventTitle('Mecz Ligowy');
      setEventType('Mecz');
      setEventLocation('');
      setMeetingLocation('');
      setIsRecurring(false);
      setMeetingTimeObj(new Date(startDateObj.setHours(7, 5)));
      setStartTimeObj(new Date(startDateObj.setHours(8, 30)));
      setEndTimeObj(new Date(startDateObj.setHours(10, 15)));
    } else if (templateType === 'trening') {
      setEventTitle('Trening Drużyny');
      setEventType('Trening');
      setEventLocation('');
      setMeetingLocation('');
      setIsRecurring(true);
      setMeetingTimeObj(new Date(startDateObj.setHours(17, 15)));
      setStartTimeObj(new Date(startDateObj.setHours(17, 30)));
      setEndTimeObj(new Date(startDateObj.setHours(19, 0)));
    } else if (templateType === 'turniej') {
      setEventTitle('Turniej Piłkarski');
      setEventType('Mecz');
      setEventLocation('');
      setMeetingLocation('');
      setIsRecurring(false);
      setMeetingTimeObj(new Date(startDateObj.setHours(6, 45)));
      setStartTimeObj(new Date(startDateObj.setHours(8, 0)));
      setEndTimeObj(new Date(startDateObj.setHours(16, 0)));
    }
  };

  const isEventOnDate = (ev: EventItem, dateStr: string) => {
    if (!ev.isRecurring && ev.startDate <= dateStr && dateStr <= ev.endDate) {
      return true;
    }

    if (ev.isRecurring && ev.recurringDayOfWeek !== undefined) {
      if (dateStr >= ev.startDate && dateStr <= ev.endDate) {
        const [tY, tM, tD] = dateStr.split('-').map(Number);
        const targetDate = new Date(tY, tM - 1, tD);

        const [sY, sM, sD] = ev.startDate.split('-').map(Number);
        const startDate = new Date(sY, sM - 1, sD);

        const isSameDayOfWeek = targetDate.getDay() === ev.recurringDayOfWeek;

        const targetDaysTotal = Math.floor(targetDate.getTime() / (1000 * 60 * 60 * 24));
        const startDaysTotal = Math.floor(startDate.getTime() / (1000 * 60 * 60 * 24));
        const diffDays = targetDaysTotal - startDaysTotal;

        const isExactWeekInterval = diffDays % 7 === 0;

        return isSameDayOfWeek && isExactWeekInterval;
      }
    }

    return false;
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
    setEventLocation('');
    setMeetingLocation('');
    
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const baseDate = new Date(yr, mo - 1, dy);
    setStartDateObj(baseDate);
    setEndDateObj(baseDate);
    
    setMeetingTimeObj(new Date(yr, mo - 1, dy, 8, 0));
    setStartTimeObj(new Date(yr, mo - 1, dy, 9, 0));
    setEndTimeObj(new Date(yr, mo - 1, dy, 10, 0));
    
    setEventType('Trening');
    setIsRecurring(false);

    setSelectedSquad([]);
    setSquadAttendance({});
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
    setMeetingLocation(event.meetingLocation || '');
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

    selectedSquad.forEach((playerId) => {
      const status = squadAttendance[playerId];
      const playerObj = availablePlayers.find((p: any) => String(p.id) === String(playerId));
      
      if (playerObj && (status === 'present' || status === 'absent')) {
        const currentTotal = playerObj.trainingsTotal || 0;
        const currentPresent = playerObj.trainingsPresent || 0;

        updatePlayer(playerId, {
          trainingsTotal: currentTotal + 1,
          trainingsPresent: status === 'present' ? currentPresent + 1 : currentPresent,
        });
      }
    });

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
                meetingLocation,
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
        meetingLocation,
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

  const handleQuickAttendanceChange = (eventId: string, playerId: string, status: AttendanceStatus) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id === eventId) {
          const updatedAttendance = { ...ev.attendance, [playerId]: status };
          return { ...ev, attendance: updatedAttendance };
        }
        return ev;
      })
    );
  };

  const handleQuickAttendanceBatch = (eventId: string, newAttendanceMap: Record<string, AttendanceStatus>) => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev.id === eventId) {
          return { ...ev, attendance: newAttendanceMap };
        }
        return ev;
      })
    );
  };

  const selectEntireYear = () => {
    const yearPlayers = filteredSquadPlayers.map((p: any) => String(p.id));
    const newSquad = Array.from(new Set([...selectedSquad, ...yearPlayers]));
    setSelectedSquad(newSquad);
  };

  const handleCopySquadAndSendPush = async () => {
    const nominatedNames = availablePlayers
      .filter((p: any) => selectedSquad.includes(String(p.id)))
      .map((p: any) => {
        const cleanFirst = (p.firstName || '').replace(/\s*\(\d{4}\)/g, '');
        const cleanLast = (p.lastName || '').replace(/\s*\(\d{4}\)/g, '');
        return `• ${cleanFirst} ${cleanLast}`;
      })
      .join('\n');

    const dateStr = formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} do ${formattedEndDate}`;
    const message = `📌 ${eventTitle}\n📅 Data: ${dateStr}\n⏰ Zbiórka: ${formattedMeetingTime} (${meetingLocation || 'Miejsce zbiórki'}) | Start: ${formattedStartTime} - ${formattedEndTime}\n📍 Miejsce wydarzenia: ${eventLocation}\n\nKADRA (${selectedSquad.length}):\n${nominatedNames}\n\nProśba o potwierdzenie obecności! 👍`;

    await Clipboard.setStringAsync(message);

    await notificationService.sendLocalAlert(
      `⚽ Powołanie: ${eventTitle}`,
      `Zbiórka: ${formattedMeetingTime}. Sprawdź szczegóły w aplikacji!`
    );

    Alert.alert(
      'Wysłano Powiadomienia Push 📲 & Skopiowano 📋',
      `Powołanie dostarczono do ${selectedSquad.length} zawodników. Tekst powołania został skopiowany do schowka!`
    );
  };

  const openMapLocation = (loc: string) => {
    const targetLoc = loc.trim();
    if (!targetLoc) {
      Alert.alert('Brak adresu', 'Wpisz lokalizację lub adres.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetLoc)}`;
    Linking.openURL(url).catch(() => Alert.alert('Błąd', 'Nie można otworzyć mapy Google.'));
  };

  const filteredSquadPlayers = availablePlayers.filter((p: any) => {
    if (squadYearFilter === 'Wszyscy') return true;
    return String(p.year) === String(squadYearFilter);
  });

  const dayEvents = events.filter((ev) => isEventOnDate(ev, selectedDate) && (filterType === 'Wszystkie' || ev.type === filterType));

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
          <Text style={styles.headerSubtitle}>Terminarz, zbiórki i szybka obecność</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenCreateModal(selectedDate)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      {/* Pasek Filtrów nad Kalendarzem */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['Wszystkie', 'Mecz', 'Trening', 'Inne'].map(ft => (
            <TouchableOpacity 
              key={ft} 
              style={[styles.mainFilterChip, filterType === ft && styles.mainFilterChipActive]} 
              onPress={() => setFilterType(ft)}
            >
              <Text style={[styles.mainFilterText, filterType === ft && styles.mainFilterTextActive]}>{ft}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
            <Text style={styles.monthSubText}>Kliknij dzień, aby zobaczyć wydarzenia i sprawdzić obecność</Text>

            <View style={styles.weekDaysHeaderRow}>
              {SHORT_WEEK_DAYS.map((wd, index) => (
                <Text key={index} style={styles.weekDayHeaderLabel}>{wd}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: firstDayOffset }, (_, i) => (
                <View key={`empty-${i}`} style={[styles.dayCell, styles.emptyDayCell]} />
              ))}

              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((dayNum) => {
                const dayStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const dayEvs = events.filter((ev) => isEventOnDate(ev, dayStr) && (filterType === 'Wszystkie' || ev.type === filterType));
                const hasEvent = dayEvs.length > 0;
                const isSelected = selectedDate === dayStr;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, hasEvent && styles.dayCellHasEvent]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>{dayNum}</Text>
                    {hasEvent && (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 2 }}>
                        {dayEvs.slice(0, 3).map((e, idx) => {
                          const cfg = getEventTypeConfig(e.type);
                          return <View key={idx} style={[styles.eventDot, { backgroundColor: cfg.text }]} />;
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {viewMode === 'tydzien' && (
          <View style={styles.cardBox}>
            <Text style={styles.monthTitle}>Wybrany Tydzień</Text>
            {[
              { day: 'Poniedziałek', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-26` },
              { day: 'Wtorek', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-27` },
              { day: 'Środa', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-28` },
              { day: 'Czwartek', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-29` },
              { day: 'Piątek', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-30` },
              { day: 'Sobota', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-31` },
              { day: 'Niedziela', date: `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01` },
            ].map((dayObj) => {
              const dEvents = events.filter((ev) => isEventOnDate(ev, dayObj.date) && (filterType === 'Wszystkie' || ev.type === filterType));

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
                      dEvents.map((ev) => {
                        const cfg = getEventTypeConfig(ev.type);
                        return (
                          <View key={ev.id} style={[styles.eventSubCard, { borderLeftColor: cfg.text, borderLeftWidth: 4 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.eventSubCardTitle}>{ev.title}</Text>
                              <View style={[styles.miniBadge, { backgroundColor: cfg.bg }]}>
                                <Text style={[styles.miniBadgeText, { color: cfg.text }]}>{ev.type}</Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              onPress={() => openMapLocation(ev.location)}
                              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 }}
                            >
                              <Ionicons name="map" size={12} color="#2563eb" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                                Adres: {ev.location}
                              </Text>
                            </TouchableOpacity>

                            {ev.meetingLocation ? (
                              <TouchableOpacity
                                onPress={() => openMapLocation(ev.meetingLocation || '')}
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}
                              >
                                <Ionicons name="navigate" size={12} color="#dc2626" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                                  Zbiórka: {ev.meetingTime} – {ev.meetingLocation}
                                </Text>
                              </TouchableOpacity>
                            ) : null}

                            <Text style={styles.eventSubCardMeta}>
                              ⏰ Start: {ev.startTime} - {ev.endTime}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.noEventText}>Brak zajęć • Kliknij, aby dodać</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {viewMode === 'lista' && (
          <View>
            <Text style={styles.sectionTitle}>Nadchodzące Wydarzenia</Text>
            {events
              .filter(ev => filterType === 'Wszystkie' || ev.type === filterType)
              .map((ev) => {
              const cfg = getEventTypeConfig(ev.type);
              
              // Obliczenia paska frekwencji
              const presentCount = Object.values(ev.attendance).filter(status => status === 'present').length;
              const totalSquad = ev.squadIds.length;
              const attendancePercent = totalSquad > 0 ? (presentCount / totalSquad) * 100 : 0;
              const barColor = attendancePercent >= 80 ? '#16a34a' : (attendancePercent >= 50 ? '#ca8a04' : '#dc2626');

              return (
                <View key={ev.id} style={[styles.eventListCard, { borderLeftColor: cfg.text, borderLeftWidth: 5 }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={styles.eventTitleText}>{ev.title}</Text>
                      <View style={[styles.eventBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.eventBadgeText, { color: cfg.text }]}>{ev.type}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => openMapLocation(ev.location)}
                      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 2 }}
                    >
                      <Ionicons name="navigate-circle" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Adres: {ev.location} (Otwórz w Maps)
                      </Text>
                    </TouchableOpacity>

                    {ev.meetingLocation ? (
                      <TouchableOpacity
                        onPress={() => openMapLocation(ev.meetingLocation || '')}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                      >
                        <Ionicons name="flag" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                          Zbiórka: {ev.meetingTime} | {ev.meetingLocation} (Otwórz w Maps)
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <Text style={styles.eventMetaText}>
                      📅 {ev.startDate} | Start: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{ev.startTime} - {ev.endTime}</Text>
                    </Text>

                    {ev.isRecurring && (
                      <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold', marginTop: 2 }}>
                        🔄 Cykliczne (co tydzień)
                      </Text>
                    )}

                    {/* Pasek frekwencji */}
                    <View style={styles.progressSection}>
                      <Text style={styles.progressText}>Frekwencja: {presentCount}/{totalSquad} obecnych</Text>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${attendancePercent}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>

                  </View>

                  <TouchableOpacity style={styles.listEditBtn} onPress={() => handleOpenEditModal(ev)}>
                    <Ionicons name="create-outline" size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: ZARZĄDZANIE DNIEM + MASOWA SZYBKA OBECNOŚĆ TRENERA */}
      <Modal animationType="fade" transparent={true} visible={dayModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wydarzenia dla: {selectedDate}</Text>
              <TouchableOpacity onPress={() => setDayModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {dayEvents.length > 0 ? (
              <ScrollView style={{ maxHeight: 550 }} showsVerticalScrollIndicator={false}>
                {dayEvents.map((ev) => {
                  const cfg = getEventTypeConfig(ev.type);
                  
                  return (
                    <View key={ev.id} style={[styles.dayEventItemBox, { borderLeftColor: cfg.text, borderLeftWidth: 4 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dayEventTitle}>{ev.title}</Text>
                          
                          <TouchableOpacity 
                            onPress={() => openMapLocation(ev.location)} 
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 }}
                          >
                            <Ionicons name="location" size={13} color="#2563eb" style={{ marginRight: 3 }} />
                            <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', textDecorationLine: 'underline' }}>
                              Adres: {ev.location}
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.dayEventSub}>
                            ⏰ Start: {ev.startTime} - {ev.endTime}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.editExistingBtn} onPress={() => handleOpenEditModal(ev)}>
                          <Text style={styles.editExistingBtnText}>Edytuj</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Integracja Nawigacji do Płyty Boiska */}
                      <TouchableOpacity 
                        style={styles.quickAttendanceRouteBtn} 
                        onPress={() => {
                          setDayModalVisible(false);
                          Alert.alert(
                            "Integracja Nawigacji", 
                            "Tutaj użyjemy routera by przenieść Cię na płytę boiska! Np.\n\nrouter.push('/QuickAttendance')"
                          );
                        }}
                      >
                        <Ionicons name="football-outline" size={16} color="#fff" style={{marginRight: 6}} />
                        <Text style={styles.quickAttendanceRouteBtnText}>Otwórz Pełny Ekran: Płyta Boiska ⚡</Text>
                      </TouchableOpacity>

                      {/* MASOWA OBECNOŚĆ */}
                      <View style={styles.massAttendanceContainer}>
                        <View style={styles.massHeaderRow}>
                          <Text style={styles.massTitle}>⚡ Masowa Szybka Obecność (Mini)</Text>
                          <TouchableOpacity 
                            style={styles.massActionAllBtn} 
                            onPress={() => {
                              const updated: Record<string, AttendanceStatus> = {};
                              ev.squadIds.forEach(pId => { updated[pId] = 'present'; });
                              handleQuickAttendanceBatch(ev.id, updated);
                            }}
                          >
                            <Text style={styles.massActionAllText}>Wszyscy Obecni</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.massSubtitle}>Sprawdź szybko bez wchodzenia w pełny tryb:</Text>

                        {ev.squadIds.length > 0 ? (
                          <View style={{ marginTop: 4 }}>
                            {ev.squadIds.map((pId) => {
                              const playerObj = availablePlayers.find((p: any) => String(p.id) === String(pId));
                              if (!playerObj) return null;
                              const status = ev.attendance?.[pId] || 'pending';
                              const cleanFirst = (playerObj.firstName || '').replace(/\s*\(\d{4}\)/g, '');
                              const cleanLast = (playerObj.lastName || '').replace(/\s*\(\d{4}\)/g, '');

                              return (
                                <View key={pId} style={styles.massPlayerCard}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.massPlayerName}>
                                      #{playerObj.number || '•'} {cleanFirst} {cleanLast}
                                    </Text>
                                    <Text style={styles.massPlayerSub}>Rocznik: {playerObj.year || '2012'}</Text>
                                  </View>

                                  <View style={styles.massStatusRow}>
                                    <TouchableOpacity
                                      style={[
                                        styles.massStatusBtn,
                                        styles.massStatusPresent,
                                        status === 'present' && styles.massStatusPresentActive,
                                      ]}
                                      onPress={() => handleQuickAttendanceChange(ev.id, pId, 'present')}
                                    >
                                      <Text style={[styles.massStatusText, status === 'present' && styles.massStatusTextActive]}>
                                        Tak
                                      </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={[
                                        styles.massStatusBtn,
                                        styles.massStatusAbsent,
                                        status === 'absent' && styles.massStatusAbsentActive,
                                      ]}
                                      onPress={() => handleQuickAttendanceChange(ev.id, pId, 'absent')}
                                    >
                                      <Text style={[styles.massStatusText, status === 'absent' && styles.massStatusTextActive]}>
                                        Nie
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.noEventText}>Brak powołanych zawodników do sprawdzenia obecności.</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.noEventsDayText}>Brak zaplanowanych wydarzeń w tym dniu.</Text>
            )}

            <TouchableOpacity style={styles.addNewEventInDayBtn} onPress={() => handleOpenCreateModal(selectedDate)}>
              <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.addNewEventInDayText}>Dodaj wydarzenie w tym dniu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: FORMULARZ DODAWANIA / EDYCJI WYDARZENIA */}
      <Modal animationType="slide" transparent={true} visible={formModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEventId ? 'Edytuj Wydarzenie ✏️' : 'Nowe Wydarzenie ⚽'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {!editingEventId && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>⚡ Szybkie szablony:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('mecz')}>
                      <Text style={styles.templateChipText}>⚽ Mecz Ligowy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('trening')}>
                      <Text style={styles.templateChipText}>🏃 Trening</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.templateChip} onPress={() => applyTemplate('turniej')}>
                      <Text style={styles.templateChipText}>🏆 Turniej</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              <Text style={styles.inputLabel}>Nazwa wydarzenia:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Mecz Ligowy vs Orły / Trening"
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Typ wydarzenia:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {(['Mecz', 'Trening', 'Inne'] as ('Mecz' | 'Trening' | 'Inne')[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeOptionBtn,
                      eventType === t && { backgroundColor: '#2563eb', borderColor: '#2563eb' },
                    ]}
                    onPress={() => setEventType(t)}
                  >
                    <Text style={[styles.typeOptionText, eventType === t && { color: '#fff', fontWeight: 'bold' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Lokalizacja wydarzenia (Adres):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Stadion Miejski, ul. Sportowa 1"
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                onPress={() => openMapLocation(eventLocation)}
                style={styles.quickMapLinkRow}
              >
                <Ionicons name="navigate" size={13} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={styles.quickMapLinkText}>Sprawdź trasę w Google Maps 🗺️</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Data od:</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowStartDatePicker(true)}>
                    <Text style={styles.pickerBoxBtnText}>{formattedStartDate}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Data do:</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowEndDatePicker(true)}>
                    <Text style={styles.pickerBoxBtnText}>{formattedEndDate}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDateObj}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowStartDatePicker(false);
                    if (date) {
                      setStartDateObj(date);
                      setEndDateObj(date);
                    }
                  }}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDateObj}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndDateObj(date);
                  }}
                />
              )}

              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start:</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={styles.pickerBoxBtnText}>{formattedStartTime}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Koniec:</Text>
                  <TouchableOpacity style={styles.pickerBoxBtn} onPress={() => setShowEndTimePicker(true)}>
                    <Text style={styles.pickerBoxBtnText}>{formattedEndTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showStartTimePicker && (
                <DateTimePicker
                  value={startTimeObj}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(_, date) => {
                    setShowStartTimePicker(false);
                    if (date) setStartTimeObj(date);
                  }}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={endTimeObj}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(_, date) => {
                    setShowEndTimePicker(false);
                    if (date) setEndTimeObj(date);
                  }}
                />
              )}

              <View style={styles.meetingSectionBox}>
                <Text style={[styles.inputLabel, { color: '#dc2626' }]}>⏰ Szczegóły Zbiórki</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
                  <Text style={[styles.inputLabel, { flex: 1, marginBottom: 0 }]}>Godzina zbiórki:</Text>
                  <TouchableOpacity style={[styles.pickerBoxBtn, { width: 120 }]} onPress={() => setShowMeetingTimePicker(true)}>
                    <Text style={[styles.pickerBoxBtnText, { color: '#dc2626', fontWeight: 'bold' }]}>{formattedMeetingTime}</Text>
                  </TouchableOpacity>
                </View>

                {showMeetingTimePicker && (
                  <DateTimePicker
                    value={meetingTimeObj}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(_, date) => {
                      setShowMeetingTimePicker(false);
                      if (date) setMeetingTimeObj(date);
                    }}
                  />
                )}

                <Text style={[styles.inputLabel, { marginTop: 6 }]}>Adres zbiórki (opcjonalnie)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="np. Klub Sportowy, szatnia główna"
                  value={meetingLocation}
                  onChangeText={setMeetingLocation}
                />

                <TouchableOpacity
                  onPress={() => openMapLocation(meetingLocation)}
                  style={styles.quickMapLinkRow}
                >
                  <Ionicons name="navigate" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                  <Text style={[styles.quickMapLinkText, { color: '#dc2626' }]}>Otwórz trasę zbiórki w Google Maps 🗺️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.switchLabel}>Trening cykliczny co tydzień</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Wydarzenie powtórzy się w każdy {currentDayOfWeekName}</Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                  thumbColor={isRecurring ? '#2563eb' : '#f1f5f9'}
                />
              </View>

              <View style={styles.squadSectionHeader}>
                <Text style={styles.inputLabel}>Powołana Kadra ({selectedSquad.length} zawodników)</Text>
                <TouchableOpacity onPress={selectEntireYear}>
                  <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold' }}>+ Zaznacz rocznik</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Wszyscy', '2012', '2013', '2014', '2015', '2016'].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.filterChip, squadYearFilter === yr && styles.filterChipActive]}
                    onPress={() => setSquadYearFilter(yr)}
                  >
                    <Text style={[styles.filterChipText, squadYearFilter === yr && styles.filterChipTextActive]}>{yr}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.squadListContainer}>
                {filteredSquadPlayers.map((player: any) => {
                  const pId = String(player.id);
                  const isSelected = selectedSquad.includes(pId);
                  const status = squadAttendance[pId] || 'pending';
                  const cleanFirstName = (player.firstName || '').replace(/\s*\(\d{4}\)/g, '');
                  const cleanLastName = (player.lastName || '').replace(/\s*\(\d{4}\)/g, '');

                  return (
                    <View key={player.id} style={styles.squadItemRow}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        onPress={() => togglePlayerSquad(pId)}
                      >
                        <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxChecked]}>
                          {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={{ marginLeft: 8 }}>
                          <Text style={styles.squadPlayerName}>{cleanFirstName} {cleanLastName}</Text>
                          <Text style={styles.squadPlayerSub}>Rocznik: {player.year} | Nr {player.number}</Text>
                        </View>
                      </TouchableOpacity>

                      {isSelected && (
                        <View style={styles.statusButtonsRow}>
                          <TouchableOpacity
                            style={[styles.statusBtn, status === 'present' && { backgroundColor: '#16a34a' }]}
                            onPress={() => setPlayerStatus(pId, 'present')}
                          >
                            <Text style={[styles.statusBtnText, status === 'present' && { color: '#fff' }]}>Tak</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.statusBtn, status === 'pending' && { backgroundColor: '#ca8a04' }]}
                            onPress={() => setPlayerStatus(pId, 'pending')}
                          >
                            <Text style={[styles.statusBtnText, status === 'pending' && { color: '#fff' }]}>?</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.statusBtn, status === 'absent' && { backgroundColor: '#dc2626' }]}
                            onPress={() => setPlayerStatus(pId, 'absent')}
                          >
                            <Text style={[styles.statusBtnText, status === 'absent' && { color: '#fff' }]}>Nie</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalStickyFooter}>
              <TouchableOpacity style={styles.pushActionBtn} onPress={handleCopySquadAndSendPush}>
                <Ionicons name="paper-plane-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.pushActionBtnText}>Wyślij Powiadomienia Push & Kopiuj do Schowka</Text>
              </TouchableOpacity>

              <View style={styles.modalButtonsRow}>
                {editingEventId && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteEvent}>
                    <Text style={styles.deleteBtnText}>Usuń</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent}>
                  <Text style={styles.saveBtnText}>Zapisz Wydarzenie</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  mainFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
  },
  mainFilterChipActive: {
    backgroundColor: '#2563eb',
  },
  mainFilterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  mainFilterTextActive: {
    color: '#fff',
  },
  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 3,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#dbeafe',
  },
  toggleText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  monthNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  monthNavArrow: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  monthSubText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  weekDaysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayHeaderLabel: {
    width: '14%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  emptyDayCell: {
    backgroundColor: 'transparent',
  },
  dayCellHasEvent: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayCellSelected: {
    backgroundColor: '#2563eb',
  },
  dayCellText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dayCellTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  weekDayRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekDayHeader: {
    width: 80,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  weekDayDate: {
    fontSize: 10,
    color: '#64748b',
  },
  eventSubCard: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  eventSubCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  eventSubCardMeta: {
    fontSize: 10,
    color: '#64748b',
  },
  noEventText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  eventListCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  eventTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventMetaText: {
    fontSize: 11,
    color: '#475569',
  },
  progressSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  progressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  listEditBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dayEventItemBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  dayEventTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  dayEventSub: {
    fontSize: 11,
    color: '#64748b',
  },
  editExistingBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editExistingBtnText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  quickAttendanceRouteBtn: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  quickAttendanceRouteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  massAttendanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  massHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  massTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  massSubtitle: { fontSize: 10, color: '#64748b', marginBottom: 6 },
  massActionAllBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  massActionAllText: { fontSize: 9, fontWeight: 'bold', color: '#15803d' },
  massPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  massPlayerName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  massPlayerSub: { fontSize: 9, color: '#64748b' },
  massStatusRow: { flexDirection: 'row', gap: 4 },
  massStatusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    minWidth: 50,
    alignItems: 'center',
  },
  massStatusPresent: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  massStatusPresentActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  massStatusAbsent: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  massStatusAbsentActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  massStatusText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  massStatusTextActive: { color: '#fff' },

  noEventsDayText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 20,
  },
  addNewEventInDayBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addNewEventInDayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  templateChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  templateChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  typeOptionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: '#f8fafc',
  },
  typeOptionText: {
    fontSize: 12,
    color: '#64748b',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  quickMapLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  quickMapLinkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  pickerBoxBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBoxBtnText: {
    fontSize: 12,
    color: '#0f172a',
  },
  meetingSectionBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  squadSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginRight: 4,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 11,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  squadListContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 6,
    marginBottom: 10,
  },
  squadItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  squadPlayerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  squadPlayerSub: {
    fontSize: 10,
    color: '#64748b',
  },
  statusButtonsRow: {
    flexDirection: 'row',
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginLeft: 4,
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  modalStickyFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  pushActionBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  pushActionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});