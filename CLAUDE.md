# CLAUDE.md — SceneGenie 项目

## 项目概览

- **项目名称**：SceneGenie（AI 视频生成工具）
- **工作目录**：`d:/video_gen/`
- **创建日期**：2026-05-23
- **目标用户**：普通消费者（C端）
- **核心功能**：用户输入文本提示词（+可选图片）→ AI 生成视频

## 技术栈

- **前端**：Vite + React 19 + TypeScript + Tailwind CSS + shadcn/ui + GSAP
- **后端**：Node.js + Express + TypeScript（ESM）
- **数据库**：SQLite（用户数据、验证码）
- **邮件服务**：Resend API（验证码发送）
- **视频渲染**：Hyperframes（HeyGen HTML→Video 引擎）
- **动画**：GSAP + GSAP ScrollTrigger
- **LLM 支持**：Claude / OpenAI / Kimi / DeepSeek / 自定义（用户自供 API Key）

## 项目结构

```
d:/video_gen/
├── app/                          # 前端应用（Vite + React 19）
│   ├── src/
│   │   ├── components/           # 可复用组件
│   │   │   ├── LoginModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── ui/               # shadcn/ui 组件库
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts        # 认证状态（真实 API）
│   │   │   └── useLanguage.ts
│   │   ├── sections/
│   │   │   └── HeroSection.tsx
│   │   ├── services/
│   │   │   └── api.ts            # 后端 API 客户端
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tailwind.config.js
├── server/                       # 后端应用（Express + SQLite）
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.ts
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── services/
│   │   │   ├── authService.ts    # 注册/登录/发码业务逻辑
│   │   │   ├── tokenService.ts   # JWT 签发/验证
│   │   │   └── emailService.ts   # Resend 邮件发送
│   │   ├── models/
│   │   │   └── userModel.ts      # SQLite 查询封装
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts # JWT Bearer 校验
│   │   │   └── rateLimiter.ts    # IP/邮箱限流
│   │   ├── utils/
│   │   │   └── validators.ts
│   │   ├── db.ts                 # SQLite 连接 + 建表
│   │   └── index.ts              # Express 入口
│   ├── .env                      # 环境变量（JWT_SECRET, Resend Key）
│   └── package.json
├── data/                         # SQLite 数据库文件
│   └── scenegenie.db
├── docs/superpowers/
│   ├── specs/                    # 设计规格文档
│   └── plans/                    # 实现计划
└── CLAUDE.md                     # 本文件
```

## 设计系统

- **主背景色**：`#010828`（深空蓝黑）
- **主文字色**：`#EFF4FF`（cream）
- **强调色**：`#6FFF00`（neon green）
- **标题字体**：Anton（Grotesk，uppercase）
- **装饰字体**：Condiment（cursive）
- **正文字体**：monospace
- **UI 风格**：Liquid Glass（毛玻璃 + 微光边框）
- **主题**：太空/宇航员/科技感

## 数据存储

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| 用户信息 | `server/data/scenegenie.db` (SQLite) | id, email, password_hash, name, created_at |
| 验证码 | 内存 Map + TTL / SQLite 临时表 | email, code, expires_at, used，5分钟过期 |
| JWT Token | 前端 localStorage | 后端只验签不存储 |
| LLM API Key | 前端 localStorage | 用户自供，不上传服务器 |

## 前端页面规划

### 欢迎页（当前已实现）
- 全屏宇航员视频背景（object-cover object-bottom）
- 左上角品牌文案（支持中英切换）
- 顶部导航栏：Log In | Home | Features | Settings
- 右下角快捷按钮：Help / Theme / Feedback
- Settings 无需登录即可访问

### 登录/注册弹窗
- 支持登录/注册模式切换
- 注册时需邮箱验证码（Resend API 发送）
- 登录时邮箱+密码，无需验证码
- 社交登录：Google / GitHub（预留）

### 登录后首页（工作台）
- 静态深色背景 + subtle 星星粒子动效
- 侧边栏导航：Generate | Templates | History | Settings
- 主区域：输入框 + 快捷模板 + 生成进度

## 核心架构决策

1. **模板驱动 + 自由生成混合**：
   - MVP：LLM 在预定义模板内填充参数
   - Future：支持完整 HTML/CSS 自由生成

2. **多 LLM 支持**：
   - 用户在设置页配置自有 API Key
   - 密钥存储在 localStorage（前端）

3. **视频风格一致性**：
   - 预定义 4-6 套视觉风格模板
   - 每套模板包含配色/字体/动画规范/布局
   - LLM 根据提示词匹配模板，在约束内生成

4. **认证体系（方案 C：混合自建）**：
   - 后端自建用户系统（Express + SQLite）
   - 邮件发送用 Resend API（免费 3000 封/月）
   - 注册：邮箱验证码 + 密码哈希（bcrypt）
   - 登录：邮箱 + 密码 → JWT
   - 安全措施：速率限制、验证码 TTL、登录失败锁定

## 协作约定（强制执行）

1. **使用 Superpowers 技能**：探讨任何功能、设计或实现方案时，**必须**先调用相关 superpowers 技能（brainstorming / writing-plans / ui-ux-pro-max 等）与用户共同商量。**用户不必每次提醒。**

2. **代码结构性与易读性**：
   - 后端按职责分层：`routes → controllers → services → models`
   - 前端按功能组织：`components / pages / hooks / services`
   - 每个文件单一职责，函数不超过 50 行
   - TypeScript 严格模式，命名清晰语义化
   - 禁止一个文件干多件事，禁止深层嵌套

3. **记忆文件维护**：持续更新 CLAUDE.md 和 memory 目录，记录项目决策和技术上下文。

4. **计划先行**：多步骤任务先制定计划，获确认后再编码。


**最后会话更新**: 2026-05-25
