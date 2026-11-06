import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Dynamiczny, bezpieczny margines górny
const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type SportDiscipline = 'Piłka Nożna' | 'Siatkówka' | 'Tenis Ziemny' | 'Inne';

export default function UstawieniaScreen() {
  const router = useRouter();

  // Stany główne aplikacji (Dyscyplina)
  const [selectedSport, setSelectedSport] = useState<SportDiscipline>('Piłka Nożna');

  // Stany przełączników modułów (Feature Toggles)
  const [isFinanseEnabled, setIsFinanseEnabled] = useState<boolean>(true);
  const [isSklepEnabled, setIsSklepEnabled] = useState<boolean>(true);
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(true);
  const [isGrywalizacjaEnabled, setIsGrywalizacjaEnabled] = useState<boolean>(true);
  const [isMotorykaEnabled, setIsMotorykaEnabled] = useState<boolean>(true);

  const handleSaveSettings = () => {
    // Tutaj docelowo zapiszemy stan do bazy Supabase w tabeli "club_settings"
    Alert.alert(
      'Ustawienia Zapisane ⚙️',
      `Dyscyplina: ${selectedSport}\n\nWidoczność modułów została zaktualizowana i dostosowana do profilu Twojej akademii.`
    );
  };

  const getSportIcon = (sport: SportDiscipline) => {
    switch (sport) {
      case 'Piłka Nożna': return 'football-outline';
      case 'Siatkówka': return 'baseball-outline'; // Używamy baseball jako zastępstwa dla okrągłej piłki w darmowych ikonach
      case 'Tenis Ziemny': return 'tennisball-outline';
      default: return 'trophy-outline';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Ustawienia Platformy</Text>
          <Text style={styles.headerSubtitle}>Personalizacja i moduły</Text>
        </View>
        <Ionicons name="settings-outline" size={24} color="#64748b" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SEKCJA 1: DYSCYPLINA SPORTOWA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={18} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Profil Akademii (Dyscyplina)</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Wybierz główny sport. System dostosuje nazewnictwo (np. "Mecz" vs "Turniej") oraz pozycje zawodników na boisku.
          </Text>
          
          <View style={styles.sportChipsContainer}>
            {(['Piłka Nożna', 'Siatkówka', 'Tenis Ziemny', 'Inne'] as SportDiscipline[]).map(sport => (
              <TouchableOpacity
                key={sport}
                style={[styles.sportChip, selectedSport === sport && styles.sportChipActive]}
                onPress={() => setSelectedSport(sport)}
              >
                <Ionicons 
                  name={getSportIcon(sport)} 
                  size={16} 
                  color={selectedSport === sport ? '#fff' : '#64748b'} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.sportChipText, selectedSport === sport && styles.sportChipTextActive]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SEKCJA 2: MODUŁY FINANSOWE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={18} color="#16a34a" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Moduły Finansowe</Text>
          </View>
          <Text style={styles.sectionDesc}>Włącz lub wyłącz pobieranie opłat i widoczność salda dla rodziców.</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Składki Członkowskie i Finanse</Text>
              <Text style={styles.switchSubtext}>Generowanie miesięcznych opłat i zaległości.</Text>
            </View>
            <Switch
              value={isFinanseEnabled}
              onValueChange={setIsFinanseEnabled}
              trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
              thumbColor={isFinanseEnabled ? '#16a34a' : '#f1f5f9'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Sklep Klubowy i Asortyment</Text>
              <Text style={styles.switchSubtext}>Zarządzanie zamówieniami na dresy i sprzęt.</Text>
            </View>
            <Switch
              value={isSklepEnabled}
              onValueChange={setIsSklepEnabled}
              trackColor={{ false: '#cbd5e1', true: '#bbf7d0' }}
              thumbColor={isSklepEnabled ? '#16a34a' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* SEKCJA 3: ZAAWANSOWANE MODUŁY I AI */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color="#8b5cf6" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Funkcje Zaawansowane (Pro)</Text>
          </View>
          <Text style={styles.sectionDesc}>Zarządzaj dodatkowymi modułami wspierającymi trening i rywalizację.</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>AI Analiza Wideo (Biomechanika)</Text>
              <Text style={styles.switchSubtext}>Ewaluacja wideo techniki z udziałem sztucznej inteligencji.</Text>
            </View>
            <Switch
              value={isAiEnabled}
              onValueChange={setIsAiEnabled}
              trackColor={{ false: '#cbd5e1', true: '#ede9fe' }}
              thumbColor={isAiEnabled ? '#8b5cf6' : '#f1f5f9'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Grywalizacja i Zadania Domowe</Text>
              <Text style={styles.switchSubtext}>System punktów XP, wyzwania i publiczna tablica wyników.</Text>
            </View>
            <Switch
              value={isGrywalizacjaEnabled}
              onValueChange={setIsGrywalizacjaEnabled}
              trackColor={{ false: '#cbd5e1', true: '#ede9fe' }}
              thumbColor={isGrywalizacjaEnabled ? '#8b5cf6' : '#f1f5f9'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.switchLabel}>Centrum Motoryki (Testy)</Text>
              <Text style={styles.switchSubtext}>Zaawansowane pomiary motoryczne w Szatni.</Text>
            </View>
            <Switch
              value={isMotorykaEnabled}
              onValueChange={setIsMotorykaEnabled}
              trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
              thumbColor={isMotorykaEnabled ? '#2563eb' : '#f1f5f9'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
          <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>Zapisz Ustawienia Platformy</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b' },
  
  content: { flex: 1, padding: 16 },

  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  sectionDesc: { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 18 },

  sportChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sportChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  sportChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sportChipText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  sportChipTextActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 2 },
  switchSubtext: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },

  saveBtn: { backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});