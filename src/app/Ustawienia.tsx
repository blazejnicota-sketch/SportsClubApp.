import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useClubSettings,
  SubscriptionPlan,
  SPORTS_DICTIONARY,
  SportDiscipline,
  SportCategory,
} from '../components/ClubSettingsContext';
import { supabase } from '../services/supabase';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function UstawieniaScreen() {
  const {
    plan,
    setPlan,
    sport,
    setSport,
    sportConfig,
    features,
    toggleFeature,
    darkMode,
    setDarkMode,
  } = useClubSettings();

  const [selectedCategory, setSelectedCategory] = useState<SportCategory | 'Wszystkie'>('Wszystkie');

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Czy na pewno chcesz się wylogować z konta?')) {
        await supabase.auth.signOut();
      }
      return;
    }
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować z konta?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyloguj',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const sportList = useMemo(() => {
    const all = Object.values(SPORTS_DICTIONARY);
    if (selectedCategory === 'Wszystkie') return all;
    return all.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  const plans: { id: SubscriptionPlan; name: string; price: string; desc: string }[] = [
    {
      id: 'STANDARD',
      name: 'Pakiet STANDARD',
      price: '0 zł / test',
      desc: 'Kadra, kody RODO, obecność i kalendarz. Moduł AI zablokowany (Paywall).',
    },
    {
      id: 'PRO',
      name: `Pakiet PRO ${sportConfig.emoji}`,
      price: '149 zł / mies.',
      desc: 'Pełny dostęp do skanera MediaPipe AI, rozgrzewki, zadań domowych i ewolucji Awatara.',
    },
    {
      id: 'ELITE',
      name: 'Pakiet ELITE 🏆',
      price: '299 zł / mies.',
      desc: 'Wszystko z PRO + 11 dyscyplin, integracja Health GPS i pełny generator zamówień sprzętu.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, darkMode && styles.headerDark]}>
        <View>
          <Text style={[styles.headerTitle, darkMode && { color: '#f8fafc' }]}>
            Ustawienia Akademii {sportConfig.emoji}
          </Text>
          <Text style={styles.headerSubtitle}>
            Sekcja: {sportConfig.name} • Konfiguracja SaaS
          </Text>
        </View>
        <View style={[styles.planBadge, plan === 'STANDARD' ? styles.badgeStd : styles.badgePro]}>
          <Text style={styles.planBadgeText}>{plan}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEKCJA 1: WYBÓR I FILTROWANIE DYSCYPLINY SPORTOWEJ (11 DYSCYPLIN) */}
        <Text style={styles.sectionTitle}>1. Aktywna Dyscyplina / Sekcja Klubu (11 Dyscyplin)</Text>
        <View style={[styles.card, darkMode && styles.cardDark]}>
          <Text style={styles.helperText}>
            Zmiana dyscypliny automatycznie dostosowuje nazewnictwo statystyk, pozycje graczy i rekomendowane moduły ćwiczeń AI (Skoczność, Zwinność, Statyczne, Dynamiczne, Rozciągające).
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {(['Wszystkie', 'Zespołowe', 'Indywidualne i Siłowe', 'Biegowe i Rekreacyjne (GPS)'] as const).map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catFilterPill,
                    selectedCategory === cat && styles.catFilterPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catFilterText,
                      selectedCategory === cat && { color: '#fff', fontWeight: 'bold' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <View style={styles.sportGrid}>
            {sportList.map((item) => {
              const active = sport === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.sportChip,
                    darkMode && styles.sportChipDark,
                    active && styles.sportChipActive,
                  ]}
                  onPress={() => setSport(item.id as SportDiscipline)}
                >
                  <Text style={styles.sportEmoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sportChipLabel,
                        darkMode && { color: '#e2e8f0' },
                        active && styles.sportChipLabelActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                      {item.category}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SEKCJA 2: SYMULATOR PAKIETU SUBSKRYPCJI */}
        <Text style={styles.sectionTitle}>2. Plan Subskrypcji Klubu (Chmura)</Text>
        <View style={[styles.card, darkMode && styles.cardDark]}>
          {plans.map((item) => {
            const isSelected = plan === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.planOption,
                  darkMode && styles.planOptionDark,
                  isSelected && styles.planOptionSelected,
                ]}
                onPress={() => setPlan(item.id)}
              >
                <View style={styles.planHeaderRow}>
                  <Text style={[styles.planName, darkMode && { color: '#f8fafc' }]}>{item.name}</Text>
                  <Text style={styles.planPrice}>{item.price}</Text>
                </View>
                <Text style={styles.planDesc}>{item.desc}</Text>
                {isSelected && (
                  <View style={styles.activeCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
                    <Text style={styles.activeCheckText}>Aktywny pakiet</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SEKCJA 3: MODUŁY FUNKCJONALNE (FEATURE TOGGLES) */}
        <Text style={styles.sectionTitle}>3. Aktywne Moduły w Aplikacji</Text>
        <View style={[styles.card, darkMode && styles.cardDark]}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>
                🧬 Zadania Domowe AI (MediaPipe) + Rozgrzewka
              </Text>
              <Text style={styles.toggleSub}>
                Skaner biomechaniczny kamery z obowiązkowym ekranem rozgrzewki i ewolucją Awatara.
              </Text>
            </View>
            <Switch
              value={features.enableAiTasks}
              onValueChange={() => toggleFeature('enableAiTasks')}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={features.enableAiTasks ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>
                ⌚ Apple Health / Google Health & Opaski GPS (Free)
              </Text>
              <Text style={styles.toggleSub}>
                Darmowa synchronizacja biegów, roweru, spacerów i kroków z czujników smartfona.
              </Text>
            </View>
            <Switch
              value={features.enableWearables}
              onValueChange={() => toggleFeature('enableWearables')}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={features.enableWearables ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>💳 Moduł Finansów i Składek</Text>
              <Text style={styles.toggleSub}>
                Wyłącz, jeśli płatnościami zajmuje się księgowość poza aplikacją.
              </Text>
            </View>
            <Switch
              value={features.enableFinances}
              onValueChange={() => toggleFeature('enableFinances')}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={features.enableFinances ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>🗓️ Terminarz i Kalendarz</Text>
              <Text style={styles.toggleSub}>
                Widoczność zakładki Terminarz w dolnym pasku nawigacji.
              </Text>
            </View>
            <Switch
              value={features.enableCalendar}
              onValueChange={() => toggleFeature('enableCalendar')}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={features.enableCalendar ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>👕 Sklep Klubowy i Sprzęt (122 cm – XL)</Text>
              <Text style={styles.toggleSub}>Zamawianie strojów, wybór rozmiarów przez rodziców i 1-klik raport dla trenera.</Text>
            </View>
            <Switch
              value={features.enableStore}
              onValueChange={() => toggleFeature('enableStore')}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={features.enableStore ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.toggleTitle, darkMode && { color: '#f8fafc' }]}>🌙 Tryb Ciemny (Dark Mode)</Text>
              <Text style={styles.toggleSub}>Ciemny motyw ekranu dla trenera i zawodników.</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={darkMode ? '#2563eb' : '#f1f5f9'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Wyloguj się z konta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerDark: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeStd: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  badgePro: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  planBadgeText: { fontSize: 11, fontWeight: '900', color: '#0f172a' },

  content: { padding: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  helperText: { fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 17 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardDark: { backgroundColor: '#1e293b', borderColor: '#334155' },

  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catFilterPillActive: { backgroundColor: '#2563eb' },
  catFilterText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: {
    flexGrow: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  sportChipDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  sportChipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb', borderWidth: 2 },
  sportEmoji: { fontSize: 20 },
  sportChipLabel: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  sportChipLabelActive: { color: '#1d4ed8' },

  planOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  planOptionDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
  planOptionSelected: { borderColor: '#2563eb', borderWidth: 2, backgroundColor: '#eff6ff' },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 },
  planName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flexShrink: 1, marginRight: 8 },
  planPrice: { fontSize: 12, fontWeight: '800', color: '#2563eb' },
  planDesc: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 17 },
  activeCheck: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  activeCheckText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, flexWrap: 'wrap', gap: 10 },
  toggleTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  toggleSub: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },

  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtnText: { color: '#dc2626', fontSize: 14, fontWeight: 'bold' },
});
