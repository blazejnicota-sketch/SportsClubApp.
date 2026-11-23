import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import {
  useClubSettings,
  SportDiscipline,
  SportCategory,
} from '../components/ClubSettingsContext';
import { usePlayers, HomeworkPrescription } from '../components/PlayersContext';
import MediaPipePoseScanner from '../components/MediaPipePoseScanner';

const SAFE_TOP_PADDING = Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : 50;

type ModuleCategory =
  | 'Wszystkie'
  | 'Skocznościowe'
  | 'Plyometryczne'
  | 'Siłowe'
  | 'Rozciągające'
  | 'Stabilizujące'
  | 'Zwinność i koordynacja'
  | 'Rozgrzewka i aktywacja';

export type DifficultyLevel = 'Początkujący' | 'Średniozaawansowany' | 'Zaawansowany';

interface VaultExercise {
  id: string;
  title: string;
  drillType: string;
  module: Exclude<ModuleCategory, 'Wszystkie'>;
  difficulty: DifficultyLevel;
  defaultSets: number;
  defaultRepsOrSec: number;
  unit: 'powt.' | 'sek.';
  defaultRestSec: number;
  xpPerSet: number;
  recommendedSports: SportDiscipline[];
  description: string;
}

export type SingleExerciseModuleKey =
  | 'Wszystkie'
  | 'Skocznościowe'
  | 'Plyometryczne'
  | 'Siłowe'
  | 'Rozciągające'
  | 'Stabilizujące'
  | 'Zwinność i koordynacja'
  | 'Rozgrzewka i aktywacja';

