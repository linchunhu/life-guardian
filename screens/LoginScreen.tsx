import React, { useState } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 验证手机号格式
  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证手机号
    if (!formData.phone || !formData.password) {
      setError('请填写完整的登录信息');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    try {
      // 使用手机号作为邮箱的前缀来创建账号
      const email = `${formData.phone}@lifeguardian.app`;

      const result = isLogin
        ? await signIn(email, formData.password)
        : await signUp(email, formData.password);

      if (result.error) {
        // 处理常见错误
        const errorMessage = result.error.message;
        if (errorMessage.includes('Invalid login credentials')) {
          setError('手机号或密码错误');
        } else if (errorMessage.includes('User already registered')) {
          setError('该手机号已被注册');
        } else if (errorMessage.includes('Email not confirmed')) {
          // 手机号登录不需要验证邮箱
          onNavigate(Screen.HOME);
        } else {
          setError(errorMessage);
        }
      } else {
        // 登录/注册成功
        onNavigate(Screen.HOME);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#102216] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-sm px-8">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-glow mb-2">
            <MaterialIcon name="health_and_safety" className="text-4xl text-[#102216]" filled />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">
            Life Guardian
          </h1>
          <p className="text-gray-400 text-sm text-center max-w-[200px] leading-relaxed">
            您的生命资产数字托管专家
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <MaterialIcon name="error_outline" className="text-red-400 text-lg" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">手机号</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+86</span>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => {
                  // 只允许输入数字
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone: value });
                }}
                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 pl-14 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">密码</label>
            <input
              type="password"
              required
              placeholder="请输入密码 (至少6位)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {!isLogin && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">确认密码</label>
              <input
                type="password"
                required
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary hover:bg-primary/90 text-[#102216] font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-6 ${loading ? 'opacity-80 cursor-wait' : ''}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <MaterialIcon name="refresh" className="animate-spin" />
                处理中...
              </span>
            ) : (
              <>
                <span>{isLogin ? '立即登录' : '注册账号'}</span>
                <MaterialIcon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-gray-500 text-sm">
            {isLogin ? '还没有账号?' : '已有账号?'}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ phone: '', password: '', confirmPassword: '' });
              setError(null);
            }}
            className="text-primary font-bold text-sm hover:underline"
          >
            {isLogin ? '去注册' : '去登录'}
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-8 font-mono">Build 20231105.1.0.3</p>
      </div>
    </div>
  );
};