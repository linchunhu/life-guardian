-- 修复数据库：更新外键引用和禁用RLS
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- 1. 创建 app_users 表（如果不存在）
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

-- 2. 禁用所有表的 RLS（简化开发，生产环境需重新配置）
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE moods DISABLE ROW LEVEL SECURITY;
ALTER TABLE will_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. 修改外键约束（删除旧的，添加新的或直接移除约束）
-- 注意：这会删除外键约束，让 user_id 可以是任意 UUID

-- contacts 表
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;

-- check_ins 表
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_user_id_fkey;

-- moods 表
ALTER TABLE moods DROP CONSTRAINT IF EXISTS moods_user_id_fkey;

-- will_items 表
ALTER TABLE will_items DROP CONSTRAINT IF EXISTS will_items_user_id_fkey;

-- email_configs 表
ALTER TABLE email_configs DROP CONSTRAINT IF EXISTS email_configs_user_id_fkey;

-- user_settings 表
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- 4. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone);

-- 5. 授权匿名用户访问（Supabase anon key）
GRANT ALL ON app_users TO anon;
GRANT ALL ON app_users TO authenticated;
GRANT ALL ON contacts TO anon;
GRANT ALL ON check_ins TO anon;
GRANT ALL ON moods TO anon;
GRANT ALL ON will_items TO anon;
GRANT ALL ON email_configs TO anon;
GRANT ALL ON user_settings TO anon;
