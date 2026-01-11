import React, { useState, useEffect } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getContacts, createContact, updateContact, deleteContact } from '../services/contactService';
import { getEmailConfig, updateEmailConfig } from '../services/settingsService';
import type { Contact } from '../lib/supabaseClient';

interface ContactsScreenProps {
  onNavigate: (screen: Screen) => void;
}

const ROLES = [
  { label: '父母', value: '父亲', colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/10' },
  { label: '配偶', value: '配偶', colorClass: 'bg-pink-500/20 text-pink-300 border-pink-500/10' },
  { label: '子女', value: '子女', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/10' },
  { label: '兄弟姐妹', value: '兄弟', colorClass: 'bg-purple-500/20 text-purple-300 border-purple-500/10' },
  { label: '好友', value: '好友', colorClass: 'bg-primary/20 text-primary border-primary/10' },
];

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Email Config State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    subject: '【紧急】来自Life Guardian的自动求助邮件',
    body: '这是一封自动发送的紧急求助邮件。当您收到这封邮件时，系统监测到我已经超过72小时未进行生存确认。请尝试联系我，或根据我们之前的约定采取紧急行动。我的最后已知位置及相关数字资产信息已附在附件中（需密钥解密）。'
  });

  // Form State
  const [formData, setFormData] = useState<Partial<Contact>>({});

  // 加载数据
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // 加载联系人
    const contactsData = await getContacts(user.id);
    setContacts(contactsData);

    // 加载邮件配置
    const emailConfigData = await getEmailConfig(user.id);
    if (emailConfigData) {
      setEmailConfig({
        subject: emailConfigData.subject,
        body: emailConfigData.body,
      });
    }

    setLoading(false);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      role: '好友',
      email: '',
      is_active: true,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    });
    setEditingContact(null);
    setIsEditing(true);
  };

  const handleEdit = (contact: Contact) => {
    setFormData({ ...contact });
    setEditingContact(contact);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !user) return;

    const roleConfig = ROLES.find(r => formData.role?.includes(r.label) || r.value === formData.role) || ROLES[4];

    if (editingContact) {
      // 更新联系人
      const updated = await updateContact(editingContact.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role || '好友',
        role_color_class: roleConfig.colorClass,
        avatar_url: formData.avatar_url,
      });
      if (updated) {
        setContacts(contacts.map(c => c.id === editingContact.id ? updated : c));
      }
    } else {
      // 创建联系人
      const created = await createContact({
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        role: formData.role || '好友',
        role_color_class: roleConfig.colorClass,
        avatar_url: formData.avatar_url || '',
        is_active: true,
      });
      if (created) {
        setContacts([...contacts, created]);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (editingContact) {
      const success = await deleteContact(editingContact.id);
      if (success) {
        setContacts(contacts.filter(c => c.id !== editingContact.id));
      }
    }
    setIsEditing(false);
  };

  const handleSaveEmailConfig = async () => {
    if (!user) return;
    await updateEmailConfig(user.id, emailConfig);
    setIsEmailModalOpen(false);
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
            onClick={() => setIsEditing(false)}
            className="text-gray-400 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <MaterialIcon name="close" />
          </button>
          <h2 className="text-white text-lg font-bold flex-1 text-center">
            {editingContact ? '编辑联系人' : '添加联系人'}
          </h2>
          <button
            onClick={handleSave}
            className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          >
            <MaterialIcon name="check" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Avatar Preview */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <img src={formData.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full bg-white/5 border border-white/10" />
              <button
                onClick={() => setFormData({ ...formData, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` })}
                className="absolute bottom-0 right-0 bg-gray-700 text-white p-1.5 rounded-full border border-surface-dark hover:bg-primary hover:text-black transition-colors"
              >
                <MaterialIcon name="refresh" className="text-sm font-bold" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">姓名</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入姓名"
                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">关系 / 角色</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className={`p-2 rounded-lg text-xs font-medium border transition-all ${formData.role === role.value
                      ? `${role.colorClass} border-opacity-50 ring-1 ring-offset-1 ring-offset-card-dark ring-white/20`
                      : 'bg-card-dark border-white/5 text-gray-500 hover:bg-white/5'
                      }`}
                  >
                    {role.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">电子邮箱</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="用于接收紧急邮件"
                className="w-full bg-card-dark border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {editingContact && (
              <button
                onClick={handleDelete}
                className="w-full mt-8 py-4 rounded-xl text-red-500 font-medium hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20"
              >
                <MaterialIcon name="person_remove" />
                删除联系人
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">紧急联系人</h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {/* Status Card */}
        <div className="p-4">
          <div className="relative overflow-hidden rounded-xl shadow-lg group h-[180px]">
            {/* Background Image with Gradient */}
            <div
              className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255, 138, 76, 0.85) 0%, rgba(16, 34, 22, 0.9) 100%), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop")'
              }}
            ></div>

            <div className="relative z-10 flex flex-col items-stretch justify-end pt-8 pb-5 px-5 h-full">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <MaterialIcon name="shield_lock" filled className="text-white text-[28px]" />
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">运行正常</span>
                </div>
                <h3 className="text-white text-2xl font-bold leading-tight tracking-tight shadow-black/20 text-shadow">自动守护开启中</h3>
                <p className="text-white/90 text-sm font-medium leading-relaxed max-w-[95%]">
                  若连续 <span className="text-white font-bold text-lg mx-1 underline decoration-primary decoration-2 underline-offset-4">72小时</span> 未感应到您的生存确认，我们将自动激活紧急预案。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2 flex items-center justify-between">
          <h3 className="text-white text-lg font-bold leading-tight">
            守护者列表 <span className="text-gray-500 text-sm font-normal ml-1">({contacts.length}/5)</span>
          </h3>
          {contacts.length < 5 && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-1 text-primary text-sm font-semibold hover:text-primary/80 transition-colors active:scale-95"
            >
              <MaterialIcon name="add_circle" className="text-[20px]" />
              <span>添加</span>
            </button>
          )}
        </div>

        {/* Contact List */}
        {contacts.map(contact => (
          <div key={contact.id} className="mx-4 mb-3 bg-card-dark rounded-xl border border-white/5 overflow-hidden shadow-sm hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4 p-4 justify-between">
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className="relative shrink-0">
                  <img
                    src={contact.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`}
                    alt={contact.name}
                    className="bg-center bg-no-repeat bg-cover rounded-full h-12 w-12 bg-surface-dark border border-white/10"
                  />
                  {contact.is_active && (
                    <div className="absolute -bottom-1 -right-1 bg-primary border-2 border-card-dark rounded-full p-[2px] shadow-sm">
                      <MaterialIcon name="check" className="text-[#102216] text-[10px] font-bold block" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-base font-bold truncate">{contact.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${contact.role_color_class}`}>
                      {contact.role}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs font-normal truncate font-mono tracking-tight opacity-70">{contact.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(contact)}
                className="shrink-0 text-gray-500 hover:text-primary transition-colors p-2 rounded-full hover:bg-white/5 active:scale-90"
              >
                <MaterialIcon name="edit" className="text-[20px]" />
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add Suggestion */}
        {contacts.length < 3 && (
          <div
            onClick={handleAddNew}
            className="mx-4 mt-2 p-6 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="size-10 rounded-full bg-white/5 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
              <MaterialIcon name="person_add" className="text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
              建议至少添加 3 位紧急联系人<br />以确保消息能准确传达
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 w-full bg-[#102216]/95 backdrop-blur-xl border-t border-white/10 p-4 pb-8 space-y-3 z-40">
        <button
          onClick={() => setIsEmailModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-[#102216] font-bold text-base h-12 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          <MaterialIcon name="mark_email_unread" filled />
          设置预设告警邮件内容
        </button>
        <button className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm font-medium py-2 transition-colors">
          <MaterialIcon name="send" className="text-[18px]" />
          立即测试发送 (不触发真实报警)
        </button>
      </div>

      {/* Email Config Modal */}
      {isEmailModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#182e21] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90%]">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#102216]">
              <h3 className="text-white font-bold">预设告警邮件</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-white">
                <MaterialIcon name="close" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">邮件标题</label>
                <input
                  type="text"
                  value={emailConfig.subject}
                  onChange={(e) => setEmailConfig({ ...emailConfig, subject: e.target.value })}
                  className="w-full bg-[#102216] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase">邮件正文</label>
                <textarea
                  value={emailConfig.body}
                  onChange={(e) => setEmailConfig({ ...emailConfig, body: e.target.value })}
                  className="w-full h-48 bg-[#102216] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary/50 focus:outline-none resize-none leading-relaxed"
                />
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                <MaterialIcon name="warning" className="text-yellow-500 text-xl shrink-0" />
                <p className="text-[10px] text-yellow-200/80 leading-snug">
                  请谨慎修改。此邮件将在系统判定您"失联"后自动群发给所有紧急联系人。
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#102216]">
              <button
                onClick={handleSaveEmailConfig}
                className="w-full bg-primary text-[#102216] font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};