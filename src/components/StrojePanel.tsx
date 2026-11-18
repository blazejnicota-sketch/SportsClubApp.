import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayers } from './PlayersContext';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

export default function StrojePanel() {
  const { players } = usePlayers();
  
  const [imageUrl, setImageUrl] = useState('');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerSizes, setPlayerSizes] = useState<Record<string, string>>({});

  // DODANE: Funkcja otwierająca galerię w telefonie
  const pickImageFromGallery = async () => {
    // Prośba o uprawnienia (wymagane na nowszych Androidach i iOS)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Brak uprawnień', 'Musisz zezwolić na dostęp do galerii, aby dodać zdjęcie tabeli rozmiarów.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setActiveImage(result.assets[0].uri);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      Alert.alert('Błąd', 'Wklej link URL lub wybierz zdjęcie bezpośrednio z galerii.');
      return;
    }
    setActiveImage(imageUrl.trim());
    setImageUrl('');
  };

  const setSize = (size: string) => {
    if (!selectedPlayerId) return;
    setPlayerSizes(prev => ({ ...prev, [selectedPlayerId]: size }));
  };

  const suggestSizeBasedOnHeight = (height: number): string => {
    if (height <= 120) return '116';
    if (height <= 132) return '128';
    if (height <= 144) return '140';
    if (height <= 156) return '152';
    if (height <= 168) return '164';
    if (height <= 174) return 'S';
    if (height <= 180) return 'M';
    if (height <= 186) return 'L';
    if (height <= 192) return 'XL';
    return 'XXL';
  };

  const handleAutoFillSizes = () => {
    let filledCount = 0;
    const newSizes = { ...playerSizes };

    players.forEach(p => {
      if (!newSizes[p.id] && p.height && p.height > 0) {
        newSizes[p.id] = suggestSizeBasedOnHeight(p.height);
        filledCount++;
      }
    });

    if (filledCount > 0) {
      setPlayerSizes(newSizes);
      Alert.alert('Autouzupełnianie 🪄', `System wygenerował i dopasował rozmiarówki dla ${filledCount} zawodników na podstawie ich kart zdrowia!`);
    } else {
      Alert.alert('Informacja', 'Nie znaleziono nowych zawodników z wpisanym wzrostem, aby dopasować rozmiar.');
    }
  };

  const handleCopyReport = async () => {
    const totalOrdered = Object.keys(playerSizes).length;
    
    const sizeCounts: Record<string, number> = {};
    Object.values(playerSizes).forEach(sz => {
      sizeCounts[sz] = (sizeCounts[sz] || 0) + 1;
    });

    let report = `⚽ RAPORT ZAMÓWIENIA STROJÓW (Sprzęt)\nŁącznie zamówiono: ${totalOrdered} / ${players.length}\n\n👕 PODZIAŁ NA ROZMIARY DO HURTOWNI:\n`;
    Object.entries(sizeCounts).forEach(([sz, count]) => {
      report += `- Rozmiar ${sz}: ${count} szt.\n`;
    });

    report += `\n👤 SZCZEGÓŁY ZAWODNIKÓW (Nadruki):\n`;
    players.forEach(p => {
      if (playerSizes[p.id]) {
        report += `- #${p.number} ${p.firstName} ${p.lastName}: Rozmiar ${playerSizes[p.id]}\n`;
      }
    });

    report += `\n_Wygenerowano z aplikacji SportsClub Pro_`;

    await Clipboard.setStringAsync(report);
    Alert.alert('Skopiowano raport! 📋', 'Podsumowanie zamówienia zostało skopiowane do schowka.');
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wizualizacja i Tabela Rozmiarów</Text>
        
        {/* ZMIENIONY UKŁAD: Pole na link URL + Przycisk do galerii */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="Link z internetu..."
            value={imageUrl}
            onChangeText={setImageUrl}
          />
          <TouchableOpacity style={styles.addUrlBtn} onPress={handleAddImageUrl}>
            <Text style={styles.addUrlBtnText}>Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickImageFromGallery}>
            <Ionicons name="image-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.galleryBtnText}>Z Galerii</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imagePreviewBox}>
          {activeImage ? (
            <Image source={{ uri: activeImage }} style={styles.previewImg} resizeMode="contain" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="shirt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.imagePreviewText}>Wklej link URL lub dodaj zdjęcie z telefonu</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={styles.sectionTitle}>Wybierz zawodnika:</Text>
        <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFillSizes}>
          <Ionicons name="flash" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={styles.autoFillBtnText}>Autouzupełnianie AI</Text>
        </TouchableOpacity>
      </View>

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
                {hasSize ? '✓ ' : ''}#{p.number} - {p.firstName} {p.lastName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedPlayer && (
        <View style={styles.sizeSection}>
          <View style={styles.sizeHeaderRow}>
            <View>
              <Text style={styles.sizeTitle}>Koszulka dla: {selectedPlayer.firstName} {selectedPlayer.lastName}</Text>
              <Text style={styles.sizeSub}>
                Aktualnie wybrany rozmiar: <Text style={{fontWeight: 'bold', color: '#2563eb'}}>{playerSizes[selectedPlayer.id] || 'Brak'}</Text>
              </Text>
            </View>
            <View style={styles.playerHeightBadge}>
              <Text style={styles.playerHeightLabel}>Wzrost</Text>
              <Text style={styles.playerHeightValue}>{selectedPlayer.height ? `${selectedPlayer.height} cm` : '---'}</Text>
            </View>
          </View>
          
          <View style={styles.sizeGrid}>
            {['116', '128', '140', '152', '164', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
               const isSuggested = !!selectedPlayer.height && selectedPlayer.height > 0 && suggestSizeBasedOnHeight(selectedPlayer.height) === sz && !playerSizes[selectedPlayer.id];
               const isActive = playerSizes[selectedPlayer.id] === sz;

               return (
                <TouchableOpacity 
                  key={sz} 
                  style={[
                    styles.sizeBtn, 
                    isActive && styles.sizeBtnActive,
                    isSuggested ? styles.sizeBtnSuggested : null
                  ]}
                  onPress={() => setSize(sz)}
                >
                  <Text style={[
                    styles.sizeBtnText, 
                    isActive && styles.sizeBtnTextActive,
                    isSuggested ? styles.sizeBtnTextSuggested : null
                  ]}>{sz}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          
          {!!selectedPlayer.height && selectedPlayer.height > 0 && !playerSizes[selectedPlayer.id] && (
            <Text style={styles.suggestionText}>
              <Ionicons name="bulb-outline" size={12} color="#d97706" /> Sugerowany rozmiar na bazie karty zawodnika (Wzrost: {selectedPlayer.height} cm)
            </Text>
          )}
        </View>
      )}

      <View style={styles.reportSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="document-text-outline" size={20} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Raport Trenera – Podsumowanie</Text>
        </View>
        <Text style={styles.reportSub}>Łącznie przypisano rozmiarów: {Object.keys(playerSizes).length} / {players.length}</Text>
        
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyReport}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.copyBtnText}>Skopiuj listę do Hurtowni / Grupy</Text>
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
  inputRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  urlInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, fontSize: 11 },
  addUrlBtn: { backgroundColor: '#475569', paddingHorizontal: 10, justifyContent: 'center', borderRadius: 8 },
  addUrlBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  galleryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  galleryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  imagePreviewBox: { height: 160, backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePreviewText: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  previewImg: { width: '100%', height: '100%' },
  
  autoFillBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fde68a' },
  autoFillBtnText: { fontSize: 11, fontWeight: 'bold', color: '#d97706' },

  playerScroll: { flexDirection: 'row', marginBottom: 16, maxHeight: 40 },
  playerChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8, justifyContent: 'center' },
  playerChipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  playerChipDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  playerChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  playerChipTextActive: { color: '#2563eb', fontWeight: 'bold' },

  sizeSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sizeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sizeTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  sizeSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  playerHeightBadge: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  playerHeightLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  playerHeightValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },

  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeBtn: { width: '22%', aspectRatio: 2, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  sizeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sizeBtnSuggested: { backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 2 },
  sizeBtnText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  sizeBtnTextActive: { color: '#fff' },
  sizeBtnTextSuggested: { color: '#d97706' },
  
  suggestionText: { fontSize: 11, color: '#d97706', marginTop: 12, fontStyle: 'italic' },

  reportSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  reportSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  copyBtn: { backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 8 },
  copyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});