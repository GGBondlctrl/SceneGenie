# 视频生成功能设计文档

> **日期**: 2026-05-25
> **状态**: 已批准

## 目标

实现真正的视频生成功能：用户输入自然语言提示词 → AI 生成 HTML+GSAP 动画 → HyperFrames 渲染成 MP4 视频。

## 技术栈

- **前端**: Vite + React 19 + TypeScript + Tailwind CSS + GSAP
- **后端**: Node.js + Express + TypeScript（ESM）
- **视频渲染**: HyperFrames（HeyGen HTML→Video 引擎）
- **动画**: GSAP
- **LLM**: Claude / OpenAI / Kimi / DeepSeek / 自定义（用户自供 API Key）

## 环境验证

- Node.js: v24.14.1 ✅ (≥ 22)
- npm: 11.11.0 ✅
- FFmpeg: 8.1.1 ✅

## 核心架构

### 数据流

```
用户输入 prompt + 选择比例
    ↓
前端调用户自供的 LLM API（Claude/OpenAI/Kimi/DeepSeek）
    ↓
LLM 返回完整的 HTML 页面（含 GSAP Timeline 动画，适配所选比例）
    ↓
前端 POST HTML 代码到后端 /api/video/generate
    ↓
后端写入临时 HTML 文件 → 调用 HyperFrames 渲染成 MP4
    ↓
MP4 保存到 server/public/videos/ → 返回可访问 URL
    ↓
前端显示视频 + 提供下载
```

### 前端流程

1. 用户在 Dashboard 输入 prompt，选择比例（16:9/9:16/1:1/4:3）
2. 点击"发射火箭"按钮
3. 前端显示"正在生成动画代码..."状态
4. 调用 LLM API（用户在 Settings 中配置的 API Key）
5. LLM 返回完整的 HTML 字符串（含内联 GSAP）
6. 前端显示"正在渲染视频..."状态
7. POST HTML 到后端 `/api/video/generate`
8. 后端返回视频 URL
9. 前端显示视频播放器

### 后端流程

1. 接收 `POST /api/video/generate`：`{ html: string, ratio: string }`
2. 生成唯一任务 ID（`vid_${Date.now()}_${random}`）
3. 把 HTML 写入 `server/temp/{taskId}.html`
4. 根据 ratio 确定输出尺寸：
   - 16:9 → 1920x1080
   - 9:16 → 1080x1920
   - 1:1 → 1080x1080
   - 4:3 → 1440x1080
5. 调用 HyperFrames CLI 渲染：`hyperframes render ./temp/{taskId}.html -o ./public/videos/{taskId}.mp4 --width {w} --height {h}`
6. 渲染完成后清理临时 HTML 文件
7. 返回 `{ id, videoUrl: '/videos/{taskId}.mp4', status: 'completed', createdAt }`

## LLM Prompt 工程

### 系统提示词

```
你是一个专业的动画视频生成专家。请根据用户的描述，生成一个完整的 HTML 页面，使用 GSAP 动画库创建精美的动画效果。

要求：
1. 生成完整的独立 HTML 文件（含 <html><head><body>）
2. 使用 CDN 引入 GSAP：`<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>`
3. 动画必须在固定时长内完成（默认 5 秒）
4. 使用 GSAP Timeline 编排多个动画元素
5. 背景色必须与深空主题协调（深色背景 #010828 或类似）
6. 文字使用浅色（#EFF4FF）确保在深色背景上可见
7. 所有动画元素必须使用 opacity/transform（性能优化）
8. 画布尺寸：根据用户选择的比例设置
   - 16:9 → width: 1920px, height: 1080px
   - 9:16 → width: 1080px, height: 1920px
   - 1:1 → width: 1080px, height: 1080px
   - 4:3 → width: 1440px, height: 1080px
9. 不要包含任何外部资源引用（图片、字体等），所有内容用 CSS/HTML 实现
10. 动画结束后保持最终状态（不要循环）

输出格式：只返回纯 HTML 代码，不要包含 markdown 代码块标记。
```

### 用户提示词模板

```
请创建一个 {比例} 比例的视频动画，内容如下：
{用户输入的 prompt}

要求：
- 总时长约 5 秒
- 动画流畅自然
- 风格现代科技感
- 深色背景
```

## API 设计

### 前端 → LLM

直接调用用户配置的 LLM API（前端调用，API Key 不出前端）。

### 前端 → 后端

```typescript
POST /api/video/generate
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}

Request:
{
  "html": "<html>...</html>",
  "ratio": "16:9" | "9:16" | "1:1" | "4:3"
}

Response:
{
  "id": "vid_1234567890",
  "status": "completed",
  "videoUrl": "/videos/vid_1234567890.mp4",
  "createdAt": "2026-05-25T10:30:00.000Z"
}
```

## 错误处理

| 场景 | 处理方案 |
|------|---------|
| LLM 生成失败 | 前端显示错误，提示用户修改 prompt 重试 |
| LLM 返回非 HTML 内容 | 前端提取 HTML 部分，或报错 |
| HyperFrames 渲染失败 | 后端返回具体错误信息（HTML 语法错误、超时等） |
| 视频文件不存在 | 返回 404，前端提示视频已过期 |

## 文件结构变更

```
d:/video_gen/
├── app/src/
│   ├── services/
│   │   ├── api.ts           # 扩展 generateVideo 接口
│   │   └── llm.ts          # NEW: LLM API 调用封装
│   ├── hooks/
│   │   └── useGenerate.ts   # 修改：整合 LLM 调用 + 后端渲染
│   └── ...
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── video.ts    # NEW: 视频生成路由
│   │   ├── services/
│   │   │   └── videoRenderer.ts  # NEW: HyperFrames 渲染封装
│   │   └── index.ts        # 修改：注册视频路由
│   ├── public/videos/      # NEW: 视频输出目录
│   └── temp/               # NEW: 临时 HTML 文件目录
```

## 依赖安装

后端需要安装：
```bash
cd server
npm install @hyperframes/producer
npm install @hyperframes/core
```

## 安全与性能

1. **API Key 安全**：LLM API Key 只存在于前端 localStorage，不上传后端
2. **HTML 注入防护**：后端对收到的 HTML 进行基础验证（必须包含合法 HTML 结构）
3. **文件清理**：定时清理 `temp/` 和 `public/videos/` 中的过期文件
4. **渲染超时**：HyperFrames 渲染设置 60 秒超时
5. **并发控制**：后端限制同时渲染任务数（如最多 2 个并发）
