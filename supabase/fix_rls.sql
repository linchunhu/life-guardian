-- Life Guardian RLS 策略修复脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- ============================================
-- 方案一：临时禁用 RLS 进行测试（不推荐生产环境）
-- ============================================
-- 取消注释以下行来禁用 RLS:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE check_ins DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE moods DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE will_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_configs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 方案二：修复 RLS 策略（推荐）
-- ============================================

-- 首先删除现有的策略
DROP POLICY IF EXISTS "Users can view own check_ins" ON check_ins;
DROP POLICY IF EXISTS "Users can insert own check_ins" ON check_ins;
DROP POLICY IF EXISTS "Users can view own moods" ON moods;
DROP POLICY IF EXISTS "Users can insert own moods" ON moods;
DROP POLICY IF EXISTS "Users can view own will_items" ON will_items;
DROP POLICY IF EXISTS "Users can insert own will_items" ON will_items;
DROP POLICY IF EXISTS "Users can update own will_items" ON will_items;
DROP POLICY IF EXISTS "Users can delete own will_items" ON will_items;
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view own email_configs" ON email_configs;
DROP POLICY IF EXISTS "Users can insert own email_configs" ON email_configs;
DROP POLICY IF EXISTS "Users can update own email_configs" ON email_configs;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 重新创建 profiles 策略
CREATE POLICY "Enable read access for users" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 重新创建 check_ins 策略 - 使用更宽松的策略
CREATE POLICY "Enable read for authenticated users" ON check_ins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON check_ins
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 重新创建 moods 策略
CREATE POLICY "Enable read for authenticated users" ON moods
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON moods
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 重新创建 will_items 策略
CREATE POLICY "Enable read for authenticated users" ON will_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON will_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON will_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON will_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 重新创建 contacts 策略
CREATE POLICY "Enable read for authenticated users" ON contacts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON contacts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON contacts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 重新创建 email_configs 策略
CREATE POLICY "Enable read for authenticated users" ON email_configs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON email_configs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON email_configs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 重新创建 user_settings 策略
CREATE POLICY "Enable read for authenticated users" ON user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 验证 RLS 状态
-- ============================================
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
