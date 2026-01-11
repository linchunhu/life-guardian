import React, { useState, useEffect } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getMoodStats, getDominantMood, type MoodType } from '../services/moodService';
import { getCheckInHistory, calculateDaysAlive } from '../services/checkInService';

interface StatsScreenProps {
    onNavigate: (screen: Screen) => void;
}

const MOOD_LABELS: Record<MoodType, string> = {
    happy: '愉悦',
    calm: '平静',
    tired: '疲惫',
    sad: '忧伤',
    anxious: '焦虑',
};

export const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
    const { user, profile } = useAuth();
    const [moodData, setMoodData] = useState<{ name: string; uv: number }[]>([]);
    const [dominantMood, setDominantMood] = useState<MoodType | null>(null);
    const [daysAlive, setDaysAlive] = useState(12450);
    const [remainingDays, setRemainingDays] = useState(16200);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, profile]);

    const loadData = async () => {
        if (!user) return;

        // 获取心情数据
        const stats = await getMoodStats(user.id, 7);
        setMoodData(stats.map(s => ({ name: s.day, uv: s.value })));

        // 获取主要心情
        const mood = await getDominantMood(user.id, 7);
        setDominantMood(mood);

        // 计算在世天数
        if (profile?.birthday) {
            const days = calculateDaysAlive(profile.birthday);
            setDaysAlive(days);
            // 假设平均寿命78岁
            const avgLifespan = 78 * 365;
            setRemainingDays(Math.max(0, avgLifespan - days));
        }
    };

    // 计算已度过人生百分比
    const lifePercentage = ((daysAlive / (daysAlive + remainingDays)) * 100).toFixed(1);

    return (
        <div className="relative flex h-full flex-col bg-[#102216] text-white">
            {/* Custom Styles for Hourglass */}
            <style>{`
        .hourglass-container {
            position: relative;
            width: 80px;
            height: 120px;
            margin: 0 auto;
        }
        .hourglass-glass {
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.05);
            clip-path: polygon(0% 0%, 100% 0%, 55% 50%, 100% 100%, 0% 100%, 45% 50%);
            position: absolute;
            top: 0;
            left: 0;
            border: 2px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
            z-index: 10;
        }
        .sand-top {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 50%;
            clip-path: polygon(0% 0%, 100% 0%, 55% 100%, 45% 100%);
            z-index: 5;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }
        .sand-top-fill {
            width: 100%;
            height: ${100 - parseFloat(lifePercentage)}%;
            background-color: #3b5443;
        }
        .sand-bottom {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            bottom: 0;
            clip-path: polygon(55% 0%, 100% 100%, 0% 100%, 45% 0%);
            z-index: 5;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }
        .sand-bottom-fill {
            width: 100%;
            height: ${lifePercentage}%;
            background: linear-gradient(to top, #13ec5b, #0bda43);
            box-shadow: 0 0 20px #13ec5b;
        }
        .sand-stream {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 50%;
            background: #13ec5b;
            z-index: 4;
            opacity: 0.8;
        }
        .pulse-dot {
            box-shadow: 0 0 0 0 rgba(19, 236, 91, 0.7);
            animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 236, 91, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(19, 236, 91, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(19, 236, 91, 0); }
        }
      `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-[#102216]/90 backdrop-blur-md border-b border-white/5">
                <button
                    onClick={() => onNavigate(Screen.HOME)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
                >
                    <MaterialIcon name="arrow_back" />
                </button>
                <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10 text-white">生存统计详情</h1>
            </header>

            <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">

                {/* Hourglass Hero */}
                <div className="relative flex flex-col items-center justify-center py-8 px-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
                    <h2 className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-6">生命倒计时</h2>
                    <div className="hourglass-container mb-6">
                        <div className="sand-top"><div className="sand-top-fill"></div></div>
                        <div className="sand-stream"></div>
                        <div className="sand-bottom"><div className="sand-bottom-fill"></div></div>
                        <div className="hourglass-glass"></div>
                    </div>
                    <div className="text-center flex flex-col gap-1 z-10">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-white font-mono tracking-tighter">{remainingDays.toLocaleString()}</span>
                            <span className="text-sm font-medium text-gray-400">天</span>
                        </div>
                        <p className="text-primary text-sm font-medium tracking-wide">剩余时间估算</p>
                    </div>
                </div>

                {/* Mood Pulse Chart */}
                <div className="w-full px-4 mb-8">
                    <div className="bg-card-dark rounded-2xl p-5 border border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-xs font-bold flex items-center gap-2">
                                <MaterialIcon name="ecg_heart" className="text-primary text-base" />
                                情绪脉动
                            </h3>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">近7天趋势</span>
                        </div>
                        <div className="relative h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={moodData.length > 0 ? moodData : [{ name: 'Mon', uv: 50 }, { name: 'Tue', uv: 50 }, { name: 'Wed', uv: 50 }, { name: 'Thu', uv: 50 }, { name: 'Fri', uv: 50 }, { name: 'Sat', uv: 50 }, { name: 'Sun', uv: 50 }]}>
                                    <defs>
                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#13ec5b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="uv" stroke="#13ec5b" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Background Lines Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-between py-2 text-[10px] text-gray-600 pointer-events-none">
                                <div className="flex items-center gap-3"><span className="w-6 text-right opacity-50">愉悦</span><div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent border-t border-dashed border-white/5"></div></div>
                                <div className="flex items-center gap-3"><span className="w-6 text-right opacity-50">平静</span><div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent border-t border-dashed border-white/5"></div></div>
                                <div className="flex items-center gap-3"><span className="w-6 text-right opacity-50">疲惫</span><div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent border-t border-dashed border-white/5"></div></div>
                            </div>

                        </div>
                        <div className="mt-2 pt-3 border-t border-white/5 flex items-start gap-2">
                            <MaterialIcon name="insights" className="text-primary text-sm mt-0.5" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                近七天，你的生命色彩以'<span className="text-primary font-bold">{dominantMood ? MOOD_LABELS[dominantMood] : '平静'}</span>'为主调
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 px-4 mb-8">
                    {/* Avg Expectancy */}
                    <div className="flex flex-col p-5 bg-card-dark rounded-2xl border border-white/5 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MaterialIcon name="vital_signs" className="text-4xl" />
                        </div>
                        <p className="text-gray-400 text-xs font-medium mb-1">平均寿命预测</p>
                        <div className="flex items-end gap-1 mb-2">
                            <span className="text-2xl font-bold text-white">78.4</span>
                            <span className="text-xs font-medium text-gray-400 mb-1">岁</span>
                        </div>
                        <div className="mt-auto pt-2 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <MaterialIcon name="location_on" className="text-[12px]" />
                                基于同地区/性别数据
                            </p>
                        </div>
                    </div>

                    {/* Life Lived */}
                    <div className="flex flex-col p-5 bg-card-dark rounded-2xl border border-white/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <MaterialIcon name="hourglass_bottom" className="text-4xl" />
                        </div>
                        <p className="text-gray-400 text-xs font-medium mb-1">已度过人生</p>
                        <div className="flex items-end gap-1 mb-2">
                            <span className="text-2xl font-bold text-white">{lifePercentage}</span>
                            <span className="text-xs font-medium text-gray-400 mb-1">%</span>
                        </div>
                        <div className="mt-auto pt-2 w-full">
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-400" style={{ width: `${lifePercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestones */}
                <div className="px-4 mb-8">
                    <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                        <MaterialIcon name="flag" className="text-primary text-xl" />
                        生存里程碑
                    </h3>
                    <div className="bg-card-dark rounded-2xl p-6 border border-white/5 relative">
                        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-white/10"></div>
                        <div className="space-y-6">
                            {/* Birth */}
                            <div className="relative flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                                <div className="relative z-10 flex size-7 items-center justify-center rounded-full bg-gray-700 text-gray-500 border-2 border-card-dark">
                                    <MaterialIcon name="child_care" className="text-[14px]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">出生</p>
                                    <p className="text-xs text-gray-500">{profile?.birthday ? new Date(profile.birthday).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }) : '未设置'}</p>
                                </div>
                            </div>
                            {/* Now */}
                            <div className="relative flex items-center gap-4">
                                <div className="relative z-10 flex size-7 items-center justify-center rounded-full bg-primary text-black border-2 border-card-dark pulse-dot shadow-glow">
                                    <MaterialIcon name="accessibility_new" className="text-[16px]" />
                                </div>
                                <div className="flex-1 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-white">当下时刻</p>
                                            <p className="text-xs text-primary font-medium">状态：生存中</p>
                                        </div>
                                        <span className="bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded">NOW</span>
                                    </div>
                                </div>
                            </div>
                            {/* Retirement */}
                            <div className="relative flex items-center gap-4">
                                <div className="relative z-10 flex size-7 items-center justify-center rounded-full bg-card-dark text-primary border-2 border-primary border-dashed">
                                    <MaterialIcon name="celebration" className="text-[14px]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">退休预估</p>
                                    <p className="text-xs text-gray-500">2050年 (还有26年)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Life Balance Grid */}
                <div className="px-4 pb-8">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-white text-base font-bold flex items-center gap-2">
                            <MaterialIcon name="grid_view" className="text-primary text-xl" />
                            生命余额
                        </h3>
                        <div className="flex gap-3 text-[10px] font-medium">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-[2px] bg-white/10"></div>
                                <span className="text-gray-500">已逝</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary shadow-glow-sm"></div>
                                <span className="text-white">未来</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 px-1">每个方格代表这辈子的一个月</p>

                    <div className="bg-card-dark rounded-2xl p-4 border border-white/5">
                        <div className="grid grid-cols-12 gap-1 w-full" id="life-grid">
                            {/* Past */}
                            {Array.from({ length: Math.min(42, Math.floor(daysAlive / 30)) }).map((_, i) => (
                                <div key={`past-${i}`} className="aspect-square rounded-[2px] bg-white/10 transition-colors hover:bg-white/20"></div>
                            ))}
                            {/* Present */}
                            <div className="aspect-square rounded-[2px] bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 scale-110"></div>
                            {/* Future */}
                            {Array.from({ length: Math.min(77, Math.floor(remainingDays / 30)) }).map((_, i) => (
                                <div
                                    key={`future-${i}`}
                                    className={`aspect-square rounded-[2px] bg-primary shadow-[0_0_2px_rgba(19,236,91,0.2)] hover:bg-white transition-colors cursor-pointer ${Math.random() > 0.8 ? 'opacity-90' : 'opacity-100'}`}
                                    title="Future Month"
                                ></div>
                            ))}
                        </div>
                        <div className="h-8 w-full bg-gradient-to-t from-card-dark to-transparent mt-[-32px] relative pointer-events-none"></div>
                        <div className="mt-2 text-center">
                            <span className="text-[10px] text-gray-600 font-mono tracking-widest">... REMAINING MONTHS ...</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
