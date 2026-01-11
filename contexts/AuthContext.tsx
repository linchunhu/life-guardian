// 自定义认证上下文 - 使用手机号认证
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    AppUser,
    getCurrentUser,
    loginWithPhone,
    registerWithPhone,
    logout as logoutService,
    updateUser
} from '../services/phoneAuthService';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    login: (phone: string, password: string) => Promise<{ error: string | null }>;
    register: (phone: string, password: string) => Promise<{ error: string | null }>;
    logout: () => void;
    updateProfile: (updates: Partial<AppUser>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 检查本地存储的用户
        const storedUser = getCurrentUser();
        setUser(storedUser);
        setLoading(false);
    }, []);

    const login = async (phone: string, password: string) => {
        const result = await loginWithPhone(phone, password);
        if (result.user) {
            setUser(result.user);
        }
        return { error: result.error };
    };

    const register = async (phone: string, password: string) => {
        const result = await registerWithPhone(phone, password);
        if (result.user) {
            setUser(result.user);
        }
        return { error: result.error };
    };

    const logout = () => {
        logoutService();
        setUser(null);
    };

    const updateProfile = async (updates: Partial<AppUser>) => {
        if (!user) return { error: '未登录' };
        const result = await updateUser(user.id, updates);
        if (result.user) {
            setUser(result.user);
        }
        return { error: result.error };
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
