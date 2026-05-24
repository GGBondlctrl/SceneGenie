# SceneGenie — AI 视频生成器设计文档

**日期**: 2026-05-24  
**状态**: 已确认，待实现  
**作者**: Claude + User

---

## 1. 产品概述

SceneGenie（场景精灵）是一个面向普通用户的 AI 视频生成 Web 应用。用户通过自然语言描述即可生成视频，无需任何技术背景。

**核心定位**: 基于 [GSAP](https://github.com/greensock/GSAP) 动画库和 [Hyperframes](https://github.com/heygen-com/hyperframes) 视频渲染引擎的上层应用（wrapper），为用户提供对话式 + 模板快捷的视频生成体验。

### 1.1 目标用户

- 普通用户：无编程背景，想通过文字描述快速生成视频
- 内容创作者：需要快速制作社交媒体短视频、产品介绍等

### 1.2 核心功能

- 输入提示词生成视频（自由模式）
- 选择模板快速生成视频（模板模式）
- 上传图片素材配合提示词生成视频
- 多 LLM 提供商支持（用户自备 API Key）
- 视频预览和下载

---

## 2. 产品形态

### 2.1 首页布局

```
┌────────────────────────────────────────────┐
│  🎬 SceneGenie              [历史] [设置]   │
├────────────────────────────────────────────┤
│                                            │
│           🪄 用一句话生成视频               │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │ 💬 描述你想生成的视频...            │   │
│  │ 例如：生成一段 30 秒的产品介绍视频，  │   │
│  │ 展示我的咖啡品牌...                  │   │
│  │                                    │   │
│  │ [📎 上传图片/视频素材]  [生成 ▶]    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  ─────────── 灵感模板 ───────────          │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ 文字飞入│ │ 照片故事│ │ 产品介绍│        │
│  │ [预览]  │ │ [预览]  │ │ [预览]  │        │
│  └────────┘ └────────┘ └────────┘        │
│                                            │
│  ─────────── 社区精选 ───────────          │
│  [用户作品1] [用户作品2] [用户作品3]        │
│                                            │
└────────────────────────────────────────────┘
```

### 2.2 两种使用路径

| 路径 | 触发方式 | AI 行为 |
|------|---------|---------|
| **模板模式** | 点击模板卡片 | 选择模板 + 填充参数（JSON 配置） |
| **自由模式** | 在对话框输入提示词 | 直接生成 HTML + GSAP 代码 |

### 2.3 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | **首页** | 对话框 + 模板画廊 + 社区精选 |
| `/template/:id` | **模板详情** | 模板预览、预设提示词、素材展示、复制修改 |
| `/history` | **生成历史** | 过往生成的视频列表 |
| `/settings` | **个人中心** | API Key 配置、LLM 选择 |

---

## 3. 技术架构

### 3.1 整体架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   前端 Web   │──────▶│  后端 API   │──────▶│  用户 LLM   │
│  (React)    │◀─────│  (Node.js)  │◀─────│   API       │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Hyperframes │
                     │  (npm 依赖)  │
                     │  + FFmpeg   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  文件存储    │
                     │ (本地文件系统)│
                     └─────────────┘
```

### 3.2 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| **前端** | React 19 + TypeScript + Vite | 主流生态，开发效率高 |
| **UI** | shadcn/ui + Tailwind CSS | 美观、可定制 |
| **后端** | Node.js + Express | 与 Hyperframes（Node 工具）天然兼容 |
| **动画引擎** | GSAP (npm) | 用户指定，Hyperframes 底层使用 |
| **渲染引擎** | Hyperframes (npm) | 用户指定，"Write HTML, Render video" |
| **AI** | 用户自备 API Key | 支持 Claude、OpenAI、Kimi、DeepSeek 等 |
| **存储** | 本地文件系统 (MVP) | 简单，后续可迁移到云存储 |

### 3.3 依赖安装

```bash
npm install hyperframes gsap
npm install -D @types/gsap
```

**注意**: 不需要 `git clone` GSAP 或 Hyperframes 仓库。它们通过 npm 作为依赖引入即可。

### 3.4 API Key 安全流转

用户的 API Key 存储在浏览器 localStorage 中，**不上传到任何服务器数据库**。

生成视频时的流转方式（后端代理模式）：

```
前端 localStorage 读取 Key
        │
        ▼
生成请求头携带 Key（一次性）
        │
        ▼
后端接收请求 → 用 Key 调 LLM API
        │
        ▼
LLM 响应后，后端立即丢弃 Key（不存储）
```

- Key 只存在于单次请求的内存中
- 后端不持久化、不记录、不缓存用户的 API Key
- 前端代码开源可审计，确保没有偷偷上传 Key 的行为

---

## 4. 核心流程

### 4.1 模板模式流程

1. 用户浏览模板画廊，点击模板卡片
2. 进入模板详情页，查看预设提示词和示例素材
3. 用户可复制提示词到对话框修改，或直接使用
4. 用户可上传自己的图片替换/补充素材
5. 前端组装请求（`mode: template`, `templateId`, `prompt`, `resources[]`）
6. 后端选择对应模板的 system prompt
7. 调用用户配置的 LLM API → 返回 JSON 配置
8. 模板引擎将 JSON 填充到模板 HTML → 生成完整 `.html`
9. Hyperframes CLI 渲染 → MP4
10. 返回视频 URL → 前端预览 + 下载

### 4.2 自由模式流程

1. 用户在首页对话框输入提示词
2. 可选上传图片素材
3. 前端组装请求（`mode: free`, `prompt`, `resources[]`）
4. 后端使用"自由生成" system prompt
5. 调用 LLM → 返回完整 HTML + GSAP 代码
6. 代码安全校验（HTML 标签白名单）
7. Hyperframes CLI 渲染 → MP4
8. 返回视频 → 预览 + 下载

### 4.3 视频时长逻辑

- **不设固定时长限制**
- AI 根据用户提示词语义自动判断合理时长
- 安全上限：5 分钟（300 秒），防止资源耗尽
- LLM 输出中必须包含 `duration` 字段

---

## 5. 组件设计

### 5.1 前端组件

| 组件 | 职责 |
|------|------|
| `Navbar` | 顶部导航，Logo + 历史/设置入口 |
| `ChatInput` | 主对话框（文本输入 + 素材上传 + 生成按钮） |
| `TemplateGallery` | 模板网格展示 |
| `TemplateCard` | 单个模板卡片（预览图 + 标题） |
| `TemplateDetail` | 模板详情页（预览、提示词、素材、复制、修改） |
| `ResourceUploader` | 素材上传（拖拽/点击选择，支持图片） |
| `VideoPreview` | 视频预览播放器 + 下载按钮 |
| `SettingsPanel` | 个人中心（LLM 提供商选择 + API Key 输入） |
| `GenerationHistory` | 生成历史列表 |

### 5.2 后端模块

| 模块 | 职责 |
|------|------|
| `llm-service` | 统一封装各 LLM 提供商的调用（Claude/OpenAI/Kimi/DeepSeek） |
| `template-engine` | 读取模板、填充参数、生成完整 HTML |
| `render-service` | 调用 Hyperframes CLI 渲染 MP4 |
| `upload-service` | 处理用户素材上传，保存到本地存储 |
| `code-validator` | HTML 代码安全校验（标签白名单） |

---

## 6. 模板系统

### 6.1 目录结构

```
templates/
├── kinetic-text/
│   ├── template.html       # HTML 骨架（含 {{变量}} 占位符）
│   ├── template.json       # 模板元数据
│   └── preview.png         # 预览图
├── photo-slideshow/
│   ├── template.html
│   ├── template.json
│   └── preview.png
├── product-showcase/
│   ├── template.html
│   ├── template.json
│   └── preview.png
├── greeting-card/
│   ├── template.html
│   ├── template.json
│   └── preview.png
└── data-visualization/
    ├── template.html
    ├── template.json
    └── preview.png
```

### 6.2 template.json 格式

```json
{
  "id": "kinetic-text",
  "name": "文字动画",
  "description": "动态文字飞入效果，适合标语、口号展示",
  "category": "文字",
  "defaultPrompt": "生成一段文字动画视频。文字内容为'[你的文字]'，使用渐变色背景，文字逐字飞入，整体风格现代简约。",
  "params": {
    "text": { "type": "string", "default": "Hello World", "description": "显示的文字内容" },
    "duration": { "type": "number", "default": 20, "min": 10, "max": 300, "description": "视频时长（秒）" },
    "bgColor": { "type": "color", "default": "#1a1a2e", "description": "背景颜色" },
    "textColor": { "type": "color", "default": "#ffffff", "description": "文字颜色" },
    "animationStyle": { "type": "enum", "options": ["fly-in", "typewriter", "bounce"], "default": "fly-in" }
  },
  "supportedResources": ["none", "images"],
  "previewVideo": "./preview.mp4"
}
```

### 6.3 template.html 示例

```html
<div id="stage" data-composition-id="{{id}}" data-width="1920" data-height="1080" data-duration="{{duration}}">
  <div class="background" style="background: linear-gradient(135deg, {{bgColor}}, #16213e);"></div>
  <h1 class="title" style="color: {{textColor}};">{{text}}</h1>
</div>
<script>
  gsap.from(".title", {
    duration: 2,
    y: 100,
    opacity: 0,
    ease: "power3.out",
    delay: 0.5
  });
</script>
```

---

## 7. AI 提示工程

### 7.1 模板模式 System Prompt

```
你是一个视频生成配置助手。用户选择了一个模板，你需要根据用户的描述，
生成 JSON 配置来填充模板。

模板类型：{{templateId}}
可用参数：{{params}}

规则：
1. 根据用户描述推断每个参数的值
2. duration 根据内容复杂度自动判断（最少 10 秒，最长 300 秒）
3. 只输出合法 JSON，不要包含任何解释文字
4. 如果用户上传了图片，将图片路径放入 resources 数组
5. 如果用户描述不够具体，使用合理的默认值

输出格式：
{
  "templateId": "kinetic-text",
  "params": { "text": "...", "duration": 30, "bgColor": "#..." },
  "resources": ["/uploads/img1.png"]
}
```

### 7.2 自由模式 System Prompt

```
你是一个 HTML/GSAP 视频动画专家。根据用户的描述，生成一个完整的 HTML 文件，
使用 GSAP 创建动画，并通过 Hyperframes 渲染为视频。

规则：
1. 使用内联 CSS 和 GSAP CDN（<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js">）
2. 在根元素上设置 data-composition-id、data-width="1920"、data-height="1080"、data-duration="{duration}"
3. 视频尺寸 1920x1080，fps 30
4. duration 根据内容判断，最长 300 秒
5. 确保所有资源使用相对路径
6. 只输出完整 HTML 代码，不要 Markdown 代码块标记
7. 确保动画在时间线内完成，不要依赖无限循环
```

### 7.3 多 LLM 支持

| 提供商 | API 格式 | 备注 |
|--------|---------|------|
| Claude | Anthropic SDK | 代码生成能力强，推荐 |
| OpenAI | OpenAI SDK / 兼容格式 | GPT-4o，通用能力强 |
| Kimi | OpenAI 兼容格式 | 国内可用，长文本支持好 |
| DeepSeek | OpenAI 兼容格式 | 国内可用，性价比高 |
| 自定义 | 用户输入 baseURL + key | OpenAI 兼容格式 |

后端统一封装为 `llm-service`，根据用户配置的提供商选择对应的 SDK/HTTP 调用方式。

---

## 8. 数据流

### 8.1 生成请求数据流

```
用户输入提示词 + 素材
        │
        ▼
┌───────────────┐
│ 前端组装请求   │
│ {             │
│   prompt,     │
│   images[],   │
│   mode,       │
│   templateId, │
│   llmConfig   │
│ }             │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ POST /generate│
│ - 参数校验     │
│ - 选择 prompt  │
│ - 调用 LLM    │
└───────┬───────┘
        │
        ▼
┌─────────────────────────────────┐
│ LLM 返回                        │
│ 模板模式 → JSON 配置             │
│ 自由模式 → 完整 HTML             │
└───────────────┬─────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│ 模板引擎填充   │ │ 代码安全校验   │
│ JSON → HTML   │ │ HTML 标签白名单│
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ Hyperframes CLI │
        │ 渲染 MP4        │
        │ (异步任务)      │
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │ 返回视频文件     │
        │ + 预览 HTML     │
        └─────────────────┘
```

### 8.2 API 定义

#### POST /api/generate

生成视频任务。

**请求体**:
```json
{
  "mode": "template" | "free",
  "templateId": "kinetic-text",
  "prompt": "生成一段 30 秒的产品介绍视频...",
  "resources": ["/uploads/img1.png"],
  "llmConfig": {
    "provider": "claude",
    "apiKey": "sk-...",
    "model": "claude-sonnet-4-6"
  }
}
```

**响应**:
```json
{
  "taskId": "gen_abc123",
  "status": "queued",
  "message": "任务已加入队列"
}
```

#### GET /api/generate/:taskId/status

查询生成进度。

**响应**:
```json
{
  "taskId": "gen_abc123",
  "status": "processing",
  "progress": 45,
  "stage": "rendering"
}
```

#### GET /api/generate/:taskId/video

下载生成的视频（仅在 status === "completed" 时可用）。

#### GET /api/templates

获取模板列表。

#### GET /api/templates/:id

获取模板详情（含 defaultPrompt、params、resources）。

#### POST /api/upload

上传素材文件。

**请求**: `multipart/form-data`，字段 `file`

**响应**:
```json
{
  "url": "/uploads/img_abc123.png",
  "filename": "coffee.png",
  "size": 1024000
}
```

---

## 9. 错误处理

| 错误场景 | 错误码 | 处理策略 |
|----------|--------|---------|
| LLM API 密钥无效 | 401 | 前端拦截，提示用户去设置页检查配置 |
| LLM 返回格式错误 | 422 | 重试 1 次，仍失败则返回"AI 响应格式异常，请简化描述" |
| 模板不存在 | 404 | 返回"模板不存在，请刷新页面重试" |
| 素材上传过大 | 413 | 限制单文件 10MB，超出则提示压缩 |
| Hyperframes 渲染失败 | 500 | 保存错误日志，返回"渲染失败，请简化描述后重试" |
| 渲染超时（>5分钟） | 504 | 异步队列处理，通过 SSE 推送进度 |
| 代码包含不安全内容 | 400 | HTML 标签白名单过滤，拒绝 script src 外链等 |

---

## 10. 测试策略

| 测试类型 | 覆盖内容 |
|----------|---------|
| 单元测试 | 模板引擎填充逻辑、参数校验、代码白名单过滤 |
| 集成测试 | 端到端：提示词 → HTML → 视频文件存在且非空 |
| 模板测试 | 每个模板用默认参数渲染，验证不报错、输出文件有效 |
| LLM 测试 | 各提供商 API 连接测试、prompt 输出格式验证 |
| 错误测试 | 无效 API Key、错误提示词、超大文件、网络中断 |

---

## 11. Phase 2 功能规划（后续迭代）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| **社区作品上传** | 用户上传满意作品到社区，供他人学习参考 | P1 |
| **AI 质量鉴定** | 用 LLM 鉴定上传作品的质量，过滤低质量内容 | P1 |
| **好友系统** | 搜索用户名添加好友、从作品中添加作者 | P2 |
| **用户系统** | 注册登录、用户资料、作品关联 | P1 |
| **云存储迁移** | 从本地文件系统迁移到云存储（OSS/S3） | P2 |
| **更多模板** | 持续扩展模板库 | 持续 |

---

## 附录

### A. 相关资源

- [GSAP 文档](https://greensock.com/docs/)
- [Hyperframes GitHub](https://github.com/heygen-com/hyperframes)
- [Hyperframes Vercel Template](https://github.com/heygen-com/hyperframes-vercel-template)

### B. 开发环境要求

- Node.js >= 22
- FFmpeg 已安装
- npm >= 10
