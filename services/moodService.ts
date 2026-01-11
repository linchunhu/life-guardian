import { supabase, type Mood } from '../lib/supabaseClient';

export type MoodType = 'calm' | 'happy' | 'tired' | 'sad' | 'anxious';

/**
 * 记录心情
 */
export async function recordMood(userId: string, mood: MoodType): Promise<Mood | null> {
    const { data, error } = await supabase
        .from('moods')
        .insert({ user_id: userId, mood })
        .select()
        .single();

    if (error) {
        console.error('Error recording mood:', error);
        return null;
    }

    return data;
}

/**
 * 获取今日心情
 */
export async function getTodayMood(userId: string): Promise<Mood | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today mood:', error);
        return null;
    }

    return data || null;
}

/**
 * 获取心情历史
 */
export async function getMoodHistory(userId: string, days: number = 7): Promise<Mood[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

    if (error) {
        console.error('Error fetching mood history:', error);
        return [];
    }

    return data || [];
}

/**
 * 获取心情统计数据（用于图表）
 */
export async function getMoodStats(userId: string, days: number = 7): Promise<{ day: string; value: number }[]> {
    const history = await getMoodHistory(userId, days);

    // 心情值映射
    const moodValues: Record<MoodType, number> = {
        happy: 100,
        calm: 75,
        tired: 50,
        sad: 25,
        anxious: 35,
    };

    // 按日期分组并计算平均值
    const dayStats: Record<string, { total: number; count: number }> = {};

    history.forEach(mood => {
        const date = new Date(mood.recorded_at);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (!dayStats[dayKey]) {
            dayStats[dayKey] = { total: 0, count: 0 };
        }

        dayStats[dayKey].total += moodValues[mood.mood] || 50;
        dayStats[dayKey].count += 1;
    });

    // 生成过去N天的数据
    const result: { day: string; value: number }[] = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayKey = weekdays[date.getDay()];

        if (dayStats[dayKey] && dayStats[dayKey].count > 0) {
            result.push({
                day: dayKey,
                value: Math.round(dayStats[dayKey].total / dayStats[dayKey].count),
            });
        } else {
            result.push({ day: dayKey, value: 50 }); // 默认中间值
        }
    }

    return result;
}

/**
 * 获取最常见的心情
 */
export async function getDominantMood(userId: string, days: number = 7): Promise<MoodType | null> {
    const history = await getMoodHistory(userId, days);

    if (history.length === 0) return null;

    const moodCounts: Record<string, number> = {};
    history.forEach(mood => {
        moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    });

    const dominantMood = Object.entries(moodCounts).reduce((a, b) =>
        a[1] > b[1] ? a : b
    );

    return dominantMood[0] as MoodType;
}
