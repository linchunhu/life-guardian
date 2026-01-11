import React, { useState, useRef, useEffect } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile, getSettings, updateSettings, getDefaultSettings, uploadAvatar } from '../services/settingsService';
import type { Profile, UserSettings } from '../lib/supabaseClient';

interface SettingsScreenProps {
    onNavigate: (screen: Screen) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
    const { user, logout, updateProfile: authUpdateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Profile>>({});
    const [settings, setSettings] = useState<Partial<UserSettings>>(getDefaultSettings());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal states
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const [activeModal, setActiveModal] = useState<'sound' | 'vibration' | 'test' | 'detection' | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success'>('idle');
    const [detectionPeriod, setDetectionPeriod] = useState(72);

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 加载数据
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        // 加载设置
        const settingsData = await getSettings(user.id);
        if (settingsData) {
            setSettings(settingsData);
            setDetectionPeriod(settingsData.detection_period_hours || 72);
        }

        setLoading(false);
    };

    const handleStartEdit = () => {
        if (user) {
            setEditForm({
                name: user.name || '',
                bio: user.bio || '',
                birthday: user.birthday || '',
                phone: user.phone || '',
                hobbies: user.hobbies || '',
                avatar_url: user.avatar_url || '',
            });
        }
        setError(null);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            // 使用新的 AuthContext updateProfile
            const result = await authUpdateProfile(editForm);
            if (!result.error) {
                setIsEditing(false);
                setSuccessMessage('个人信息已保存');
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError(result.error || '保存失败，请检查网络连接后重试');
            }
        } catch (err) {
            setError('保存失败，请稍后重试');
            console.error(err);
        }