const FULL_70_SINGLE_EXERCISES: VaultExercise[] = [
  // 1. Ćwiczenia skocznościowe (10)
  { id: 'sk-1', difficulty: 'Początkujący', title: 'Wyskoki dosiężne w górę', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'volleyball', 'basketball'], description: 'Miękkie zejście do półprzysiadu i dynamiczny wyskok w górę z wyprostowaniem ramion.' },
  { id: 'sk-2', difficulty: 'Średniozaawansowany', title: 'Wyskoki z przysiadu (Squat Jump)', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'volleyball'], description: 'Start z pozycji zatrzymanego przysiadu, bez fazy zamachu w dół.' },
  { id: 'sk-3', difficulty: 'Średniozaawansowany', title: 'Wyskoki do główki / bloku', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'volleyball', 'basketball'], description: 'Wybicie w górę z lekkim odchyleniem tułowia i kontrolą lądowania na przedniej części stopy.' },
  { id: 'sk-4', difficulty: 'Zaawansowany', title: 'Wyskoki na jednej nodze (prawa / lewa)', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'basketball', 'handball'], description: 'Badanie i wyrównywanie mocy oraz równowagi między stronami.' },
  { id: 'sk-5', difficulty: 'Zaawansowany', title: 'Wyskoki z półobrotem (90° / 180°)', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'basketball', 'handball'], description: 'Kontrola osi kolan i bioder podczas rotacji w powietrzu.' },
  { id: 'sk-6', difficulty: 'Średniozaawansowany', title: 'Wyskoki w przód z zatrzymaniem lądowania', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 35, xpPerSet: 35, recommendedSports: ['football', 'handball'], description: 'Nacisk na amortyzację i „przyklejenie” lądowania bez koślawienia kolan.' },
  { id: 'sk-7', difficulty: 'Zaawansowany', title: 'Wyskoki w tył z asekuracją', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 2, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 35, xpPerSet: 35, recommendedSports: ['football', 'volleyball'], description: 'Mniejsza objętość, nauka orientacji przestrzennej i miękkiego lądowania.' },
  { id: 'sk-8', difficulty: 'Zaawansowany', title: 'Wyskoki kolanami do klatki piersiowej (Tuck Jump)', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'volleyball', 'basketball'], description: 'Dynamiczne podciągnięcie kolan w górę z zachowaniem pionowego tułowia.' },
  { id: 'sk-9', difficulty: 'Zaawansowany', title: 'Wyskoki z wykroku (Split Squat Jump)', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'basketball', 'handball'], description: 'Naprzemienna praca nóg w pozycji wykrocznej.' },
  { id: 'sk-10', difficulty: 'Średniozaawansowany', title: 'Wyskoki na niski stopień / pachołek', drillType: 'jump_squat', module: 'Skocznościowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'volleyball'], description: 'Wejście dynamiczne na podwyższenie z pełnym wyprostem biodra na górze.' },

  // 2. Ćwiczenia plyometryczne (10)
  { id: 'pl-1', difficulty: 'Początkujący', title: 'Szybkie odbicia w miejscu (Pogo Jumps)', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 15, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'running', 'basketball'], description: 'Sztywne kostki, minimalny czas kontaktu z podłożem, praca głównie łydką i ścięgnem Achillesa.' },
  { id: 'pl-2', difficulty: 'Zaawansowany', title: 'Szybkie odbicia na jednej nodze (Single-Leg Pogo)', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'running'], description: 'Reaktywność i sztywność stawu skokowego w wersji jednostronnej.' },
  { id: 'pl-3', difficulty: 'Średniozaawansowany', title: 'Przeskoki boczne typu „łyżwiarz” (Skater Jumps)', drillType: 'agility_skater', module: 'Plyometryczne', defaultSets: 4, defaultRepsOrSec: 16, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'handball', 'tennis'], description: 'Dynamiczne przeskoki w bok z wyhamowaniem na jednej nodze.' },
  { id: 'pl-4', difficulty: 'Zaawansowany', title: 'Drop Jump z niskiego podwyższenia', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 45, xpPerSet: 45, recommendedSports: ['football', 'volleyball', 'basketball'], description: 'Zejście z niskiego stopnia i natychmiastowy wyskok w górę z naciskiem na miękkie lądowanie.' },
  { id: 'pl-5', difficulty: 'Średniozaawansowany', title: 'Przeskoki przez niskie płotki / linie w przód', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'running'], description: 'Seria szybkich, rytmicznych przeskoków z utrzymaniem tempa.' },
  { id: 'pl-6', difficulty: 'Średniozaawansowany', title: 'Przeskoki przez niskie płotki bokiem', drillType: 'agility_skater', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'handball'], description: 'Praca bioder i przywodzicieli/odwodzicieli w płaszczyźnie czołowej.' },
  { id: 'pl-7', difficulty: 'Średniozaawansowany', title: 'Skoki obunóż zygzakiem', drillType: 'agility_skater', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 35, recommendedSports: ['football', 'basketball'], description: 'Dynamiczna zmiana kierunku z zachowaniem równowagi.' },
  { id: 'pl-8', difficulty: 'Zaawansowany', title: 'Naprzemienne „nożyce” w wyskoku', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'volleyball'], description: 'Szybka zmiana nóg w powietrzu przy zachowaniu stabilnego centrum.' },
  { id: 'pl-9', difficulty: 'Średniozaawansowany', title: 'Wyskok z szybkim zejściem do półprzysiadu (Snap-Down)', drillType: 'squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'basketball', 'volleyball'], description: 'Błyskawiczne przyjęcie pozycji amortyzującej po lądowaniu.' },
  { id: 'pl-10', difficulty: 'Zaawansowany', title: 'Skoki wieloskokowe w dal (Bounding)', drillType: 'jump_squat', module: 'Plyometryczne', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 40, xpPerSet: 40, recommendedSports: ['football', 'running'], description: 'Długie, sprężyste kroki bieżne z mocnym odepchnięciem.' },

  // 3. Ćwiczenia siłowe (10)
  { id: 'si-1', difficulty: 'Początkujący', title: 'Przysiady klasyczne', drillType: 'squat', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 15, unit: 'powt.', defaultRestSec: 35, xpPerSet: 30, recommendedSports: ['football', 'gym', 'volleyball'], description: 'Kontrola głębokości, neutralnych pleców i toru kolan.' },
  { id: 'si-2', difficulty: 'Średniozaawansowany', title: 'Przysiady bułgarskie (tylna noga na podwyższeniu)', drillType: 'squat', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 40, xpPerSet: 40, recommendedSports: ['football', 'gym', 'running'], description: 'Budowanie siły jednostronnej i stabilności biodra.' },
  { id: 'si-3', difficulty: 'Średniozaawansowany', title: 'Wykroki w przód', drillType: 'squat', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 30, xpPerSet: 30, recommendedSports: ['football', 'running'], description: 'Krok w przód, zejście biodrami w dół i powrót do pozycji wyjściowej.' },
  { id: 'si-4', difficulty: 'Średniozaawansowany', title: 'Wykroki w tył (Reverse Lunges)', drillType: 'squat', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 30, xpPerSet: 30, recommendedSports: ['football', 'running', 'handball'], description: 'Bardziej odciążające dla kolan, świetne do nauki kontroli tułowia.' },
  { id: 'si-5', difficulty: 'Średniozaawansowany', title: 'Pompki klasyczne', drillType: 'pushups', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 15, unit: 'powt.', defaultRestSec: 40, xpPerSet: 35, recommendedSports: ['football', 'gym', 'martial_arts', 'handball'], description: 'Praca ramion i klatki piersiowej z utrzymaniem prostej linii ciała.' },
  { id: 'si-6', difficulty: 'Zaawansowany', title: 'Pompki w wąskim chwycie (tricepsowe)', drillType: 'pushups', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 40, xpPerSet: 35, recommendedSports: ['gym', 'martial_arts'], description: 'Większy akcent na prostowniki łokcia i stabilizację barków.' },
  { id: 'si-7', difficulty: 'Zaawansowany', title: 'Pompki z rotacją tułowia (T-Pushup)', drillType: 'pushups', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 40, xpPerSet: 40, recommendedSports: ['football', 'gym', 'handball'], description: 'Siła górnej części ciała połączona z kontrolą antyrotacyjną.' },
  { id: 'si-8', difficulty: 'Początkujący', title: 'Wznosy bioder w leżeniu tyłem (Glute Bridge)', drillType: 'plank', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 15, unit: 'powt.', defaultRestSec: 30, xpPerSet: 30, recommendedSports: ['football', 'running', 'cycling'], description: 'Aktywacja pośladków i prostowników biodra.' },
  { id: 'si-9', difficulty: 'Średniozaawansowany', title: 'Wznosy bioder na jednej nodze', drillType: 'plank', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'running'], description: 'Wyrównywanie siły pośladków i tylnej taśmy.' },
  { id: 'si-10', difficulty: 'Początkujący', title: 'Wspięcia na palce (stojąc / na jednej nodze)', drillType: 'squat', module: 'Siłowe', defaultSets: 3, defaultRepsOrSec: 20, unit: 'powt.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'running', 'basketball'], description: 'Wzmocnienie mięśni łydki i stabilizacji stawu skokowego.' },

  // 4. Ćwiczenia rozciągające (10)
  { id: 'ro-1', difficulty: 'Początkujący', title: 'Skłon w przód do stóp (mięśnie dwugłowe uda)', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'running', 'cycling'], description: 'Płynne pogłębianie bez szarpania.' },
  { id: 'ro-2', difficulty: 'Początkujący', title: 'Rozciąganie mięśnia czworogłowego uda', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'running'], description: 'Przyciągnięcie pięty do pośladka z zachowaniem prostego tułowia.' },
  { id: 'ro-3', difficulty: 'Średniozaawansowany', title: 'Pozycja „gołębia” / rozciąganie pośladka i biodra', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 25, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'running', 'cycling'], description: 'Rozluźnienie głębokich rotatorów biodra.' },
  { id: 'ro-4', difficulty: 'Średniozaawansowany', title: 'Wykrok niski z otwarciem klatki piersiowej i zginaczy biodra', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'running'], description: 'Rozciągnięcie przedniej strony biodra po treningu.' },
  { id: 'ro-5', difficulty: 'Średniozaawansowany', title: 'Rozciąganie przywodzicieli w siadzie / wykroku bocznym', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'handball', 'tennis'], description: 'Praca nad elastycznością wewnętrznej strony uda.' },
  { id: 'ro-6', difficulty: 'Początkujący', title: '„Koci grzbiet – krowa” w klęku podpartym', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'swimming', 'gym'], description: 'Mobilizacja kręgosłupa w spokojnym oddechu.' },
  { id: 'ro-7', difficulty: 'Początkujący', title: 'Rotacja tułowia w leżeniu na boku („otwieranie książki”)', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'volleyball', 'tennis'], description: 'Mobilność odcinka piersiowego i barków.' },
  { id: 'ro-8', difficulty: 'Początkujący', title: 'Rozciąganie łydek przy ścianie', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'running', 'basketball'], description: 'Rozluźnienie łydki i ścięgna Achillesa (proste i ugięte kolano).' },
  { id: 'ro-9', difficulty: 'Początkujący', title: 'Pozycja dziecka z sięgnięciem dłońmi w bok', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'swimming', 'volleyball'], description: 'Rozciągnięcie najszerszego grzbietu i boków tułowia.' },
  { id: 'ro-10', difficulty: 'Początkujący', title: 'Rozciąganie klatki piersiowej i barków', drillType: 'mobility_stretch', module: 'Rozciągające', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 25, recommendedSports: ['football', 'handball', 'volleyball'], description: 'Otwarcie klatki po wysiłku.' },

  // 5. Ćwiczenia stabilizujące (10)
  { id: 'st-1', difficulty: 'Początkujący', title: 'Deska na przedramionach (Forearm Plank)', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 40, unit: 'sek.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'running', 'cycling', 'swimming'], description: 'Utrzymanie prostej linii barki–biodra–kostki.' },
  { id: 'st-2', difficulty: 'Średniozaawansowany', title: 'Deska na wyprostowanych ramionach (High Plank)', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 35, unit: 'sek.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'gym', 'handball'], description: 'Stabilizacja barków i tułowia.' },
  { id: 'st-3', difficulty: 'Średniozaawansowany', title: 'Deska bokiem (Side Plank — lewa / prawa)', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 30, unit: 'sek.', defaultRestSec: 25, xpPerSet: 35, recommendedSports: ['football', 'running'], description: 'Wzmocnienie mięśni skośnych i bocznej stabilizacji biodra.' },
  { id: 'st-4', difficulty: 'Początkujący', title: '„Bird-Dog” w klęku podpartym', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'running'], description: 'Naprzemienne unoszenie przeciwnej ręki i nogi bez kołysania biodrami.' },
  { id: 'st-5', difficulty: 'Początkujący', title: '„Dead Bug” w leżeniu tyłem', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'running', 'swimming'], description: 'Kontrola odcinka lędźwiowego przy ruchu rąk i nóg.' },
  { id: 'st-6', difficulty: 'Początkujący', title: 'Stanie na jednej nodze (kontrola równowagi)', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 30, unit: 'sek.', defaultRestSec: 20, xpPerSet: 30, recommendedSports: ['football', 'running', 'basketball'], description: 'Trening propriocepcji stawu skokowego i kolana.' },
  { id: 'st-7', difficulty: 'Średniozaawansowany', title: '„Jaskółka” / waga przodem na jednej nodze', drillType: 'mobility_stretch', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 25, xpPerSet: 35, recommendedSports: ['football', 'running'], description: 'Równowaga i praca tylnej taśmy w podporze na jednej nodze.' },
  { id: 'st-8', difficulty: 'Średniozaawansowany', title: 'Chód w pozycji niskiego przysiadu (Monster / Crab Walk)', drillType: 'agility_skater', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 14, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'basketball', 'handball'], description: 'Stabilizacja bioder i kolan w ruchu.' },
  { id: 'st-9', difficulty: 'Zaawansowany', title: 'Deska z unoszeniem nogi lub ręki', drillType: 'plank', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 30, unit: 'sek.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'gym'], description: 'Utrudnienie antyrotacyjne i stabilizacyjne.' },
  { id: 'st-10', difficulty: 'Zaawansowany', title: 'Lądowanie na jednej nodze z zatrzymaniem (3 sekundy)', drillType: 'jump_squat', module: 'Stabilizujące', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'volleyball', 'basketball'], description: 'Kontrola kolana i miednicy tuż po kontakcie z podłożem.' },

  // 6. Zwinność i koordynacja ruchowa (10)
  { id: 'zw-1', difficulty: 'Początkujący', title: 'Szybkie przebieżki w miejscu z wysokim unoszeniem kolan (A-Skip)', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'running', 'basketball'], description: 'Rytm i koordynacja góra–dół.' },
  { id: 'zw-2', difficulty: 'Początkujący', title: 'Krok dostawny boczny w niskiej pozycji', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 30, xpPerSet: 35, recommendedSports: ['football', 'basketball', 'handball', 'tennis'], description: 'Szybkie przemieszczanie w bok z zachowaniem niskiego środka ciężkości.' },
  { id: 'zw-3', difficulty: 'Średniozaawansowany', title: 'Bieg slalomem między pachołkami', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 35, recommendedSports: ['football', 'handball'], description: 'Płynne zmiany kierunku i praca ramion.' },
  { id: 'zw-4', difficulty: 'Zaawansowany', title: '„Koperta” / szybkie zmiany kierunku przód–bok–tył', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'tennis', 'basketball'], description: 'Reakcja i zmiana wektora ruchu.' },
  { id: 'zw-5', difficulty: 'Początkujący', title: 'Praca na drabince koordynacyjnej (1 krok w kwadracie)', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 15, unit: 'sek.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'basketball', 'tennis'], description: 'Szybka kadencja stóp.' },
  { id: 'zw-6', difficulty: 'Średniozaawansowany', title: 'Praca na drabince koordynacyjnej (2 kroki w kwadracie)', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 15, unit: 'sek.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'basketball'], description: 'Rytm i dokładność postawienia stopy.' },
  { id: 'zw-7', difficulty: 'Zaawansowany', title: 'Przejście z leżenia przodem do szybkiego startu na 5 m', drillType: 'pushups', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 8, unit: 'powt.', defaultRestSec: 35, xpPerSet: 35, recommendedSports: ['football', 'handball'], description: 'Dynamika wstawania i pierwszy krok.' },
  { id: 'zw-8', difficulty: 'Zaawansowany', title: 'Skok z zatrzymaniem na jednej nodze + zmiana kierunku', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 35, xpPerSet: 40, recommendedSports: ['football', 'basketball'], description: 'Kontrola hamowania przed zwrotem.' },
  { id: 'zw-9', difficulty: 'Średniozaawansowany', title: 'Naprzemienne szybkie dotknięcia stóp do linii / pachołka', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 25, xpPerSet: 30, recommendedSports: ['football', 'tennis', 'volleyball'], description: 'Koordynacja i szybkość reakcji.' },
  { id: 'zw-10', difficulty: 'Średniozaawansowany', title: 'Bieg po ósemce', drillType: 'agility_skater', module: 'Zwinność i koordynacja', defaultSets: 3, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 30, xpPerSet: 30, recommendedSports: ['football', 'basketball'], description: 'Płynne prowadzenie toru ruchu i kontrola przechyłu ciała.' },

  // 7. Rozgrzewka i aktywacja przedtreningowa (10)
  { id: 'rz-1', difficulty: 'Początkujący', title: 'Trucht w miejscu z krążeniem ramion', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 30, unit: 'sek.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'swimming', 'volleyball'], description: 'Podniesienie temperatury ciała i rozgrzanie barków.' },
  { id: 'rz-2', difficulty: 'Początkujący', title: 'Krążenia bioder na zewnątrz i do wewnątrz', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'running'], description: 'Przygotowanie stawów biodrowych w marszu lub miejscu.' },
  { id: 'rz-3', difficulty: 'Początkujący', title: 'Pajacyki klasyczne', drillType: 'jump_squat', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 25, unit: 'powt.', defaultRestSec: 20, xpPerSet: 20, recommendedSports: ['football', 'basketball', 'handball'], description: 'Ogólne pobudzenie krążeniowo-oddechowe.' },
  { id: 'rz-4', difficulty: 'Początkujący', title: 'Półprzysiady aktywacyjne z zatrzymaniem', drillType: 'squat', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 20, xpPerSet: 20, recommendedSports: ['football', 'volleyball'], description: 'Obudzenie mięśni nóg i pośladków.' },
  { id: 'rz-5', difficulty: 'Początkujący', title: 'Wymachy nóg w przód i w tył (z podparciem)', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'running'], description: 'Dynamiczne przygotowanie dwugłowych i zginaczy biodra.' },
  { id: 'rz-6', difficulty: 'Początkujący', title: 'Wymachy nóg w bok', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 12, unit: 'powt.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'running', 'handball'], description: 'Przygotowanie przywodzicieli i odwodzicieli.' },
  { id: 'rz-7', difficulty: 'Początkujący', title: 'Krążenia tułowia i skręty w staniu', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'volleyball', 'tennis'], description: 'Rozruszanie odcinka piersiowego.' },
  { id: 'rz-8', difficulty: 'Początkujący', title: 'Krążenia stawów skokowych i nadgarstków', drillType: 'mobility_stretch', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 20, unit: 'sek.', defaultRestSec: 15, xpPerSet: 20, recommendedSports: ['football', 'basketball', 'gym'], description: 'Mobilizacja obwodowa przed podporami i skokami.' },
  { id: 'rz-9', difficulty: 'Średniozaawansowany', title: 'Dynamiczne wykroki z rotacją tułowia', drillType: 'squat', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 10, unit: 'powt.', defaultRestSec: 20, xpPerSet: 25, recommendedSports: ['football', 'handball', 'basketball'], description: 'Aktywacja nóg i mobilność tułowia.' },
  { id: 'rz-10', difficulty: 'Średniozaawansowany', title: 'Krótkie przyspieszenia / wyskoki kontrolne', drillType: 'jump_squat', module: 'Rozgrzewka i aktywacja', defaultSets: 2, defaultRepsOrSec: 6, unit: 'powt.', defaultRestSec: 25, xpPerSet: 25, recommendedSports: ['football', 'running', 'basketball'], description: 'Wejście w gotowość ruchową przed zadaniem głównym.' },
];



