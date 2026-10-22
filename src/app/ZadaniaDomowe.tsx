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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeTask {
  id: string;
  title: string;
  category: 'Technika' | 'Motoryka' | 'Teoria / Wideo' | 'Regeneracja';
  dueDate: string;
  assignedTeam: string;
  description: string;
  completed: boolean;
  verified: boolean;
}

export default function ZadaniaDomoweScreen() {
  const [tasks, setTasks] = useState<HomeTask[]>([
    {
      id: '1',
      title: '300 podań o ścianę (lewa / prawa noga)',
      category: 'Technika',
      dueDate: '2026-10-25',
      assignedTeam: 'Młodzik A1',
      description: 'Zwróć uwagę na przyjęcie kierunkowe i czyste uderzenie wewnętrzną częścią stopy.',
      completed: false,
      verified: false,
    },
    {
      id: '2',
      title: '15 minut rolowania i mobilności stawów',
      category: 'Regeneracja',
      dueDate: '2026-10-26',
      assignedTeam: 'Młodzik A1',
      description: 'Skup się na mięśniach dwugłowych i łydkach po ostatnim meczu ligowym.',
      completed: true,
      verified: true,
    },
    {
      id: '3',
      title: 'Analiza wideo: pressing w 1 połowie',
      category: 'Teoria / Wideo',
      dueDate: '2026-10-27',
      assignedTeam: 'Młodzik A1',
      description: 'Obejrzyj udostępniony klip z meczu i zwróć uwagę na zachowanie drugiej linii.',
      completed: false,
      verified: false,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HomeTask['category']>('Technika');
  const [newDueDate, setNewDueDate] = useState('2026-10-30');
  const [newDescription, setNewDescription] = useState('');

  const handleAddTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('Błąd', 'Wpisz tytuł zadania.');
      return;
    }

    const task: HomeTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      category: newCategory,
      dueDate: newDueDate,
      assignedTeam: 'Młodzik A1',
      description: newDescription.trim() || 'Brak dodatkowych uwag.',
      completed: false,
      verified: false,
    };

    setTasks([task, ...tasks]);
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const toggleTaskVerified = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, verified: !t.verified } : t))
    );
  };

  const getCategoryColor = (cat: HomeTask['category']) => {
    switch (cat) {
      case 'Technika':
        return '#2563eb';
      case 'Motoryka':
        return '#d97706';
      case 'Teoria / Wideo':
        return '#7c3aed';
      case 'Regeneracja':
        return '#10b981';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Zadania Domowe</Text>
          <Text style={styles.headerSubtitle}>Indywidualny rozwój zawodników</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Nowe Zadanie</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tasks.map((item) => (
          <View key={item.id} style={styles.taskCard}>
            <View style={styles.taskHeaderRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(item.category) },
                ]}
              >
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              <Text style={styles.dueDateText}>Termin: {item.dueDate}</Text>
            </View>

            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDesc}>{item.description}</Text>

            <View style={styles.actionRow}>
              {/* Przycisk dla zawodnika: Odhaczenie wykonania */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  item.completed ? styles.btnSuccess : styles.btnOutline,
                ]}
                onPress={() => toggleTaskComplete(item.id)}
              >
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={item.completed ? '#fff' : '#4b5563'}
                />
                <Text
                  style={[
                    styles.statusBtnText,
                    item.completed && styles.statusBtnTextActive,
                  ]}
                >
                  {item.completed ? 'Wykonane' : 'Do zrobienia'}
                </Text>
              </TouchableOpacity>

              {/* Status weryfikacji przez trenera */}
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  item.verified && styles.verifyBtnActive,
                ]}
                onPress={() => toggleTaskVerified(item.id)}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={16}
                  color={item.verified ? '#fff' : '#1d4ed8'}
                />
                <Text
                  style={[
                    styles.verifyBtnText,
                    item.verified && styles.verifyBtnTextActive,
                  ]}
                >
                  {item.verified ? 'Zatwierdzone' : 'Zatwierdź'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL DODAWANIA ZADANIA */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Zleć zadanie domowe</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tytuł zadania *</Text>
            <TextInput
              style={styles.input}
              placeholder="np. 50 uderzeń prostym podbiciem"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Kategoria</Text>
            <View style={styles.categorySelector}>
              {(['Technika', 'Motoryka', 'Teoria / Wideo', 'Regeneracja'] as const).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catSelectBtn,
                      newCategory === cat && {
                        backgroundColor: getCategoryColor(cat),
                      },
                    ]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        newCategory === cat && { color: '#fff' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.inputLabel}>Termin wykonania (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={newDueDate}
              onChangeText={setNewDueDate}
            />

            <Text style={styles.inputLabel}>Opis / Wytyczne</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Dodatkowe wskazówki dla zawodnika..."
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddTask}>
              <Text style={styles.saveBtnText}>Dodaj Zadanie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  content: { flex: 1, padding: 16 },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dueDateText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  taskDesc: { fontSize: 13, color: '#4b5563', marginBottom: 12 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  btnSuccess: { backgroundColor: '#10b981', borderColor: '#10b981' },
  btnOutline: { backgroundColor: '#f9fafb' },
  statusBtnText: { fontSize: 11, fontWeight: '600', color: '#4b5563', marginLeft: 4 },
  statusBtnTextActive: { color: '#fff' },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    flex: 1,
    marginLeft: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  verifyBtnActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  verifyBtnText: { fontSize: 11, fontWeight: '600', color: '#1d4ed8', marginLeft: 4 },
  verifyBtnTextActive: { color: '#fff' },
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  categorySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catSelectBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  catSelectText: { fontSize: 10, fontWeight: 'bold', color: '#4b5563' },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});