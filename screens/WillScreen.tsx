import React, { useState, useEffect } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getWillItems, createWillItem, updateWillItem, deleteWillItem, type WillItemType, type WillItemStatus } from '../services/willService';
import type { WillItem } from '../lib/supabaseClient';

interface WillScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const WillScreen: React.FC<WillScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<WillItem | null>(null);
  const [formData, setFormData] = useState<Partial<WillItem>>({});
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getWillItems(user.id);
      setItems(data);
    } catch (err) {
      setError('加载失败，请稍后重试');
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!user) {
      setError('请先登录');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const newItem = await createWillItem({
        user_id: user.id,
        type: 'letter',
        title: '新的嘱托',
        status: 'draft',
        description: '',
        meta: '刚刚创建',
        meta_icon: 'edit',
      });

      if (newItem) {
        setItems([...items, newItem]);
        setFormData(newItem);
        setEditingItem(newItem);
      } else {
        setError('创建失败，请检查网络连接');
      }
    } catch (err) {
      setError('创建失败，请稍后重试');
      console.error(err);
    }

    setSaving(false);
  };

  const handleItemClick = (item: WillItem) => {
    setFormData({ ...item });
    setEditingItem(item);
    setError(null);
  };

  const handleSaveItem = async () => {
    if (!editingItem || !formData) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await updateWillItem(editingItem.id, {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        meta: formData.status === 'ready' ? '已就绪 • 刚刚更新' : '上次编辑: 刚刚',
      });

      if (updated) {
        setItems(items.map(item => item.id === updated.id ? updated : item));
        setEditingItem(null);
      } else {
        setError('保存失败，请重试');
      }
    } catch (err) {
      setError('保存失败，请稍后重试');
      console.error(err);
    }

    setSaving(false);
  };

  const handleDeleteItem = async () => {
    if (!editingItem) return;

    setSaving(true);

    try {
      const success = await deleteWillItem(editingItem.id);
      if (success) {
        setItems(items.filter(item => item.id !== editingItem.id));
        setEditingItem(null);
      } else {
        setError('删除失败，请重试');
      }
    } catch (err) {
      setError('删除失败，请稍后重试');
      console.error(err);
    }

    setSaving(false);
  };

  const getItemStyles = (type: WillItemType) => {
    switch (type) {
      case 'video':
        return {
          iconBg: 'bg-blue-500/10 border-blue-500/20',
          iconColor: 'text-blue-400',
          iconName: 'videocam',
          badgeStyle: 'bg-green-500/20 text-green-400 border-green-500/10',
        };
      case 'letter':
        return {
          iconBg: 'bg-purple-500/10 border-purple-500/20',
          iconColor: 'text-purple-400',
          iconName: 'mark_email_unread',
          badgeStyle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/10',
        };
      case 'asset':
        return {
          iconBg: 'bg-gray-700/30 border-white/5',
          iconColor: 'text-gray-400',
          iconName: 'account_balance_wallet',
          badgeStyle: 'bg-gray-700 text-gray-400 border-gray-600',
        };
      default:
        return {
          iconBg: 'bg-gray-700/30 border-white/5',
          iconColor: 'text-gray-400',
          iconName: 'edit',
          badgeStyle: 'bg-gray-700 text-gray-400 border-gray-600',
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return '已就绪';
      case 'draft': return '草稿中';
      case 'unconfigured': return '未配置';
      default: return '未知';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/10';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/10';
      default: return 'bg-gray-700 text-gray-400 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#102216]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Editor View
  if (editingItem) {
    return (
      <div className="relative flex h-full flex-col bg-[#102216]">
        {/* Editor Header */}
        <div className="sticky top-0 z-50 flex items-center bg-[#102216]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
          <button
            onClick={() => setEditingItem(null)}
            disabled={saving}
            className="text-gray-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <MaterialIcon name="close" />
          </button>
          <h2 className="text-white text-lg font-bold flex-1 text-center">编辑嘱托</h2>
          <button
            onClick={handleSaveItem}
            disabled={saving}
            className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {saving ? <MaterialIcon name="refresh" className="animate-spin" /> : <MaterialIcon name="check" />}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <MaterialIcon name="error_outline" className="text-red-400 text-lg" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Editor Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">

          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">类型</label>
            <div className="grid grid-cols-3 gap-2">
              {(['letter', 'video', 'asset'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, type })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${formData.type === type
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card-dark border-white/5 text-gray-400 hover:bg-white/5'
                    }`}
                >
                  <MaterialIcon name={getItemStyles(type).iconName} className="text-2xl" />
                  <span className="text-xs font-medium">
                    {type === 'letter' ? '信件' : type === 'video' ? '视频' : '资产'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">标题</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="输入标题..."
            />
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {formData.type === 'video' ? '视频寄语' : formData.type === 'asset' ? '资产信息' : '内容描述'}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-40 bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="在这里写下你的嘱托..."
            />
          </div>

          {/* Status Toggle */}
          <div className="bg-card-dark rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white font-medium">标记为已就绪</span>
              <span className="text-xs text-gray-500">完成后开启此选项</span>
            </div>
            <div
              onClick={() => setFormData({ ...formData, status: formData.status === 'ready' ? 'draft' : 'ready' })}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.status === 'ready' ? 'bg-primary' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${formData.status === 'ready' ? 'left-7' : 'left-1'}`}></div>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDeleteItem}
            disabled={saving}
            className="w-full py-4 rounded-xl text-red-500 font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MaterialIcon name="delete_outline" />
            删除此条嘱托
          </button>

        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="relative flex h-full flex-col bg-[#102216]">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center bg-[#102216]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
        <button
          onClick={() => onNavigate(Screen.HOME)}
          className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <MaterialIcon name="arrow_back" />
        </button>
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">预设遗嘱</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <MaterialIcon name="error_outline" className="text-red-400 text-lg" />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400">
            <MaterialIcon name="close" className="text-sm" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar">
        {/* Hero Section */}
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-surface-dark border border-white/10 mb-4 shadow-lg">
            <MaterialIcon name="history_edu" className="text-primary text-3xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">留下你的声音</h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            当那一天真的来临，我们会确保您的爱与思念准确传达给重要的人。
          </p>
        </div>

        {/* Message Cards */}
        <div className="px-4 space-y-4">

          {items.map((item) => {
            const styles = getItemStyles(item.type as WillItemType);
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`bg-card-dark rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-all group cursor-pointer ${item.status === 'unconfigured' ? 'opacity-80' : 'opacity-100'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${styles.iconBg}`}>
                    <MaterialIcon name={styles.iconName} className={`${styles.iconColor} text-xl`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`${item.type === 'asset' ? 'text-gray-300' : 'text-white'} font-bold text-base truncate`}>{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(item.status)}`}>{getStatusText(item.status)}</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                      {item.description || '点击编辑内容...'}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <MaterialIcon name={item.meta_icon || 'edit'} className="text-[12px]" />
                        {item.meta || '未编辑'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Button */}
          <button
            onClick={handleAddItem}
            disabled={saving}
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all group active:scale-[0.99] disabled:opacity-50 disabled:cursor-wait"
          >
            {saving ? (
              <>
                <MaterialIcon name="refresh" className="animate-spin" />
                <span className="font-medium text-sm">创建中...</span>
              </>
            ) : (
              <>
                <MaterialIcon name="add" className="group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">添加新的嘱托</span>
              </>
            )}
          </button>
        </div>

        {/* Safe Badge */}
        <div className="mt-8 flex flex-col items-center gap-2 opacity-50">
          <MaterialIcon name="verified_user" className="text-primary text-2xl" />
          <span className="text-[10px] text-gray-500">所有数据均通过端对端加密保护</span>
        </div>

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
          className="flex flex-col items-center gap-1 text-primary cursor-default">
          <MaterialIcon name="folder_open" filled />
          <span className="text-[10px] font-bold">遗嘱</span>
        </button>
        <button
          onClick={() => onNavigate(Screen.SETTINGS)}
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <MaterialIcon name="settings" />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </nav>
    </div>
  );
};