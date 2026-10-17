import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The refresh token lives in the device keychain / keystore. SecureStore has no web implementation,
// so the browser build (only used for development) falls back to localStorage.
const REFRESH_KEY = 'fintrack.refreshToken';

export async function loadRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(REFRESH_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function saveRefreshToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (token) globalThis.localStorage?.setItem(REFRESH_KEY, token);
      else globalThis.localStorage?.removeItem(REFRESH_KEY);
    } catch {
      // storage unavailable (private mode); the session just won't survive a reload
    }
    return;
  }
  if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_KEY);
}
