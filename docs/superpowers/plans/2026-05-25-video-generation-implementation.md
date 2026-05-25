# 视频生成功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现真正的视频生成功能：用户输入 prompt → 前端调 LLM 生成 HTML+GSAP → 后端 HyperFrames 渲染成 MP4 → 返回视频。

**Architecture:** 前端用用户自供的 LLM API Key 生成 HTML+GSAP 动画代码，POST 到后端；后端写入临时文件，调用 HyperFrames CLI 渲染成 MP4，保存到 public 目录并返回 URL。全程异步，前端显示"生成代码中"和"渲染视频中"两个阶段状态。

**Tech Stack:** React 19 + TypeScript (前端) / Express + TypeScript (后端) / HyperFrames CLI (视频渲染) / GSAP (动画)

---

## 文件结构

```
d:/video_gen/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   └── videoRenderer.ts    # NEW: HyperFrames 渲染封装
│   │   ├── routes/
│   │   │   └── video.ts            # NEW: 视频生成路由
│   │   └── index.ts                # MODIFY: 注册路由 + 静态文件
│   ├── public/videos/              # NEW: 视频输出目录
│   └── temp/                       # NEW: 临时 HTML 目录
├── app/src/
│   ├── services/
│   │   ├── llm.ts                  # NEW: LLM API 调用封装
│   │   └── api.ts                  # MODIFY: 更新 generateVideo 接口
│   ├── hooks/
│   │   └── useGenerate.ts          # MODIFY: 整合 LLM 调用
│   └── sections/
│       └── GenerateSection.tsx     # MODIFY: 更新生成状态显示
```

---

### Task 1: 后端安装 HyperFrames CLI

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: 安装 HyperFrames CLI**

在 `server/` 目录下执行：

```bash
cd d:/video_gen/server
npm install hyperframes
```

Expected: 安装成功，`server/package.json` 的 `dependencies` 中新增 `"hyperframes": "^x.x.x"`。

- [ ] **Step 2: 验证安装**

```bash
cd d:/video_gen/server
npx hyperframes doctor
```

Expected: 显示环境检查通过（Node.js ≥ 22, Chrome, FFmpeg 均 ✅）。

- [ ] **Step 3: 创建目录**

```bash
mkdir -p d:/video_gen/server/public/videos
mkdir -p d:/video_gen/server/temp
```

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen
git add server/package.json server/package-lock.json
git commit -m "deps(server): install hyperframes CLI"
```

---

### Task 2: 后端视频渲染服务

**Files:**
- Create: `server/src/services/videoRenderer.ts`

- [ ] **Step 1: 创建视频渲染服务**

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

const TEMP_DIR = path.resolve(process.cwd(), 'temp');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/videos');

const RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

export interface RenderOptions {
  html: string;
  ratio: string;
  taskId: string;
}

export interface RenderResult {
  videoUrl: string;
  taskId: string;
}

export async function renderVideo({ html, ratio, taskId }: RenderOptions): Promise<RenderResult> {
  const dims = RATIO_DIMENSIONS[ratio];
  if (!dims) {
    throw new Error(`Unsupported ratio: ${ratio}`);
  }

  const htmlPath = path.join(TEMP_DIR, `${taskId}.html`);
  const outputPath = path.join(OUTPUT_DIR, `${taskId}.mp4`);

  // Write HTML to temp file
  await writeFile(htmlPath, html, 'utf-8');

  try {
    // Render with HyperFrames CLI
    await execFileAsync(
      'npx',
      [
        'hyperframes',
        'render',
        htmlPath,
        '-o',
        outputPath,
        '--width',
        String(dims.width),
        '--height',
        String(dims.height),
        '--duration',
        '5',
      ],
      { timeout: 120000, cwd: process.cwd() }
    );

    return {
      videoUrl: `/videos/${taskId}.mp4`,
      taskId,
    };
  } finally {
    // Clean up temp HTML file
    try {
      await unlink(htmlPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/video_gen
git add server/src/services/videoRenderer.ts
git commit -m "feat(server): add video rendering service with HyperFrames"
```

---

### Task 3: 后端视频生成路由

**Files:**
- Create: `server/src/routes/video.ts`
- Modify: `server/src/middleware/authMiddleware.ts` (export AuthenticatedRequest)

- [ ] **Step 1: 确认 authMiddleware 已导出类型**

检查 `server/src/middleware/authMiddleware.ts` 已导出 `AuthenticatedRequest`。当前代码已有：

