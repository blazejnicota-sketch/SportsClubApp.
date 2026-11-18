import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePlayers } from './PlayersContext';

type SessionType = '1on1' | 'group';
type ViewMode = 'list' | 'calendar';

const MONTH_NAMES = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

// Helper do uniwersalnego formatowania dat (DD.MM.YYYY)
const formatDateStr = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export default function TreningiIndywidualnePanel() {
  const { players } = usePlayers();
  
  const [activeTab, setActiveTab] = useState<SessionType>('1on1');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  const [singlePlayerId, setSinglePlayerId] = useState<string>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupSelectModal, setGroupSelectModal] = useState(false);

  const [sessionGoal, setSessionGoal] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  
  // Stany dla cykliczności
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1))); // Domyślnie +1 miesiąc
  const [showRecurringDatePicker, setShowRecurringDatePicker] = useState(false);

  // Stany czasu i daty startowej
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(16, 0, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(17, 0, 0, 0)));
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Stany dla widoku kalendarza
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const [homeworkModalVisible, setHomeworkModalVisible] = useState(false);
  const [selectedSessionForHomework, setSelectedSessionForHomework] = useState<any>(null);
  
  const HOMEWORK_TASKS = [
    'Żonglerka (Prawa/Lewa) - 50 podbić',
    'Zwód pojedynczy w biegu (Wideo)',
    'Strzał w okienko z 16 metrów',
    'Koordynacja z drabinką',
  ];

  const [sessions, setSessions] = useState([
    { 
      id: '1', 
      name: 'Kuba Nowak (Spoza listy)', 
      dateStr: formatDateStr(new Date()),
      startMs: new Date().setHours(16, 0, 0, 0),
      endMs: new Date().setHours(17, 0, 0, 0),
      time: `${formatDateStr(new Date())} • 16:00 - 17:00`, 
      goal: 'Gra 1v1 i strzały z dystansu', 
      notes: 'Widoczna poprawa dynamiki.', 
      status: 'Zaplanowany',
      isRecurring: false
    },
  ]);

  const toggleGroupPlayer = (id: string) => {
    if (selectedGroupIds.includes(id)) {
      setSelectedGroupIds(selectedGroupIds.filter(pid => pid !== id));
    } else {
      if (selectedGroupIds.length >= 4) {
        Alert.alert('Limit grupy', 'Mała grupa może liczyć maksymalnie 4 osoby.');
        return;
      }
      setSelectedGroupIds([...selectedGroupIds, id]);
    }
  };

  const getDatesToSchedule = () => {
    const dates: Date[] = [];
    let curr = new Date(date);
    const end = isRecurring ? new Date(recurringEndDate) : new Date(date);
    
    // Zabezpieczenie przed nieskończoną pętlą (max rok w przód)
    let safetyLimit = 52; 
    
    while (curr <= end && safetyLimit > 0) {
      dates.push(new Date(curr));
      if (!isRecurring) break;
      curr.setDate(curr.getDate() + 7);
      safetyLimit--;
    }
    return dates;
  };

  const checkTimeConflicts = (datesToCheck: Date[]) => {
    for (const d of datesToCheck) {
      const dStr = formatDateStr(d);
      
      const sTime = new Date(d);
      sTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const eTime = new Date(d);
      eTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      const conflict = sessions.find(s => s.dateStr === dStr && sTime.getTime() < s.endMs && eTime.getTime() > s.startMs);
      
      if (conflict) return conflict;
    }
    return null;
  };

  const processAddSession = (datesToSchedule: Date[]) => {
    let sessionName = '';

    if (activeTab === '1on1') {
      if (!singlePlayerId) {
        Alert.alert('Brak danych', 'Wybierz zawodnika do treningu 1-on-1.');
        return;
      }
      const p = players.find(p => p.id === singlePlayerId);
      sessionName = p ? `${p.firstName} ${p.lastName}` : 'Nieznany Zawodnik';
    } else {
      if (selectedGroupIds.length < 2) {
        Alert.alert('Brak danych', 'Wybierz od 2 do 4 zawodników do małej grupy.');
        return;
      }
      const names = players.filter(p => selectedGroupIds.includes(p.id)).map(p => p.firstName).join(', ');
      sessionName = `Grupa: ${names}`;
    }

    if (!sessionGoal) {
      Alert.alert('Brak celu', 'Proszę wpisać główny element/cel treningowy.');
      return;
    }

    const startStr = startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const endStr = endTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const newSessionsList = datesToSchedule.map((d, index) => {
      const dateString = formatDateStr(d);
      const sTime = new Date(d); sTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      const eTime = new Date(d); eTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      return {
        // Dodajemy index do ID, by każdy wygenerowany trening był unikalny
        id: Date.now().toString() + index,
        name: sessionName,
        dateStr: dateString,
        startMs: sTime.getTime(),
        endMs: eTime.getTime(),
        time: `${dateString} • ${startStr} - ${endStr}`,
        goal: sessionGoal,
        notes: coachNotes || 'Brak notatek wstępnych.',
        status: 'Zaplanowany',
        isRecurring: isRecurring
      };
    });

    setSessions([...newSessionsList, ...sessions]);
    setSinglePlayerId('');
    setSelectedGroupIds([]);
    setSessionGoal('');
    setCoachNotes('');
    setIsRecurring(false);
    
    if (viewMode === 'calendar') {
      setSelectedDateFilter(formatDateStr(date));
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    
    Alert.alert('Sukces', `Wygenerowano ${newSessionsList.length} sesji treningowych w harmonogramie.`);
  };

  const handleAddSession = () => {
    if (startTime.getTime() >= endTime.getTime()) {
      Alert.alert('Błąd czasu', 'Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia!');
      return;
    }

    if (isRecurring && recurringEndDate < date) {
      Alert.alert('Błąd daty', 'Data końcowa cyklu musi być późniejsza niż data pierwszego treningu!');
      return;
    }

    const datesToSchedule = getDatesToSchedule();
    const conflict = checkTimeConflicts(datesToSchedule);
    
    if (conflict) {
      Alert.alert(
        '⚠️ Kolizja w kalendarzu!',
        `Przynajmniej jeden trening z tego cyklu nakłada się z już zaplanowanym wydarzeniem:\n\n${conflict.name}\n${conflict.time}\n\nCzy chcesz nałożyć te treningi?`,
        [
          { text: 'Popraw', style: 'cancel' },
          { text: 'Zapisz mimo to', style: 'destructive', onPress: () => processAddSession(datesToSchedule) },
        ]
      );
    } else {
      processAddSession(datesToSchedule);
    }
  };

  const markAsCompleted = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'Zakończony' } : s));
  };

  const assignHomework = (task: string) => {
    setHomeworkModalVisible(false);
    Alert.alert('Zadanie Przypisane! 🏆', `Zadanie domowe "${task}" zostało pomyślnie wysłane do: ${selectedSessionForHomework.name}. Pojawi się w ich aplikacji.`);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(newDate);
  };

  const renderCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayObj = new Date(year, month, 1).getDay();
    const shift = firstDayObj === 0 ? 6 : firstDayObj - 1;
    const daysCount = new Date(year, month + 1, 0).getDate();

    const daysArray = [];
    for (let i = 0; i < shift; i++) daysArray.push(null);
    for (let i = 1; i <= daysCount; i++) daysArray.push(i);

    const weeks = [];
    while (daysArray.length > 0) weeks.push(daysArray.splice(0, 7));

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.calMonthText}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
            <Ionicons name="chevron-forward" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.calWeekDays}>
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
            <Text key={d} style={styles.calWeekDayText}>{d}</Text>
          ))}
        </View>

        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.calWeekRow}>
            {week.map((day, dIdx) => {
              if (!day) return <View key={dIdx} style={styles.calDayEmpty} />;
              const dateStr = formatDateStr(new Date(year, month, day));
              const hasSession = sessions.some(s => s.dateStr === dateStr);
              const isSelected = selectedDateFilter === dateStr;

              return (
                <TouchableOpacity 
                  key={dIdx} 
                  style={[styles.calDayBtn, isSelected && styles.calDayBtnSelected]} 
                  onPress={() => setSelectedDateFilter(dateStr)}
                >
                  <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>{day}</Text>
                  {hasSession && <View style={[styles.calDayDot, isSelected && {backgroundColor: '#fff'}]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        
        {selectedDateFilter && (
          <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSelectedDateFilter(null)}>
            <Text style={styles.clearFilterBtnText}>Pokaż wszystkie sesje</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const displayedSessions = selectedDateFilter && viewMode === 'calendar'
    ? sessions.filter(s => s.dateStr === selectedDateFilter)
    : sessions;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Treningi Indywidualne i Grupy ⚽</Text>
        <Text style={styles.subtitle}>Zarządzaj sesjami z inteligentnym kalendarzem</Text>
      </View>

      {/* FORMULARZ ZAPISU */}
      <View style={styles.formCard}>
        <View style={styles.formHeaderRow}>
          <Text style={styles.formTitle}>Zaplanuj nowy trening</Text>
          <View style={styles.tabRowMini}>
            <TouchableOpacity style={[styles.tabMini, activeTab === '1on1' && styles.tabActive]} onPress={() => { setActiveTab('1on1'); setSelectedGroupIds([]); }}>
              <Text style={[styles.tabTextMini, activeTab === '1on1' && styles.tabTextActive]}>1-on-1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabMini, activeTab === 'group' && styles.tabActive]} onPress={() => { setActiveTab('group'); setSinglePlayerId(''); }}>
              <Text style={[styles.tabTextMini, activeTab === 'group' && styles.tabTextActive]}>Grupa</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {activeTab === '1on1' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerSelectScroll}>
            {players.map(p => (
              <TouchableOpacity key={p.id} style={[styles.playerChip, singlePlayerId === p.id && styles.playerChipActive]} onPress={() => setSinglePlayerId(p.id)}>
                <Text style={[styles.playerChipText, singlePlayerId === p.id && styles.playerChipTextActive]}>{p.firstName} {p.lastName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity style={styles.groupSelectBtn} onPress={() => setGroupSelectModal(true)}>
            <Ionicons name="people-outline" size={18} color="#2563eb" style={{marginRight: 8}} />
            <Text style={styles.groupSelectText}>
              {selectedGroupIds.length > 0 ? `Wybrano: ${selectedGroupIds.length}/4 zawodników` : 'Wybierz zawodników do grupy (Max 4)'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.timeLabel}>Pierwszy trening</Text>
            <Text style={styles.timeValue}>{formatDateStr(date)}</Text>
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date} mode="date" display="default"
            onChange={(_, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) setDate(selectedDate); }}
          />
        )}

        <View style={styles.timeSelectRow}>
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartTimePicker(true)}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{startTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
          <Ionicons name="remove-outline" size={24} color="#94a3b8" />
          <TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndTimePicker(true)}>
            <Text style={styles.timeLabel}>Koniec</Text>
            <Text style={styles.timeValue}>{endTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {showStartTimePicker && (
          <DateTimePicker
            value={startTime} mode="time" is24Hour={true} display="default"
            onChange={(_, selectedTime) => { setShowStartTimePicker(Platform.OS === 'ios'); if (selectedTime) setStartTime(selectedTime); }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime} mode="time" is24Hour={true} display="default"
            onChange={(_, selectedTime) => { setShowEndTimePicker(Platform.OS === 'ios'); if (selectedTime) setEndTime(selectedTime); }}
          />
        )}

        <TextInput style={styles.input} placeholder="Cel treningowy (np. Gra 1v1)" value={sessionGoal} onChangeText={setSessionGoal} />
        <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Notatki Trenera (nad czym się skupić)" multiline value={coachNotes} onChangeText={setCoachNotes} />

        {/* TRENING CYKLICZNY */}
        <View style={styles.recurringRow}>
          <View>
            <Text style={styles.recurringLabel}>Trening cykliczny</Text>
            <Text style={styles.recurringSub}>Powtarzaj co tydzień</Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
            thumbColor={isRecurring ? '#2563eb' : '#f8fafc'}
          />
        </View>

        {isRecurring && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Data końcowa cyklu:</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowRecurringDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.timeLabel}>Zakończenie cyklu</Text>
                <Text style={styles.timeValue}>{formatDateStr(recurringEndDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {showRecurringDatePicker && (
          <DateTimePicker
            value={recurringEndDate}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              setShowRecurringDatePicker(Platform.OS === 'ios');
              if (selectedDate) setRecurringEndDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddSession}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.submitBtnText}>Zapisz w harmonogramie</Text>
        </TouchableOpacity>
      </View>

      {/* PRZEŁĄCZNIK WIDOKÓW HARMONOGRAMU */}
      <View style={styles.viewToggleRow}>
        <Text style={styles.listTitle}>Harmonogram:</Text>
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]} onPress={() => setViewMode('list')}>
            <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#2563eb' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'calendar' && styles.viewToggleBtnActive]} onPress={() => setViewMode('calendar')}>
            <Ionicons name="calendar-outline" size={16} color={viewMode === 'calendar' ? '#2563eb' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* WIDOK KALENDARZA (Jeśli wybrany) */}
      {viewMode === 'calendar' && renderCalendarGrid()}

      {/* LISTA SESJI */}
      {displayedSessions.length > 0 ? (
        displayedSessions.map(s => (
          <View key={s.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.sessionName}>{s.name}</Text>
                {s.isRecurring && <Ionicons name="repeat" size={14} color="#2563eb" style={{marginLeft: 6}} />}
              </View>
              <View style={[styles.statusBadge, s.status === 'Zakończony' && { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={[styles.statusText, s.status === 'Zakończony' && { color: '#16a34a' }]}>{s.status}</Text>
              </View>
            </View>
            
            <Text style={styles.sessionTime}>🕒 {s.time}</Text>
            <Text style={styles.sessionGoal}>🎯 Cel: {s.goal}</Text>
            
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notatka trenera:</Text>
              <Text style={styles.notesText}>{s.notes}</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              {s.status === 'Zaplanowany' && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => markAsCompleted(s.id)}>
                  <Ionicons name="checkmark-done" size={16} color="#fff" style={{marginRight: 4}} />
                  <Text style={styles.completeBtnText}>Zrealizowano</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.homeworkBtn} 
                onPress={() => { setSelectedSessionForHomework(s); setHomeworkModalVisible(true); }}
              >
                <Ionicons name="trophy-outline" size={16} color="#f59e0b" style={{marginRight: 4}} />
                <Text style={styles.homeworkBtnText}>Zadanie Domowe</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noSessionsText}>
          {viewMode === 'calendar' && selectedDateFilter 
            ? 'Brak zaplanowanych treningów w tym dniu.' 
            : 'Brak zaplanowanych treningów.'}
        </Text>
      )}

      <View style={{ height: 40 }} />

      {/* MODAL: WYBÓR MAŁEJ GRUPY */}
      <Modal visible={groupSelectModal} animationType="slide" transparent>
        <View style={styles.modalOverlayFull}>
          <View style={styles.modalContainerFull}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz Małą Grupę (Max 4)</Text>
              <TouchableOpacity onPress={() => setGroupSelectModal(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView>
              {players.map(p => {
                const isSelected = selectedGroupIds.includes(p.id);
                return (
                  <TouchableOpacity key={p.id} style={[styles.groupPlayerRow, isSelected && styles.groupPlayerRowSelected]} onPress={() => toggleGroupPlayer(p.id)}>
                    <Text style={styles.groupPlayerText}>#{p.number} {p.firstName} {p.lastName}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={() => setGroupSelectModal(false)}>
              <Text style={styles.submitBtnText}>Zatwierdź grupę ({selectedGroupIds.length}/4)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: ZADANIA DOMOWE */}
      <Modal visible={homeworkModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayFull}>
          <View style={[styles.modalContainerFull, { height: '50%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zadaj pracę domową 🏆</Text>
              <TouchableOpacity onPress={() => setHomeworkModalVisible(false)}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Wybierz wyzwanie dla: <Text style={{fontWeight: 'bold', color: '#0f172a'}}>{selectedSessionForHomework?.name}</Text>
            </Text>
            <ScrollView>
              {HOMEWORK_TASKS.map((task, idx) => (
                <TouchableOpacity key={idx} style={styles.homeworkTaskBtn} onPress={() => assignHomework(task)}>
                  <Ionicons name="videocam-outline" size={18} color="#f59e0b" style={{marginRight: 8}} />
                  <Text style={styles.homeworkTaskText}>{task}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  headerBox: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  formTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  
  tabRowMini: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 6, padding: 2 },
  tabMini: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  tabActive: { backgroundColor: '#2563eb' },
  tabTextMini: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  playerSelectScroll: { maxHeight: 45, marginBottom: 12 },
  playerChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#cbd5e1', height: 36, justifyContent: 'center' },
  playerChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  playerChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  playerChipTextActive: { color: '#fff' },

  groupSelectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 12, justifyContent: 'center' },
  groupSelectText: { fontSize: 13, fontWeight: 'bold', color: '#2563eb' },

  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10 },
  timeSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeBtn: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, alignItems: 'center' },
  timeLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  timeValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 4 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 10 },
  
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  recurringLabel: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  recurringSub: { fontSize: 11, color: '#64748b' },

  submitBtn: { backgroundColor: '#16a34a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 8, marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  viewToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  viewToggleGroup: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 6, padding: 2 },
  viewToggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  viewToggleBtnActive: { backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },

  calendarContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNavBtn: { padding: 4 },
  calMonthText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  calWeekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calWeekDayText: { fontSize: 11, fontWeight: 'bold', color: '#64748b', width: 30, textAlign: 'center' },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calDayEmpty: { width: 32, height: 32 },
  calDayBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  calDayBtnSelected: { backgroundColor: '#2563eb' },
  calDayText: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
  calDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  calDayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563eb', position: 'absolute', bottom: 4 },
  clearFilterBtn: { marginTop: 10, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 8, alignItems: 'center' },
  clearFilterBtnText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },

  sessionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sessionName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  sessionTime: { fontSize: 12, color: '#475569', marginBottom: 4 },
  sessionGoal: { fontSize: 12, color: '#0f172a', fontWeight: '600', marginBottom: 10 },
  notesBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  notesLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  notesText: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
  
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  completeBtn: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  completeBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  homeworkBtn: { flex: 1, backgroundColor: '#fef3c7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#fde68a' },
  homeworkBtnText: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
  noSessionsText: { textAlign: 'center', color: '#64748b', marginTop: 20, fontStyle: 'italic', fontSize: 12 },

  modalOverlayFull: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainerFull: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  groupPlayerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  groupPlayerRowSelected: { backgroundColor: '#eff6ff' },
  groupPlayerText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

  homeworkTaskBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  homeworkTaskText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1e293b' },
});