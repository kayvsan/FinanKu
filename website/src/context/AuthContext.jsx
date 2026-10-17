import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, logoutRequest, refreshSession, setAccessToken, setUnauthorizedHandler } from '../shared/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // status: 'loading' while restoring a session from the refresh cookie, then 'authenticated' | 'anonymous'
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    refreshSession()
      .then(data => {
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(clearSession);
  }, [clearSession]);

  const startSession = (data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  };

  const register = async (username, password) => {
    startSession(await apiFetch('/auth/register', { method: 'POST', body: { username, password } }));
  };

  const login = async (username, password) => {
    startSession(await apiFetch('/auth/login', { method: 'POST', body: { username, password } }));
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  };

  const value = {
    status,
    currentUser: user?.username ?? null,
    register,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