export type ProgramCategory = 'Wszystkie' | 'Skoczność' | 'Zwinność' | 'Siła Core' | 'Szybkość' | 'Prewencja';

interface MotorModuleProgram {
  id: string;
  title: string;
  category: Exclude<ProgramCategory, 'Wszystkie'>;
  durationWeeks: number;
  ageGroup: string;
  drillType: string;
  unit: 'powt.' | 'sek.';
  baseSets: number;
  baseRepsOrSec: number;
  baseRestSec: number;
  xpPerWeek: number;
  goal: string;
  aiFocus: string;
}

const AI_MOTOR_MODULES: MotorModuleProgram[] = [
  {
    id: 'mod-1',
    title: 'Fundament Lotu (Skoczność)',
    category: 'Skoczność',
    durationWeeks: 8,
    ageGroup: '11–18 lat',
    drillType: 'jump_squat',
    unit: 'powt.',
    baseSets: 3,
    baseRepsOrSec: 8,
    baseRestSec: 45,
    xpPerWeek: 120,
    goal: 'Zwiększenie wysokości wyskoku dosiężnego i bezpieczna technika lądowania.',
    aiFocus: 'MediaPipe kontroluje kąt zgięcia kolan (<135°) i oś stawów przy lądowaniu.',
  },
  {
    id: 'mod-2',
    title: 'Eksplozja na Boisku (Plyometria)',
    category: 'Skoczność',
    durationWeeks: 10,
    ageGroup: '13–18 lat',
    drillType: 'jump_squat',
    unit: 'powt.',
    baseSets: 4,
    baseRepsOrSec: 10,
    baseRestSec: 50,
    xpPerWeek: 150,
    goal: 'Moc eksplozywna w pojedynkach główkowych, blokach i pierwszych krokach.',
    aiFocus: 'AI mierzy dynamikę wybicia oraz stabilność tułowia w fazie lotu.',
  },
  {
    id: 'mod-3',
    title: 'Zwinne Stopy (Agility Pro)',
    category: 'Zwinność',
    durationWeeks: 8,
    ageGroup: '10–18 lat',
    drillType: 'agility_skater',
    unit: 'powt.',
    baseSets: 3,
    baseRepsOrSec: 14,
    baseRestSec: 30,
    xpPerWeek: 110,
    goal: 'Szybka praca nóg, koordynacja i lekkość poruszania się na małej przestrzeni.',
    aiFocus: 'Skaner sprawdza symetrię przeskoków bocznych i balans środka ciężkości.',
  },
  {
    id: 'mod-4',
    title: 'Zmiana Kierunku (COD Master)',
    category: 'Zwinność',
    durationWeeks: 12,
    ageGroup: '13–18 lat',
    drillType: 'agility_skater',
    unit: 'powt.',
    baseSets: 4,
    baseRepsOrSec: 16,
    baseRestSec: 35,
    xpPerWeek: 160,
    goal: 'Błyskawiczne hamowanie i dynamiczny zwrot bez utraty równowagi.',
    aiFocus: 'AI wykrywa asymetrię lewej i prawej nogi przy gwałtownym zatrzymaniu.',
  },
  {
    id: 'mod-5',
    title: 'Stalowy Gorset (Core Stability)',
    category: 'Siła Core',
    durationWeeks: 8,
    ageGroup: '10–18 lat',
    drillType: 'plank',
    unit: 'sek.',
    baseSets: 3,
    baseRepsOrSec: 35,
    baseRestSec: 30,
    xpPerWeek: 120,
    goal: 'Wzmocnienie mięśni głębokich brzucha i pleców dla stabilności w kontakcie.',
    aiFocus: 'MediaPipe pilnuje prostej linii barki–biodra–kostki bez zapadania lędźwi.',
  },
  {
    id: 'mod-6',
    title: 'Siła bez Sztangi (Kalistenika)',
    category: 'Siła Core',
    durationWeeks: 12,
    ageGroup: '12–18 lat',
    drillType: 'pushups',
    unit: 'powt.',
    baseSets: 3,
    baseRepsOrSec: 12,
    baseRestSec: 45,
    xpPerWeek: 150,
    goal: 'Bezpieczna budowa siły górnej części ciała z masą własnego ciała.',
    aiFocus: 'AI liczy pełne powtórzenia (<115° w łokciach) i symetrię barków.',
  },
  {
    id: 'mod-7',
    title: 'Błyskawiczny Start (0–10m)',
    category: 'Szybkość',
    durationWeeks: 8,
    ageGroup: '11–18 lat',
    drillType: 'jump_squat',
    unit: 'powt.',
    baseSets: 4,
    baseRepsOrSec: 8,
    baseRestSec: 45,
    xpPerWeek: 130,
    goal: 'Poprawa czasu reakcji i siły pierwszych trzech kroków przyspieszenia.',
    aiFocus: 'Skaner analizuje głębokość pozycji startowej i dynamikę wyprostu biodra.',
  },
  {
    id: 'mod-8',
    title: 'Maksymalna V-Max (Szybkość)',
    category: 'Szybkość',
    durationWeeks: 10,
    ageGroup: '14–18 lat',
    drillType: 'agility_skater',
    unit: 'powt.',
    baseSets: 4,
    baseRepsOrSec: 18,
    baseRestSec: 40,
    xpPerWeek: 145,
    goal: 'Zwiększenie kadencji kroku i utrzymanie prędkości maksymalnej.',
    aiFocus: 'AI kontroluje rytm pracy rąk i nóg oraz minimalizuje zbędne ruchy tułowia.',
  },
  {
    id: 'mod-9',
    title: 'Elastyczny Atleta (Mobility)',
    category: 'Prewencja',
    durationWeeks: 8,
    ageGroup: '10–18 lat',
    drillType: 'mobility_stretch',
    unit: 'powt.',
    baseSets: 2,
    baseRepsOrSec: 10,
    baseRestSec: 20,
    xpPerWeek: 100,
    goal: 'Zwiększenie zakresu ruchu w biodrach i stawach skokowych oraz regeneracja.',
    aiFocus: 'MediaPipe weryfikuje płynność zejścia i pełny zakres rozciągnięcia.',
  },
  {
    id: 'mod-10',
    title: 'Prewencja ACL & Kolan (FIFA 11+)',
    category: 'Prewencja',
    durationWeeks: 12,
    ageGroup: '11–18 lat',
    drillType: 'mobility_stretch',
    unit: 'powt.',
    baseSets: 3,
    baseRepsOrSec: 12,
    baseRestSec: 25,
    xpPerWeek: 155,
    goal: 'Ochrona więzadeł krzyżowych i stabilizacja kolan u młodych zawodników.',
    aiFocus: 'Kluczowy alert AI przy koślawieniu kolan do środka podczas przysiadu.',
  },
];

