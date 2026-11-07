import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

export default function AiVideoAnalysis() {
  const router = useRouter();
  const [status, setStatus] = useState<'wybor' | 'nagrywanie' | 'analiza' | 'raport'>('wybor');

  const handleStart = () => {
    setStatus('nagrywanie');
    // Symulacja nagrywania - po 3 sekundach koniec
    setTimeout(() => {
      setStatus('analiza');
      // Symulacja analizy AI - po kolejnych 3 sekundach raport
      setTimeout(() => {
        setStatus('raport');
      }, 3000);
    }, 3000);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Analiza AI (Beta)</Text>
      </View>

      <View style={styles.content}>
        {status === 'wybor' && (
          <View style={styles.box}>
            <Ionicons name="videocam-outline" size={64} color="#3b82f6" style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Text style={styles.title}>Nagraj ćwiczenie</Text>
            <Text style={styles.desc}>Moduł AI przeanalizuje szkielet 3D i postawę zawodnika podczas strzału lub dryblingu.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnText}>Rozpocznij Nagrywanie</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'nagrywanie' && (
          <View style={styles.cameraFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            <View style={styles.recIndicator}><View style={styles.recDot} /><Text style={styles.recText}>REC 00:02</Text></View>
            <Ionicons name="person" size={120} color="rgba(255,255,255,0.2)" />
            <Text style={styles.cameraHint}>Trzymaj telefon stabilnie...</Text>
          </View>
        )}

        {status === 'analiza' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.title, { marginTop: 20 }]}>Przetwarzanie AI...</Text>
            <Text style={styles.desc}>MediaPipe Pose Lite analizuje kąty stawów w 3D.</Text>
          </View>
        )}

        {status === 'raport' && (
          <View style={styles.reportBox}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>78</Text>
              <Text style={styles.scoreSub}>/100</Text>
            </View>
            <Text style={styles.title}>Raport Techniczny AI</Text>
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: 'bold', color: '#16a34a' }}>✓ Mocne strony:</Text>
              <Text style={styles.desc}>Płynny zamach nogi, dobre ułożenie stopy postawnej.</Text>
              <Text style={{ fontWeight: 'bold', color: '#dc2626', marginTop: 10 }}>✗ Do poprawy:</Text>
              <Text style={styles.desc}>Ciało zbytnio odchylone do tyłu w momencie kontaktu z piłką.</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={() => setStatus('wybor')}>
              <Text style={styles.startBtnText}>Zapisz i Nowa Analiza</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 16 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  
  box: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  startBtn: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: 'bold' },

  cameraFrame: { flex: 1, backgroundColor: '#000', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
  cornerTL: { position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerTR: { position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  cornerBL: { position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerBR: { position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  recIndicator: { position: 'absolute', top: 30, flexDirection: 'row', alignItems: 'center' },
  recDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', marginRight: 8 },
  recText: { color: '#fff', fontWeight: 'bold' },
  cameraHint: { position: 'absolute', bottom: 40, color: '#94a3b8', fontSize: 12 },

  reportBox: { backgroundColor: '#f8fafc', padding: 24, borderRadius: 16 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#3b82f6', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scoreNum: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  scoreSub: { fontSize: 10, color: '#64748b' }
});
