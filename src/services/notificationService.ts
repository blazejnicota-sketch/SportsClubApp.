import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

// Konfiguracja zachowania powiadomień gdy aplikacja jest otwarta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  // Prośba o uprawnienia do powiadomień i pobranie Expo Push Token
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Brak uprawnień', 'Nie włączono powiadomień push dla tej aplikacji.');
        return null;
      }
      
      // Pobranie tokenu urządzenia do powiadomień zdalnych
      const tokenData = await Notifications.getExpoPushTokenAsync();
      console.log('Expo Push Token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.log('Błąd podczas pobierania uprawnień/tokenu:', error);
      return null;
    }
  },

  // Natychmiastowe powiadomienie testowe / alert
  async sendLocalAlert(title: string, body: string) {
    const token = await this.requestPermissions();
    if (!token) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
      },
      trigger: null,
    });
  },

  // Zaplanowanie powiadomienia o zbiórce meczowej
  async scheduleMatchReminder(matchTitle: string, secondsInFuture: number) {
    const token = await this.requestPermissions();
    if (!token) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚽ Zbliża się zbiórka!',
        body: `Wydarzenie: ${matchTitle}. Nie zapomnij sprzętu i staw się na czas!`,
        sound: 'default',
      },
      trigger: { seconds: secondsInFuture } as any,
    });
  },

  // NOWOŚĆ: Zdalne wysyłanie powiadomienia Push do urządzenia przez serwer/API Expo
  async sendPushNotification(expoPushToken: string, title: string, body: string) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { academyApp: true },
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.log('Błąd wysyłania powiadomienia push:', error);
    }
  }
};