const getWeekPrescription = (mod: MotorModuleProgram, week: number) => {
  const progressRatio = (week - 1) / Math.max(1, mod.durationWeeks - 1);
  let phaseLabel = 'Adaptacja Techniczna';
  if (week === mod.durationWeeks) phaseLabel = 'Szczyt Formy / Test AI';
  else if (progressRatio >= 0.65) phaseLabel = 'Intensyfikacja & Moc';
  else if (progressRatio >= 0.3) phaseLabel = 'Budowanie Objętości';

  const extraSets = week >= Math.ceil(mod.durationWeeks * 0.6) ? 1 : 0;
  const sets = mod.baseSets + extraSets;
  const repsOrSec =
    mod.unit === 'sek.'
      ? mod.baseRepsOrSec + (week - 1) * 5
      : mod.baseRepsOrSec + Math.floor((week - 1) * 1.5);
  const restSec = Math.max(15, mod.baseRestSec - Math.floor((week - 1) / 3) * 5);

  return { sets, repsOrSec, restSec, phaseLabel };
};

const getExerciseMediaPipeVideo = (drillType?: string, title?: string) => {
  const t = (drillType || '').toLowerCase();
  const name = (title || '').toLowerCase();

  if (name.includes('pajacyk') || name.includes('rozgrzewk') || name.includes('trucht') || name.includes('krążeni') || name.includes('wymach')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/2816902761046287383',
      label: 'Wzorzec + MediaPipe: Rozgrzewka i aktywacja',
    };
  }
  if (name.includes('drabink') || name.includes('slalom') || name.includes('kopert') || name.includes('ósemc') || name.includes('a-skip') || name.includes('krok dostawny') || name.includes('zwin')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/12910597520604266242',
      label: 'Wzorzec + MediaPipe: Zwinność i praca nóg',
    };
  }
  if (name.includes('jednej nodze') || name.includes('równowag') || name.includes('jaskółk')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/7857278671429224685',
      label: 'Wzorzec + MediaPipe: Równowaga i stabilizacja jednostronna',
    };
  }
  if (name.includes('wykrok') || name.includes('lunge')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/9305064507880722458',
      label: 'Wzorzec + MediaPipe: Wykroki i kontrola osi ruchu',
    };
  }
  if (name.includes('wznosy bioder') || name.includes('glute bridge') || name.includes('bioder')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/1169095152822511311',
      label: 'Wzorzec + MediaPipe: Wznosy bioder i stabilizacja miednicy',
    };
  }
  if (t.includes('plank') || name.includes('desk') || name.includes('core') || name.includes('gorset')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/6050247604474293292',
      label: 'Wzorzec + MediaPipe: Deska (Plank) — stabilizacja tułowia',
    };
  }
  if (t.includes('pushup') || name.includes('pompk') || name.includes('kalistenik')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/10163247222223545443',
      label: 'Wzorzec + MediaPipe: Pompki klasyczne i kontrola osi',
    };
  }
  if (t.includes('skater') || t.includes('agility') || name.includes('łyżwiarz') || name.includes('przeskok') || name.includes('kierunk') || name.includes('v-max')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/17438914309093186369',
      label: 'Wzorzec + MediaPipe: Przeskoki boczne (Łyżwiarz)',
    };
  }
  if (t.includes('mobility') || t.includes('stretch') || name.includes('mobiln') || name.includes('rozciąg') || name.includes('prewenc') || name.includes('acl')) {
    return {
      uri: 'http://googleusercontent.com/generated_video_content/10863733826626462269',
      label: 'Wzorzec + MediaPipe: Mobilność i rozciąganie',
    };
  }
  return {
    uri: 'http://googleusercontent.com/generated_video_content/13756362820221857551',
    label: 'Wzorzec + MediaPipe: Wyskoki i dynamika ruchu',
  };
};

