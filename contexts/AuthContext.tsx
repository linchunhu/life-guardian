import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser, onAuthStateChange, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../services/authService';
import { getProfile } from '../services/settingsService';
import type { Profile } from '../lib/supabaseClient';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // 加载用户资料
    const loadProfile = async (userId: string) => {
        const profileData = await getProfile(userId);
        setProfile(profileData);
    };

    // 刷新用户资料
    const refreshProfile = async () => {
        if (user) {
            await loadProfile(user.id);
        }
    };

    // 初始化并监听认证状态
    useEffect(() => {
        // 获取当前用户
        getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadProfile(currentUser.id);
            }
            setLoading(false);
        });

        // 监听认证状态变化
        const unsubscribe = onAuthStateChange((newUser) => {
            setUser(newUser);
            if (newUser) {
                loadProfile(newUser.id);
            } else {
                setProfile(null);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // 登录
    const signIn = async (email: string, password: string) => {
        const result = await authSignIn(email, password);
        if (result.error) {
            return { error: result.error };
        }
        if (result.user) {
            setUser(result.user);
            await loadProfile(result.user.id);
        }
        return { error: null };
    };

    // 注册
    const signUp = async (email: string, password: string) => {
        const result = await authSignUp(email, password);
        if (result.error) {
            return { error: result.error };
        }
        if (result.user) {
            setUser(result.user);
            // 新用户 profile 由数据库触发器自动创建
            await loadProfile(result.user.id);
        }
        return { error: null };
    };

    // 登出
    const signOut = async () => {
        await authSignOut();
        setUser(null);
        setProfile(null);
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
