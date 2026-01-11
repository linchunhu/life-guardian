import React, { useState, useEffect } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { checkIn, getTodayCheckIn, calculateDaysAlive } from '../services/checkInService';
import { recordMood, getTodayMood, type MoodType } from '../services/moodService';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

// 根据生日计算统计数据
const calculateLifeStats = (birthday: string | null) => {
  const avgLifeExpectancy = 78.4; // 平均寿命年数
  const totalLifeDays = avgLifeExpectancy * 365;

  if (!birthday) {
    // 默认34岁
    const defaultDays = 34 * 365;
    const remaining = Math.round(totalLifeDays - defaultDays);
    const remainingYears = Math.round((remaining / 365));
    // 随机百分比
    return { daysAlive: defaultDays, remainingYears, peerPercentage: 88 };
  }

  const birthDate = new Date(birthday);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const daysAlive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 计算剩余年数
  const ageInYears = daysAlive / 365;
  const remainingYears = Math.max(0, Math.round(avgLifeExpectancy - ageInYears));

  // 计算击败同龄人百分比（基于打卡活跃度，这里简化为基于年龄）
  // 年龄越大，坚持打卡越难得，百分比越高
  const peerPercentage = Math.min(99, Math.round(50 + (ageInYears / 2) + Math.random() * 10));

  return { daysAlive, remainingYears, peerPercentage };
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'scanning' | 'checked'>('idle');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 动态计算的生命统计数据
  const [lifeStats, setLifeStats] = useState({ daysAlive: 12450, remainingYears: 32, peerPercentage: 88 });

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载今日状态和计算统计数据
  useEffect(() => {
    if (user) {
      loadTodayStatus();
    }
  }, [user]);

  // 当用户信息更新时重新计算统计数据
  useEffect(() => {
    if (user) {
      const stats = calculateLifeStats(user.birthday || null);
      setLifeStats(stats);
    }
  }, [user?.birthday]);

  const loadTodayStatus = async () => {
    if (!user) return;

    // 检查今日打卡
    const todayCheckIn = await getTodayCheckIn(user.id);
    if (todayCheckIn) {
      setCheckInStatus('checked');
    }

    // 检查今日心情
    const todayMood = await getTodayMood(user.id);
    if (todayMood) {
      setSelectedMood(todayMood.mood);
    }
  };

  const handleCheckIn = async () => {
    if (checkInStatus !== 'idle' || !user) return;

    setCheckInStatus('scanning');

    // 模拟扫描延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 调用打卡服务
    const result = await checkIn(user.id);

    if (result) {
      setCheckInStatus('checked');
      // 显示成功提示
      setShowSuccessToast(true);
      // 2秒后跳转到生存统计页面
      setTimeout(() => {
        setShowSuccessToast(false);
        onNavigate(Screen.STATS);
      }, 2000);
    } else {
      // 失败时重置状态
      setCheckInStatus('idle');
    }
  };

  const handleMoodSelect = async (mood: string) => {
    if (!user || selectedMood === mood) return;

    setSelectedMood(mood);
    await recordMood(user.id, mood as MoodType);
  };

  const handleNavigation = (target: Screen) => {
    onNavigate(target);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    onNavigate(Screen.LOGIN);
  };

  // 格式化天数显示
  const formatDays = (days: number) => {
    return days.toLocaleString('zh-CN');
  };

  // 格式化当前时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  return (
    <div className="relative flex h-full flex-col bg-[#050505] text-white overflow-hidden">

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className="bg-primary text-black px-6 py-3 rounded-full shadow-glow flex items-center gap-2 font-bold">
            <MaterialIcon name="check_circle" filled />
            <span>打卡成功！生命体征正常</span>
          </div>
        </div>
      )}

      {/* Menu Sidebar Overlay */}
      <div className={`absolute inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-200'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Drawer */}
        <div className={`absolute left-0 top-0 h-full w-64 bg-[#102216] border-r border-white/10 p-6 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-glow-sm">
                <MaterialIcon name="health_and_safety" filled />
              </div>
              <span className="font-bold text-lg tracking-wide text-white">Life Guardian</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors">
              <MaterialIcon name="close" />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { label: '看板', icon: 'ecg_heart', target: Screen.HOME },
              { label: '紧急联系人', icon: 'contacts', target: Screen.CONTACTS },
              { label: '生存统计', icon: 'bar_chart', target: Screen.STATS },
              { label: '预设遗嘱', icon: 'folder_open', target: Screen.WILL },
              { label: '设置', icon: 'settings', target: Screen.SETTINGS },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.target)}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group active:scale-95"
              >
                <MaterialIcon name={item.icon} className="group-hover:text-primary transition-colors text-xl" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
            >
              <MaterialIcon name="logout" className="text-xl" />
              <span className="font-medium text-sm">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4 bg-transparent z-10">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors active:scale-90 duration-200"
        >
          <MaterialIcon name="menu" className="text-3xl" />
        </button>
        <div className="flex items-center justify-center text-white text-sm font-medium tracking-wide opacity-80">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${checkInStatus === 'checked' ? 'bg-primary' : 'bg-primary animate-pulse'}`}></span>
          {checkInStatus === 'checked' ? '今日已打卡' : '监测中'}
        </div>
        <button
          onClick={() => onNavigate(Screen.CONTACTS)}
          className="relative flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
        >
          <MaterialIcon name="notifications" className="text-3xl" />
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#050505]"></span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center relative z-10 px-6 overflow-y-auto no-scrollbar pb-4">

        {/* Current Time Display */}
        <div className="w-full text-center mt-2 mb-2">
          <p className="text-2xl font-bold text-primary font-mono tracking-wider">{formatTime(currentTime)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(currentTime)}</p>
        </div>

        {/* Days Counter - 动态显示 */}
        <div className="mt-4 mb-4 text-center w-full cursor-pointer group" onClick={() => onNavigate(Screen.STATS)}>
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">
            已在这个星球停留了
          </h2>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-6xl font-black tracking-tight text-white leading-none group-hover:scale-105 transition-transform duration-300">
              {formatDays(lifeStats.daysAlive)}
            </h1>
            <span className="text-xl font-medium text-gray-400 mt-2">天</span>
          </div>
        </div>

        {/* Big Pulse Button (Interactive) */}
        <div className="flex-1 flex items-center justify-center w-full py-4 min-h-[260px]">
          <div className="relative group">
            {/* Background Effects (Only show when not checked) */}
            {checkInStatus === 'idle' && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-700 animate-pulse-slow"></div>
                <div className="absolute inset-2 rounded-full border border-primary/30 animate-ping opacity-20"></div>
              </>
            )}

            {/* Scanning Ring Effect */}
            {checkInStatus === 'scanning' && (
              <div className="absolute inset-[-10px] rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            )}

            {/* Success Glow */}
            {checkInStatus === 'checked' && (
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse"></div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={checkInStatus !== 'idle'}
              className={`relative flex flex-col items-center justify-center w-64 h-64 rounded-full border-4 transition-all duration-500 overflow-hidden
                ${checkInStatus === 'idle'
                  ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-[#222] shadow-[0_0_60px_-15px_rgba(19,236,91,0.3)] hover:shadow-[0_0_80px_-10px_rgba(19,236,91,0.5)] active:scale-95 group-hover:border-primary/50 cursor-pointer'
                  : ''}
                ${checkInStatus === 'scanning'
                  ? 'bg-[#0a0a0a] border-primary/50 shadow-none scale-95 cursor-wait'
                  : ''}
                ${checkInStatus === 'checked'
                  ? 'bg-primary/5 border-primary shadow-[0_0_50px_rgba(19,236,91,0.2)] cursor-default'
                  : ''}
              `}
            >
              {checkInStatus === 'idle' && (
                <>
                  <MaterialIcon name="fingerprint" className="text-primary text-5xl mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-white text-lg font-bold tracking-wide">确认生命体征</span>
                  <span className="text-gray-500 text-xs mt-2 font-medium">点击打卡</span>
                </>
              )}

              {checkInStatus === 'scanning' && (
                <>
                  <MaterialIcon name="sensors" className="text-primary text-4xl mb-3 animate-pulse" />
                  <span className="text-white text-base font-bold tracking-wide animate-pulse">正在扫描...</span>
                  <span className="text-primary/70 text-xs mt-2 font-mono">Verifying...</span>
                </>
              )}

              {checkInStatus === 'checked' && (
                <div className="animate-bounce-in flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-3 shadow-glow animate-bounce">
                    <MaterialIcon name="check" className="text-black text-3xl font-bold" />
                  </div>
                  <span className="text-white text-xl font-bold tracking-wide">今日已打卡</span>
                  <span className="text-primary text-xs mt-1 font-bold tracking-wider uppercase">生命体征正常</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mood Selector */}
        <div className="w-full mb-6">
          <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-4">今日心情</p>
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar px-1 pb-2">
            {[
              { name: 'calm', icon: 'spa', label: '平静' },
              { name: 'happy', icon: 'sentiment_satisfied', label: '愉悦' },
              { name: 'tired', icon: 'bedtime', label: '疲惫' },
              { name: 'sad', icon: 'rainy', label: '忧伤' },
              { name: 'anxious', icon: 'cyclone', label: '焦虑' },
            ].map((mood) => (
              <label
                key={mood.name}
                className="cursor-pointer group flex flex-col items-center gap-2 min-w-[56px]"
                onClick={() => handleMoodSelect(mood.name)}
              >
                <input
                  className="peer sr-only"
                  name="mood"
                  type="radio"
                  checked={selectedMood === mood.name}
                  onChange={() => { }}
                />
                <div className={`w-12 h-12 rounded-full bg-surface-dark border flex items-center justify-center transition-all duration-300 ${selectedMood === mood.name
                  ? 'border-primary/80 bg-[#0a2010] shadow-[0_0_15px_rgba(19,236,91,0.3)] text-primary'
                  : 'border-surface-border text-gray-500 group-hover:border-gray-600'
                  }`}>
                  <MaterialIcon name={mood.icon} className="text-2xl" />
                </div>
                <span className={`text-[10px] font-medium transition-colors ${selectedMood === mood.name ? 'text-primary' : 'text-gray-500'}`}>{mood.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bottom Cards - 动态显示 */}
        <div className="w-full grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-dark border border-surface-border rounded-2xl p-5 flex flex-col items-start gap-2 backdrop-blur-sm bg-opacity-80 hover:border-primary/30 transition-colors duration-300 group">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="groups" className="text-gray-500 text-xl group-hover:text-primary transition-colors" />
              <p className="text-gray-400 text-xs font-medium">同龄人对比</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-xs">击败</span>
              <span className="text-primary text-2xl font-bold font-mono">{lifeStats.peerPercentage}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
              <div className="bg-primary h-1 rounded-full transition-all duration-500" style={{ width: `${lifeStats.peerPercentage}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-dark border border-surface-border rounded-2xl p-5 flex flex-col items-start gap-2 backdrop-blur-sm bg-opacity-80 hover:border-primary/30 transition-colors duration-300 group">
            <div className="flex items-center gap-2 mb-1">
              <MaterialIcon name="hourglass_bottom" className="text-gray-500 text-xl group-hover:text-primary transition-colors" />
              <p className="text-gray-400 text-xs font-medium">预估剩余</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-primary text-2xl font-bold font-mono">{lifeStats.remainingYears}</span>
              <span className="text-white text-sm">年</span>
            </div>
            <p className="text-gray-600 text-[10px] leading-tight">基于平均寿命测算</p>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="relative z-20 bg-surface-dark/90 backdrop-blur-md border-t border-surface-border px-6 py-4 flex justify-around items-center">
        <button
          onClick={() => onNavigate(Screen.HOME)}
          className="flex flex-col items-center gap-1 text-primary cursor-default">
          <MaterialIcon name="ecg_heart" filled />
          <span className="text-[10px] font-bold">看板</span>
        </button>
        <button
          onClick={() => onNavigate(Screen.WILL)}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <MaterialIcon name="folder_open" />
          <span className="text-[10px] font-medium">遗嘱</span>
        </button>
        <button
          onClick={() => onNavigate(Screen.SETTINGS)}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <MaterialIcon name="settings" />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </nav>

      {/* Background Pulse Effect */}
      <div className="absolute bottom-0 left-0 w-full h-[120px] pointer-events-none overflow-hidden z-0">
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-primary/5 to-transparent"></div>
        <svg className="absolute bottom-0 w-full h-24 text-primary opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="url(#grad1)" fillOpacity="0.2"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#13ec5b', stopOpacity: 1 }}></stop>
              <stop offset="100%" style={{ stopColor: '#050505', stopOpacity: 0 }}></stop>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};