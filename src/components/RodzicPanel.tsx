import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';

interface RodzicPanelProps {
  onBack?: () => void;
}

interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  type: 'info' | 'warning' | 'success';
}

const MOCK_NOTICES: Notice[] = [
  {
    id: '1',
    title: 'Zmiana godziny treningu w czwartek',
    date: '04.11.2026',
    content: 'Trening rocznika 2014 zostaje przesunięty z 17:00 na 18:30 ze względu na rezerwację boiska.',
    type: 'warning',
  },
  {
    id: '2',
    title: 'Wpłata składki za listopad',
    date: '01.11.2026',
    content: 'Przypominamy o wpłacie składki członkowskiej do 10 dnia miesiąca.',
    type: 'info',
  },
];

export const RodzicPanel: React.FC<RodzicPanelProps> = ({ onBack }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'payments' | 'gear'>('home');

  const [connectedPlayer, setConnectedPlayer] = useState<{
    id: string;
    name: string;
    team: string;
    club: string;
    code: string;
  } | null>(null);

  // Sprawdzanie przy starcie, czy rodzic ma już powiązanego zawodnika w Supabase
  useEffect(() => {
    checkLinkedPlayer();
  }, []);

  const checkLinkedPlayer = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setLoading(false);
        return;
      }

      const parentId = authData.user.id;

      // Szukamy w bazie zawodnika powiązanego z tym kontem rodzica
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('parent_id', parentId)
        .maybeSingle();

      if (!playerError && player) {
        setIsConnected(true);
        setConnectedPlayer({
          id: player.id,
          name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
          team: `Rocznik ${player.year || '2012'}`,
          club: 'WKS Wieluń',
          code: player.invite_code || 'Brak kodu',
        });
      } else {
        setIsConnected(false);
        setConnectedPlayer(null);
      }
    } catch (err) {
      console.error('Błąd pobierania powiązanego zawodnika:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      Alert.alert('Błąd', 'Proszę wprowadzić kod zaproszenia od trenera.');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        Alert.alert('Błąd', 'Musisz być zalogowany, aby powiązać konto.');
        setLoading(false);
        return;
      }

      const parentId = authData.user.id;

      // 1. Sprawdzamy czy zawodnik z takim kodem istnieje w bazie
      const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('*')
        .eq('invite_code', cleanCode)
        .maybeSingle();

      if (fetchError || !player) {
        Alert.alert('Nie znaleziono', 'Podany kod zaproszenia jest nieprawidłowy lub nie istnieje w bazie.');
        setLoading(false);
        return;
      }

      // 2. Przypisujemy parent_id do rekordu zawodnika w Supabase
      const { error: updateError } = await supabase
        .from('players')
        .update({ parent_id: parentId })
        .eq('id', player.id);

      if (updateError) {
        Alert.alert('Błąd', 'Nie udało się powiązać konta w bazie danych.');
        setLoading(false);
        return;
      }

      setIsConnected(true);
      setConnectedPlayer({
        id: player.id,
        name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        team: `Rocznik ${player.year || '2012'}`,
        club: 'WKS Wieluń',
        code: cleanCode,
      });

      Alert.alert('Sukces!', `Pomyślnie powiązano profil zawodnika: ${player.first_name} ${player.last_name}[cite: 1]`);
      setInviteCode('');
    } catch (err) {
      console.error('Błąd weryfikacji kodu:', err);
      Alert.alert('Błąd', 'Wystąpił błąd podczas łączenia z bazą.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Odłączenie profilu',
      'Czy na pewno chcesz odłączyć konto rodzica od profilu zawodnika?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Odłącz',
          style: 'destructive',
          onPress: async () => {
            if (!connectedPlayer) return;
            setLoading(true);
            try {
              const { error } = await supabase
                .from('players')
                .update({ parent_id: null })
                .eq('id', connectedPlayer.id);

              if (!error) {
                setIsConnected(false);
                setConnectedPlayer(null);
                Alert.alert('Rozłączono', 'Konto zostało pomyślnie odpięte od profilu dziecka.');
              } else {
                Alert.alert('Błąd', 'Nie udało się odłączyć profilu.');
              }
            } catch (err) {
              console.error('Błąd rozłączania:', err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: '#9ca3af', marginTop: 12 }}>Ładowanie strefy rodzica...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* NAGŁÓWEK */}
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Powrót</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Strefa Rodzica</Text>
            <Text style={styles.subtitleHeader}>Panel zarządzania udziałem dziecka w klubie</Text>
          </View>
        </View>

        {/* EKRAN ŁĄCZENIA KODEM (GDY NIEPOŁĄCZONY) */}
        {!isConnected ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dołącz do drużyny</Text>
            <Text style={styles.cardSubtitle}>
              Wprowadź unikalny kod zaproszenia wygenerowany przez trenera w zakładce kadry, aby uzyskać dostęp do składu, obecności i opłat[cite: 1].
            </Text>

            <TextInput
              style={styles.input}
              placeholder="np. K7X9PL"
              placeholderTextColor="#777777"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyCode}>
              <Text style={styles.primaryButtonText}>Zweryfikuj kod i połącz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* EKRAN GŁÓWNY RODZICA (POŁĄCZONY) */
          <View style={styles.mainContent}>
            {/* KARTA PROFILU DZIECKA */}
            <View style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <View>
                  <Text style={styles.playerName}>{connectedPlayer?.name}</Text>
                  <Text style={styles.playerDetails}>
                    {connectedPlayer?.club} • {connectedPlayer?.team}
                  </Text>
                </View>
                <View style={styles.badgeActive}>
                  <Text style={styles.badgeActiveText}>Połączony</Text>
                </View>
              </View>

              <View style={styles.codeRow}>
                <Text style={styles.codeRowLabel}>Kod przypisania:</Text>
                <Text style={styles.codeRowValue}>{connectedPlayer?.code}</Text>
              </View>

              <TouchableOpacity style={styles.disconnectLink} onPress={handleDisconnect}>
                <Text style={styles.disconnectLinkText}>Zmień kod / Odłącz profil</Text>
              </TouchableOpacity>
            </View>

            {/* ZAKŁADKI / NAWIGACJA WEWNĘTRZNA */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
                onPress={() => setActiveTab('home')}
              >
                <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
                  Ogłoszenia
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'attendance' && styles.tabButtonActive]}
                onPress={() => setActiveTab('attendance')}
              >
                <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
                  Obecności
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'payments' && styles.tabButtonActive]}
                onPress={() => setActiveTab('payments')}
              >
                <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
                  Finanse
                </Text>
              </TouchableOpacity>
            </View>

            {/* SEKCJA TREŚCI W ZALEŻNOŚCI OD ZAKŁADKI */}
            {activeTab === 'home' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aktualności od trenera</Text>
                {MOCK_NOTICES.map((item) => (
                  <View key={item.id} style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                      <Text style={styles.noticeTitle}>{item.title}</Text>
                      <Text style={styles.noticeDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.noticeContent}>{item.content}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'attendance' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Szybkie potwierdzenie obecności</Text>
                <View style={styles.eventCard}>
                  <Text style={styles.eventTitle}>Trening – Boisko B</Text>
                  <Text style={styles.eventTime}>Czwartek, 5 Listopada 2026 • 18:30</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnSuccess]}
                      onPress={() => Alert.alert('Obecność', 'Potwierdzono obecność dziecku.')}
                    >
                      <Text style={styles.btnText}>Będzie</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnDanger]}
                      onPress={() => Alert.alert('Nieobecność', 'Zgłoszono nieobecność.')}
                    >
                      <Text style={styles.btnText}>Nie będzie</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'payments' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status składki klubowej</Text>
                <View style={styles.paymentStatusCard}>
                  <Text style={styles.paymentMonth}>Składka – Listopad 2026</Text>
                  <Text style={styles.paymentAmount}>120,00 PLN</Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>OPŁACONE (BLIK P2P)</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  headerRow: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitleHeader: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#121212',
    color: '#ffffff',
    padding: 16,
    borderRadius: 8,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainContent: {
    marginTop: 4,
  },
  playerCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2d2d',
    marginBottom: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerDetails: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  badgeActive: {
    backgroundColor: '#059669',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeActiveText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  codeRowLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginRight: 6,
  },
  codeRowValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disconnectLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  disconnectLinkText: {
    color: '#ef4444',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  noticeCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  noticeDate: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  noticeContent: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventTime: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#16a34a',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  paymentStatusCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMonth: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#9ca3af',
    marginVertical: 2,
  },
  paidBadge: {
    backgroundColor: '#064e3b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default RodzicPanel;