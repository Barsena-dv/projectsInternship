import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

export const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  return {
    id: rawUser.id || rawUser._id,
    full_name: rawUser.full_name || rawUser.fullName || rawUser.name || '',
    email: rawUser.email,
    phone: rawUser.phone,
    role: rawUser.role,
    accountStatus: rawUser.accountStatus,
    isVerified: rawUser.isVerified,
    profileImage: rawUser.profileImage,
    ratingAvg: rawUser.ratingAvg,
    ratingCount: rawUser.ratingCount,
    createdAt: rawUser.createdAt,
  };
};

export const getRoleHomePath = (role) => {
  if (role === 'owner') return '/owner/dashboard';
  if (role === 'finder') return '/finder/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/login';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pnf_token') || null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    const storedToken = localStorage.getItem('pnf_token');
    const storedUser = localStorage.getItem('pnf_user');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    if (storedUser) {
      try {
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem('pnf_user');
      }
    }

    try {
      const response = await authApi.me();
      const freshUser = normalizeUser(response.data);
      setUser(freshUser);
      localStorage.setItem('pnf_user', JSON.stringify(freshUser));
    } catch {
      localStorage.removeItem('pnf_token');
      localStorage.removeItem('pnf_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const authToken = response?.data?.token;
    const loginUser = normalizeUser(response?.data?.user);

    localStorage.setItem('pnf_token', authToken);
    localStorage.setItem('pnf_user', JSON.stringify(loginUser));
    setToken(authToken);
    setUser(loginUser);

    return loginUser;
  }, []);

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const refreshMe = useCallback(async () => {
    const response = await authApi.me();
    const profile = normalizeUser(response.data);
    setUser(profile);
    localStorage.setItem('pnf_user', JSON.stringify(profile));
    return profile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pnf_token');
    localStorage.removeItem('pnf_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
