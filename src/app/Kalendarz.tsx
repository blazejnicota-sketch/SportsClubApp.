import React, { useState, useMemo } from 'react';
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

// Typy danych dla kalendarza
type EventType = 'mecz_dom' | 'mecz_wyjazd' | 'trening_takt' | 'trening_motor' | 'badania' | 'zebranie';
type AttendanceStatus = 'obecny' | 'nieobecny' | 'usprawiedliwiony' | 'spozniony' | 'kontuzja';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  gatheringTime?: string;
  type: EventType;
  title: string;
  location: string;
  opponent?: string;
  notes?: string;
  isRecurring?: boolean;
}

export default function KalendarzScreen() {
  // Stany widoku
  const [viewMode, setViewMode] = useState<'miesiac' | 'tydzien' | 'lista'>('miesiac');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stany modali
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState<boolean>(false);
  const [callupModalVisible, setCallupModalVisible] = useState<boolean>(false);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Formularz nowego wydarzenia
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventType, setNewEventType] = useState<EventType>('mecz_dom');
  const [newEventTime, setNewEventTime] = useState<string>('11:00');
  const [newEventGathering, setNewEventGathering] = useState<string>('10:00');
  const [newEventLocation, setNewEventLocation] = useState<string>('Boisko Główne');
  const [newEventOpponent, setNewEventOpponent] = useState<string>('');
  const [newEventNotes, setNewEventNotes] = useState<string>('');
  const [newEventRecurring, setNewEventRecurring] = useState<boolean>(false);

  // Stan sprzętu w powołaniach
  const [callupEquipment, setCallupEquipment] = useState<{ [key: string]: boolean }>({
    'Stroj Czerwony (Gospodarz)': true,
    'Stroj Niebieski (Wyjazd)': false,
    'Ochraniacze': true,
    'Legitymacja / Dokument': true,
    'Dres Klubowy': true,
    'Woda / Bidon': true,
  });

  // Stan bazy wydarzeń
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      date: '2026-10-24',
      time: '11:00',
      gatheringTime: '10:00',
      type: 'mecz_dom',
      title: 'Mecz Ligowy vs AP Warszawa',
      location: 'Stadion Miejski, Boisko A',
      opponent: 'AP Warszawa',
      notes: 'Zbiórka w szatni nr 3. Pamiętać o legitymacjach.',
    },
    {
      id: '2',
      date: '2026-10-26',
      time: '17:30',
      gatheringTime: '17:15',
      type: 'trening_takt',
      title: 'Trening Taktyczny (Stałe Fragmenty)',
      location: 'Orlik ul. Szkolna',
      notes: 'Praca nad dośrodkowaniami z rzutów rożnych.',
    },
    {
      id: '3',
      date: '2026-10-28',
      time: '17:30',
      gatheringTime: '17:15',
      type: 'trening_motor',
      title: 'Trening Motoryczny + Szybkość',
      location: 'Hala Sportowa / Boisko B',
      notes: 'Zabrać buty na zmianę na halę.',
    },
    {
      id: '4',
      date: '2026-10-31',
      time: '10:00',
      gatheringTime: '08:30',
      type: 'mecz_wyjazd',
      title: 'Mecz Wyjazdowy vs Delta Warszawa',
      location: 'Warszawa, ul. Sportowa 12',
      opponent: 'Delta Warszawa',
      notes: 'Wyjazd autokarem spod klubu o 08:45.',
    },
  ]);

  // Stan frekwencji [eventId][playerId] -> AttendanceStatus
  const [attendanceData, setAttendanceData] = useState<{
    [eventId: string]: { [playerId: string]: AttendanceStatus };
  }>({
    '1': {
      '1': 'obecny',
      '2': 'obecny',
      '3': 'usprawiedliwiony',
      '4': 'spozniony',
    },
  });

  const [attendanceSearch, setAttendanceSearch] = useState<string>('');

  // Pomocnicza funkcja pobierania imienia i nazwiska
  const getPlayerName = (player: any) => {
    if (player.name) return player.name;
    if (player.firstName || player.lastName) {
      return `${player.firstName || ''} ${player.lastName || ''}`.trim();
    }
    if (player.first_name || player.last_name) {
      return `${player.first_name || ''} ${player.last_name || ''}`.trim();
    }
    return 'Zawodnik';
  };

  // Dodawanie nowego wydarzenia
  const handleAddEvent = () => {
    if (!newEventTitle.trim()) {
      Alert.alert('Błąd', 'Wprowadź tytuł wydarzenia.');
      return;
    }

    const createdEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDate,
      time: newEventTime,
      gatheringTime: newEventGathering,
      type: newEventType,
      title: newEventTitle,
      location: newEventLocation,
      opponent: newEventOpponent,
      notes: newEventNotes,
      isRecurring: newEventRecurring,
    };

    setEvents((prev) => [...prev, createdEvent]);

    // Czyszczenie formularza
    setNewEventTitle('');
    setNewEventOpponent('');
    setNewEventNotes('');
    setAddModalVisible(false);

    Alert.alert('Sukces ⚽', 'Dodano nowe wydarzenie do kalendarza!');
  };

  // Obsługa otwierania modali
  const openAttendanceModal = (event: CalendarEvent) => {
    setActiveEvent(event);
    setAttendanceModalVisible(true);
  };

  const openCallupModal = (event: CalendarEvent) => {
    setActiveEvent(event);
    setCallupModalVisible(true);
  };

  // Zmiana obecności zawodnika
  const setPlayerAttendance = (playerId: string, status: AttendanceStatus) => {
    if (!activeEvent) return;
    setAttendanceData((prev) => ({
      ...prev,
      [activeEvent.id]: {
        ...(prev[activeEvent.id] || {}),
        [playerId]: status,
      },
    }));
  };

  // Hurtowe zaznaczanie obecności
  const markAllAttendance = (status: AttendanceStatus) => {
    if (!activeEvent) return;
    const updated: { [key: string]: AttendanceStatus } = {};
    MOCK_100_PLAYERS.forEach((p: any) => {
      updated[p.id] = status;
    });
    setAttendanceData((prev) => ({
      ...prev,
      [activeEvent.id]: updated,
    }));
  };

  // Statystyki frekwencji dla aktywnego wydarzenia
  const attendanceStats = useMemo(() => {
    if (!activeEvent) return { total: 0, present: 0, absent: 0, percent: 0 };
    const currentEventAtt = attendanceData[activeEvent.id] || {};
    const total = MOCK_100_PLAYERS.slice(0, 20).length; // Przykładowa kadra 20 osób
    let presentCount = 0;
    let absentCount = 0;

    MOCK_100_PLAYERS.slice(0, 20).forEach((p: any) => {
      const st = currentEventAtt[p.id] || 'obecny';
      if (st === 'obecny' || st === 'spozniony') presentCount++;
      if (st === 'nieobecny' || st === 'kontuzja') absentCount++;
    });

    const percent = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    return { total, present: presentCount, absent: absentCount, percent };
  }, [activeEvent, attendanceData]);

  // Generowanie tekstu powołania
  const generatedCallupText = useMemo(() => {
    if (!activeEvent) return '';
    const selectedEq = Object.keys(callupEquipment)
      .filter((key) => callupEquipment[key])
      .map((item) => `• ${item}`)
      .join('\n');

    return (
      `⚽ POWOŁANIE NA WYDARZENIE ⚽\n\n` +
      `📌 Wydarzenie: ${activeEvent.title}\n` +
      `📅 Data: ${activeEvent.date}\n` +
      `⏰ Godzina meczu/zajęć: ${activeEvent.time}\n` +
      `🕒 Godzina zbiórki: ${activeEvent.gatheringTime || activeEvent.time}\n` +
      `📍 Lokalizacja: ${activeEvent.location}\n` +
      (activeEvent.notes ? `📝 Uwagi: ${activeEvent.notes}\n` : '') +
      `\n🎒 Wymagany sprzęt:\n${selectedEq || 'Brak wymagań'}\n\n` +
      `Prosimy o potwierdzenie obecności w aplikacji!`
    );
  }, [activeEvent, callupEquipment]);

  const copyCallupToClipboard = () => {
    Alert.alert(
      'Skopiowano do Schowka! 📋',
      'Treść powołania została pomyślnie wygenerowana. Możesz ją wkleić na grupę WhatsApp lub SMS.'
    );
    setCallupModalVisible(false);
  };

  // Pomocniczy render ikony typu wydarzenia
  const renderTypeBadge = (type: EventType) => {
    switch (type) {
      case 'mecz_dom':
        return <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}><Text style={[styles.badgeText, { color: '#166534' }]}>Mecz Dom</Text></View>;
      case 'mecz_wyjazd':
        return <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}><Text style={[styles.badgeText, { color: '#92400e' }]}>Mecz Wyjazd</Text></View>;
      case 'trening_takt':
        return <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}><Text style={[styles.badgeText, { color: '#1e40af' }]}>Taktyka</Text></View>;
      case 'trening_motor':
        return <View style={[styles.badge, { backgroundColor: '#f3e8ff' }]}><Text style={[styles.badgeText, { color: '#6b21a8' }]}>Motoryka</Text></View>;
      case 'badania':
        return <View style={[styles.badge, { backgroundColor: '#ffe4e6' }]}><Text style={[styles.badgeText, { color: '#9f1239' }]}>Badania</Text></View>;
      default:
        return <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}><Text style={[styles.badgeText, { color: '#475569' }]}>Inne</Text></View>;
    }
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK KONTROLNY */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
          <Text style={styles.headerSubtitle}>Terminarz, frekwencja live oraz powołania</Text>
        </View>
        <TouchableOpacity
          style={styles.addEventTopBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addEventTopBtnText}>Dodaj</Text>
        </TouchableOpacity>
      </View>

      {/* PASEK PRZEŁĄCZANIA WIDOKÓW */}
      <View style={styles.viewModesRow}>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'miesiac' && styles.activeModeBtn]}
          onPress={() => setViewMode('miesiac')}
        >
          <Ionicons name="grid-outline" size={14} color={viewMode === 'miesiac' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.modeText, viewMode === 'miesiac' && styles.activeModeText]}>Miesiąc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'tydzien' && styles.activeModeBtn]}
          onPress={() => setViewMode('tydzien')}
        >
          <Ionicons name="calendar-outline" size={14} color={viewMode === 'tydzien' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.modeText, viewMode === 'tydzien' && styles.activeModeText]}>Tydzień</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'lista' && styles.activeModeBtn]}
          onPress={() => setViewMode('lista')}
        >
          <Ionicons name="list-outline" size={14} color={viewMode === 'lista' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.modeText, viewMode === 'lista' && styles.activeModeText]}>Lista</Text>
        </TouchableOpacity>
      </View>

      {/* ZAWARTOŚĆ GŁÓWNA */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* WIDOK 1: MIESIĄC */}
        {viewMode === 'miesiac' && (
          <View>
            <View style={styles.monthHeaderBox}>
              <Text style={styles.monthTitle}>Październik 2026</Text>
              <Text style={styles.monthSub}>Wybierz dzień, aby wyświetlić zaplanowane mecze i treningi</Text>
            </View>

            {/* SIATKA DNI */}
            <View style={styles.monthGrid}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
                <View key={d} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{d}</Text>
                </View>
              ))}

              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const dayStr = `2026-10-${day < 10 ? '0' + day : day}`;
                const dayEvents = events.filter((e) => e.date === dayStr);
                const isSelected = selectedDate === dayStr;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      dayEvents.length > 0 && !isSelected && styles.dayCellHasEvent,
                    ]}
                    onPress={() => setSelectedDate(dayStr)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                    {dayEvents.length > 0 && (
                      <View style={styles.eventDotsRow}>
                        {dayEvents.map((ev) => (
                          <View
                            key={ev.id}
                            style={[
                              styles.eventDot,
                              {
                                backgroundColor:
                                  ev.type.includes('mecz') ? '#16a34a' : '#2563eb',
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* WIDOK 2: TYDZIEŃ */}
        {viewMode === 'tydzien' && (
          <View>
            <Text style={styles.sectionTitle}>Bieżący Tydzień (24 - 31 Października)</Text>
            {[
              { dayName: 'Sobota', dateStr: '2026-10-24' },
              { dayName: 'Niedziela', dateStr: '2026-10-25' },
              { dayName: 'Poniedziałek', dateStr: '2026-10-26' },
              { dayName: 'Wtorek', dateStr: '2026-10-27' },
              { dayName: 'Środa', dateStr: '2026-10-28' },
              { dayName: 'Czwartek', dateStr: '2026-10-29' },
              { dayName: 'Piątek', dateStr: '2026-10-30' },
            ].map((item) => {
              const dayEvs = events.filter((e) => e.date === item.dateStr);
              return (
                <View key={item.dateStr} style={styles.weekRow}>
                  <View style={styles.weekDayBox}>
                    <Text style={styles.weekDayName}>{item.dayName}</Text>
                    <Text style={styles.weekDayDate}>{item.dateStr.slice(8, 10)}.10</Text>
                  </View>
                  <View style={styles.weekEventContent}>
                    {dayEvs.length > 0 ? (
                      dayEvs.map((ev) => (
                        <View key={ev.id} style={{ marginBottom: 4 }}>
                          <Text style={styles.weekEventTitle}>{ev.title}</Text>
                          <Text style={styles.weekEventSub}>⏰ {ev.time} • 📍 {ev.location}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.weekEventEmpty}>Brak zaplanowanych zajęć</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* WIDOK 3: LISTA & DZIENNY AGENDATOR */}
        {viewMode === 'lista' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Szukaj w wydarzeniach..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {viewMode === 'lista'
            ? 'Nadchodzące Wydarzenia Drużyny'
            : `Harmonogram dla dnia: ${selectedDate}`}
        </Text>

        {events
          .filter((ev) => {
            if (viewMode === 'lista') {
              return ev.title.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return ev.date === selectedDate;
          })
          .map((ev) => (
            <View key={ev.id} style={styles.eventCard}>
              <View style={styles.eventTopRow}>
                {renderTypeBadge(ev.type)}
                <Text style={styles.eventDateTag}>📅 {ev.date}</Text>
              </View>

              <Text style={styles.eventCardTitle}>{ev.title}</Text>

              <View style={styles.eventMetaRow}>
                <Ionicons name="time-outline" size={14} color="#64748b" />
                <Text style={styles.eventMetaText}>
                  Godz. {ev.time} (Zbiórka: {ev.gatheringTime || ev.time})
                </Text>
              </View>

              <View style={styles.eventMetaRow}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.eventMetaText}>{ev.location}</Text>
              </View>

              {ev.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>📝 {ev.notes}</Text>
                </View>
              )}

              {/* AKCJE ZWIĄZANE Z WYDARZENIEM */}
              <View style={styles.eventCardActions}>
                <TouchableOpacity
                  style={styles.attendanceBtn}
                  onPress={() => openAttendanceModal(ev)}
                >
                  <Ionicons name="checkbox-outline" size={15} color="#2563eb" />
                  <Text style={styles.attendanceBtnText}>Frekwencja LIVE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callupBtn}
                  onPress={() => openCallupModal(ev)}
                >
                  <Ionicons name="clipboard-outline" size={15} color="#d97706" />
                  <Text style={styles.callupBtnText}>Powołanie do Schowka</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= MODAL 1: KREATOR WYDARZENIA ================= */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nowe Wydarzenie w Kalendarzu</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Tytuł wydarzenia</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Mecz Ligowy vs Legia"
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Kategoria zajęć</Text>
              <View style={styles.typeGrid}>
                {[
                  { key: 'mecz_dom', label: 'Mecz Domowy' },
                  { key: 'mecz_wyjazd', label: 'Mecz Wyjazd' },
                  { key: 'trening_takt', label: 'Taktyka' },
                  { key: 'trening_motor', label: 'Motoryka' },
                  { key: 'badania', label: 'Badania' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.typeChipBtn,
                      newEventType === item.key && styles.typeChipBtnActive,
                    ]}
                    onPress={() => setNewEventType(item.key as EventType)}
                  >
                    <Text
                      style={[
                        styles.typeChipBtnText,
                        newEventType === item.key && styles.typeChipBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Godzina wydarzenia</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="17:30"
                    value={newEventTime}
                    onChangeText={setNewEventTime}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Godzina zbiórki</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="17:15"
                    value={newEventGathering}
                    onChangeText={setNewEventGathering}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Miejsce / Boisko</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="np. Orlik ul. Szkolna"
                value={newEventLocation}
                onChangeText={setNewEventLocation}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Wytyczne / Notatki dla kadry</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                multiline
                placeholder="np. Zabrać legitymacje i dresy klubowe"
                value={newEventNotes}
                onChangeText={setNewEventNotes}
                placeholderTextColor="#94a3b8"
              />
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddEvent}>
                <Text style={styles.saveBtnText}>Zapisz Wydarzenie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: FREKWENCJA LIVE ================= */}
      <Modal animationType="slide" transparent={true} visible={attendanceModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Frekwencja na Żywo</Text>
                <Text style={styles.modalSubTitle}>{activeEvent?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* PASEK STATYSTYK FREKWENCJI */}
            <View style={styles.statsBarContainer}>
              <View style={styles.statsBarHeader}>
                <Text style={styles.statsBarTitle}>
                  Obecność: {attendanceStats.present} / {attendanceStats.total} zawodników
                </Text>
                <Text style={styles.statsBarPercent}>{attendanceStats.percent}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[styles.progressBarFill, { width: `${attendanceStats.percent}%` }]}
                />
              </View>
            </View>

            {/* AKCJE MASOWE */}
            <View style={styles.massActionsRow}>
              <TouchableOpacity
                style={styles.massBtn}
                onPress={() => markAllAttendance('obecny')}
              >
                <Text style={styles.massBtnText}>Zaznacz wszystkich (Obecny)</Text>
              </TouchableOpacity>
            </View>

            {/* LISTA ZAWODNIKÓW */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {MOCK_100_PLAYERS.slice(0, 15).map((player: any) => {
                const pId = player.id;
                const status =
                  attendanceData[activeEvent?.id || '']?.[pId] || 'obecny';

                return (
                  <View key={pId} style={styles.attendanceRow}>
                    <Text style={styles.attendancePlayerName}>{getPlayerName(player)}</Text>

                    <View style={styles.statusChipsRow}>
                      <TouchableOpacity
                        style={[
                          styles.attChip,
                          status === 'obecny' && styles.attChipGreen,
                        ]}
                        onPress={() => setPlayerAttendance(pId, 'obecny')}
                      >
                        <Text
                          style={[
                            styles.attChipText,
                            status === 'obecny' && { color: '#fff' },
                          ]}
                        >
                          Obecny
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.attChip,
                          status === 'nieobecny' && styles.attChipRed,
                        ]}
                        onPress={() => setPlayerAttendance(pId, 'nieobecny')}
                      >
                        <Text
                          style={[
                            styles.attChipText,
                            status === 'nieobecny' && { color: '#fff' },
                          ]}
                        >
                          Nieob.
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.attChip,
                          status === 'usprawiedliwiony' && styles.attChipYellow,
                        ]}
                        onPress={() => setPlayerAttendance(pId, 'usprawiedliwiony')}
                      >
                        <Text
                          style={[
                            styles.attChipText,
                            status === 'usprawiedliwiony' && { color: '#fff' },
                          ]}
                        >
                          Ustrp.
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                Alert.alert('Zapisano 💾', 'Raport frekwencji został zaktualizowany.');
                setAttendanceModalVisible(false);
              }}
            >
              <Text style={styles.saveBtnText}>Zatwierdź Listę Obecności</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: GENERATOR POWOŁAŃ ================= */}
      <Modal animationType="slide" transparent={true} visible={callupModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Generator Powołań 📋</Text>
                <Text style={styles.modalSubTitle}>Gotowy tekst na WhatsApp / SMS</Text>
              </View>
              <TouchableOpacity onPress={() => setCallupModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Zaznacz wymagany sprzęt:</Text>
            <View style={styles.eqChecklist}>
              {Object.keys(callupEquipment).map((eqKey) => (
                <TouchableOpacity
                  key={eqKey}
                  style={styles.eqCheckItem}
                  onPress={() =>
                    setCallupEquipment((prev) => ({
                      ...prev,
                      [eqKey]: !prev[eqKey],
                    }))
                  }
                >
                  <Ionicons
                    name={callupEquipment[eqKey] ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={callupEquipment[eqKey] ? '#2563eb' : '#94a3b8'}
                  />
                  <Text style={styles.eqCheckText}>{eqKey}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Podgląd generowanej wiadomości:</Text>
            <ScrollView style={styles.previewBox}>
              <Text style={styles.previewText}>{generatedCallupText}</Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 12 }]}
              onPress={copyCallupToClipboard}
            >
              <Ionicons name="copy-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Skopiuj Treść Powołania</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* NAGŁÓWEK KONTROLNY */
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
  addEventTopBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addEventTopBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  /* WIDOKI PRZEŁĄCZANIA */
  viewModesRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  activeModeBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#2563eb' },
  modeText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  activeModeText: { color: '#2563eb', fontWeight: 'bold' },

  content: { padding: 16 },

  /* MIESIĄC */
  monthHeaderBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  monthTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  monthSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  dayHeaderCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  dayHeaderText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  dayCell: {
    width: '13.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0.5%',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  dayCellSelected: { backgroundColor: '#2563eb' },
  dayCellHasEvent: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  dayText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  dayTextSelected: { color: '#fff', fontWeight: 'bold' },
  eventDotsRow: { flexDirection: 'row', marginTop: 2 },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginRight: 2 },

  /* TYDZIEŃ */
  weekRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  weekDayBox: { width: 90, borderRightWidth: 1, borderRightColor: '#e2e8f0', paddingRight: 8 },
  weekDayName: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  weekDayDate: { fontSize: 10, color: '#64748b' },
  weekEventContent: { flex: 1, paddingLeft: 10 },
  weekEventTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  weekEventSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  weekEventEmpty: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

  /* LISTA & KARTY WYDARZEŃ */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', padding: 0 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginTop: 8, marginBottom: 10 },

  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  eventDateTag: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  eventCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 8, marginBottom: 6 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  eventMetaText: { fontSize: 12, color: '#475569', marginLeft: 6 },
  notesBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  notesText: { fontSize: 11, color: '#64748b', fontStyle: 'italic' },

  eventCardActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  attendanceBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb', marginLeft: 4 },
  callupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  callupBtnText: { fontSize: 11, fontWeight: 'bold', color: '#d97706', marginLeft: 4 },

  /* MODALE */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  modalSubTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  typeChipBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeChipBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  typeChipBtnText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  typeChipBtnTextActive: { color: '#2563eb', fontWeight: 'bold' },

  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginRight: 8 },
  cancelBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  /* FREKWENCJA MODAL */
  statsBarContainer: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  statsBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statsBarTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  statsBarPercent: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  progressBarTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#16a34a' },

  massActionsRow: { flexDirection: 'row', marginBottom: 8 },
  massBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  massBtnText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },

  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  attendancePlayerName: { fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1 },
  statusChipsRow: { flexDirection: 'row' },
  attChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9', marginLeft: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  attChipGreen: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  attChipRed: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  attChipYellow: { backgroundColor: '#d97706', borderColor: '#d97706' },
  attChipText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },

  /* POWOŁANIE MODAL */
  eqChecklist: { marginTop: 4, marginBottom: 8 },
  eqCheckItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  eqCheckText: { fontSize: 12, color: '#334155', marginLeft: 8 },
  previewBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', maxHeight: 180 },
  previewText: { fontSize: 11, color: '#0f172a', lineHeight: 17 },
});