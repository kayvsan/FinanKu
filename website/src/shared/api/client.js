// Thin fetch wrapper for the Flask API (proxied by Vite at /api).
// The access token lives only in memory; the refresh token is an httpOnly cookie the browser sends to /api/auth.

let accessToken = null;
let refreshPromise = null;
let onUnauthorized = () => {};

// Number of requests in flight, observed by the global progress bar (useSyncExternalStore)
let pending = 0;
const pendingListeners = new Set();

function setPending(delta) {
  pending += delta;
  pendingListeners.forEach(listener => listener());
}

export function subscribePending(listener) {
  pendingListeners.add(listener);
  return () => pendingListeners.delete(listener);
}

export function getPendingCount() {
  return pending;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function readCookie(name) {
  const match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, credentials: 'same-origin', headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (accessToken) init.headers.Authorization = `Bearer ${accessToken}`;
  setPending(1);
  try {
    const res = await fetch(`/api${path}`, init);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // empty or non-JSON body (e.g. backend not running behind the proxy)
    }
    return { res, data };
  } catch {
    throw new Error('Server tidak dapat dihubungi. Periksa koneksi atau pastikan backend berjalan.');
  } finally {
    setPending(-1);
  }
}

function toError(res, data) {
  const err = new Error(data?.error || (res.status >= 500 ? 'Server tidak dapat dihubungi.' : `Permintaan gagal (${res.status}).`));
  err.status = res.status;
  return err;
}

// Exchange the refresh cookie for a new access token; concurrent callers share one request
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrf = readCookie('csrf_refresh_token');
      const { res, data } = await request('/auth/refresh', {
        method: 'POST',
        headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {}
      });
      if (!res.ok) throw toError(res, data);
      setAccessToken(data.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
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
  return data;
}

export async function logoutRequest() {
  const csrf = readCookie('csrf_refresh_token');
  try {
    await request('/auth/logout', { method: 'POST', headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {} });
  } finally {
    setAccessToken(null);
  }
}