        setSaving(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            // 上传头像
            const url = await uploadAvatar(user.id, file);
            if (url) {
                setEditForm(prev => ({ ...prev, avatar_url: url }));
            } else {
                // 本地预览
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditForm(prev => ({ ...prev, avatar_url: reader.result as string }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSettingChange = async (key: keyof UserSettings, value: any) => {
        if (!user) return;

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await updateSettings(user.id, { [key]: value });
    };

    const handleSaveDetectionPeriod = async () => {
        if (!user) return;

        await handleSettingChange('detection_period_hours', detectionPeriod);
        setActiveModal(null);
    };

    const runEmergencyTest = () => {
        setActiveModal('test');
        setTestStatus('sending');
        setTimeout(() => {
            setTestStatus('success');
        }, 2000);
    };

    const handleLogout = () => {
        logout();
        onNavigate(Screen.LOGIN);
    };

    const Toggle = ({ value, onChange }: { value: boolean, onChange: (val: boolean) => void }) => (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onChange(!value);
            }}
            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ease-in-out ${value ? 'bg-primary' : 'bg-gray-700'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? 'left-7' : 'left-1'}`}></div>
        </div>
    );

    // 获取用户名首字母
    const getInitials = () => {
        if (user?.name) {
            return user.name.charAt(0).toUpperCase();
        }
        return 'LG';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#102216]">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="relative flex h-full flex-col bg-[#102216]">
                {/* Edit Header */}
                <div className="sticky top-0 z-50 flex items-center bg-[#102216]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="text-gray-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <MaterialIcon name="close" />
                    </button>
                    <h2 className="text-white text-lg font-bold flex-1 text-center">编辑个人信息</h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                        {saving ? <MaterialIcon name="refresh" className="animate-spin" /> : <MaterialIcon name="check" />}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                        <MaterialIcon name="error_outline" className="text-red-400 text-lg" />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                    {/* Avatar Edit */}
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="relative w-24 h-24 group cursor-pointer" onClick={handleAvatarClick}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden relative">
                                    {editForm.avatar_url ? (
                                        <img src={editForm.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">{getInitials()}</span>
                                    )}
                                </div>
                            </div>
                            <div
                                className="absolute bottom-0 right-0 p-2 bg-gray-700 rounded-full border border-surface-dark text-white group-hover:bg-primary group-hover:text-black transition-colors"
                            >
                                <MaterialIcon name="photo_camera" className="text-sm" />
                            </div>
                            {/* Dotted Box Effect from Screenshot */}
                            <div className="absolute -inset-4 border-2 border-dashed border-primary/30 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="text-xs text-gray-500">点击更换头像</span>
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">昵称</label>
                            <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                placeholder="请输入昵称"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">个人签名</label>
                            <textarea
                                value={editForm.bio || ''}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                className="w-full h-24 bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                placeholder="向死而生，珍惜当下。"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">生日</label>
                            <input
                                type="date"
                                value={editForm.birthday || ''}
                                onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">联系电话</label>
                            <input
                                type="tel"
                                value={editForm.phone || ''}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                placeholder="请输入联系电话"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">爱好</label>
                            <input
                                type="text"
                                value={editForm.hobbies || ''}
                                onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
                                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                                placeholder="例如：游泳、看书..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID (不可修改)</label>
                            <input
                                type="text"
                                value={user?.id?.slice(0, 8) || ''}
                                disabled
                                className="w-full bg-white/5 border border-transparent rounded-xl p-4 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">绑定邮箱 (不可修改)</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-white/5 border border-transparent rounded-xl p-4 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-full flex-col bg-[#102216]">
            {/* Success Toast */}
            {successMessage && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
                    <div className="bg-primary text-black px-6 py-3 rounded-full shadow-glow flex items-center gap-2 font-bold">
                        <MaterialIcon name="check_circle" filled />
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center bg-[#102216]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
                <button
                    onClick={() => onNavigate(Screen.HOME)}
                    className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                    <MaterialIcon name="arrow_back" />
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">设置</h2>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 px-4 py-6 no-scrollbar">

                {/* Profile Card */}
                <div className="flex items-center gap-4 mb-8 bg-card-dark p-4 rounded-xl border border-white/5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-white">{getInitials()}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{user?.name || 'Life Guardian'}</h3>
                        <p className="text-gray-400 text-xs">{user?.membership || '普通会员'}</p>
                        <p className="text-gray-500 text-[10px] mt-1 line-clamp-1">{user?.bio || '向死而生，珍惜当下。'}</p>
                    </div>
                    <button onClick={handleStartEdit} className="text-primary text-sm font-medium hover:text-primary/80 transition-colors px-2 py-1">编辑</button>
                </div>

                {/* Settings Group: Detection */}
                <div className="mb-6">
                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">监测机制</h4>
                    <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
                        {/* Detection Period - 可点击修改 */}
                        <div
                            onClick={() => {
                                setDetectionPeriod(settings.detection_period_hours || 72);
                                setActiveModal('detection');
                            }}
                            className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="timer" className="text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">判定周期</span>
                                    <span className="text-gray-500 text-xs">超过此时长未打卡视为异常</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-bold text-sm">{settings.detection_period_hours || 72} 小时</span>
                                <MaterialIcon name="chevron_right" className="text-gray-600 text-lg" />
                            </div>
                        </div>
                        <div
                            onClick={() => handleSettingChange('do_not_disturb', !settings.do_not_disturb)}
                            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="do_not_disturb_on" className="text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">免打扰模式</span>
                                    <span className="text-gray-500 text-xs">夜间不发送打卡提醒</span>
                                </div>
                            </div>
                            <Toggle value={settings.do_not_disturb || false} onChange={(v) => handleSettingChange('do_not_disturb', v)} />
                        </div>
                    </div>
                </div>

                {/* Settings Group: Notifications */}
                <div className="mb-6">
                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">通知与告警</h4>
                    <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
                        <div
                            onClick={() => handleSettingChange('push_enabled', !settings.push_enabled)}
                            className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="notifications_active" className="text-gray-400" />
                                <span className="text-white text-sm font-medium">打卡提醒推送</span>
                            </div>
                            <Toggle value={settings.push_enabled ?? true} onChange={(v) => handleSettingChange('push_enabled', v)} />
                        </div>

                        {/* Reminder Sound */}
                        <div
                            onClick={() => setActiveModal('sound')}
                            className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="music_note" className="text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">提醒音效</span>
                                    <span className="text-gray-500 text-xs">{settings.sound || '默认 (Radar)'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MaterialIcon name="chevron_right" className="text-gray-600 text-lg" />
                            </div>
                        </div>

                        {/* Vibration Pattern */}
                        <div
                            onClick={() => setActiveModal('vibration')}
                            className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="vibration" className="text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">震动模式</span>
                                    <span className="text-gray-500 text-xs">{settings.vibration || '心跳节奏'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MaterialIcon name="chevron_right" className="text-gray-600 text-lg" />
                            </div>
                        </div>

                        <div
                            onClick={runEmergencyTest}
                            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <MaterialIcon name="contact_phone" className="text-gray-400" />
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-medium">紧急联系人通知测试</span>
                                    <span className="text-gray-500 text-xs">每月一次自动模拟测试</span>
                                </div>
                            </div>
                            <MaterialIcon name="chevron_right" className="text-gray-600 text-lg" />
                        </div>
                    </div>
                </div>

                {/* Settings Group: Danger */}
                <div className="mb-8">
                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 px-1">其他</h4>
                    <div className="bg-card-dark rounded-xl border border-white/5 overflow-hidden">
                        <div
                            onClick={() => setShowPrivacyPolicy(true)}
                            className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <span className="text-white text-sm font-medium pl-1">隐私政策</span>
                            <MaterialIcon name="chevron_right" className="text-gray-600 text-lg" />
                        </div>
                        <div
                            onClick={handleLogout}
                            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <span className="text-red-500 text-sm font-medium pl-1">退出登录</span>
                            <MaterialIcon name="logout" className="text-red-500/50 text-lg" />
                        </div>
                    </div>
                </div>

                <p className="text-center text-gray-700 text-xs font-mono mb-4">Version 1.0.2 (Build 20231105)</p>

            </div>
            {/* Nav */}
            <nav className="relative z-20 bg-surface-dark/90 backdrop-blur-md border-t border-surface-border px-6 py-4 flex justify-around items-center">
                <button
                    onClick={() => onNavigate(Screen.HOME)}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                    <MaterialIcon name="ecg_heart" />
                    <span className="text-[10px] font-medium">看板</span>
                </button>
                <button
                    onClick={() => onNavigate(Screen.WILL)}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
                    <MaterialIcon name="folder_open" />
                    <span className="text-[10px] font-medium">遗嘱</span>
                </button>
                <button
                    onClick={() => onNavigate(Screen.SETTINGS)}
                    className="flex flex-col items-center gap-1 text-primary cursor-default">
                    <MaterialIcon name="settings" filled />
                    <span className="text-[10px] font-medium">设置</span>
                </button>
            </nav>

            {/* Modals & Bottom Sheets */}
            {(showPrivacyPolicy || activeModal) && (
                <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">

                    {/* Privacy Policy */}
                    {showPrivacyPolicy && (
                        <div className="w-full h-[80%] bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl flex flex-col relative animate-slide-up">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-white font-bold text-lg">隐私政策</h3>
                                <button onClick={() => setShowPrivacyPolicy(false)} className="text-gray-400 hover:text-white">
                                    <MaterialIcon name="close" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-gray-300 text-sm leading-relaxed">
                                <p className="font-bold text-white">1. 数据收集与使用</p>
                                <p>Life Guardian 高度重视您的隐私。我们仅收集必要的生存状态数据（如打卡记录、情绪状态）以提供自动告警服务。您的所有数据均在本地加密，仅在触发紧急预案时通过安全通道传输给您指定的联系人。</p>
                                <p className="font-bold text-white">2. 紧急联系人信息</p>
                                <p>您添加的紧急联系人信息（姓名、邮箱、关系）仅用于紧急通知。我们不会向任何第三方出售或共享这些信息。</p>
                                <p className="font-bold text-white">3. 数字资产托管</p>
                                <p>您的数字资产信息（如账号、密码）采用AES-256军用级加密标准存储。Life Guardian 团队无法查看您的明文密码，只有持有正确密钥的人（即您的紧急联系人）在特定条件下才能解密。</p>
                                <p className="font-bold text-white">4. 账号注销</p>
                                <p>您随时可以申请注销账号，我们将彻底删除您的所有历史数据，且不可恢复。</p>
                            </div>
                            <div className="p-4 border-t border-white/5">
                                <button onClick={() => setShowPrivacyPolicy(false)} className="w-full bg-primary text-black font-bold py-3 rounded-xl">我已了解</button>
                            </div>
                        </div>
                    )}

                    {/* Detection Period Selection */}
                    {activeModal === 'detection' && (
                        <div className="w-full max-w-sm bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-white font-bold">设置判定周期</h3>
                                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                                    <MaterialIcon name="close" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <p className="text-gray-400 text-sm">设定连续未打卡多少小时后，系统判定为异常并启动紧急通知。</p>

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setDetectionPeriod(Math.max(24, detectionPeriod - 12))}
                                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                    >
                                        <MaterialIcon name="remove" />
                                    </button>
                                    <div className="text-center">
                                        <span className="text-4xl font-bold text-primary">{detectionPeriod}</span>
                                        <p className="text-gray-500 text-sm">小时</p>
                                    </div>
                                    <button
                                        onClick={() => setDetectionPeriod(Math.min(168, detectionPeriod + 12))}
                                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                    >
                                        <MaterialIcon name="add" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {[24, 48, 72, 96].map(hours => (
                                        <button
                                            key={hours}
                                            onClick={() => setDetectionPeriod(hours)}
                                            className={`py-2 rounded-lg text-sm font-medium transition-all ${detectionPeriod === hours
                                                ? 'bg-primary text-black'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {hours}h
                                        </button>
                                    ))}
                                </div>

                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                                    <MaterialIcon name="warning" className="text-yellow-500 text-xl shrink-0" />
                                    <p className="text-[10px] text-yellow-200/80 leading-snug">
                                        建议设置为72小时或以上，避免因短期无法使用手机而触发误报。
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-white/5">
                                <button
                                    onClick={handleSaveDetectionPeriod}
                                    className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    保存设置
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sound Selection */}
                    {activeModal === 'sound' && (
                        <div className="w-full max-w-sm bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-white font-bold">选择提醒音效</h3>
                                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                                    <MaterialIcon name="close" />
                                </button>
                            </div>
                            <div className="p-2">
                                {['默认 (Radar)', '空灵 (Cosmic)', '急促 (Beacon)', '柔和 (Silk)'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { handleSettingChange('sound', opt); setActiveModal(null); }}
                                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 text-left transition-colors"
                                    >
                                        <span className={`${settings.sound === opt ? 'text-primary font-bold' : 'text-gray-300'}`}>{opt}</span>
                                        {settings.sound === opt && <MaterialIcon name="check" className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vibration Selection */}
                    {activeModal === 'vibration' && (
                        <div className="w-full max-w-sm bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-white font-bold">选择震动模式</h3>
                                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                                    <MaterialIcon name="close" />
                                </button>
                            </div>
                            <div className="p-2">
                                {['心跳节奏', 'SOS 求救', '持续震动', '快速短震'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { handleSettingChange('vibration', opt); setActiveModal(null); }}
                                        className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 text-left transition-colors"
                                    >
                                        <span className={`${settings.vibration === opt ? 'text-primary font-bold' : 'text-gray-300'}`}>{opt}</span>
                                        {settings.vibration === opt && <MaterialIcon name="check" className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Test Simulation */}
                    {activeModal === 'test' && (
                        <div className="w-full max-w-sm bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col items-center text-center animate-slide-up">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                {testStatus === 'sending' ? (
                                    <MaterialIcon name="sensors" className="text-primary text-3xl animate-ping" />
                                ) : (
                                    <MaterialIcon name="check_circle" className="text-primary text-3xl animate-bounce-in" />
                                )}
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">
                                {testStatus === 'sending' ? '正在模拟告警...' : '测试成功'}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6">
                                {testStatus === 'sending'
                                    ? '系统正在尝试连接您的紧急联系人'
                                    : '已成功向紧急联系人发送测试通知'}
                            </p>
                            <button
                                onClick={() => setActiveModal(null)}
                                disabled={testStatus === 'sending'}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${testStatus === 'sending'
                                    ? 'bg-white/5 text-gray-500 cursor-wait'
                                    : 'bg-primary text-black hover:bg-primary/90'
                                    }`}
                            >
                                {testStatus === 'sending' ? '请稍候...' : '完成'}
                            </button>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};