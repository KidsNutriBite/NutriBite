import { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../api/auth.api';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const { data } = await authService.getMe();
                    setUser(data); // data is { _id, name, email, role }
                } catch (error) {
                    console.error('Auth check failed', error);
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        const { data } = await authService.login(email, password);
        // data structure: { user: {...}, token: "..." }
        // Storing token in localStorage for Phase 1 simplicity.
        // TODO: Move to HttpOnly cookie for enhanced security in production.
        if (rememberMe) {
            localStorage.setItem('token', data.token);
            sessionStorage.removeItem('token');
        } else {
            sessionStorage.setItem('token', data.token);
            localStorage.removeItem('token');
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data.user;
    };

    const register = async (userData) => {
        const { data } = await authService.register(userData);
        localStorage.setItem('token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
