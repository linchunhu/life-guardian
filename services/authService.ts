import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
    user: User | null;
    session: Session | null;
    error: Error | null;
}

/**
 * 用户注册
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    return {
        user: data.user,
        session: data.session,
        error: error,
    };
}

/**
 * 用户登录
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return {
        user: data.user,
        session: data.session,
        error: error,
    };
}

/**
 * 用户登出
 */
export async function signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * 获取当前会话
 */
export async function getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
}
