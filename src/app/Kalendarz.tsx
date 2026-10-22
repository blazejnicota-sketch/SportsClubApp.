import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type EventType = 'mecz' | 'trening' | 'sparing' | 'inne';
type RSVPStatus = 'present' | 'absent' | 'late' | 'none';
type CalendarViewMode = 'month' | 'week' | 'list';

interface EventItem {
  id: string;
  title: string;
  type: EventType;
  date: string; // Format YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetTime?: string; // HH:mm (Zbiórka)
  meetLocation?: string; // Miejsce zbiórki
  location: string; // Miejsce meczu/treningu
  locationAddress?: string; // Adres do Google Maps
  team: string;
  equipment?: string; // np. Stroje czerwone, ochraniacze
  description?: string;
  userRsvp?: RSVPStatus;
}

export default function KalendarzScreen() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-22');
  
  // Przykładowe wydarzenia
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: '1',
      title: 'Mecz Ligowy vs Warta Sieradz',
      type: 'mecz',
      date: '2026-10-24',
      startTime: '11:00',
      endTime: '13:00',
      meetTime: '09:30',
      meetLocation: 'Parking klubowy (Wyjazd busem)',
      location: 'Stadion Miejski w Sieradzu',
      locationAddress: 'Sportowa 1, Sieradz',
      team: 'Młodzik A1',
      equipment: 'Komplet czerwony, ochraniacze, legitymacja',
      description: 'Zbiórka punktualnie. Jedziemy wspólnie busem klubowym.',
      userRsvp: 'present',
    },
    {
      id: '2',
      title: 'Trening Taktyczny',
      type: 'trening',
      date: '2026-10-22',
      startTime: '17:00',
      endTime: '18:30',
      meetTime: '16:45',
      meetLocation: 'Szatnia nr 4',
      location: 'Boisko Sztuczne Orlik',
      locationAddress: 'Polna 12, Wieluń',
      team: 'Młodzik A1',
      equipment: 'Obuwie na sztuczną trawę, roler',
      description: 'Skupienie na stałych fragmentach gry.',
      userRsvp: 'none',
    },
    {
      id: '3',
      title: 'Sparing Wewnętrzny',
      type: 'sparing',
      date: '2026-10-28',
      startTime: '16:30',
      endTime: '18:00',
      meetTime: '16:15',
      meetLocation: 'Boisko główne',
      location: 'Stadion Główny',
      locationAddress: 'Częstochowska 15, Wieluń',
      team: 'Młodzik A1',
      equipment: 'Stroje czarne',
      userRsvp: 'none',
    },
  ]);

  // Modal dodawania nowego wydarzenia
  const [modalVisible, setModalVisible] = useState(false);
  
  // Formularz nowego wydarzenia
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('trening');
  const [newDate, setNewDate] = useState(selectedDate);
  const [newStartTime, setNewStartTime] = useState('17:00');
  const [newEndTime, setNewEndTime] = useState('18:30');
  const [newMeetTime, setNewMeetTime] = useState('16:45');
  const [newMeetLocation, setNewMeetLocation] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newTeam, setNewTeam] = useState('Młodzik A1');
  const [newEquipment, setNewEquipment] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Nawigacja w Google Maps
  const openGoogleMaps = (address: string) => {
    if (!address) {
      Alert.alert('Brak adresu', 'Lokalizacja nie posiada zapisanego adresu do nawigacji.');
      return;
    }
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    });

    Linking.openURL(url as string).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    });
  };

  // Dodawanie z konkretnego dnia
  const handleDayPress = (dayStr: string) => {
    setSelectedDate(dayStr);
  };

  const handleOpenAddModal = (initialDate?: string) => {
    setNewDate(initialDate || selectedDate);
    setNewTitle('');
    setNewType('trening');
    setNewStartTime('17:00');
    setNewEndTime('18:30');
    setNewMeetTime('16:45');
    setNewMeetLocation('');
    setNewLocation('');
    setNewLocationAddress('');
    setNewEquipment('');
    setNewDescription('');
    setModalVisible(true);
  };

  const handleSaveEvent = () => {
    if (!newTitle.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę wydarzenia.');
      return;
    }

    const createdEvent: EventItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      type: newType,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      meetTime: newMeetTime || undefined,
      meetLocation: newMeetLocation || undefined,
      location: newLocation || 'Boisko klubowe',
      locationAddress: newLocationAddress || newLocation,
      team: newTeam,
      equipment: newEquipment || undefined,
      description: newDescription || undefined,
      userRsvp: 'none',
    };

    setEvents([createdEvent, ...events]);
    setModalVisible(false);
  };

  const handleRsvp = (eventId: string, status: RSVPStatus) => {
    setEvents(
      events.map((ev) => (ev.id === eventId ? { ...ev, userRsvp: status } : ev))
    );
  };

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case 'mecz':
        return '#ef4444';
      case 'trening':
        return '#2563eb';
      case 'sparing':
        return '#f59e0b';
      case 'inne':
        return '#10b981';
    }
  };

  const getTypeLabel = (type: EventType) => {
    switch (type) {
      case 'mecz':
        return 'Mecz Ligowy';
      case 'trening':
        return 'Trening';
      case 'sparing':
        return 'Sparing';
      case 'inne':
        return 'Wydarzenie';
    }
  };

  // Filtrowanie wydarzeń dla wybranego dnia
  const selectedDayEvents = events.filter((e) => e.date === selectedDate);

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK ORAZ PRZEŁĄCZNIK WIDOKÓW */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kalendarz Drużyny</Text>
        <TouchableOpacity
          style={styles.addBtnHeader}
          onPress={() => handleOpenAddModal(selectedDate)}
        >
          <Ionicons name="add-circle" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'month' && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode('month')}
        >
          <Text
            style={[
              styles.toggleBtnText,
              viewMode === 'month' && styles.toggleBtnTextActive,
            ]}
          >
            Miesiąc
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'week' && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode('week')}
        >
          <Text
            style={[
              styles.toggleBtnText,
              viewMode === 'week' && styles.toggleBtnTextActive,
            ]}
          >
            Tydzień
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'list' && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleBtnText,
              viewMode === 'list' && styles.toggleBtnTextActive,
            ]}
          >
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* WIDOK MIESIĄCA */}
        {viewMode === 'month' && (
          <View style={styles.card}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>Październik 2026</Text>
            </View>
            <View style={styles.daysGrid}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d, i) => (
                <Text key={i} style={styles.dayName}>
                  {d}
                </Text>
              ))}
              {/* Dni miesiąca (przykładowa siatka) */}
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const dayStr = `2026-10-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const isSelected = selectedDate === dayStr;
                const hasEvent = events.some((e) => e.date === dayStr);

                return (
                  <TouchableOpacity
                    key={dayNum}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasEvent && <View style={styles.eventDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.addDirectBtn}
              onPress={() => handleOpenAddModal(selectedDate)}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.addDirectBtnText}>
                Dodaj wydarzenie na {selectedDate}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WIDOK TYGODNIA */}
        {viewMode === 'week' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bieżący Tydzień</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.weekRow}>
                {['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'].map((dayStr) => {
                  const dayEvents = events.filter((e) => e.date === dayStr);
                  const isSelected = selectedDate === dayStr;
                  return (
                    <TouchableOpacity
                      key={dayStr}
                      style={[styles.weekDayCard, isSelected && styles.weekDayCardSelected]}
                      onPress={() => handleDayPress(dayStr)}
                    >
                      <Text style={[styles.weekDayText, isSelected && styles.weekDayTextSelected]}>
                        {dayStr.slice(8)} Oct
                      </Text>
                      <Text style={styles.weekDayCount}>{dayEvents.length} wyd.</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* LISTA WYDARZEŃ DLA WYBRANEGO DNIA LUB WSZYSTKICH */}
        <Text style={styles.sectionTitle}>
          {viewMode === 'list'
            ? 'Wszystkie nadchodzące wydarzenia'
            : `Wydarzenia w dniu: ${selectedDate}`}
        </Text>

        {(viewMode === 'list' ? events : selectedDayEvents).length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-clear-outline" size={40} color="#9ca3af" />
            <Text style={styles.emptyText}>Brak zaplanowanych wydarzeń</Text>
          </View>
        ) : (
          (viewMode === 'list' ? events : selectedDayEvents).map((item) => (
            <View key={item.id} style={styles.eventCard}>
              {/* Pasek kategorii */}
              <View
                style={[
                  styles.eventTypeBar,
                  { backgroundColor: getTypeColor(item.type) },
                ]}
              />

              <View style={styles.eventContent}>
                <View style={styles.eventHeaderRow}>
                  <View style={styles.typeBadge}>
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: getTypeColor(item.type) },
                      ]}
                    >
                      {getTypeLabel(item.type)}
                    </Text>
                  </View>
                  <Text style={styles.eventDateText}>
                    {item.date} | {item.startTime} - {item.endTime}
                  </Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>

                {/* SEKCJA ZBIÓRKI (Jeśli podana) */}
                {(item.meetTime || item.meetLocation) && (
                  <View style={styles.meetBox}>
                    <View style={styles.rowItem}>
                      <Ionicons name="alarm-outline" size={18} color="#d97706" />
                      <Text style={styles.meetTitle}>ZBIÓRKA: </Text>
                      <Text style={styles.meetTimeText}>
                        godz. {item.meetTime || 'Do ustalenia'}
                      </Text>
                    </View>
                    {item.meetLocation && (
                      <View style={[styles.rowItem, { marginTop: 4 }]}>
                        <Ionicons name="business-outline" size={16} color="#4b5563" />
                        <Text style={styles.meetLocationText}>
                          {item.meetLocation}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* SEKCJA LOKALIZACJI + GOOGLE MAPS */}
                <View style={styles.locationContainer}>
                  <View style={styles.rowItemFlex}>
                    <Ionicons name="location" size={18} color="#ef4444" />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                  {item.locationAddress && (
                    <TouchableOpacity
                      style={styles.navBtn}
                      onPress={() => openGoogleMaps(item.locationAddress!)}
                    >
                      <Ionicons name="navigate" size={14} color="#fff" />
                      <Text style={styles.navBtnText}>Nawiguj</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* SPRZĘT / STROJE */}
                {item.equipment && (
                  <View style={styles.rowItem}>
                    <Ionicons name="shirt-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      Sprzęt: {item.equipment}
                    </Text>
                  </View>
                )}

                {/* OPIS */}
                {item.description && (
                  <Text style={styles.descriptionText}>{item.description}</Text>
                )}

                {/* POTWIERDZENIE OBECNOŚCI (RSVP) */}
                <View style={styles.rsvpSection}>
                  <Text style={styles.rsvpLabel}>Obecność:</Text>
                  <View style={styles.rsvpButtons}>
                    <TouchableOpacity
                      style={[
                        styles.rsvpBtn,
                        item.userRsvp === 'present' && styles.rsvpBtnPresent,
                      ]}
                      onPress={() => handleRsvp(item.id, 'present')}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={item.userRsvp === 'present' ? '#fff' : '#10b981'}
                      />
                      <Text
                        style={[
                          styles.rsvpBtnText,
                          item.userRsvp === 'present' && styles.rsvpBtnTextActive,
                        ]}
                      >
                        Będę
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.rsvpBtn,
                        item.userRsvp === 'late' && styles.rsvpBtnLate,
                      ]}
                      onPress={() => handleRsvp(item.id, 'late')}
                    >
                      <Ionicons
                        name="time"
                        size={16}
                        color={item.userRsvp === 'late' ? '#fff' : '#f59e0b'}
                      />
                      <Text
                        style={[
                          styles.rsvpBtnText,
                          item.userRsvp === 'late' && styles.rsvpBtnTextActive,
                        ]}
                      >
                        Spóźnię się
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.rsvpBtn,
                        item.userRsvp === 'absent' && styles.rsvpBtnAbsent,
                      ]}
                      onPress={() => handleRsvp(item.id, 'absent')}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={item.userRsvp === 'absent' ? '#fff' : '#ef4444'}
                      />
                      <Text
                        style={[
                          styles.rsvpBtnText,
                          item.userRsvp === 'absent' && styles.rsvpBtnTextActive,
                        ]}
                      >
                        Nie będę
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DODAWANIA NOWEGO WYDARZENIA */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nowe Wydarzenie</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nazwa wydarzenia *</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Mecz Ligowy vs Raków"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Typ wydarzenia</Text>
              <View style={styles.typeSelector}>
                {(['trening', 'mecz', 'sparing', 'inne'] as EventType[]).map(
                  (t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeSelectBtn,
                        newType === t && {
                          backgroundColor: getTypeColor(t),
                        },
                      ]}
                      onPress={() => setNewType(t)}
                    >
                      <Text
                        style={[
                          styles.typeSelectText,
                          newType === t && styles.typeSelectTextActive,
                        ]}
                      >
                        {getTypeLabel(t)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Data (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newDate}
                    onChangeText={setNewDate}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Drużyna</Text>
                  <TextInput
                    style={styles.input}
                    value={newTeam}
                    onChangeText={setNewTeam}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputLabel}>Godz. rozpoczęcia</Text>
                  <TextInput
                    style={styles.input}
                    value={newStartTime}
                    onChangeText={setNewStartTime}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputLabel}>Godz. zakończenia</Text>
                  <TextInput
                    style={styles.input}
                    value={newEndTime}
                    onChangeText={setNewEndTime}
                  />
                </View>
              </View>

              {/* SEKCJA ZBIÓRKI W MODALU */}
              <View style={styles.modalSectionBox}>
                <Text style={styles.modalSectionTitle}>📍 Zbiórka</Text>
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.inputLabel}>Godzina zbiórki</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="np. 16:15"
                      value={newMeetTime}
                      onChangeText={setNewMeetTime}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.inputLabel}>Miejsce zbiórki</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="np. Szatnia nr 2"
                      value={newMeetLocation}
                      onChangeText={setNewMeetLocation}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Miejsce wydarzenia / Boisko</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Stadion Główny"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.inputLabel}>Adres do Google Maps</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Sportowa 1, Wieluń"
                value={newLocationAddress}
                onChangeText={setNewLocationAddress}
              />

              <Text style={styles.inputLabel}>Wymagany sprzęt / Stroje</Text>
              <TextInput
                style={styles.input}
                placeholder="np. Czerwone koszulki, ochraniacze"
                value={newEquipment}
                onChangeText={setNewEquipment}
              />

              <Text style={styles.inputLabel}>Dodatkowe uwagi</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Uwagi dla rodziców i zawodników..."
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveBtnText}>Zapisz Wydarzenie</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addBtnHeader: {
    padding: 4,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 3,
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayName: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    fontSize: 12,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#2563eb',
  },
  dayText: {
    fontSize: 13,
    color: '#1f2937',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ef4444',
    marginTop: 2,
  },
  addDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  addDirectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  weekDayCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    width: 80,
  },
  weekDayCardSelected: {
    backgroundColor: '#2563eb',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  weekDayTextSelected: {
    color: '#fff',
  },
  weekDayCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
  },
  eventTypeBar: {
    width: 6,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventDateText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 6,
  },
  meetBox: {
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginVertical: 6,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
    marginLeft: 4,
  },
  meetTimeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  meetLocationText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowItemFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 6,
  },
  rsvpSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rsvpLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  rsvpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    marginHorizontal: 2,
  },
  rsvpBtnPresent: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  rsvpBtnLate: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  rsvpBtnAbsent: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  rsvpBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 4,
  },
  rsvpBtnTextActive: {
    color: '#fff',
  },
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  typeSelectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  typeSelectTextActive: {
    color: '#fff',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  modalSectionBox: {
    backgroundColor: '#fefce8',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginVertical: 8,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#854d0e',
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});