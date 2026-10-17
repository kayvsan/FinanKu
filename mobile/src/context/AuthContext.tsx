import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { endSession, refreshSession, setUnauthorizedHandler, startSession } from '@/lib/api';
import type { User } from '@/lib/types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthValue {
  status: Status;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Restore the session from the refresh token in secure storage
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    refreshSession()
      .then(data => {
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(clearSession);
  }, [clearSession]);

  const login = async (username: string, password: string) => {
    const data = await startSession('/auth/login', username, password);
    setUser(data.user);
    setStatus('authenticated');
  };

  const register = async (username: string, password: string) => {
    const data = await startSession('/auth/register', username, password);
    setUser(data.user);
    setStatus('authenticated');
  };

  const logout = async () => {
    try {
      await endSession();
    } finally {
      clearSession();
    }
  };

  return <AuthContext.Provider value={{ status, user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
