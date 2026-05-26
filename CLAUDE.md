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

## 视频生成管线（核心流程）

### 第一阶段：前端 → LLM 生成动画代码

1. 用户在 Dashboard 输入提示词、选择比例（16:9 / 9:16 / 1:1 / 4:3）、设置时长（1~300 秒）
2. `useGenerate` hook 调用 `generateHTML()`（llm.ts），将用户输入发给 LLM
3. LLM 返回 JSON：`{ custom_css, html_elements, gsap_animations, duration }`
4. `template.ts` 的 `renderTemplate()` 将三段代码注入预置 HTML 骨架，生成符合 HyperFrames 规范的完整 HTML
   - 必须注入：`window.__timelines = { main: tl }`、`window.__hf = { duration, seek }`、`data-composition-id="main"`
   - `tl` 必须设置 `paused: true`，避免自动播放
   - 如果 GSAP 动画实际时长不足，自动补 `tl.to({}, { duration: gap })` 延长

### 第二阶段：后端 → HyperFrames 渲染 MP4

5. 前端 POST `/api/video/generate`（body: `{ html, ratio, duration }`）
6. 后端 `videoRenderer.ts` 创建 `temp/{taskId}/index.html`，执行：
   ```
   npx hyperframes render {taskDir} -o {output}.mp4 --width 1920 --height 1080 --duration 60
   ```
7. 视频保存到 `public/videos/{taskId}.mp4`，返回 `{ videoUrl: "/videos/xxx.mp4" }`
8. 前端 `<video>` 标签播放（Vite proxy 将 `/videos` 转发到 3001 端口）

### 时长控制（三重保障）

| 层级 | 机制 | 文件 |
|------|------|------|
| 用户显式控制 | 输入框设置秒数，作为 `forcedDuration` 传入 | GenerateSection.tsx → useGenerate.ts |
| 自然语言兜底 | `parseDurationFromPrompt()` 解析提示词中的 "30秒" / "1分钟" | llm.ts |
| 模板自动补全 | GSAP timeline 实际时长不足时自动延长 | template.ts |

### 场景格式支持

当用户提示词包含 `=== SCENE N ===` / `[timestamp]` 格式时，`buildUserPrompt()` 自动切换为"编译器模式"：
- 每条 `[timestamp]` 条目映射为对应的 CSS + HTML + GSAP 动画
- 时间戳通过 GSAP timeline position 参数精确定位
- SYSTEM_PROMPT 包含场景格式转换规则（交叉淡入淡出、特效模拟等）

### LLM JSON 容错

`repairJSON()` + `tryParseJSON()` 提供两层修复：
1. 提取最外层 `{...}` + 去除尾逗号 + 补全截断的括号
2. `decodeHTMLEntities()` 清理泄漏到 GSAP 代码中的 HTML 实体（`&lt;` → `<` 等）

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


**最后会话更新**: 2026-05-26

**项目底层视频生成核心**: GSAP — https://github.com/greensock/GSAP / HyperFrames — https://github.com/heygen-com/hyperframes

## 已知注意事项

1. **React 闭包陷阱**：`useGenerate` 的 `generate` 回调依赖数组必须包含 `duration`，否则用户修改时长后按钮拿的是过期旧值
2. **Vite proxy**：`/videos` 和 `/api` 均需代理到 `http://localhost:3001`
3. **Windows `execFile` + npx**：必须设置 `shell: true`，否则找不到 `.cmd` 脚本
4. **HyperFrames 输入**：期望目录路径（含 `index.html`），不是文件路径
5. **模板字符串中的反引号**：SYSTEM_PROMPT 内不能直接写未转义的反引号，会导致构建失败
