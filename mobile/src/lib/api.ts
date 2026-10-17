// Client for the Flask API (backend/). Mirrors website/src/shared/api/client.js, but the
// refresh token is sent as a Bearer header (no cookies in React Native) and kept in SecureStore.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { loadRefreshToken, saveRefreshToken } from './tokenStorage';
import type { User } from './types';

const API_PORT = 5000;
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Where the API lives:
 * 1. EXPO_PUBLIC_API_URL (e.g. http://192.168.1.10:5000/api) when set in mobile/.env
 * 2. In development, the computer running `npx expo start` — Expo Go already knows its LAN address
 * 3. localhost (browser build / emulator on the same machine)
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const hostUri = Constants.expoConfig?.hostUri; // "192.168.1.10:8081"
  const host = hostUri?.split(':')[0];
  if (host && Platform.OS !== 'web') return `http://${host}:${API_PORT}/api`;
  return `http://localhost:${API_PORT}/api`;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

let accessToken: string | null = null;
let refreshPromise: Promise<Session> | null = null;
let onUnauthorized: () => void = () => {};

// Requests in flight, for the global progress bar (useSyncExternalStore)
let pending = 0;
const pendingListeners = new Set<() => void>();
function setPending(delta: number) {
  pending += delta;
  pendingListeners.forEach(l => l());
}
export function subscribePending(listener: () => void) {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}
export const getPendingCount = () => pending;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request(path: string, { method = 'GET', body, token = accessToken }: RequestOptions = {}) {
  const headers: Record<string, string> = { 'X-Client': 'mobile', Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  setPending(1);
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // empty / non-JSON body
    }
    return { res, data };
  } catch {
    throw new ApiError(
      `Server tidak dapat dihubungi (${getApiBaseUrl()}). Pastikan backend berjalan dan HP satu Wi-Fi dengan komputer.`,
      0,
    );
  } finally {
    clearTimeout(timer);
    setPending(-1);
  }
}

function toError(res: Response, data: any) {
  return new ApiError(data?.error || `Permintaan gagal (${res.status}).`, res.status);
}

/** Trade the stored refresh token for a new access token; concurrent callers share one request. */
export function refreshSession(): Promise<Session> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await loadRefreshToken();
      if (!refreshToken) throw new ApiError('Belum login.', 401);
      const { res, data } = await request('/auth/refresh', { method: 'POST', token: refreshToken });
      if (!res.ok) {
        if (res.status === 401) await saveRefreshToken(null);
        throw toError(res, data);
      }
      setAccessToken(data.accessToken);
      return data as Session;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch<T = any>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
  let { res, data } = await request(path, options);
  if (res.status === 401 && !path.startsWith('/auth/')) {
    try {
      await refreshSession();
    } catch (err) {
      setAccessToken(null);
      onUnauthorized();
      throw err;
    }
    ({ res, data } = await request(path, options));
  }
  if (!res.ok) throw toError(res, data);
  return data as T;
}

/** login/register: keep the access token in memory and the refresh token in secure storage */
export async function startSession(path: '/auth/login' | '/auth/register', username: string, password: string) {
  const data = await apiFetch<Session>(path, { method: 'POST', body: { username, password } });
  setAccessToken(data.accessToken);
  await saveRefreshToken(data.refreshToken ?? null);
  return data;
}

export async function endSession() {
  const refreshToken = await loadRefreshToken();
  try {
    if (refreshToken) await request('/auth/logout', { method: 'POST', token: refreshToken });
  } catch {
    // offline: still forget the tokens locally
  } finally {
    setAccessToken(null);
    await saveRefreshToken(null);
  }
}