```typescript
export interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string; name: string };
}
```

无需修改。

- [ ] **Step 2: 创建视频路由**

```typescript
import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { renderVideo } from '../services/videoRenderer.js';

const router = Router();

router.post('/generate', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { html, ratio } = req.body;

  if (!html || typeof html !== 'string') {
    res.status(400).json({ error: 'Missing or invalid html' });
    return;
  }

  if (!ratio || !['16:9', '9:16', '1:1', '4:3'].includes(ratio)) {
    res.status(400).json({ error: 'Missing or invalid ratio' });
    return;
  }

  // Basic HTML validation
  if (!html.includes('<html>') || !html.includes('</html>')) {
    res.status(400).json({ error: 'Invalid HTML content' });
    return;
  }

  const taskId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const result = await renderVideo({ html, ratio, taskId });

    res.json({
      id: result.taskId,
      status: 'completed',
      videoUrl: result.videoUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Video rendering failed:', err);
    res.status(500).json({ error: 'Video rendering failed' });
  }
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen
git add server/src/routes/video.ts
git commit -m "feat(server): add video generation route"
```

---

### Task 4: 后端注册视频路由并配置静态文件

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: 修改 index.ts 注册路由和静态文件**

在 `server/src/index.ts` 中：

1. 添加 import：

```typescript
import videoRoutes from './routes/video.js';
```

2. 在 `app.use('/api/auth', authRoutes);` 下方添加：

```typescript
app.use('/api/video', videoRoutes);
```

3. 在 `app.use('/api/auth', authRoutes);` 之前添加静态文件服务：

```typescript
app.use('/videos', express.static(path.join(process.cwd(), 'public/videos')));
```

4. 添加 path import（如果还没有）：

```typescript
import path from 'path';
```

