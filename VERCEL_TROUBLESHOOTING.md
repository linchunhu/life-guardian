# Vercel 部署排查指南

## ⚠️ 当前问题
网站显示白屏，控制台提示"Expected a JavaScript module script but the server responded with a MIME type of 'text/html'"

## 🔍 排查步骤

### 1. 检查 Vercel 项目设置
1. 登录 https://vercel.com
2. 进入你的项目：life-guardian
3. 点击 **Settings**

### 2. 验证构建配置
在 **Settings → General → Build & Development Settings**：

| 配置项 | 应设置为 |
|--------|---------|
| Framework Preset | **Vite** |
| Build Command | `npm run build` 或留空 |
| Output Directory | `dist` |
| Install Command | `npm install` 或留空 |

⚠️ **如果设置不对，请修改后重新部署！**

### 3. 配置环境变量
在 **Settings → Environment Variables** 添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | 你的 Supabase URL | 从 Supabase Dashboard 获取 |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | 从 Supabase Dashboard 获取 |

⚠️ **必须添加这两个环境变量，否则应用无法连接数据库！**

获取方式：
1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 左侧菜单 **Settings** → **API**
4. 复制 **Project URL** 和 **anon public** key

### 4. 手动触发重新部署
添加环境变量后：
1. 进入 **Deployments** 标签
2. 点击最新的部署
3. 点击右上角 **...** → **Redeploy**
4. 选择 **Use existing Build Cache: No**
5. 点击 **Redeploy**

### 5. 查看构建日志
如果还是失败：
1. 进入 **Deployments**
2. 点击最新的部署
3. 查看 **Build Logs**
4. 截图发给我，我帮你分析

---

## 🎯 快速修复 Checklist

- [ ] Framework Preset 设置为 **Vite**
- [ ] Output Directory 设置为 **dist**
- [ ] 添加了 `VITE_SUPABASE_URL` 环境变量
- [ ] 添加了 `VITE_SUPABASE_ANON_KEY` 环境变量
- [ ] 触发了重新部署（不使用缓存）
- [ ] 等待 2-3 分钟部署完成
- [ ] 刷新网页

---

## 📝 备选方案：使用 Netlify

如果 Vercel 实在不行，可以尝试 Netlify（配置更简单）：

1. 访问 https://app.netlify.com
2. 用 GitHub 登录
3. 点击 **Add new site** → **Import an existing project**
4. 选择 **GitHub** → **life-guardian**
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 添加环境变量（同上）
7. 点击 **Deploy**

Netlify 通常对 Vite 项目更友好！
