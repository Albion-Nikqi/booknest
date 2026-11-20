import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext =  createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true)

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return null;
        }

        try {
            const res = await apiClient.get('/auth/me/');
            setUser(res.data);
            return res.data;
        }catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            return null;
        }finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const login = async (username, password) => {
        const res = await apiClient.post('/auth/login/', { username, password });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        const currentUser = await fetchCurrentUser();
        return currentUser;
    };

    const register = async (username, email, password) => {
        const res = await apiClient.post('/auth/register/', { username, email, password });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const isAuthenticated = Boolean(user);
    const isLibrarian = user?.role  === 'librarian';

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                isLibrarian,
                login, 
                register,
                logout,
               refreshUser: fetchCurrentUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth duhet te perdoret brenda nje AuthProvider');
    }
    return context;
}