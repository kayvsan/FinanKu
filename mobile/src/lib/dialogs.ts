import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert does nothing, so the browser build uses the window dialogs

export function showAlert(message: string, title = 'FinTrack.id') {
  if (Platform.OS === 'web') {
    globalThis.alert?.(message);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAsync(message: string, { title = 'Konfirmasi', confirmText = 'Ya', destructive = true } = {}) {
  if (Platform.OS === 'web') return Promise.resolve(Boolean(globalThis.confirm?.(message)));
  return new Promise<boolean>(resolve => {
    Alert.alert(title, message, [
      { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
