import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { ROLES } from '../config/roles';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fmms_jwt_token';
const USER_KEY = 'fmms_user';

export const normalizeRole = (role) => {
  const cleaned = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (cleaned === ROLES.ADMIN || cleaned === 'super_admin' || cleaned === 'superadmin') {
    return ROLES.ADMIN;
  }
  if (cleaned === ROLES.MANAGER) {
    return ROLES.MANAGER;
  }
  return ROLES.REPRESENTATIVE;
};

const extractSession = (data) => {
  const token = data?.token || data?.data?.token || '';
  const rawUser = data?.user || data?.data?.user || data?.data || {};
  const rawRole =
    rawUser.role ??
    rawUser.userRole ??
    rawUser.accountType ??
    data?.role ??
    ROLES.REPRESENTATIVE;

  return {
    token,
    user: {
      ...rawUser,
      id: rawUser.id || rawUser._id,
      role: normalizeRole(rawRole),
    },
  };
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: parsed?.id || parsed?._id,
        role: normalizeRole(parsed?.role),
      };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      const session = extractSession(data);
      setToken(session.token);
      setUser(session.user);
      return session.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (details) => {
    setLoading(true);
    try {
      const data = await authService.register(details);
      if (data?.token || data?.data?.token) {
        const session = extractSession(data);
        setToken(session.token);
        setUser(session.user);
        return { signedIn: true, user: session.user, message: data?.message };
      }
      return {
        signedIn: false,
        message: data?.message || 'Registration successful. Please sign in.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}