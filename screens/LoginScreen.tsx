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
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!formData.email || !formData.password) {
      setError('请填写完整的登录信息');
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
      const result = isLogin
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password);

      if (result.error) {
        // 处理常见错误
        const errorMessage = result.error.message;
        if (errorMessage.includes('Invalid login credentials')) {
          setError('邮箱或密码错误');
        } else if (errorMessage.includes('User already registered')) {
          setError('该邮箱已被注册');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('请先验证您的邮箱');
        } else {
          setError(errorMessage);
        }
      } else {
        // 登录/注册成功，AuthContext 会自动更新状态
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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">账号</label>
            <input
              type="email"
              required
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
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
              setFormData({ email: '', password: '', confirmPassword: '' });
              setError(null);
            }}
            className="text-primary font-bold text-sm hover:underline"
          >
            {isLogin ? '去注册' : '去登录'}
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-8 font-mono">Build 20231105.1.0.2</p>
      </div>
    </div>
  );
};