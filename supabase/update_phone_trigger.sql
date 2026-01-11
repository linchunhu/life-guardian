-- 更新用户注册触发器：支持手机号提取
-- 在 Supabase Dashboard -> SQL Editor 中执行

-- 更新触发器函数：提取手机号到 phone 字段
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_number TEXT;
  user_name TEXT;
BEGIN
  -- 从邮箱地址中提取手机号（格式：user_18812345678@lifeguardian.app）
  IF NEW.email LIKE 'user_%@lifeguardian.app' THEN
    phone_number := REPLACE(REPLACE(NEW.email, 'user_', ''), '@lifeguardian.app', '');
    user_name := phone_number;  -- 用手机号作为默认用户名
  ELSE
    phone_number := NULL;
    user_name := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id, user_name, phone_number);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
