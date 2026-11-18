import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { supabase } from '../services/supabase';

// Importy widoków
import PanelTrenera from './PanelTrenera';
import RodzicPanel from './RodzicPanel';
import ZawodnikPanel from './ZawodnikPanel';
import ParentLinkScreen from './ParentLinkScreen';
import Auth from './Auth';

export default function AppRouter() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'trener' | 'rodzic' | 'zawodnik' | null>(null);
  const [isLinked, setIsLinked] = useState<boolean>(true);

  useEffect(() => {
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        determineUserRoleAndLink(currentSession.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUserSession = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;

      setSession(currentSession);
      if (currentSession) {
        await determineUserRoleAndLink(currentSession.user);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.log('Błąd sesji:', err);
      setLoading(false);
    }
  };

  const determineUserRoleAndLink = async (user: any) => {
    try {
      // Odczyt roli z metadanych Supabase
      const role = user.user_metadata?.role || 'trener'; 
      setUserRole(role);

      if (role === 'trener') {
        setIsLinked(true);
      } else {
        // Weryfikacja czy rodzic/zawodnik wpisał już kod zaproszenia
        const { data: playerRecord } = await supabase
          .from('players')
          .select('id')
          .or(`parent_id.eq.${user.id},user_id.eq.${user.id}`)
          .maybeSingle();

        setIsLinked(!!playerRecord);
      }
    } catch (err) {
      console.log('Błąd weryfikacji:', err);
      setIsLinked(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Ładowanie SportsClub Pro...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Witaj w SportsClub Pro ⚽</Text>
        <Text style={styles.subtitle}>Zaloguj się, aby kontynuować.</Text>
        <Auth /> 
      </SafeAreaView>
    );
  }

  if (userRole === 'trener') return <PanelTrenera />;
  
  if (!isLinked) return <ParentLinkScreen onLinkedSuccess={() => setIsLinked(true)} />;
  
  if (userRole === 'rodzic') return <RodzicPanel />;
  
  return <ZawodnikPanel />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 },
});