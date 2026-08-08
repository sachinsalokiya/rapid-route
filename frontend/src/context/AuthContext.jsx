import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rr_user')) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('rr_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('rr_token')));

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
        localStorage.setItem('rr_user', JSON.stringify(data.data.user));
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem('rr_token');
        localStorage.removeItem('rr_user');
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('rr_token', data.data.token);
        localStorage.setItem('rr_user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return data.data.user;
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        localStorage.setItem('rr_token', data.data.token);
        localStorage.setItem('rr_user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return data.data.user;
      },
      logout() {
        localStorage.removeItem('rr_token');
        localStorage.removeItem('rr_user');
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
