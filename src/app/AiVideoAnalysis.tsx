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
    setTimeout(() => {
      setStatus('analiza');
      setTimeout(() => { setStatus('raport'); }, 3500);
    }, 4000);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>MediaPipe AI Vision</Text>
      </View>

      <View style={styles.content}>
        {status === 'wybor' && (
          <View style={styles.box}>
            <View style={styles.iconCircle}>
              <Ionicons name="scan-outline" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Silnik AI Pose Lite</Text>
            <Text style={styles.desc}>Uruchom kamerę, aby sztuczna inteligencja przeanalizowała sylwetkę 3D zawodnika, ułożenie stóp i dynamikę strzału w czasie rzeczywistym.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.startBtnText}>Uruchom Skaner Kamery</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'nagrywanie' && (
          <View style={styles.cameraFrame}>
            {/* Elementy siatki i UI kamery */}
            <View style={styles.gridLineH} />
            <View style={styles.gridLineV} />
            <View style={styles.cornerTL} /><View style={styles.cornerTR} />
            <View style={styles.cornerBL} /><View style={styles.cornerBR} />
            
            <View style={styles.recIndicator}>
              <View style={styles.recDot} /><Text style={styles.recText}>REC 00:03</Text>
            </View>
            
            <Ionicons name="body-outline" size={160} color="rgba(59, 130, 246, 0.4)" style={styles.bodyWireframe} />
            
            <View style={styles.cameraHintBox}>
              <Ionicons name="warning" size={16} color="#eab308" />
              <Text style={styles.cameraHint}>Utrzymaj całą sylwetkę gracza w kadrze...</Text>
            </View>
          </View>
        )}

        {status === 'analiza' && (
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#3b82f6" style={{ transform: [{ scale: 1.5 }] }} />
            <Text style={[styles.title, { marginTop: 32 }]}>Ekstrakcja Wektorów 3D</Text>
            <Text style={styles.desc}>Przetwarzanie 33 punktów orientacyjnych szkieletu i generowanie modelu biomechanicznego...</Text>
          </View>
        )}

        {status === 'raport' && (
          <View style={styles.reportBox}>
            <View style={styles.scoreHeader}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>82</Text>
                <Text style={styles.scoreSub}>/100</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 20 }}>
                <Text style={styles.title}>Raport Techniki</Text>
                <Text style={styles.scoreVerdict}>Bardzo dobra mechanika</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.reportItem}>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.reportItemTitle}>Balans Ciała</Text>
                <Text style={styles.descSmall}>Środek ciężkości idealnie obniżony przed strzałem.</Text>
              </View>
            </View>
            
            <View style={styles.reportItem}>
              <Ionicons name="close-circle" size={24} color="#dc2626" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.reportItemTitle}>Kąt Nogi Postawnej</Text>
                <Text style={styles.descSmall}>Stopa postawna odchylona o 15° za bardzo na zewnątrz, co powoduje utratę precyzji.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setStatus('wybor')}>
              <Text style={styles.startBtnText}>Zapisz w kartotece gracza</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  
  box: { backgroundColor: '#0f172a', padding: 32, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#3b82f6' },
  title: { fontSize: 22, fontWeight: '900', color: '#f8fafc', marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32, lineHeight: 22, fontWeight: '500' },
  startBtn: { flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  cameraFrame: { flex: 1, backgroundColor: '#000', borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  gridLineH: { position: 'absolute', top: '50%', width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  gridLineV: { position: 'absolute', left: '50%', height: '100%', width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  cornerTL: { position: 'absolute', top: 30, left: 30, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#3b82f6', borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 30, right: 30, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#3b82f6', borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 30, left: 30, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#3b82f6', borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 30, right: 30, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#3b82f6', borderRadius: 4 },
  recIndicator: { position: 'absolute', top: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 8 },
  recText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  bodyWireframe: { position: 'absolute' },
  cameraHintBox: { position: 'absolute', bottom: 50, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  cameraHint: { color: '#facc15', fontSize: 13, fontWeight: '700', marginLeft: 8 },

  reportBox: { backgroundColor: '#0f172a', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#1e293b' },
  scoreHeader: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 6, borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' },
  scoreNum: { fontSize: 32, fontWeight: '900', color: '#fff' },
  scoreSub: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  scoreVerdict: { color: '#16a34a', fontWeight: '800', fontSize: 14, marginTop: 4, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 24 },
  reportItem: { flexDirection: 'row', marginBottom: 20 },
  reportItemTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  descSmall: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 }
});
