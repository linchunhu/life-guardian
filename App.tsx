import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomeScreen } from './screens/HomeScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { WillScreen } from './screens/WillScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { Screen } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>(Screen.HOME);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#102216]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // 如果未登录，显示登录页面
  if (!user) {
    return <LoginScreen onNavigate={setCurrentScreen} />;
  }

  // 已登录，根据当前屏幕显示对应页面
  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.HOME:
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case Screen.CONTACTS:
        return <ContactsScreen onNavigate={setCurrentScreen} />;
      case Screen.STATS:
        return <StatsScreen onNavigate={setCurrentScreen} />;
      case Screen.WILL:
        return <WillScreen onNavigate={setCurrentScreen} />;
      case Screen.SETTINGS:
        return <SettingsScreen onNavigate={setCurrentScreen} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };

  return renderScreen();
}

function App() {
  return (
    <AuthProvider>
      <div className="flex justify-center min-h-screen bg-[#050505]">
        <div className="relative w-full max-w-md h-screen overflow-hidden shadow-2xl bg-[#050505]">
          <AppContent />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;