# Life Guardian 部署指南

## 📦 Vercel 部署步骤

### 准备工作
- GitHub 账号（你已有：linchunhu）
- 项目已推送到 GitHub（✅ 已完成）

---

## 步骤 1：登录 Vercel

1. 打开浏览器访问 **https://vercel.com**
2. 点击右上角 **"Login"** 按钮
3. 选择 **"Continue with GitHub"**
4. 在 GitHub 授权页面点击 **"Authorize Vercel"**

---

## 步骤 2：添加新项目

1. 登录后，点击 **"Add New..."** → **"Project"**
   - 或点击 **"+ New Project"** 按钮
2. 在 **"Import Git Repository"** 列表中找到 **life-guardian**
3. 点击该项目右侧的 **"Import"** 按钮

> 💡 如果看不到仓库，点击 "Adjust GitHub App Permissions" 授权 Vercel 访问你的仓库

---

## 步骤 3：配置项目

在 **"Configure Project"** 页面：

| 配置项 | 值 |
|--------|-----|
| Project Name | `life-guardian`（默认） |
| Framework Preset | `Vite`（应自动检测） |
| Root Directory | `./`（默认） |
| Build Command | `npm run build`（默认） |
| Output Directory | `dist`（默认） |

### ⚠️ 重要：添加环境变量

点击 **"Environment Variables"** 展开，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_SUPABASE_URL` | 你的 Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key |

> 这些值在你的 `.env.local` 文件中可以找到

---

## 步骤 4：部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（通常 1-2 分钟）
3. 看到 **"Congratulations!"** 表示部署成功

---

## 步骤 5：获取访问地址

部署成功后，Vercel 会分配一个免费域名：
```
https://life-guardian.vercel.app
```
或类似格式如：
```
https://life-guardian-xxx.vercel.app
```

---

## 📲 iPhone 安装 PWA 步骤

### 1. 打开 Safari（必须用 Safari）
用 iPhone 上的 **Safari 浏览器**访问你的 Vercel 部署地址

### 2. 点击分享按钮
点击屏幕底部的 **分享图标**（方框+向上箭头）

### 3. 添加到主屏幕
在弹出菜单中向上滑动，找到并点击 **"添加到主屏幕"**

### 4. 确认添加
- 可以修改应用名称（默认 "Life Guardian"）
- 点击右上角 **"添加"**

### 5. 完成！
应用图标会出现在 iPhone 主屏幕上，点击即可像原生 App 一样使用！

---

## 🎉 效果

安装后的 PWA 特性：
- ✅ 全屏运行，无浏览器地址栏
- ✅ 独立的应用图标
- ✅ 启动画面
- ✅ 类原生 App 体验

---

## ⚠️ 注意事项

1. **必须使用 Safari**：iOS 只支持通过 Safari 安装 PWA
2. **HTTPS 必须**：Vercel 自动提供 HTTPS
3. **刷新应用**：如果代码更新，需要重新打开 PWA 或清除缓存

---

## 🔧 后续更新

当你修改代码后：
```bash
git add .
git commit -m "Update xxx"
git push
```
Vercel 会自动重新部署！
