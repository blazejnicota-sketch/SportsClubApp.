import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../services/supabase';

// Konfiguracja zachowania powiadomień, gdy aplikacja jest otworzona
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(playerId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Brak zgody na powiadomienia Push!');
      return;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
      console.log('Expo Push Token:', token);

      if (playerId && token) {
        await supabase
          .from('players')
          .update({ push_token: token })
          .eq('id', playerId);
      }
    } catch (e) {
      console.log('Błąd podczas generowania tokena push:', e);
    }
  } else {
    console.log('Powiadomienia Push działają tylko na fizycznych urządzeniach.');
  }

  return token;
}