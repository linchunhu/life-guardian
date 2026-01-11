-- 自定义用户认证表
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- 创建自定义用户表（不依赖 auth.users）
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '向死而生，珍惜当下。',
  birthday DATE,
  hobbies TEXT,
  membership TEXT DEFAULT '普通会员',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone);

-- 禁用 RLS（因为我们自己管理认证）
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 更新其他表的外键引用，改为引用 app_users
-- 注意：需要先删除旧的外键约束

-- 先清空测试数据（可选，生产环境慎用）
-- TRUNCATE contacts, check_ins, moods, will_items, email_configs, user_settings, profiles CASCADE;

-- 禁用所有表的 RLS（简化开发）
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE moods DISABLE ROW LEVEL SECURITY;
ALTER TABLE will_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
