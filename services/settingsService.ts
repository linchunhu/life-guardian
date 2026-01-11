import { supabase, type Profile, type EmailConfig, type UserSettings } from '../lib/supabaseClient';

// ============================================
// Profile 相关
// ============================================

/**
 * 获取用户资料
 */
export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

/**
 * 更新用户资料
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }

    return data;
}

/**
 * 上传头像
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading avatar:', error);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

    // 更新 profile 中的 avatar_url
    await updateProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
}

// ============================================
// Email Config 相关
// ============================================

/**
 * 获取邮件配置
 */
export async function getEmailConfig(userId: string): Promise<EmailConfig | null> {
    const { data, error } = await supabase
        .from('email_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching email config:', error);
        return null;
    }

    return data;
}

/**
 * 更新或创建邮件配置
 */
export async function updateEmailConfig(userId: string, config: {
    subject: string;
    body: string;
}): Promise<EmailConfig | null> {
    // 先检查是否存在
    const existing = await getEmailConfig(userId);

    if (existing) {
        const { data, error } = await supabase
            .from('email_configs')
            .update({ ...config, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating email config:', error);
            return null;
        }
        return data;
    } else {
        const { data, error } = await supabase
            .from('email_configs')
            .insert({ user_id: userId, ...config })
            .select()
            .single();

        if (error) {
            console.error('Error creating email config:', error);
            return null;
        }
        return data;
    }
}

// ============================================
// User Settings 相关
// ============================================

/**
 * 获取用户设置
 */
export async function getSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return null;
    }

    return data;
}

/**
 * 更新或创建用户设置
 */
export async function updateSettings(userId: string, settings: {
    do_not_disturb?: boolean;
    push_enabled?: boolean;
    sound?: string;
    vibration?: string;
    detection_period_hours?: number;
}): Promise<UserSettings | null> {
    // 先检查是否存在
    const existing = await getSettings(userId);

    if (existing) {
        const { data, error } = await supabase
            .from('user_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating settings:', error);
            return null;
        }
        return data;
    } else {
        const { data, error } = await supabase
            .from('user_settings')
            .insert({ user_id: userId, ...settings })
            .select()
            .single();

        if (error) {
            console.error('Error creating settings:', error);
            return null;
        }
        return data;
    }
}

/**
 * 获取默认设置值
 */
export function getDefaultSettings(): Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    return {
        do_not_disturb: false,
        push_enabled: true,
        sound: '默认 (Radar)',
        vibration: '心跳节奏',
        detection_period_hours: 72,
    };
}
