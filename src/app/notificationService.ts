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
  // Prośba o uprawnienia do powiadomień
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Brak uprawnień', 'Nie włączono powiadomień push dla tej aplikacji.');
      return false;
    }
    return true;
  },

  // Natychmiastowe powiadomienie testowe / alert
  async sendLocalAlert(title: string, body: string) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

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
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚽ Zbliża się zbiórka!',
        body: `Wydarzenie: ${matchTitle}. Nie zapomnij sprzętu i staw się na czas!`,
        sound: 'default',
      },
      trigger: { seconds: secondsInFuture } as any,
    });
  }
};