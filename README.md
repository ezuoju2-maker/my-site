# my-site

个人全栈网站：注册/登录/密码重置 + RBAC 权限。

## 在线入口

- 主站：https://my-site-n7j.pages.dev/
- 备用：https://ezuoju2-maker.github.io/my-site/

## 技术栈

- 前端：Astro + React + Tailwind CSS
- 后端：Cloudflare Workers + Astro SSR
- 数据：Cloudflare D1 (SQLite) + KV
- 邮件：Resend
- 人机验证：Cap（自托管 PoW）
- 部署：GitHub Actions

## 核心功能

- 用户注册（邮箱验证码 + Cap）
- 用户登录（记住登录 30 天）
- 忘记密码（邮箱验证码重置）
- RBAC 权限（user / admin）
- 用户中心 /dashboard/
- 管理后台 /admin/

## 本地开发

    npm install
    npm run dev

访问 http://localhost:4321

## 部署

推送 main 分支自动部署：

    git push origin main

## 日常维护

### 查看所有用户（Cloudflare D1 Console）

    SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC;

### 提升为管理员

    UPDATE users SET role = 'admin' WHERE username = '你的用户名';

### 清空所有账号

GitHub Actions -> Clear All Users (Manual Only) -> Run workflow -> 输入 YES-CLEAR-ALL

### 调试

URL 后加 ?debug=1 加载 Eruda 移动端 Console：

    https://my-site-n7j.pages.dev/?debug=1

## 项目结构

    src/
      components/           React 组件
      pages/                Astro 页面 + API 路由
      lib/                  工具库（auth/captcha/otp/cors/url 等）
      middleware.ts         安全响应头

## 安全特性

- PBKDF2-SHA256 10 万次迭代
- HttpOnly + Secure Session Cookie
- Cap PoW 人机验证
- Origin 白名单 CSRF 防护
- 登录/发码速率限制
- OTP 单次消费 + 独立签名密钥
- 安全响应头（nosniff / X-Frame / HSTS 等）
