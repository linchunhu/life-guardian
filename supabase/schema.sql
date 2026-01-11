-- Life Guardian Database Schema
-- Supabase SQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户资料表 (扩展 auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '向死而生，珍惜当下。',
  phone TEXT,
  birthday DATE,
  hobbies TEXT,
  membership TEXT DEFAULT '普通会员',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 紧急联系人表
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_color_class TEXT DEFAULT 'bg-primary/20 text-primary border-primary/10',
  email TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- ============================================
-- 3. 打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_checked_at ON check_ins(checked_at);

-- ============================================
-- 4. 心情记录表
-- ============================================
CREATE TABLE IF NOT EXISTS moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('calm', 'happy', 'tired', 'sad', 'anxious')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_recorded_at ON moods(recorded_at);

-- ============================================
-- 5. 遗嘱项目表
-- ============================================
CREATE TABLE IF NOT EXISTS will_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'letter', 'asset', 'audio')),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('ready', 'draft', 'unconfigured')),
  description TEXT,
  file_url TEXT,
  meta TEXT,
  meta_icon TEXT DEFAULT 'edit',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_will_items_user_id ON will_items(user_id);

-- ============================================
-- 6. 邮件配置表
-- ============================================
CREATE TABLE IF NOT EXISTS email_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '【紧急】来自Life Guardian的自动求助邮件',
  body TEXT NOT NULL DEFAULT '这是一封自动发送的紧急求助邮件。当您收到这封邮件时，系统监测到我已经超过72小时未进行生存确认。请尝试联系我，或根据我们之前的约定采取紧急行动。',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. 用户设置表
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  do_not_disturb BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sound TEXT DEFAULT '默认 (Radar)',
  vibration TEXT DEFAULT '心跳节奏',
  detection_period_hours INTEGER DEFAULT 72,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE will_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: 用户只能访问自己的资料
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Contacts: 用户只能访问自己的联系人
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Check-ins: 用户只能访问自己的打卡记录
CREATE POLICY "Users can view own check_ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check_ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Moods: 用户只能访问自己的心情记录
CREATE POLICY "Users can view own moods" ON moods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods" ON moods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Will Items: 用户只能访问自己的遗嘱
CREATE POLICY "Users can view own will_items" ON will_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own will_items" ON will_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own will_items" ON will_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own will_items" ON will_items
  FOR DELETE USING (auth.uid() = user_id);

-- Email Configs: 用户只能访问自己的邮件配置
CREATE POLICY "Users can view own email_configs" ON email_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_configs" ON email_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email_configs" ON email_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- User Settings: 用户只能访问自己的设置
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);
