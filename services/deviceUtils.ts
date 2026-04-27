import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getDevicePushTokenAsync() {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    const pushToken = await Notifications.getDevicePushTokenAsync();
    return pushToken.data;
  } catch (error) {
    console.error('Erro ao capturar o token do dispositivo:', error);
    return null;
  }
}

export async function getBatteryPercentage(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();

    if (level === -1 || level === null) {
      return null;
    }

    return Math.round(level * 100);
  } catch (error) {
    console.error('Erro ao ler a bateria:', error);
    return null;
  }
}
