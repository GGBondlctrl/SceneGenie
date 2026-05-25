# SceneGenie 认证体系设计文档

> 方案：C — 混合自建（Express + SQLite + Resend API）
> 日期：2026-05-24
> 状态：待审核

---

## 1. 设计目标

为 SceneGenie 构建一套安全、轻量、易部署的用户认证体系，支持邮箱注册（验证码验证）和邮箱密码登录。

## 2. 认证流程

### 2.1 注册流程

```
用户填写 姓名 + 邮箱 + 密码
  → 点击"发送验证码"
    → 后端校验邮箱格式 + 限流
      → 生成 6 位数字验证码（5 分钟过期）
        → 通过 Resend API 发送验证邮件
          → 用户输入验证码
            → 后端验证验证码（未过期 + 未使用 + 匹配）
              → bcrypt 哈希密码
                → 写入 users 表
                  → 生成 JWT
                    → 返回 JWT + 用户信息
                      → 前端存入 localStorage，自动登录
```

### 2.2 登录流程

```
用户填写 邮箱 + 密码
  → 后端查询 users 表
    → 用户存在？
      → bcrypt 比对密码
        → 匹配？
          → 生成 JWT（有效期 7 天）
            → 返回 JWT + 用户信息
              → 前端存入 localStorage
        → 不匹配？
          → 登录失败计数 +1
            → 连续 5 次失败锁定 15 分钟
      → 用户不存在？
        → 返回"邮箱或密码错误"（模糊提示防枚举）
```

### 2.3 退出流程

```
用户点击 Sign Out
  → 前端清除 localStorage 中的 JWT
    → 页面刷新，回到欢迎页
```

## 3. 数据库结构（SQLite）

```sql
-- users 表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- verification_codes 表
CREATE TABLE verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'register',
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- login_attempts 表（登录失败记录）
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 4. API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/auth/send-code` | 发送邮箱验证码 | `{ email: string }` | `{ message: string }` |
| POST | `/api/auth/register` | 注册 | `{ email, password, name, code }` | `{ token: string, user: { id, email, name } }` |
| POST | `/api/auth/login` | 登录 | `{ email, password }` | `{ token: string, user: { id, email, name } }` |
| POST | `/api/auth/logout` | 退出 | — | `{ message: string }` |
| GET | `/api/auth/me` | 获取当前用户 | Header: `Authorization: Bearer <token>` | `{ user: { id, email, name } }` |

## 5. 安全策略

### 5.1 验证码策略
- **格式**：6 位纯数字，随机生成
- **有效期**：5 分钟
- **使用次数**：单次有效，验证后即标记 used = true
- **限流**：同一邮箱 1 分钟最多 1 条，1 小时最多 5 条

### 5.2 密码策略
- **哈希算法**：bcrypt，cost factor 12
- **最小长度**：8 位
- **禁止明文存储**

### 5.3 JWT 策略
- **算法**：HS256
- **有效期**：7 天
- **密钥**：环境变量 `JWT_SECRET`
- **传输**：HTTP-only cookie 或 localStorage（本项目用 localStorage）

### 5.4 登录保护
- **失败锁定**：同一邮箱连续 5 次失败锁定 15 分钟
- **模糊提示**：用户不存在和密码错误返回相同消息，防枚举
- **IP 限流**：单 IP 每小时最多 100 次认证请求

### 5.5 邮件安全
- **发送服务**：Resend API（免费 3000 封/月）
- **发件人**：`SceneGenie <noreply@scenegenie.app>`
- **内容**：纯文本 + HTML 双格式，包含验证码和过期时间

## 6. 后端目录结构

```
server/
├── src/
│   ├── index.ts              # Express 入口
│   ├── routes/
│   │   └── auth.ts           # 认证路由
│   ├── controllers/
│   │   └── authController.ts # 请求处理器
│   ├── services/
│   │   ├── authService.ts    # 认证业务逻辑
│   │   ├── emailService.ts   # 邮件发送服务
│   │   └── tokenService.ts   # JWT 生成/验证
│   ├── models/
│   │   └── userModel.ts      # 数据库操作
│   ├── middleware/
│   │   ├── rateLimiter.ts    # 限流中间件
│   │   └── authMiddleware.ts # JWT 验证中间件
│   ├── utils/
│   │   └── validators.ts     # 输入验证工具
│   └── db.ts                 # SQLite 连接
└── data/
    └── scenegenie.db         # SQLite 数据库文件
```

## 7. 前端适配

- **LoginModal**：登录/注册模式切换，注册时增加"发送验证码"按钮
- **useAuth Hook**：集成真实 API 调用，替换 mock 逻辑
- **Dashboard**：登录后调用 `/api/auth/me` 获取用户信息

## 8. 环境变量

```bash
# server/.env
JWT_SECRET=your-secret-key-here
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=noreply@scenegenie.app
```

## 9. 依赖

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "sqlite3": "^5.1.7",
    "resend": "^3.0.0",
    "dotenv": "^16.4.0",
    "express-rate-limit": "^7.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

---

## 自检清单

- [x] 无 TBD / TODO / 占位符
- [x] 数据库表结构与 API 端点一致
- [x] 安全策略覆盖验证码、密码、JWT、登录保护
- [x] 目录结构按职责分层（routes/controllers/services/models/middleware）
- [x] 环境变量和依赖明确列出
