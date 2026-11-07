import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 🔴 TUTAJ WKLEISZ SWOJE KLUCZE W NASTĘPNYM KROKU 🔴
const supabaseUrl = 'TUTAJ_WKLEJ_URL_Z_SUPABASE';
const supabaseAnonKey = 'TUTAJ_WKLEJ_KLUCZ_ANON_Z_SUPABASE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
