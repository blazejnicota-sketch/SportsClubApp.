import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from './notificationService';

export default function UstawieniaScreen() {
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [coachMode, setCoachMode] = useState<boolean>(true);

  const handleTogglePush = (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      notificationService.requestPermissions().then((token) => {
        if (token) {
          Alert.alert('Sukces 🔔', 'Powiadomienia Push zostały aktywowane dla tego urządzenia.');
        }
      });
    } else {
      Alert.alert('Powiadomienia', 'Powiadomienia zostały wyłączone.');
    }
  };

  const handleTestNotification = async () => {
    await notificationService.sendLocalAlert(
      'Test Akademii ⚽',
      'To jest testowe powiadomienie z systemu zarządzania klubem.'
    );
  };

  return (
    <View style={styles.container}>
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ustawienia Akademii ⚙️</Text>
        <Text style={styles.headerSubtitle}>Zarządzanie aplikacją, powiadomieniami i profilem</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SEKCJA: PROFIL KLUBU */}
        <Text style={styles.sectionTitle}>Profil i Organizacja</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-outline" size={18} color="#2563eb" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Nazwa Akademii</Text>
              <Text style={styles.itemSub}>Sports Club Academy Management</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Ionicons name="mail-outline" size={18} color="#2563eb" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Kontakt / Administrator</Text>
              <Text style={styles.itemSub}>blazejnicota@gmail.com</Text>
            </View>
          </View>
        </View>

        {/* SEKCJA: PREFERENCJE I POWIADOMIENIA */}
        <Text style={styles.sectionTitle}>Powiadomienia i Komunikacja</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications-outline" size={18} color="#2563eb" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Powiadomienia Push</Text>
              <Text style={styles.itemSub}>Otrzymuj alerty o meczach i zadaniach</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={pushEnabled ? '#2563eb' : '#f1f5f9'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.rowItem} onPress={handleTestNotification}>
            <View style={styles.iconBox}>
              <Ionicons name="paper-plane-outline" size={18} color="#16a34a" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Wyślij testowe powiadomienie</Text>
              <Text style={styles.itemSub}>Sprawdź, czy telefon poprawnie odbiera alerty</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* SEKCJA: TRYBY APLIKACJI */}
        <Text style={styles.sectionTitle}>Tryb Użytkowania</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={18} color="#2563eb" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.itemTitle}>Tryb Trenera / Zarządu</Text>
              <Text style={styles.itemSub}>Pełny dostęp do ewidencji i raportów</Text>
            </View>
            <Switch
              value={coachMode}
              onValueChange={setCoachMode}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={coachMode ? '#2563eb' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* INFORMACJE O WERSJI */}
        <View style={styles.versionBox}>
          <Text style={styles.versionText}>Sports Club App v2.4.0 (Expo + Supabase)</Text>
          <Text style={styles.versionSub}>Wszystkie moduły zintegrowane i aktywne</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { padding: 16 },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 8, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  itemSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  versionBox: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 12,
  },
  versionText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  versionSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});