修改后的 `server/src/index.ts` 关键部分：

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/video.js';
import { ipRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(ipRateLimiter);

// Static files for videos
app.use('/videos', express.static(path.join(process.cwd(), 'public/videos')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
```

- [ ] **Step 2: 测试后端编译**

```bash
cd d:/video_gen/server
npm run build
```

Expected: TypeScript 编译通过，无错误。

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen
git add server/src/index.ts
git commit -m "feat(server): register video routes and static video serving"
```

---

### Task 5: 前端 LLM 服务封装

**Files:**
- Create: `app/src/services/llm.ts`

- [ ] **Step 1: 创建 LLM 服务**

```typescript
export type LLMProvider = 'claude' | 'openai' | 'kimi' | 'deepseek' | 'custom';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
}

const SYSTEM_PROMPT = `你是一个专业的动画视频生成专家。请根据用户的描述，生成一个完整的 HTML 页面，使用 GSAP 动画库创建精美的动画效果。

要求：
1. 生成完整的独立 HTML 文件（含 <html><head><body>）
2. 使用 CDN 引入 GSAP：<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
3. 动画必须在 5 秒内完成
4. 使用 GSAP Timeline 编排多个动画元素
5. 背景色使用深色 #0a0a12，文字使用浅色 #f0f0f5
6. 所有动画元素必须使用 opacity/transform（性能优化）
7. 画布尺寸根据比例设置 CSS width/height
8. 不要包含任何外部图片资源，所有视觉效果用 CSS/HTML 实现
9. 动画结束后保持最终状态（不要循环）
10. 确保所有动画元素都在可视区域内，不要溢出画布

输出格式：只返回纯 HTML 代码，不要包含 markdown 代码块标记。`;

function buildUserPrompt(prompt: string, ratio: string): string {
  return `请创建一个 ${ratio} 比例的视频动画，内容如下：\n${prompt}\n\n要求：\n- 总时长约 5 秒\n- 动画流畅自然\n- 风格现代科技感\n- 深色背景，浅色文字\n- 画布尺寸：${ratio === '16:9' ? '1920x1080' : ratio === '9:16' ? '1080x1920' : ratio === '1:1' ? '1080x1080' : '1440x1080'}`;
}

function getApiUrl(provider: LLMProvider, customBaseUrl?: string): string {
  switch (provider) {
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'kimi':
      return 'https://api.moonshot.cn/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/v1/chat/completions';
    case 'custom':
      return customBaseUrl || '';
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getHeaders(provider: LLMProvider, apiKey: string): Record<string, string> {
  switch (provider) {
    case 'claude':
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
    case 'openai':
    case 'kimi':
    case 'deepseek':
    case 'custom':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
  }
}

function buildBody(provider: LLMProvider, prompt: string): Record<string, unknown> {
  switch (provider) {
    case 'claude':
      return {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      };
    case 'openai':
    case 'kimi':
    case 'deepseek':
    case 'custom':
      return {
        model: provider === 'openai' ? 'gpt-4o' : provider === 'kimi' ? 'moonshot-v1-8k' : provider === 'deepseek' ? 'deepseek-chat' : 'default',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      };
  }
}

function extractContent(provider: LLMProvider, data: Record<string, unknown>): string {
  if (provider === 'claude') {
    const content = (data.content as Array<{ type: string; text: string }>)?.[0]?.text;
    if (!content) throw new Error('Empty response from Claude');
    return content;
  }
  const message = (data.choices as Array<{ message: { content: string } }>)?.[0]?.message;
  if (!message?.content) throw new Error('Empty response from LLM');
  return message.content;
}

export async function generateHTML(config: LLMConfig, userPrompt: string, ratio: string): Promise<string> {
  const url = getApiUrl(config.provider, config.baseUrl);
  const headers = getHeaders(config.provider, config.apiKey);
  const body = buildBody(config.provider, buildUserPrompt(userPrompt, ratio));

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error((data.error as Record<string, string>)?.message || `LLM API error: ${res.status}`);
  }

  const content = extractContent(config.provider, data);

  // Extract HTML from markdown code blocks if present
  const htmlMatch = content.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  // Otherwise assume the whole response is HTML
  return content.trim();
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/video_gen
git add app/src/services/llm.ts
git commit -m "feat(client): add LLM service for HTML+GSAP generation"
```

---

### Task 6: 前端修改 API 接口

**Files:**
- Modify: `app/src/services/api.ts`

- [ ] **Step 1: 更新 generateVideo 接口接收 html 参数**

在 `app/src/services/api.ts` 中修改 `GenerateVideoRequest` 接口：

```typescript
export interface GenerateVideoRequest {
  html: string;
  ratio: '16:9' | '9:16' | '1:1' | '4:3';
}
```

修改 `api.generateVideo` 方法，从 mock 改为真实调用：

```typescript
generateVideo: (req: GenerateVideoRequest): Promise<GenerateVideoResponse> =>
  fetchJson('/video/generate', {
    method: 'POST',
    body: JSON.stringify(req),
  }),
```

- [ ] **Step 2: Commit**

```bash
cd d:/video_gen
git add app/src/services/api.ts
git commit -m "feat(client): update generateVideo API to accept html and call real endpoint"
```

---

### Task 7: 前端修改 useGenerate hook

**Files:**
- Modify: `app/src/hooks/useGenerate.ts`

- [ ] **Step 1: 重写 useGenerate hook**

```typescript
import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api.js';
import { generateHTML, type LLMProvider } from '../services/llm.js';

export interface GenerateResult {
  id: string;
  videoUrl: string;
  createdAt: string;
}

type GeneratePhase = 'idle' | 'generating_html' | 'rendering_video' | 'completed' | 'error';

export function useGenerate() {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [phase, setPhase] = useState<GeneratePhase>('idle');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastPromptRef = useRef('');
  const lastRatioRef = useRef<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');

  const getLLMConfig = useCallback((): { provider: LLMProvider; apiKey: string; baseUrl?: string } | null => {
    const provider = localStorage.getItem('scene-genie-llm-provider') as LLMProvider | null;
    const apiKey = localStorage.getItem('scene-genie-llm-key');
    if (!provider || !apiKey) return null;
    const baseUrl = localStorage.getItem('scene-genie-llm-baseurl') || undefined;
    return { provider, apiKey, baseUrl };
  }, []);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    const llmConfig = getLLMConfig();
    if (!llmConfig) {
      setError('请先在设置中配置 LLM API Key');
      setPhase('error');
      return;
    }

    setPhase('generating_html');
    setError(null);
    setResult(null);

    lastPromptRef.current = prompt;
    lastRatioRef.current = selectedRatio;

    let html: string;
    try {
      html = await generateHTML(llmConfig, prompt, selectedRatio);
    } catch (err) {
      setError('动画代码生成失败：' + (err as Error).message);
      setPhase('error');
      return;
    }

    setPhase('rendering_video');

    try {
      const res = await api.generateVideo({ html, ratio: selectedRatio });

      if (res.status === 'completed' && res.videoUrl) {
        setResult({
          id: res.id,
          videoUrl: res.videoUrl,
          createdAt: res.createdAt,
        });
        setPhase('completed');
      } else {
        setError('视频渲染失败，请重试');
        setPhase('error');
      }
    } catch (err) {
      setError((err as Error).message || '视频渲染失败，请重试');
      setPhase('error');
    }
  }, [prompt, selectedRatio, getLLMConfig]);

  const regenerate = useCallback(() => {
    setPrompt(lastPromptRef.current);
    setSelectedRatio(lastRatioRef.current);
    setResult(null);
    setError(null);
    setPhase('idle');
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setPhase('idle');
  }, []);

  return {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating: phase === 'generating_html' || phase === 'rendering_video',
    phase,
    result,
    error,
    generate,
    regenerate,
    clearResult,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd d:/video_gen
git add app/src/hooks/useGenerate.ts
git commit -m "feat(client): rewrite useGenerate with LLM + two-phase generation"
```

---

### Task 8: 前端修改 GenerateSection 状态显示

**Files:**
- Modify: `app/src/sections/GenerateSection.tsx`
- Modify: `app/src/pages/Dashboard.tsx`

- [ ] **Step 1: 修改 GenerateSection 接收 phase 并显示两阶段状态**

在 `GenerateSection.tsx` 中：

1. 修改 interface，添加 phase：

```typescript
interface GenerateSectionProps {
  prompt: string;
  setPrompt: (v: string) => void;
  selectedRatio: Ratio;
  setSelectedRatio: (v: Ratio) => void;
  isGenerating: boolean;
  phase: 'idle' | 'generating_html' | 'rendering_video' | 'completed' | 'error';
  result: GenerateResult | null;
  error: string | null;
  onGenerate: () => void;
  onRegenerate: () => void;
}
```

2. 修改组件参数解构：

```typescript
export default function GenerateSection({
  prompt,
  setPrompt,
  selectedRatio,
  setSelectedRatio,
  isGenerating,
  phase,
  result,
  error,
  onGenerate,
  onRegenerate,
}: GenerateSectionProps) {
```

3. 修改 loading 状态的显示文本：

在按钮渲染部分，替换原来的 loading 显示：

```tsx
{isGenerating ? (
  <>
    <div className="w-5 h-5 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
    {phase === 'generating_html'
      ? tx.generatingHtml
      : tx.renderingVideo}
  </>
) : (
```

4. 添加新的翻译文本：

```typescript
const tx = {
  // ... existing translations
  generatingHtml: t({ en: 'Generating animation code...', zh: '正在生成动画代码...' }),
  renderingVideo: t({ en: 'Rendering video...', zh: '正在渲染视频...' }),
  configureLLM: t({ en: 'Please configure LLM API Key in Settings', zh: '请先在设置中配置 LLM API Key' }),
};
```

5. 当用户未配置 LLM 时，按钮点击显示提示：

修改 `handleGenerate`：

```typescript
const handleGenerate = () => {
  if (!prompt.trim() || isGenerating) return;
  onGenerate();
};
```

这个已经在 useGenerate 中处理了错误状态。

- [ ] **Step 2: 修改 Dashboard.tsx 传递 phase**

```typescript
<GenerateSection
  prompt={prompt}
  setPrompt={setPrompt}
  selectedRatio={selectedRatio}
  setSelectedRatio={setSelectedRatio}
  isGenerating={isGenerating}
  phase={phase}
  result={result}
  error={error}
  onGenerate={generate}
  onRegenerate={handleRegenerate}
/>
```

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen
git add app/src/sections/GenerateSection.tsx app/src/pages/Dashboard.tsx
git commit -m "feat(client): display two-phase generation status (code → video)"
```

---

### Task 9: 在 SettingsModal 中添加 LLM 配置

**Files:**
- Modify: `app/src/components/SettingsModal.tsx`

- [ ] **Step 1: 在 SettingsModal 中添加 LLM 配置界面**

在语言选择下方添加 LLM 配置区域：

```tsx
{/* LLM Configuration */}
<div className="mt-8 pt-6 border-t border-white/5">
  <h3 className="font-grotesk uppercase text-cream text-[16px] tracking-wide mb-4">
    {lang === 'zh' ? 'AI 模型配置' : 'AI Model Config'}
  </h3>

  {/* Provider */}
  <div className="mb-4">
    <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
      {lang === 'zh' ? '模型提供商' : 'Provider'}
    </label>
    <select
      value={llmProvider}
      onChange={(e) => setLlmProvider(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-cream text-[14px] focus:outline-none focus:border-neon/30"
    >
      <option value="claude">Claude (Anthropic)</option>
      <option value="openai">OpenAI</option>
      <option value="kimi">Kimi (Moonshot)</option>
      <option value="deepseek">DeepSeek</option>
      <option value="custom">Custom</option>
    </select>
  </div>

  {/* API Key */}
  <div className="mb-4">
    <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
      API Key
    </label>
    <input
      type="password"
      value={llmKey}
      onChange={(e) => setLlmKey(e.target.value)}
      placeholder={lang === 'zh' ? '输入你的 API Key' : 'Enter your API Key'}
      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-neon/30"
    />
  </div>

  {/* Base URL (for custom) */}
  {llmProvider === 'custom' && (
    <div className="mb-4">
      <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
        Base URL
      </label>
      <input
        type="text"
        value={llmBaseUrl}
        onChange={(e) => setLlmBaseUrl(e.target.value)}
        placeholder="https://api.example.com/v1"
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-neon/30"
      />
    </div>
  )}

  <p className="font-mono text-cream/30 text-[10px]">
    {lang === 'zh'
      ? 'API Key 仅存储在本地浏览器，不会上传到服务器'
      : 'API Key is stored locally in your browser only'}
  </p>
</div>
```

同时需要添加 state 和 useEffect 来读写 localStorage：

```typescript
const [llmProvider, setLlmProvider] = useState('claude');
const [llmKey, setLlmKey] = useState('');
const [llmBaseUrl, setLlmBaseUrl] = useState('');

useEffect(() => {
  setLlmProvider(localStorage.getItem('scene-genie-llm-provider') || 'claude');
  setLlmKey(localStorage.getItem('scene-genie-llm-key') || '');
  setLlmBaseUrl(localStorage.getItem('scene-genie-llm-baseurl') || '');
}, []);

const handleSave = () => {
  localStorage.setItem('scene-genie-llm-provider', llmProvider);
  localStorage.setItem('scene-genie-llm-key', llmKey);
  localStorage.setItem('scene-genie-llm-baseurl', llmBaseUrl);
  onClose();
};
```

把关闭按钮的 `onClick={onClose}` 改为 `onClick={handleSave}`。

- [ ] **Step 2: Commit**

```bash
cd d:/video_gen
git add app/src/components/SettingsModal.tsx
git commit -m "feat(client): add LLM provider config in SettingsModal"
```

---

### Task 10: 端到端测试

**Files:**
- 全部已修改文件

- [ ] **Step 1: 启动后端**

```bash
cd d:/video_gen/server
npm run dev
```

Expected: 后端启动成功，监听 3001 端口。

- [ ] **Step 2: 启动前端**

```bash
cd d:/video_gen/app
npm run dev
```

- [ ] **Step 3: 完整流程测试**

1. 打开首页，进入 Settings，配置 LLM API Key（选择 provider，输入 key）
2. 保存设置
3. 在 Dashboard 输入 prompt，选择比例
4. 点击"发射火箭"
5. 预期看到"正在生成动画代码..." → "正在渲染视频..." → 视频出现
6. 检查 `server/public/videos/` 目录下是否生成了 MP4 文件

- [ ] **Step 4: 验证构建**

```bash
cd d:/video_gen/app && npm run build
cd d:/video_gen/server && npm run build
```

Expected: 前后端均编译通过。

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen
git add -A
git commit -m "feat: implement real video generation with LLM + HyperFrames"
```

---

## Spec Self-Review

**1. Spec coverage:**
- ✅ LLM 调用（前端）→ Task 5
- ✅ HTML+GSAP 生成 → Task 5 (prompt engineering)
- ✅ 后端视频渲染 → Task 2
- ✅ 后端路由 → Task 3
- ✅ 前端状态管理 → Task 7
- ✅ 两阶段生成状态显示 → Task 8
- ✅ LLM 配置界面 → Task 9
- ✅ 静态文件服务 → Task 4
- ✅ 文件清理 → Task 2 (finally block)

**2. Placeholder scan:**
- ✅ 无 TBD/TODO
- ✅ 所有代码片段完整
- ✅ 所有命令完整

**3. Type consistency:**
- ✅ `GenerateResult` 在 useGenerate 和 api.ts 中一致
- ✅ `Ratio` 类型在前后端一致
- ✅ `LLMProvider` 类型统一

无 gaps，计划完整。
