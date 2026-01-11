import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface Profile {
    id: string;
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    birthday: string | null;
    hobbies: string | null;
    membership: string;
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: string;
    user_id: string;
    name: string;
    role: string;
    role_color_class: string | null;
    email: string;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CheckIn {
    id: string;
    user_id: string;
    checked_at: string;
}

export interface Mood {
    id: string;
    user_id: string;
    mood: 'calm' | 'happy' | 'tired' | 'sad' | 'anxious';
    recorded_at: string;
}

export interface WillItem {
    id: string;
    user_id: string;
    type: 'video' | 'letter' | 'asset' | 'audio';
    title: string;
    status: 'ready' | 'draft' | 'unconfigured';
    description: string | null;
    file_url: string | null;
    meta: string | null;
    meta_icon: string | null;
    created_at: string;
    updated_at: string;
}

export interface EmailConfig {
    id: string;
    user_id: string;
    subject: string;
    body: string;
    created_at: string;
    updated_at: string;
}

export interface UserSettings {
    id: string;
    user_id: string;
    do_not_disturb: boolean;
    push_enabled: boolean;
    sound: string;
    vibration: string;
    detection_period_hours: number;
    created_at: string;
    updated_at: string;
}
