import { supabase, type CheckIn } from '../lib/supabaseClient';

/**
 * 记录打卡
 */
export async function checkIn(userId: string): Promise<CheckIn | null> {
    const { data, error } = await supabase
        .from('check_ins')
        .insert({ user_id: userId })
        .select()
        .single();

    if (error) {
        console.error('Error recording check-in:', error);
        return null;
    }

    return data;
}

/**
 * 获取今日打卡状态
 */
export async function getTodayCheckIn(userId: string): Promise<CheckIn | null> {
    // 获取今天的开始时间（UTC）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .gte('checked_at', today.toISOString())
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching today check-in:', error);
        return null;
    }

    return data || null;
}

/**
 * 获取打卡历史
 */
export async function getCheckInHistory(userId: string, days: number = 30): Promise<CheckIn[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .gte('checked_at', startDate.toISOString())
        .order('checked_at', { ascending: false });

    if (error) {
        console.error('Error fetching check-in history:', error);
        return [];
    }

    return data || [];
}

/**
 * 获取最后一次打卡
 */
export async function getLastCheckIn(userId: string): Promise<CheckIn | null> {
    const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching last check-in:', error);
        return null;
    }

    return data || null;
}

/**
 * 计算连续打卡天数
 */
export async function getCheckInStreak(userId: string): Promise<number> {
    const history = await getCheckInHistory(userId, 365);

    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 按日期分组
    const checkInDates = new Set(
        history.map(ci => {
            const date = new Date(ci.checked_at);
            date.setHours(0, 0, 0, 0);
            return date.toISOString();
        })
    );

    // 从今天开始往回数
    let currentDate = new Date(today);
    while (checkInDates.has(currentDate.toISOString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

/**
 * 计算自出生以来的天数
 */
export function calculateDaysAlive(birthday: string | null): number {
    if (!birthday) {
        // 默认值：假设用户34岁
        return 34 * 365;
    }

    const birthDate = new Date(birthday);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}
