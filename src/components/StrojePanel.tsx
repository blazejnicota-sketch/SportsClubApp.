import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from './PlayersContext';
import * as Clipboard from 'expo-clipboard';

export default function StrojePanel() {
  const { players } = usePlayers();
  
  const [imageUrl, setImageUrl] = useState('');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerSizes, setPlayerSizes] = useState<Record<string, string>>({});

  const handleAddImage = () => {
    // Usunięto rygorystyczną walidację, która psuła działanie w wideo. 
    // Teraz przyjmuje każdy link, chyba że jest zupełnie pusty.
    if (!imageUrl.trim()) {
      Alert.alert('Błąd', 'Wklej jakikolwiek link URL do grafiki.');
      return;
    }
    setActiveImage(imageUrl.trim());
    setImageUrl('');
  };

  const setSize = (size: string) => {
    if (!selectedPlayerId) return;
    setPlayerSizes(prev => ({ ...prev, [selectedPlayerId]: size }));
  };

  const handleCopyReport = async () => {
    const totalOrdered = Object.keys(playerSizes).length;
    
    const sizeCounts: Record<string, number> = {};
    Object.values(playerSizes).forEach(sz => {
      sizeCounts[sz] = (sizeCounts[sz] || 0) + 1;
    });

    let report = `⚽ RAPORT ZAMÓWIENIA STROJÓW\nŁącznie zamówiono: ${totalOrdered} / ${players.length}\n\nPodział na rozmiary:\n`;
    Object.entries(sizeCounts).forEach(([sz, count]) => {
      report += `- Rozmiar ${sz}: ${count} szt.\n`;
    });

    report += `\nSzczegóły zawodników:\n`;
    players.forEach(p => {
      if (playerSizes[p.id]) {
        report += `- ${p.firstName} ${p.lastName}: ${playerSizes[p.id]}\n`;
      }
    });

    await Clipboard.setStringAsync(report);
    Alert.alert('Skopiowano raport! 📋', 'Podsumowanie zamówienia zostało skopiowane do schowka.');
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wizualizacja i Tabela Rozmiarów</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="Wklej link do grafiki (np. z hurtowni)"
            value={imageUrl}
            onChangeText={setImageUrl}
          />
          <TouchableOpacity style={styles.addUrlBtn} onPress={handleAddImage}>
            <Text style={styles.addUrlBtnText}>Dodaj</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imagePreviewBox}>
          {activeImage ? (
            <Image source={{ uri: activeImage }} style={styles.previewImg} resizeMode="contain" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="shirt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.imagePreviewText}>Brak dodanej tabeli rozmiarów</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Wybierz zawodnika, aby wskazać rozmiar:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerScroll}>
        {players.map(p => {
          const hasSize = !!playerSizes[p.id];
          return (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.playerChip, selectedPlayerId === p.id && styles.playerChipActive, hasSize && styles.playerChipDone]}
              onPress={() => setSelectedPlayerId(p.id)}
            >
              <Text style={[styles.playerChipText, selectedPlayerId === p.id && styles.playerChipTextActive, hasSize && { color: '#16a34a' }]}>
                {hasSize ? '✓ ' : ''}# - {p.firstName} {p.lastName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedPlayer && (
        <View style={styles.sizeSection}>
          <Text style={styles.sizeTitle}>Rozmiar koszulki dla: {selectedPlayer.firstName} {selectedPlayer.lastName}</Text>
          <Text style={styles.sizeSub}>Aktualnie wybrany: <Text style={{fontWeight: 'bold', color: '#2563eb'}}>{playerSizes[selectedPlayer.id] || 'Brak'}</Text></Text>
          
          <View style={styles.sizeGrid}>
            {['116', '128', '140', '152', '164', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => (
              <TouchableOpacity 
                key={sz} 
                style={[styles.sizeBtn, playerSizes[selectedPlayer.id] === sz && styles.sizeBtnActive]}
                onPress={() => setSize(sz)}
              >
                <Text style={[styles.sizeBtnText, playerSizes[selectedPlayer.id] === sz && styles.sizeBtnTextActive]}>{sz}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.reportSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="document-text-outline" size={20} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Raport Trenera – Podsumowanie</Text>
        </View>
        <Text style={styles.reportSub}>Łącznie przypisano rozmiarów: {Object.keys(playerSizes).length} / {players.length}</Text>
        
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyReport}>
          <Ionicons name="copy-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.copyBtnText}>Skopiuj raport dla hurtowni / na grupę</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  urlInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, fontSize: 12 },
  addUrlBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  addUrlBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  imagePreviewBox: { height: 160, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePreviewText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  previewImg: { width: '100%', height: '100%' },
  
  playerScroll: { flexDirection: 'row', marginBottom: 16 },
  playerChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  playerChipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  playerChipDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  playerChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  playerChipTextActive: { color: '#2563eb', fontWeight: 'bold' },

  sizeSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sizeTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  sizeSub: { fontSize: 12, color: '#64748b', marginBottom: 16, marginTop: 2 },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBtn: { width: '22%', aspectRatio: 2, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  sizeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sizeBtnText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  sizeBtnTextActive: { color: '#fff' },

  reportSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  reportSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  copyBtn: { backgroundColor: '#16a34a', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 8 },
  copyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
