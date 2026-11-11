import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import {
  ACCESS_TOKEN_KEY,
  clearAuthToken,
  REFRESH_TOKEN_KEY,
  setAuthToken,
  USER_KEY
} from '../api/axios';

export const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);
  const [student, setStudent] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const applyMe = useCallback((data) => {
    setUser(data.user);
    setStudent(data.student || null);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken: newAccessToken, refreshToken } = response.data.data;
    // localStorage keeps MVP sessions simple, but is readable by injected scripts; httpOnly cookies reduce that exposure.
    setAuthToken(newAccessToken, refreshToken, loggedInUser);
    setAccessToken(newAccessToken);
    setUser(loggedInUser);
    const me = await authApi.me();
    applyMe(me.data.data);
    return me.data.data.user;
  }, [applyMe]);

  const register = useCallback(async (payload) => {
    const response = await authApi.register(payload);
    const { user: registeredUser, accessToken: newAccessToken, refreshToken } = response.data.data;
    setAuthToken(newAccessToken, refreshToken, registeredUser);
    setAccessToken(newAccessToken);
    setUser(registeredUser);
    const me = await authApi.me();
    applyMe(me.data.data);
    return me.data.data.user;
  }, [applyMe]);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(ACCESS_TOKEN_KEY)) await authApi.logout();
    } finally {
      clearAuthToken();
      setAccessToken(null);
      setUser(null);
      setStudent(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const refresh = useCallback(async () => {
    const response = await authApi.me();
    applyMe(response.data.data);
    return response.data.data;
  }, [applyMe]);

  useEffect(() => {
    let active = true;
    const handleAuthExpired = () => {
      clearAuthToken();
      setAccessToken(null);
      setUser(null);
      setStudent(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener('scap:auth-expired', handleAuthExpired);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      clearAuthToken();
      setUser(null);
      setStudent(null);
      setAccessToken(null);
      setLoading(false);
      return () => {
        active = false;
        window.removeEventListener('scap:auth-expired', handleAuthExpired);
      };
    }
    setAuthToken(token, localStorage.getItem(REFRESH_TOKEN_KEY), readStoredUser());
    authApi.me()
      .then((response) => {
        if (active) applyMe(response.data.data);
      })
      .catch(() => {
        clearAuthToken();
        if (active) {
          setUser(null);
          setStudent(null);
          setAccessToken(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener('scap:auth-expired', handleAuthExpired);
    };
  }, [applyMe, navigate]);

  const value = useMemo(() => ({
    user,
    student,
    accessToken,
    loading,
    login,
    register,
    logout,
    refresh
  }), [user, student, accessToken, loading, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
