// 自定义手机号认证服务 - 不依赖 Supabase Auth
import { supabase } from '../lib/supabaseClient';

// 简单的密码哈希（生产环境应使用 bcrypt 等）
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'life_guardian_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await hashPassword(password);
    return inputHash === hash;
}

export interface AppUser {
    id: string;
    phone: string;
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
    birthday: string | null;
    hobbies: string | null;
    membership: string;
    created_at: string;
    updated_at: string;
}

// 用户注册
export async function registerWithPhone(phone: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
    try {
        // 检查手机号是否已注册
        const { data: existing } = await supabase
            .from('app_users')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existing) {
            return { user: null, error: '该手机号已被注册' };
        }

        // 密码哈希
        const passwordHash = await hashPassword(password);

        // 创建用户
        const { data, error } = await supabase
            .from('app_users')
            .insert({
                phone,
                password_hash: passwordHash,
                name: phone, // 默认用手机号作为名称
            })
            .select()
            .single();

        if (error) {
            console.error('注册错误:', error);
            return { user: null, error: '注册失败，请稍后重试' };
        }

        // 保存到本地存储
        localStorage.setItem('app_user', JSON.stringify(data));

        return { user: data as AppUser, error: null };
    } catch (err) {
        console.error('注册异常:', err);
        return { user: null, error: '网络错误，请稍后重试' };
    }
}

// 用户登录
export async function loginWithPhone(phone: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
    try {
        // 查找用户
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error || !data) {
            return { user: null, error: '手机号或密码错误' };
        }

        // 验证密码
        const isValid = await verifyPassword(password, data.password_hash);
        if (!isValid) {
            return { user: null, error: '手机号或密码错误' };
        }

        // 移除密码哈希后返回
        const { password_hash, ...userWithoutPassword } = data;

        // 保存到本地存储
        localStorage.setItem('app_user', JSON.stringify(userWithoutPassword));

        return { user: userWithoutPassword as AppUser, error: null };
    } catch (err) {
        console.error('登录异常:', err);
        return { user: null, error: '网络错误，请稍后重试' };
    }
}

// 获取当前用户
export function getCurrentUser(): AppUser | null {
    const stored = localStorage.getItem('app_user');
    if (stored) {
        try {
            return JSON.parse(stored) as AppUser;
        } catch {
            return null;
        }
    }
    return null;
}

// 退出登录
export function logout(): void {
    localStorage.removeItem('app_user');
}

// 更新用户信息
export async function updateUser(userId: string, updates: Partial<AppUser>): Promise<{ user: AppUser | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('app_users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return { user: null, error: '更新失败' };
        }

        // 更新本地存储
        const { password_hash, ...userWithoutPassword } = data;
        localStorage.setItem('app_user', JSON.stringify(userWithoutPassword));

        return { user: userWithoutPassword as AppUser, error: null };
    } catch (err) {
        return { user: null, error: '网络错误' };
    }
}
