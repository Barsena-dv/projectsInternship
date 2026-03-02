import { createContext, useCallback, useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await axiosInstance.get('/auth/me');
            if (response.data.success) {
                setUser(response.data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = (data) => {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};