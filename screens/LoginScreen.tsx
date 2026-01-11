import React, { useState } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 手机号格式验证
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证手机号格式
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的11位手机号');
      return;
    }

    // 验证密码
    if (formData.password.length < 6) {
      setError('密码至少需要6位');
      return;
    }

    // 注册时验证密码确认
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await login(formData.phone, formData.password)
        : await register(formData.phone, formData.password);

      if (result.error) {
        setError(result.error);
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
    <div className="flex h-full flex-col bg-[#102216] text-white overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-glow">
          <MaterialIcon name="health_and_safety" filled className="text-primary text-4xl" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Life Guardian</h1>
        <p className="text-gray-400 text-sm">您的生命资产数字托管专家</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <MaterialIcon name="error_outline" className="text-red-400 text-lg" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 space-y-4">
        {/* Phone Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">手机号</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+86</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              className="w-full bg-card-dark border border-white/10 rounded-xl p-4 pl-12 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="请输入手机号"
              maxLength={11}
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">密码</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="请输入密码"
          />
        </div>

        {/* Confirm Password (Register only) */}
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">确认密码</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="请再次输入密码"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <MaterialIcon name="refresh" className="animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <>
              <span>{isLogin ? '登录' : '注册账号'}</span>
              <MaterialIcon name="arrow_forward" />
            </>
          )}
        </button>

        {/* Toggle Login/Register */}
        <div className="text-center py-4">
          <span className="text-gray-500 text-sm">
            {isLogin ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-primary font-medium ml-2 hover:underline"
          >
            {isLogin ? '去注册' : '去登录'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="text-center pb-8 pt-4">
        <p className="text-gray-600 text-xs">Build 20231105.1.0.3</p>
      </div>
    </div>
  );
};