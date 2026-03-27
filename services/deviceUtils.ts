import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura como o celular reage se a notificação chegar com o App aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function getDevicePushTokenAsync() {
  if (!Device.isDevice) {
    console.log('⚠️ Notificações Push só funcionam em dispositivos físicos.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('⚠️ Permissão negada pelo usuário para Push Notifications.');
    return null;
  }

  // Configuração obrigatória para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    // Retorna o Device Push Token (FCM Token no Android)
    const pushToken = await Notifications.getDevicePushTokenAsync();
    return pushToken.data;
  } catch (error) {
    console.error('❌ Erro ao capturar o token FCM:', error);
    return null;
  }
}

export async function getBatteryPercentage(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    // O nível retorna entre 0 e 1 (ex: 0.85 = 85%)
    // -1 significa emulador ou não suportado
    if (level === -1 || level === null) return null;
    return Math.round(level * 100);
  } catch (error) {
    console.error('❌ Erro ao ler a bateria:', error);
    return null;
  }
}