export default function ZadaniaDomoweScreen() {
  const { sport, setSport, sportConfig, allSports } = useClubSettings();
  const { players, availableYears, updatePlayer } = usePlayers();

  const [mainViewTab, setMainViewTab] = useState<'modules' | 'single'>('modules');
  const [selectedProgramCategory, setSelectedProgramCategory] = useState<ProgramCategory>('Wszystkie');
  const [moduleWeeks, setModuleWeeks] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    AI_MOTOR_MODULES.forEach((m) => {
      init[m.id] = 1;
    });
    return init;
  });

  const [selectedSportCategory, setSelectedSportCategory] = useState<SportCategory | 'Wszystkie'>('Wszystkie');
  const [selectedModule, setSelectedModule] = useState<ModuleCategory>('Wszystkie');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Wszystkie' | DifficultyLevel>('Wszystkie');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('Wszyscy');
  const [requireWarmupBumper, setRequireWarmupBumper] = useState<boolean>(true);

  // Elastyczna konfiguracja serii, powtórzeń/sekund i przerw dla każdego ćwiczenia
  const [exerciseConfigs, setExerciseConfigs] = useState<
    Record<string, { sets: string; repsOrSec: string; restSec: string }>
  >(() => {
    const init: Record<string, { sets: string; repsOrSec: string; restSec: string }> = {};
    FULL_70_SINGLE_EXERCISES.forEach((ex) => {
      init[ex.id] = {
        sets: String(ex.defaultSets),
        repsOrSec: String(ex.defaultRepsOrSec),
        restSec: String(ex.defaultRestSec),
      };
    });
    return init;
  });

  // Stany dla modalu Skanera AI z obsługą wielu serii i timera przerwy
  const [previewExercise, setPreviewExercise] = useState<VaultExercise | null>(null);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [activeSetNumber, setActiveSetNumber] = useState<number>(1);
  const [totalSetsCount, setTotalSetsCount] = useState<number>(3);
  const [targetRepsForSet, setTargetRepsForSet] = useState<number>(10);
  const [configuredRestSeconds, setConfiguredRestSeconds] = useState<number>(30);
  const [isRestingBetweenSets, setIsRestingBetweenSets] = useState<boolean>(false);
  const [restCountdown, setRestCountdown] = useState<number>(0);
  const [selectedTestPlayerId, setSelectedTestPlayerId] = useState<string>('');

  useEffect(() => {
    if (!isRestingBetweenSets) return;
    if (restCountdown <= 0) {
      setIsRestingBetweenSets(false);
      setActiveSetNumber((prev) => prev + 1);
      return;
    }
    const timer = setTimeout(() => {
      setRestCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isRestingBetweenSets, restCountdown]);

  const updateExConfig = (exId: string, field: 'sets' | 'repsOrSec' | 'restSec', value: string) => {
    setExerciseConfigs((prev) => ({
      ...prev,
      [exId]: {
        ...(prev[exId] || { sets: '3', repsOrSec: '10', restSec: '30' }),
        [field]: value,
      },
    }));
  };

  const adjustExConfig = (exId: string, field: 'sets' | 'repsOrSec' | 'restSec', delta: number, minVal: number = 1) => {
    const current = parseInt(exerciseConfigs[exId]?.[field] || '1', 10) || minVal;
    const nextVal = Math.max(minVal, current + delta);
    updateExConfig(exId, field, String(nextVal));
  };

  const applyQuickProgressionPreset = (ex: VaultExercise, level: 'start' | 'progres' | 'elite') => {
    if (level === 'start') {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '3', repsOrSec: String(ex.defaultRepsOrSec), restSec: '45' },
      }));
    } else if (level === 'progres') {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '4', repsOrSec: String(Math.round(ex.defaultRepsOrSec * 1.5)), restSec: '30' },
      }));
    } else {
      setExerciseConfigs((prev) => ({
        ...prev,
        [ex.id]: { sets: '5', repsOrSec: String(ex.defaultRepsOrSec * 2), restSec: '20' },
      }));
    }
  };

  const filteredSports = useMemo(() => {
    if (selectedSportCategory === 'Wszystkie') return allSports;
    return allSports.filter((s) => s.category === selectedSportCategory);
  }, [allSports, selectedSportCategory]);

  const filteredExercises = useMemo(() => {
    return FULL_70_SINGLE_EXERCISES.filter((ex) => {
      if (selectedModule !== 'Wszystkie' && ex.module !== selectedModule) return false;
      if (selectedDifficulty !== 'Wszystkie' && ex.difficulty !== selectedDifficulty) return false;
      return true;
    }).sort((a, b) => {
      const aMatch = a.recommendedSports.includes(sport) ? 1 : 0;
      const bMatch = b.recommendedSports.includes(sport) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [selectedModule, selectedDifficulty, sport]);

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const filteredMotorModules = useMemo(() => {
    return AI_MOTOR_MODULES.filter(
      (m) => selectedProgramCategory === 'Wszystkie' || m.category === selectedProgramCategory
    );
  }, [selectedProgramCategory]);

  const handleAssignModuleWeekToTeam = (mod: MotorModuleProgram) => {
    const week = moduleWeeks[mod.id] || 1;
    const plan = getWeekPrescription(mod, week);

    const targetPlayers =
      selectedYearFilter === 'Wszyscy'
        ? players
        : players.filter((p) => String(p.year) === String(selectedYearFilter));

    const prescription: HomeworkPrescription = {
      exerciseId: `${mod.id}-w${week}`,
      title: `${mod.title} (Tydz. ${week}/${mod.durationWeeks})`,
      drillType: mod.drillType,
      sets: plan.sets,
      repsOrSec: plan.repsOrSec,
      unit: mod.unit,
      restSec: plan.restSec,
      xpReward: mod.xpPerWeek,
      requireWarmup: requireWarmupBumper,
      assignedAt: new Date().toLocaleDateString('pl-PL'),
    };

    targetPlayers.forEach((p) => {
      updatePlayer(p.id, { activeHomework: prescription });
    });

    showNotice(
      `Moduł AI Przypisany! 🏆 (Tydzień ${week}/${mod.durationWeeks})`,
      `Program: ${mod.title}
` +
        `Faza: ${plan.phaseLabel}
` +
        `Plan: ${plan.sets} serii x ${plan.repsOrSec} ${mod.unit} (przerwa ${plan.restSec}s)
` +
        `Nagroda: +${mod.xpPerWeek} XP
` +
        `Odbiorcy (${selectedYearFilter === 'Wszyscy' ? 'Cała Kadra' : `Rocznik ${selectedYearFilter}`}): ${targetPlayers.length} zawodników
` +
        `Nadzór AI (MediaPipe): WŁĄCZONY 🤖`
    );
  };

  const handleStartModuleScanner = (mod: MotorModuleProgram) => {
    const week = moduleWeeks[mod.id] || 1;
    const plan = getWeekPrescription(mod, week);

    const syntheticEx: VaultExercise = {
      id: `${mod.id}-w${week}`,
      title: `${mod.title} (Tydz. ${week}/${mod.durationWeeks})`,
      drillType: mod.drillType,
      module: 'Skocznościowe',
      difficulty: 'Średniozaawansowany',
      defaultSets: plan.sets,
      defaultRepsOrSec: plan.repsOrSec,
      unit: mod.unit,
      defaultRestSec: plan.restSec,
      xpPerSet: Math.round(mod.xpPerWeek / Math.max(1, plan.sets)),
      recommendedSports: ['football'],
      description: mod.goal,
    };

    setPreviewExercise(syntheticEx);
    setTotalSetsCount(plan.sets);
    setTargetRepsForSet(plan.repsOrSec);
    setConfiguredRestSeconds(plan.restSec);
    setActiveSetNumber(1);
    setIsRestingBetweenSets(false);
    setRestCountdown(0);
    if (!selectedTestPlayerId && players.length > 0) {
      setSelectedTestPlayerId(players[0].id);
    }
    setScannerVisible(true);
  };

  const handleAssignToTeam = (ex: VaultExercise) => {
    const cfg = exerciseConfigs[ex.id] || {
      sets: String(ex.defaultSets),
      repsOrSec: String(ex.defaultRepsOrSec),
      restSec: String(ex.defaultRestSec),
    };
    const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
    const repsNum = Math.max(1, parseInt(cfg.repsOrSec, 10) || ex.defaultRepsOrSec);
    const restNum = Math.max(0, parseInt(cfg.restSec, 10) || ex.defaultRestSec);
    const totalXp = setsNum * ex.xpPerSet;

    const targetPlayers =
      selectedYearFilter === 'Wszyscy'
        ? players
        : players.filter((p) => String(p.year) === String(selectedYearFilter));

    const prescription: HomeworkPrescription = {
      exerciseId: ex.id,
      title: ex.title,
      drillType: ex.drillType,
      sets: setsNum,
      repsOrSec: repsNum,
      unit: ex.unit,
      restSec: restNum,
      xpReward: totalXp,
      requireWarmup: requireWarmupBumper,
      assignedAt: new Date().toLocaleDateString('pl-PL'),
    };

    targetPlayers.forEach((p) => {
      updatePlayer(p.id, { activeHomework: prescription });
    });

    showNotice(
      'Zadanie AI z Progresją Wysłane! 🚀',
      `Ćwiczenie: ${ex.title}\n` +
        `Plan: ${setsNum} serii x ${repsNum} ${ex.unit} (przerwa: ${restNum}s)\n` +
        `Nagroda za całość: +${totalXp} XP\n` +
        `Odbiorcy (${selectedYearFilter === 'Wszyscy' ? 'Cała Kadra' : `Rocznik ${selectedYearFilter}`}): ${targetPlayers.length} zawodników\n` +
        `Wymóg 3-min rozgrzewki: ${requireWarmupBumper ? 'WŁĄCZONY 🛡️' : 'Wyłączony'}\nDostęp w panelu Zawodnika/Rodzica: ODBLOKOWANY PO ZLECENIU TRENERA 🔒✅`
    );
  };

  const handleStartTestScanner = (ex: VaultExercise) => {
    const cfg = exerciseConfigs[ex.id] || {
      sets: String(ex.defaultSets),
      repsOrSec: String(ex.defaultRepsOrSec),
      restSec: String(ex.defaultRestSec),
    };
    const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
    const repsNum = Math.max(1, parseInt(cfg.repsOrSec, 10) || ex.defaultRepsOrSec);
    const restNum = Math.max(0, parseInt(cfg.restSec, 10) || ex.defaultRestSec);

    setPreviewExercise(ex);
    setActiveSetNumber(1);
    setTotalSetsCount(setsNum);
    setTargetRepsForSet(repsNum);
    setConfiguredRestSeconds(restNum);
    setIsRestingBetweenSets(false);
    if (!selectedTestPlayerId && players.length > 0) {
      setSelectedTestPlayerId(String(players[0].id));
    }
    setScannerVisible(true);
  };

  const handleSetCompletedInScanner = (metrics: { reps: number; score: number; asymmetryIndex: number }) => {
    if (!previewExercise) return;

    if (activeSetNumber < totalSetsCount) {
      if (configuredRestSeconds > 0) {
        setRestCountdown(configuredRestSeconds);
        setIsRestingBetweenSets(true);
      } else {
        setActiveSetNumber((prev) => prev + 1);
      }
      return;
    }

    // Wszystkie serie ukończone -> zapisujemy wynik w historii testów zawodnika (do Tablicy Progresu!)
    setScannerVisible(false);
    const totalXp = totalSetsCount * previewExercise.xpPerSet;
    const targetPlayer = players.find((p) => String(p.id) === String(selectedTestPlayerId)) || players[0];

    if (targetPlayer) {
      const totalVolume = totalSetsCount * targetRepsForSet;
      const newEntry = {
        testName: `AI: ${previewExercise.title.split('(')[0].trim()}`,
        result: `${totalVolume} ${previewExercise.unit} (${totalSetsCount}x${targetRepsForSet})`,
        date: new Date().toLocaleDateString('pl-PL'),
        sets: totalSetsCount,
        repsOrSec: targetRepsForSet,
        restSec: configuredRestSeconds,
        scorePercent: metrics.score,
      };
      updatePlayer(targetPlayer.id, {
        tests: [newEntry, ...(targetPlayer.tests || [])],
        xp: (targetPlayer.xp || 300) + totalXp,
      });
    }

    showNotice(
      'Wszystkie Serie Ukończone! 🏆',
      `Wykonano: ${totalSetsCount} serii x ${targetRepsForSet} ${previewExercise.unit}\n` +
        `Ocena Techniki AI: ${metrics.score}% | Asymetria: ${metrics.asymmetryIndex}%\n` +
        (targetPlayer
          ? `Zapisano w Tablicy Progresu gracza ${targetPlayer.firstName} (+${totalXp} XP)!`
          : '')
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Wyzwania AI & 10 Modułów Motorycznych 🧬</Text>
          <Text style={styles.headerSubtitle}>
            Autonomiczne plany 8–12 tygodniowe z analizą MediaPipe oraz pojedyncze zadania
          </Text>
        </View>
      </View>

      {/* PRZEŁĄCZNIK GŁÓWNY: 10 MODUŁÓW AI vs POJEDYNCZE ĆWICZENIA */}
      <View style={styles.mainSwitcherRow}>
        <TouchableOpacity
          style={[styles.mainSwitchBtn, mainViewTab === 'modules' && styles.mainSwitchBtnActive]}
          onPress={() => setMainViewTab('modules')}
        >
          <Ionicons
            name="layers-outline"
            size={15}
            color={mainViewTab === 'modules' ? '#fff' : '#475569'}
          />
          <Text style={[styles.mainSwitchText, mainViewTab === 'modules' && styles.mainSwitchTextActive]}>
            10 Modułów AI (8–12 tyg.)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainSwitchBtn, mainViewTab === 'single' && styles.mainSwitchBtnActive]}
          onPress={() => setMainViewTab('single')}
        >
          <Ionicons
            name="flash-outline"
            size={15}
            color={mainViewTab === 'single' ? '#fff' : '#475569'}
          />
          <Text style={[styles.mainSwitchText, mainViewTab === 'single' && styles.mainSwitchTextActive]}>
            Pojedyncze Ćwiczenia
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mainViewTab === 'modules' && (
          <View>
            {/* BANER INFORMACYJNY AI-FIRST */}
            <View style={styles.aiHeroBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="hardware-chip-outline" size={20} color="#38bdf8" />
                <Text style={styles.aiHeroTitle}>Autonomiczna Periodyzacja AI (MediaPipe)</Text>
              </View>
              <Text style={styles.aiHeroSub}>
                Wybierz jeden z 10 gotowych programów (8–12 tygodni) i przypisz aktywny tydzień kadrze lub wybranemu rocznikowi. Sztuczna inteligencja sama pilnuje techniki, progresji i zapisuje raporty.
              </Text>
            </View>

            {/* WYBÓR ROCZNIKA DOCELOWEGO + ROZGRZEWKA */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Odbiorcy Modułu (Rocznik / Kadra):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {['Wszyscy', ...availableYears].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.yearChip, selectedYearFilter === yr && styles.yearChipActive]}
                    onPress={() => setSelectedYearFilter(yr)}
                  >
                    <Text style={[styles.yearChipText, selectedYearFilter === yr && styles.yearChipTextActive]}>
                      {yr === 'Wszyscy' ? 'Cała Kadra' : `Rocznik ${yr}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* FILTR KATEGORII MODUŁÓW */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {(['Wszystkie', 'Skoczność', 'Zwinność', 'Siła Core', 'Szybkość', 'Prewencja'] as ProgramCategory[]).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modulePill,
                      selectedProgramCategory === cat && styles.modulePillActive,
                    ]}
                    onPress={() => setSelectedProgramCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.modulePillText,
                        selectedProgramCategory === cat && styles.modulePillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

            {/* LISTA 10 MODUŁÓW MOTORYCZNYCH */}
            {filteredMotorModules.map((mod, idx) => {
              const currentWeek = moduleWeeks[mod.id] || 1;
              const plan = getWeekPrescription(mod, currentWeek);

              return (
                <View key={mod.id} style={styles.moduleProgramCard}>
                  <View style={styles.exerciseHeaderRow}>
                    <View style={styles.moduleTag}>
                      <Text style={styles.moduleTagText}>
                        #{idx + 1} • {mod.category} • {mod.durationWeeks} tyg.
                      </Text>
                    </View>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageBadgeText}>👤 {mod.ageGroup}</Text>
                    </View>
                  </View>

                  <Text style={styles.exerciseTitle}>{mod.title}</Text>
                  <Text style={styles.exerciseDesc}>{mod.goal}</Text>

                  <View style={styles.aiFocusBox}>
                    <Ionicons name="eye-outline" size={14} color="#7c3aed" />
                    <Text style={styles.aiFocusText}>{mod.aiFocus}</Text>
                  </View>

                  {/* STEROWANIE TYGODNIEM PERIODYZACJI */}
                  <View style={styles.weekSelectorBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={styles.weekSelectorLabel}>
                          Aktywny Tydzień: <Text style={{ color: '#2563eb' }}>{currentWeek} / {mod.durationWeeks}</Text>
                        </Text>
                        <Text style={styles.weekPhaseText}>Faza: {plan.phaseLabel}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.weekStepBtn}
                          onPress={() =>
                            setModuleWeeks((prev) => ({
                              ...prev,
                              [mod.id]: Math.max(1, (prev[mod.id] || 1) - 1),
                            }))
                          }
                        >
                          <Ionicons name="remove" size={16} color="#0f172a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.weekStepBtn}
                          onPress={() =>
                            setModuleWeeks((prev) => ({
                              ...prev,
                              [mod.id]: Math.min(mod.durationWeeks, (prev[mod.id] || 1) + 1),
                            }))
                          }
                        >
                          <Ionicons name="add" size={16} color="#0f172a" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* AUTOMATYCZNE PARAMETRY DLA WYBRANEGO TYGODNIA */}
                    <View style={styles.weekMetricsRow}>
                      <View style={styles.weekMetricChip}>
                        <Text style={styles.weekMetricVal}>{plan.sets}</Text>
                        <Text style={styles.weekMetricLbl}>Serie</Text>
                      </View>
                      <View style={styles.weekMetricChip}>
                        <Text style={styles.weekMetricVal}>{plan.repsOrSec} {mod.unit}</Text>
                        <Text style={styles.weekMetricLbl}>Cel / seria</Text>
                      </View>
                      <View style={styles.weekMetricChip}>
                        <Text style={styles.weekMetricVal}>{plan.restSec}s</Text>
                        <Text style={styles.weekMetricLbl}>Przerwa</Text>
                      </View>
                      <View style={[styles.weekMetricChip, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                        <Text style={[styles.weekMetricVal, { color: '#b45309' }]}>+{mod.xpPerWeek}</Text>
                        <Text style={[styles.weekMetricLbl, { color: '#b45309' }]}>XP</Text>
                      </View>
                    </View>
                  </View>

                  {/* PRZYCISKI AKCJI MODUŁU */}
                  <View style={styles.exerciseActionsRow}>
                    <TouchableOpacity
                      style={styles.assignBtn}
                      onPress={() => handleAssignModuleWeekToTeam(mod)}
                    >
                      <Ionicons name="send-outline" size={15} color="#fff" />
                      <Text style={styles.assignBtnText}>Przypisz Tydzień {currentWeek}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.testAiBtn}
                      onPress={() => handleStartModuleScanner(mod)}
                    >
                      <Ionicons name="videocam-outline" size={15} color="#2563eb" />
                      <Text style={styles.testAiBtnText}>Testuj AI</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </View>
        )}

        {mainViewTab === 'single' && (
          <View>
        {/* 1. WYBÓR I FILTROWANIE DYSCYPLINY SPORTOWEJ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Aktywna Dyscyplina: {sportConfig.emoji} {sportConfig.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {(['Wszystkie', 'Zespołowe', 'Indywidualne i Siłowe', 'Biegowe i Rekreacyjne (GPS)'] as const).map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    selectedSportCategory === cat && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedSportCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedSportCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredSports.map((sp) => {
              const isCurrent = sp.id === sport;
              return (
                <TouchableOpacity
                  key={sp.id}
                  style={[styles.sportCard, isCurrent && styles.sportCardActive]}
                  onPress={() => setSport(sp.id)}
                >
                  <Text style={{ fontSize: 20 }}>{sp.emoji}</Text>
                  <Text style={[styles.sportCardName, isCurrent && { color: '#2563eb', fontWeight: 'bold' }]}>
                    {sp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. BEZPIECZEŃSTWO ZDROWOTNE I FILTR ROCZNIKA DO WYSYŁKI */}
        <View style={styles.card}>
          <View style={styles.warmupRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#b45309' }}>
                🛡️ Obowiązkowa Rozgrzewka i Klauzula Zdrowotna
              </Text>
              <Text style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
                Przed włączeniem kamery dziecko i rodzic muszą zatwierdzić 3-minutową rozgrzewkę
              </Text>
            </View>
            <Switch value={requireWarmupBumper} onValueChange={setRequireWarmupBumper} />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Odbiorcy zadań domowych (Rocznik):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['Wszyscy', '2012', '2013', '2014', '2015', '2016', ...availableYears]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearPill, selectedYearFilter === yr && styles.yearPillActive]}
                  onPress={() => setSelectedYearFilter(yr)}
                >
                  <Text
                    style={[
                      styles.yearPillText,
                      selectedYearFilter === yr && { color: '#fff', fontWeight: 'bold' },
                    ]}
                  >
                    {yr === 'Wszyscy' ? `Cała kadra (${players.length})` : `Rocznik ${yr}`}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* 3. MODUŁY MOTORYCZNE */}
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>2. Wybierz Moduł Motoryczny:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(
            [
              'Wszystkie',
              'Skocznościowe',
              'Plyometryczne',
              'Siłowe',
              'Rozciągające',
              'Stabilizujące',
              'Zwinność i koordynacja',
              'Rozgrzewka i aktywacja',
            ] as ModuleCategory[]
          ).map(
            (mod) => (
              <TouchableOpacity
                key={mod}
                style={[styles.modPill, selectedModule === mod && styles.modPillActive]}
                onPress={() => setSelectedModule(mod)}
              >
                <Text style={[styles.modPillText, selectedModule === mod && { color: '#fff' }]}>{mod}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* FILTR POZIOMU ZAAWANSOWANIA */}
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>3. Poziom zaawansowania zawodnika:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {(['Wszystkie', 'Początkujący', 'Średniozaawansowany', 'Zaawansowany'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.modPill,
                selectedDifficulty === lvl && {
                  backgroundColor:
                    lvl === 'Początkujący'
                      ? '#16a34a'
                      : lvl === 'Średniozaawansowany'
                      ? '#d97706'
                      : lvl === 'Zaawansowany'
                      ? '#dc2626'
                      : '#0f172a',
                },
              ]}
              onPress={() => setSelectedDifficulty(lvl)}
            >
              <Text style={[styles.modPillText, selectedDifficulty === lvl && { color: '#fff' }]}>
                {lvl === 'Początkujący'
                  ? '🟢 Początkujący'
                  : lvl === 'Średniozaawansowany'
                  ? '🟡 Średniozaawansowany'
                  : lvl === 'Zaawansowany'
                  ? '🔴 Zaawansowany'
                  : 'Wszystkie poziomy'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LISTA ĆWICZEŃ ZE SKARBNICY Z KREATOREM SERII / POWTÓRZEŃ / PRZERW */}
        {filteredExercises.map((ex) => {
          const isRec = ex.recommendedSports.includes(sport);
          const cfg = exerciseConfigs[ex.id] || {
            sets: String(ex.defaultSets),
            repsOrSec: String(ex.defaultRepsOrSec),
            restSec: String(ex.defaultRestSec),
          };
          const setsNum = Math.max(1, parseInt(cfg.sets, 10) || ex.defaultSets);
          const totalXp = setsNum * ex.xpPerSet;

          return (
            <View key={ex.id} style={[styles.exerciseCard, isRec && styles.exerciseCardRec]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <View style={styles.modBadge}>
                    <Text style={styles.modBadgeText}>MODUŁ: {ex.module.toUpperCase()}</Text>
                  </View>
                  <View
                    style={[
                      styles.modBadge,
                      {
                        backgroundColor:
                          ex.difficulty === 'Początkujący'
                            ? '#dcfce7'
                            : ex.difficulty === 'Średniozaawansowany'
                            ? '#fef3c7'
                            : '#fee2e2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modBadgeText,
                        {
                          color:
                            ex.difficulty === 'Początkujący'
                              ? '#15803d'
                              : ex.difficulty === 'Średniozaawansowany'
                              ? '#b45309'
                              : '#dc2626',
                        },
                      ]}
                    >
                      {ex.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  {isRec && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>⭐ POLECANE DLA: {sportConfig.name.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.xpText}>+{totalXp} XP</Text>
              </View>

              <Text style={styles.exTitle}>{ex.title}</Text>
              <Text style={styles.exDesc}>{ex.description}</Text>

              {/* ELASTYCZNY KREATOR PARAMETRÓW ĆWICZENIA (SERIE, POWTÓRZENIA/SEKUNDY, PRZERWA) */}
              <View style={styles.prescriptionBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.prescriptionTitle}>⚙️ Konfiguracja Obciążenia (Periodyzacja):</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={styles.presetMiniChip} onPress={() => applyQuickProgressionPreset(ex, 'start')}>
                      <Text style={styles.presetMiniText}>Tydz. 1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.presetMiniChip} onPress={() => applyQuickProgressionPreset(ex, 'progres')}>
                      <Text style={styles.presetMiniText}>+Progres</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.presetMiniChip, { backgroundColor: '#dbeafe' }]} onPress={() => applyQuickProgressionPreset(ex, 'elite')}>
                      <Text style={[styles.presetMiniText, { color: '#1d4ed8' }]}>🔥 Miesiąc +1</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.prescriptionInputsRow}>
                  {/* LICZBA SERII */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>SERIE</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'sets', -1, 1)}>
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.sets}
                        onChangeText={(v) => updateExConfig(ex.id, 'sets', v)}
                      />
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'sets', 1, 1)}>
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* POWTÓRZENIA LUB SEKUNDY */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>{ex.unit === 'sek.' ? 'CZAS (SEK.)' : 'POWTÓRZENIA'}</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustExConfig(ex.id, 'repsOrSec', ex.unit === 'sek.' ? -5 : -2, 1)}
                      >
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.repsOrSec}
                        onChangeText={(v) => updateExConfig(ex.id, 'repsOrSec', v)}
                      />
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustExConfig(ex.id, 'repsOrSec', ex.unit === 'sek.' ? 5 : 2, 1)}
                      >
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* PRZERWA MIĘDZY SERIAMI */}
                  <View style={styles.paramCol}>
                    <Text style={styles.paramLabel}>PRZERWA (S)</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'restSec', -5, 0)}>
                        <Text style={styles.stepBtnTxt}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.paramInput}
                        keyboardType="numeric"
                        value={cfg.restSec}
                        onChangeText={(v) => updateExConfig(ex.id, 'restSec', v)}
                      />
                      <TouchableOpacity style={styles.stepBtn} onPress={() => adjustExConfig(ex.id, 'restSec', 5, 0)}>
                        <Text style={styles.stepBtnTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.prescriptionSummaryText}>
                  📋 Podsumowanie zadania: <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{cfg.sets || 1} serie x {cfg.repsOrSec || 1} {ex.unit}</Text> • Przerwa między seriami: <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>{cfg.restSec || 0} sek.</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => handleAssignToTeam(ex)}
                >
                  <Ionicons name="paper-plane-outline" size={15} color="#fff" />
                  <Text style={styles.assignBtnText}>Zadaj ({cfg.sets}x{cfg.repsOrSec} {ex.unit})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testScannerBtn}
                  onPress={() => handleStartTestScanner(ex)}
                >
                  <Ionicons name="videocam-outline" size={16} color="#2563eb" />
                  <Text style={styles.testScannerBtnText}>Wykonaj z AI</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>

      {/* MODAL SKANERA AI Z OBSŁUGĄ WIELU SERII I TIMERA PRZERWY */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
          <View style={styles.scannerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
                {previewExercise?.title}
              </Text>
              <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                Seria {activeSetNumber} z {totalSetsCount} • Cel: {targetRepsForSet} {previewExercise?.unit} • Przerwa: {configuredRestSeconds}s
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setScannerVisible(false)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Wybór zawodnika, któremu zapiszemy wykonanie do Tablicy Progresu */}
          {players.length > 0 && (
            <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 14, paddingBottom: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}>Zawodnik:</Text>
                {players.map((p) => {
                  const isSel = String(p.id) === String(selectedTestPlayerId);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1e293b' },
                        isSel && { backgroundColor: '#2563eb' },
                      ]}
                      onPress={() => setSelectedTestPlayerId(String(p.id))}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: isSel ? 'bold' : 'normal' }}>
                        {p.firstName} {p.lastName || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ flex: 1 }}>
            {previewExercise && (
              <>
                {(() => {
                  const vid = getExerciseMediaPipeVideo(previewExercise.drillType, previewExercise.title);
                  return (
                    <View style={styles.demoVideoContainer}>
                      <Video
                        style={{ width: '100%', height: 100 }}
                        source={{ uri: vid.uri }}
                        useNativeControls={false}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay
                        isMuted
                      />
                      <Text style={{ color: '#e2e8f0', fontSize: 10, fontWeight: 'bold', position: 'absolute', bottom: 4, backgroundColor: 'rgba(15,23,42,0.82)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        {vid.label}
                      </Text>
                    </View>
                  );
                })()}

                {isRestingBetweenSets ? (
                  <View style={styles.restOverlayBox}>
                    <Ionicons name="timer-outline" size={56} color="#38bdf8" />
                    <Text style={styles.restTitle}>Przerwa między seriami</Text>
                    <Text style={styles.restSub}>
                      Ukończono serię {activeSetNumber} z {totalSetsCount}. Przygotuj się do kolejnej serii!
                    </Text>
                    <Text style={styles.restTimerDigits}>{restCountdown} s</Text>
                    <TouchableOpacity
                      style={styles.skipRestBtn}
                      onPress={() => {
                        setIsRestingBetweenSets(false);
                        setActiveSetNumber((prev) => prev + 1);
                      }}
                    >
                      <Ionicons name="play-skip-forward" size={16} color="#fff" />
                      <Text style={styles.skipRestBtnText}>Pomiń przerwę i zacznij serię {activeSetNumber + 1}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MediaPipePoseScanner
                    key={`set-${activeSetNumber}`}
                    facing="front"
                    targetReps={targetRepsForSet}
                    drillType={previewExercise.drillType}
                    isHandheld={false}
                    onComplete={handleSetCompletedInScanner}
                  />
                )}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { paddingHorizontal: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catChipActive: { backgroundColor: '#0f172a' },
  catChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  catChipTextActive: { color: '#fff' },
  sportCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 95,
  },
  sportCardActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb', borderWidth: 1.5 },
  sportCardName: { fontSize: 11, color: '#334155', marginTop: 4, textAlign: 'center' },
  warmupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  yearPillActive: { backgroundColor: '#2563eb' },
  yearPillText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  modPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  modPillActive: { backgroundColor: '#2563eb' },
  modPillText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exerciseCardRec: { borderColor: '#60a5fa', borderWidth: 1.5 },
  modBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#2563eb' },
  recBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#854d0e' },
  xpText: { fontSize: 13, fontWeight: '900', color: '#16a34a' },
  exTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 6 },
  exDesc: { fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 17 },

  prescriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prescriptionTitle: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  presetMiniChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  presetMiniText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  prescriptionInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paramCol: { flex: 1, alignItems: 'center' },
  paramLabel: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 26,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnTxt: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  paramInput: {
    width: 42,
    height: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    padding: 0,
  },
  prescriptionSummaryText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },

  assignBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  assignBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  testScannerBtn: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 5,
  },
  testScannerBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0f172a',
  },
  demoVideoContainer: {
    backgroundColor: '#1e293b',
    height: 118,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restOverlayBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  restSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6 },
  restTimerDigits: {
    fontSize: 56,
    fontWeight: '900',
    color: '#38bdf8',
    marginVertical: 20,
    fontVariant: ['tabular-nums'],
  },
  skipRestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  skipRestBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  mainSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  mainSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  mainSwitchBtnActive: {
    backgroundColor: '#2563eb',
  },
  mainSwitchText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  mainSwitchTextActive: {
    color: '#ffffff',
  },
  aiHeroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  aiHeroTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  aiHeroSub: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginTop: 2,
  },
  moduleProgramCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ageBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  aiFocusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  aiFocusText: {
    flex: 1,
    fontSize: 11,
    color: '#5b21b6',
    fontWeight: '600',
  },
  weekSelectorBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekSelectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  weekPhaseText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  weekStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekMetricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  weekMetricChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekMetricVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  weekMetricLbl: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },

  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  yearChipActive: {
    backgroundColor: '#2563eb',
  },
  yearChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  yearChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modulePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  modulePillActive: {
    backgroundColor: '#2563eb',
  },
  modulePillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  modulePillTextActive: {
    color: '#ffffff',
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  moduleTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moduleTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 6,
  },
  exerciseDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 17,
  },
  exerciseActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  testAiBtn: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 5,
  },
  testAiBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
