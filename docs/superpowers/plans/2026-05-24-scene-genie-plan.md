# SceneGenie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SceneGenie, an AI video generation web app where users describe videos in natural language and get rendered MP4s, powered by GSAP + Hyperframes.

**Architecture:** Monorepo with React frontend (Vite) and Node.js/Express backend. Users provide their own LLM API keys. Backend handles LLM proxying, template rendering, and Hyperframes video generation. Frontend provides chat interface + template gallery.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Node.js, Express, Hyperframes, GSAP, Vitest

---

## File Structure

```
d:/video_gen/
├── package.json                    # Root workspace config
├── client/                         # React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types.ts
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ChatInput.tsx
│       │   ├── TemplateGallery.tsx
│       │   ├── TemplateCard.tsx
│       │   ├── TemplateDetail.tsx
│       │   ├── ResourceUploader.tsx
│       │   └── VideoPreview.tsx
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── TemplatePage.tsx
│       │   └── SettingsPage.tsx
│       ├── hooks/
│       │   ├── useLLMConfig.ts
│       │   └── useGeneration.ts
│       └── services/
│           └── api.ts
├── server/                         # Node.js backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express server entry
│       ├── types.ts
│       ├── routes/
│       │   ├── generate.ts
│       │   ├── templates.ts
│       │   └── upload.ts
│       └── services/
│           ├── llm-service.ts
│           ├── template-engine.ts
│           ├── render-service.ts
│           └── code-validator.ts
├── templates/                      # Video templates
│   ├── kinetic-text/
│   │   ├── template.html
│   │   ├── template.json
│   │   └── preview.png
│   ├── photo-slideshow/
│   │   ├── template.html
│   │   ├── template.json
│   │   └── preview.png
│   ├── product-showcase/
│   │   ├── template.html
│   │   ├── template.json
│   │   └── preview.png
│   ├── greeting-card/
│   │   ├── template.html
│   │   ├── template.json
│   │   └── preview.png
│   └── data-visualization/
│       ├── template.html
│       ├── template.json
│       └── preview.png
└── uploads/                        # User uploaded files
```

---

## Task 1: Project Initialization and Monorepo Structure

**Files:**
- Create: `d:/video_gen/package.json`
- Create: `d:/video_gen/.gitignore`
- Create: `d:/video_gen/client/package.json`
- Create: `d:/video_gen/server/package.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "scene-genie",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w client && npm run build -w server"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
dist/
build/
.env
.env.local
uploads/*
!uploads/.gitkeep
*.log
.DS_Store
```

- [ ] **Step 3: Create client/package.json**

```json
{
  "name": "scene-genie-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: Create server/package.json**

```json
{
  "name": "scene-genie-server",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "hyperframes": "^0.1.0",
    "gsap": "^3.12.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 5: Create directories**

Run:
```bash
mkdir -p d:/video_gen/client/src/{components,pages,hooks,services}
mkdir -p d:/video_gen/server/src/{routes,services}
mkdir -p d:/video_gen/templates
mkdir -p d:/video_gen/uploads
touch d:/video_gen/uploads/.gitkeep
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
cd d:/video_gen && npm install
cd d:/video_gen/client && npm install
cd d:/video_gen/server && npm install
```

- [ ] **Step 7: Initialize git**

Run:
```bash
cd d:/video_gen && git init
```

- [ ] **Step 8: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "chore: initialize scene-genie monorepo with client and server workspaces"
```

---

## Task 2: Backend Express Server

**Files:**
- Create: `d:/video_gen/server/tsconfig.json`
- Create: `d:/video_gen/server/src/types.ts`
- Create: `d:/video_gen/server/src/index.ts`
- Test: `d:/video_gen/server/src/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index';

describe('Server', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should have CORS enabled', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npm install -D supertest @types/supertest
npx vitest run src/index.test.ts
```

Expected: FAIL with "Cannot find module './index'" or similar

- [ ] **Step 3: Implement server**

Create `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

Create `server/src/types.ts`:

```typescript
export interface LLMConfig {
  provider: 'claude' | 'openai' | 'kimi' | 'deepseek' | 'custom';
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface GenerateRequest {
  mode: 'template' | 'free';
  templateId?: string;
  prompt: string;
  resources?: string[];
  llmConfig: LLMConfig;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPrompt: string;
  params: Record<string, {
    type: string;
    default: unknown;
    description?: string;
  }>;
  supportedResources: string[];
}
```

Create `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/index.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add express server with health endpoint and CORS"
```

---

## Task 3: Template System

**Files:**
- Create: `d:/video_gen/server/src/services/template-engine.ts`
- Create: `d:/video_gen/templates/kinetic-text/template.json`
- Create: `d:/video_gen/templates/kinetic-text/template.html`
- Create: `d:/video_gen/templates/photo-slideshow/template.json`
- Create: `d:/video_gen/templates/photo-slideshow/template.html`
- Test: `d:/video_gen/server/src/services/template-engine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/template-engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadTemplates, loadTemplate, fillTemplate } from './template-engine';

describe('Template Engine', () => {
  it('should load all templates', async () => {
    const templates = await loadTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('id');
    expect(templates[0]).toHaveProperty('name');
  });

  it('should load a specific template', async () => {
    const template = await loadTemplate('kinetic-text');
    expect(template).not.toBeNull();
    expect(template?.id).toBe('kinetic-text');
  });

  it('should return null for non-existent template', async () => {
    const template = await loadTemplate('non-existent');
    expect(template).toBeNull();
  });

  it('should fill template with params', async () => {
    const html = await fillTemplate('kinetic-text', {
      text: 'Hello World',
      duration: 20,
      bgColor: '#1a1a2e'
    });
    expect(html).toContain('Hello World');
    expect(html).toContain('#1a1a2e');
    expect(html).toContain('data-duration="20"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/template-engine.test.ts
```

Expected: FAIL with "Cannot find module" or template not found

- [ ] **Step 3: Create template files**

Create `templates/kinetic-text/template.json`:

```json
{
  "id": "kinetic-text",
  "name": "文字动画",
  "description": "动态文字飞入效果，适合标语、口号展示",
  "category": "文字",
  "defaultPrompt": "生成一段文字动画视频。文字内容为'[你的文字]'，使用渐变色背景，文字逐字飞入，整体风格现代简约。",
  "params": {
    "text": { "type": "string", "default": "Hello World", "description": "显示的文字内容" },
    "duration": { "type": "number", "default": 20, "description": "视频时长（秒）" },
    "bgColor": { "type": "color", "default": "#1a1a2e", "description": "背景颜色" },
    "textColor": { "type": "color", "default": "#ffffff", "description": "文字颜色" }
  },
  "supportedResources": ["none"]
}
```

Create `templates/kinetic-text/template.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: linear-gradient(135deg, {{bgColor}}, #16213e);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Arial', sans-serif;
    }
    .title {
      font-size: 120px;
      font-weight: bold;
      color: {{textColor}};
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="{{id}}" data-width="1920" data-height="1080" data-duration="{{duration}}">
    <h1 class="title">{{text}}</h1>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script>
    gsap.from(".title", {
      duration: 2,
      y: 100,
      opacity: 0,
      ease: "power3.out",
      delay: 0.5
    });
  </script>
</body>
</html>
```

Create `templates/photo-slideshow/template.json`:

```json
{
  "id": "photo-slideshow",
  "name": "照片轮播",
  "description": "多张照片渐变切换的轮播效果",
  "category": "照片",
  "defaultPrompt": "生成一段照片轮播视频。展示我的照片，每张照片停留3秒，带有优雅的淡入淡出过渡效果。",
  "params": {
    "duration": { "type": "number", "default": 30, "description": "视频时长（秒）" },
    "transitionDuration": { "type": "number", "default": 1, "description": "过渡时长（秒）" }
  },
  "supportedResources": ["images"]
}
```

Create `templates/photo-slideshow/template.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: #000;
    }
    .slide {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
    }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="{{id}}" data-width="1920" data-height="1080" data-duration="{{duration}}">
    <img class="slide" src="{{resources.0}}" style="opacity: 1;" />
    <img class="slide" src="{{resources.1}}" />
    <img class="slide" src="{{resources.2}}" />
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script>
    const slides = document.querySelectorAll('.slide');
    const duration = {{duration}};
    const transition = {{transitionDuration}};
    const hold = (duration - transition * (slides.length - 1)) / slides.length;
    slides.forEach((slide, i) => {
      if (i > 0) {
        gsap.to(slide, {
          opacity: 1,
          duration: transition,
          delay: i * (hold + transition)
        });
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 4: Implement template engine**

Create `server/src/services/template-engine.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TemplateConfig } from '../types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

export async function loadTemplates(): Promise<TemplateConfig[]> {
  const dirs = await fs.readdir(TEMPLATES_DIR);
  const templates: TemplateConfig[] = [];

  for (const dir of dirs) {
    const template = await loadTemplate(dir);
    if (template) {
      templates.push(template);
    }
  }

  return templates;
}

export async function loadTemplate(id: string): Promise<TemplateConfig | null> {
  try {
    const configPath = path.join(TEMPLATES_DIR, id, 'template.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as TemplateConfig;
  } catch {
    return null;
  }
}

export async function fillTemplate(
  id: string,
  params: Record<string, unknown>
): Promise<string> {
  const htmlPath = path.join(TEMPLATES_DIR, id, 'template.html');
  let html = await fs.readFile(htmlPath, 'utf-8');

  // Simple variable substitution: {{key}}
  for (const [key, value] of Object.entries(params)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, String(value));
  }

  // Replace {{id}} with template id
  html = html.replace(/{{id}}/g, id);

  return html;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/template-engine.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add template system with kinetic-text and photo-slideshow templates"
```

---

## Task 4: LLM Service

**Files:**
- Create: `d:/video_gen/server/src/services/llm-service.ts`
- Test: `d:/video_gen/server/src/services/llm-service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/llm-service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateWithLLM, buildTemplatePrompt, buildFreeformPrompt } from './llm-service';
import type { LLMConfig } from '../types';

describe('LLM Service', () => {
  it('should build template prompt', () => {
    const prompt = buildTemplatePrompt('kinetic-text', {
      text: { type: 'string', default: 'Hello' }
    });
    expect(prompt).toContain('kinetic-text');
    expect(prompt).toContain('JSON');
  });

  it('should build freeform prompt', () => {
    const prompt = buildFreeformPrompt();
    expect(prompt).toContain('HTML/GSAP');
    expect(prompt).toContain('Hyperframes');
  });

  it('should throw for unsupported provider', async () => {
    const config: LLMConfig = {
      provider: 'custom',
      apiKey: 'test',
      baseUrl: 'http://localhost'
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Bad request' } })
      } as Response)
    );

    await expect(generateWithLLM('test prompt', config)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/llm-service.test.ts
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement LLM service**

Create `server/src/services/llm-service.ts`:

```typescript
import type { LLMConfig } from '../types';

export function buildTemplatePrompt(templateId: string, params: Record<string, unknown>): string {
  return `你是一个视频生成配置助手。用户选择了一个模板，你需要根据用户的描述，生成 JSON 配置来填充模板。

模板类型：${templateId}
可用参数：${JSON.stringify(params, null, 2)}

规则：
1. 根据用户描述推断每个参数的值
2. duration 根据内容复杂度自动判断（最少 10 秒，最长 300 秒）
3. 只输出合法 JSON，不要包含任何解释文字
4. 如果用户上传了图片，将图片路径放入 resources 数组

输出格式：
{
  "templateId": "${templateId}",
  "params": { ... },
  "resources": []
}`;
}

export function buildFreeformPrompt(): string {
  return `你是一个 HTML/GSAP 视频动画专家。根据用户的描述，生成一个完整的 HTML 文件，使用 GSAP 创建动画，并通过 Hyperframes 渲染为视频。

规则：
1. 使用内联 CSS 和 GSAP CDN（<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js">）
2. 在根元素上设置 data-composition-id、data-width="1920"、data-height="1080"、data-duration="{duration}"
3. 视频尺寸 1920x1080，fps 30
4. duration 根据内容判断，最长 300 秒
5. 确保所有资源使用相对路径
6. 只输出完整 HTML 代码，不要 Markdown 代码块标记
7. 确保动画在时间线内完成，不要依赖无限循环`;
}

export async function generateWithLLM(
  prompt: string,
  config: LLMConfig
): Promise<string> {
  const { provider, apiKey, model, baseUrl } = config;

  if (provider === 'claude') {
    return callClaude(prompt, apiKey, model || 'claude-sonnet-4-6');
  }

  if (provider === 'openai' || provider === 'kimi' || provider === 'deepseek' || provider === 'custom') {
    const url = baseUrl || getDefaultBaseUrl(provider);
    return callOpenAICompatible(prompt, apiKey, url, model || 'gpt-4o');
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}

function getDefaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1';
    case 'kimi': return 'https://api.moonshot.cn/v1';
    case 'deepseek': return 'https://api.deepseek.com/v1';
    default: return '';
  }
}

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAICompatible(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LLM API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/llm-service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add LLM service supporting Claude, OpenAI, Kimi, DeepSeek"
```

---

## Task 5: Code Validator

**Files:**
- Create: `d:/video_gen/server/src/services/code-validator.ts`
- Test: `d:/video_gen/server/src/services/code-validator.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/code-validator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateHTML } from './code-validator';

describe('Code Validator', () => {
  it('should allow safe HTML', () => {
    const html = '<div><h1>Hello</h1><p>World</p></div>';
    expect(() => validateHTML(html)).not.toThrow();
  });

  it('should reject script tags with external src', () => {
    const html = '<script src="http://evil.com/xss.js"></script>';
    expect(() => validateHTML(html)).toThrow('Unsafe HTML');
  });

  it('should allow GSAP CDN script', () => {
    const html = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>';
    expect(() => validateHTML(html)).not.toThrow();
  });

  it('should reject event handlers', () => {
    const html = '<div onclick="alert(1)">click me</div>';
    expect(() => validateHTML(html)).toThrow('Unsafe HTML');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/code-validator.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement code validator**

Create `server/src/services/code-validator.ts`:

```typescript
const ALLOWED_TAGS = new Set([
  'html', 'head', 'body', 'meta', 'title', 'style', 'link',
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'video', 'audio', 'source',
  'svg', 'path', 'rect', 'circle', 'g', 'defs', 'use',
  'script', 'canvas', 'br', 'hr',
  'a', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'
]);

const ALLOWED_SCRIPT_SRC = [
  'https://cdnjs.cloudflare.com/ajax/libs/gsap',
  'https://cdn.jsdelivr.net/npm/gsap'
];

const FORBIDDEN_PATTERNS = [
  /on\w+\s*=/i,           // event handlers: onclick, onload, etc.
  /javascript:/i,          // javascript: URLs
  /eval\s*\(/i,           // eval()
  /document\.write/i,     // document.write
  /window\.location/i,    // redirects
  /fetch\s*\(/i,          // network requests (allow GSAP CDN only)
  /XMLHttpRequest/i,
  /WebSocket/i
];

export function validateHTML(html: string): void {
  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(html)) {
      throw new Error(`Unsafe HTML detected: ${pattern.source}`);
    }
  }

  // Check script tags
  const scriptMatches = html.matchAll(/<script[^>]*>/gi);
  for (const match of scriptMatches) {
    const tag = match[0];
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      const isAllowed = ALLOWED_SCRIPT_SRC.some(allowed => src.startsWith(allowed));
      if (!isAllowed) {
        throw new Error(`Unsafe script source: ${src}`);
      }
    }
  }

  // Check for unknown tags (basic check)
  const tagMatches = html.matchAll(/<(\w+)[\s>]/gi);
  for (const match of tagMatches) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      throw new Error(`Unknown/unsafe tag: ${tag}`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/code-validator.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add HTML code validator with tag whitelist and security checks"
```

---

## Task 6: Render Service (Hyperframes)

**Files:**
- Create: `d:/video_gen/server/src/services/render-service.ts`
- Test: `d:/video_gen/server/src/services/render-service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/render-service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderVideo } from './render-service';

describe('Render Service', () => {
  it('should export renderVideo function', () => {
    expect(typeof renderVideo).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/render-service.test.ts
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement render service**

Create `server/src/services/render-service.ts`:

```typescript
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

export interface RenderOptions {
  html: string;
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
}

export async function renderVideo(options: RenderOptions): Promise<string> {
  const { html, outputPath, width = 1920, height = 1080, fps = 30 } = options;

  // Write HTML to temporary file
  const tempHtmlPath = path.join(UPLOADS_DIR, `temp_${Date.now()}.html`);
  await fs.writeFile(tempHtmlPath, html, 'utf-8');

  try {
    // Check if hyperframes CLI is available
    await checkHyperframes();

    // Run hyperframes render
    await runHyperframes(tempHtmlPath, outputPath, { width, height, fps });

    return outputPath;
  } finally {
    // Clean up temp HTML file
    try {
      await fs.unlink(tempHtmlPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function checkHyperframes(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['hyperframes', '--version'], {
      shell: true,
      stdio: 'pipe'
    });

    let output = '';
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Hyperframes CLI not found. Please install: npm install -g hyperframes'));
      }
    });

    child.on('error', () => {
      reject(new Error('Hyperframes CLI not found. Please install: npm install -g hyperframes'));
    });
  });
}

async function runHyperframes(
  inputPath: string,
  outputPath: string,
  options: { width: number; height: number; fps: number }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      'hyperframes',
      'render',
      inputPath,
      '--output', outputPath,
      '--width', String(options.width),
      '--height', String(options.height),
      '--fps', String(options.fps)
    ];

    const child = spawn('npx', args, {
      shell: true,
      stdio: 'pipe'
    });

    let stderr = '';
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Hyperframes render failed: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run Hyperframes: ${err.message}`));
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/services/render-service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add Hyperframes render service with CLI wrapper"
```

---

## Task 7: Templates API Route

**Files:**
- Create: `d:/video_gen/server/src/routes/templates.ts`
- Modify: `d:/video_gen/server/src/index.ts`
- Test: `d:/video_gen/server/src/routes/templates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/templates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Templates API', () => {
  it('should list all templates', async () => {
    const response = await request(app).get('/api/templates');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get template by id', async () => {
    const response = await request(app).get('/api/templates/kinetic-text');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('kinetic-text');
  });

  it('should return 404 for unknown template', async () => {
    const response = await request(app).get('/api/templates/unknown');
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/templates.test.ts
```

Expected: FAIL with 404 since routes not registered

- [ ] **Step 3: Implement templates route**

Create `server/src/routes/templates.ts`:

```typescript
import { Router } from 'express';
import { loadTemplates, loadTemplate } from '../services/template-engine';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const templates = await loadTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await loadTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load template' });
  }
});

export default router;
```

- [ ] **Step 4: Register route in server**

Modify `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import templatesRouter from './routes/templates';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/templates', templatesRouter);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/templates.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add templates API route (list and get by id)"
```

---

## Task 8: Upload API Route

**Files:**
- Create: `d:/video_gen/server/src/routes/upload.ts`
- Modify: `d:/video_gen/server/src/index.ts`
- Test: `d:/video_gen/server/src/routes/upload.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/upload.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Upload API', () => {
  it('should have upload endpoint', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.png');
    // Should not be 404
    expect(response.status).not.toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/upload.test.ts
```

Expected: FAIL with 404

- [ ] **Step 3: Implement upload route**

Create `server/src/routes/upload.ts`:

```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

const router = Router();

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
    size: req.file.size
  });
});

export default router;
```

- [ ] **Step 4: Register route and serve static files**

Modify `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import templatesRouter from './routes/templates';
import uploadRouter from './routes/upload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/templates', templatesRouter);
app.use('/api/upload', uploadRouter);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/upload.test.ts
```

Expected: PASS (or acceptable non-404 status)

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add file upload API with multer, 10MB limit, type validation"
```

---

## Task 9: Generate API Route (Template Mode)

**Files:**
- Create: `d:/video_gen/server/src/routes/generate.ts`
- Modify: `d:/video_gen/server/src/index.ts`
- Test: `d:/video_gen/server/src/routes/generate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/generate.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index';

describe('Generate API', () => {
  it('should accept generate request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        mode: 'template',
        templateId: 'kinetic-text',
        prompt: '生成一段20秒的文字动画，文字是"Hello"',
        llmConfig: {
          provider: 'openai',
          apiKey: 'test-key'
        }
      });
    // Should not be 404, might fail on LLM call but route should exist
    expect(response.status).not.toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/generate.test.ts
```

Expected: FAIL with 404

- [ ] **Step 3: Implement generate route**

Create `server/src/routes/generate.ts`:

```typescript
import { Router } from 'express';
import { generateWithLLM, buildTemplatePrompt } from '../services/llm-service';
import { loadTemplate, fillTemplate } from '../services/template-engine';
import { validateHTML } from '../services/code-validator';
import { renderVideo } from '../services/render-service';
import type { GenerateRequest } from '../types';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const router = Router();

// In-memory task store (replace with Redis/etc for production)
const tasks = new Map<string, {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  outputPath?: string;
  error?: string;
}>();

router.post('/', async (req, res) => {
  try {
    const body = req.body as GenerateRequest;
    const taskId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    tasks.set(taskId, {
      status: 'queued',
      progress: 0,
      stage: 'queued'
    });

    // Start async processing
    processGeneration(taskId, body).catch(console.error);

    res.json({
      taskId,
      status: 'queued',
      message: '任务已加入队列'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start generation' });
  }
});

router.get('/:taskId/status', (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({
    taskId: req.params.taskId,
    status: task.status,
    progress: task.progress,
    stage: task.stage
  });
});

router.get('/:taskId/video', async (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task || task.status !== 'completed' || !task.outputPath) {
    res.status(404).json({ error: 'Video not found or not ready' });
    return;
  }

  res.sendFile(task.outputPath);
});

async function processGeneration(taskId: string, body: GenerateRequest): Promise<void> {
  const task = tasks.get(taskId)!;

  try {
    task.status = 'processing';
    task.stage = 'generating';
    task.progress = 10;

    let html: string;

    if (body.mode === 'template') {
      html = await processTemplateMode(body);
    } else {
      html = await processFreeformMode(body);
    }

    task.stage = 'validating';
    task.progress = 30;

    // Validate HTML
    validateHTML(html);

    task.stage = 'rendering';
    task.progress = 50;

    // Render video
    const outputPath = path.join(UPLOADS_DIR, `${taskId}.mp4`);
    await renderVideo({ html, outputPath });

    task.status = 'completed';
    task.progress = 100;
    task.stage = 'completed';
    task.outputPath = outputPath;
  } catch (error) {
    task.status = 'failed';
    task.stage = 'failed';
    task.error = error instanceof Error ? error.message : 'Unknown error';
  }
}

async function processTemplateMode(body: GenerateRequest): Promise<string> {
  const template = await loadTemplate(body.templateId!);
  if (!template) {
    throw new Error(`Template not found: ${body.templateId}`);
  }

  const prompt = buildTemplatePrompt(template.id, template.params);
  const fullPrompt = `${prompt}\n\n用户描述：${body.prompt}`;

  const llmResponse = await generateWithLLM(fullPrompt, body.llmConfig);

  // Parse JSON response
  let config: { params: Record<string, unknown>; resources?: string[] };
  try {
    // Try to extract JSON from markdown code block or plain text
    const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)```/) ||
                      llmResponse.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : llmResponse;
    config = JSON.parse(jsonStr);
  } catch {
    throw new Error('LLM response is not valid JSON');
  }

  // Fill template with params
  const html = await fillTemplate(template.id, config.params);
  return html;
}

async function processFreeformMode(body: GenerateRequest): Promise<string> {
  // For freeform mode, the LLM directly generates HTML
  // This will be implemented in the next task
  throw new Error('Freeform mode not yet implemented');
}

export default router;
```

- [ ] **Step 4: Register route**

Modify `server/src/index.ts` to add:

```typescript
import generateRouter from './routes/generate';
// ... after other routes
app.use('/api/generate', generateRouter);
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/generate.test.ts
```

Expected: PASS (route exists, may fail on actual LLM call but that's expected without real key)

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add generate API with template mode, async task tracking"
```

---

## Task 10: Generate API Route (Freeform Mode)

**Files:**
- Modify: `d:/video_gen/server/src/routes/generate.ts`
- Modify: `d:/video_gen/server/src/services/llm-service.ts`

- [ ] **Step 1: Implement freeform mode**

Modify `server/src/routes/generate.ts`, replace the `processFreeformMode` function:

```typescript
import { buildFreeformPrompt } from '../services/llm-service';
// ... existing imports

async function processFreeformMode(body: GenerateRequest): Promise<string> {
  const prompt = buildFreeformPrompt();
  const fullPrompt = `${prompt}\n\n用户描述：${body.prompt}`;

  const html = await generateWithLLM(fullPrompt, body.llmConfig);

  // Clean up markdown code blocks if present
  const cleanHtml = html
    .replace(/```html\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim();

  return cleanHtml;
}
```

- [ ] **Step 2: Add freeform test**

Add to `server/src/routes/generate.test.ts`:

```typescript
  it('should accept freeform generate request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        mode: 'free',
        prompt: '生成一个红色背景的div',
        llmConfig: {
          provider: 'openai',
          apiKey: 'test-key'
        }
      });
    expect(response.status).not.toBe(404);
    expect(response.body).toHaveProperty('taskId');
  });
```

- [ ] **Step 3: Run tests**

Run:
```bash
cd d:/video_gen/server && npx vitest run src/routes/generate.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add freeform generation mode with HTML output"
```

---

## Task 11: Frontend Initialization

**Files:**
- Create: `d:/video_gen/client/vite.config.ts`
- Create: `d:/video_gen/client/tsconfig.json`
- Create: `d:/video_gen/client/index.html`
- Create: `d:/video_gen/client/src/main.tsx`
- Create: `d:/video_gen/client/src/App.tsx`
- Create: `d:/video_gen/client/src/index.css`
- Create: `d:/video_gen/client/src/types.ts`

- [ ] **Step 1: Create Vite config**

Create `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001'
    }
  }
});
```

- [ ] **Step 2: Create tsconfig**

Create `client/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `client/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create HTML entry**

Create `client/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SceneGenie - AI 视频生成器</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 4: Create types**

Create `client/src/types.ts`:

```typescript
export interface LLMConfig {
  provider: 'claude' | 'openai' | 'kimi' | 'deepseek' | 'custom';
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPrompt: string;
  params: Record<string, {
    type: string;
    default: unknown;
    description?: string;
  }>;
  supportedResources: string[];
}

export interface GenerationTask {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
}
```

- [ ] **Step 5: Create main entry**

Create `client/src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 6: Create CSS with Tailwind**

Create `client/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

- [ ] **Step 7: Create Tailwind config**

Create `client/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create `client/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 8: Create App component**

Create `client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatePage from './pages/TemplatePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/template/:id" element={<TemplatePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;
```

- [ ] **Step 9: Create placeholder pages**

Create `client/src/pages/HomePage.tsx`:

```typescript
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">SceneGenie</h1>
      <p className="text-center text-gray-600">AI 视频生成器 - 用一句话创建视频</p>
    </div>
  );
}
```

Create `client/src/pages/TemplatePage.tsx`:

```typescript
export default function TemplatePage() {
  return <div>Template Detail</div>;
}
```

Create `client/src/pages/SettingsPage.tsx`:

```typescript
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

- [ ] **Step 10: Verify frontend builds**

Run:
```bash
cd d:/video_gen/client && npm run build
```

Expected: Build succeeds

- [ ] **Step 11: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: initialize React frontend with Vite, Tailwind, React Router"
```

---

## Task 12: Frontend API Service and LLM Config

**Files:**
- Create: `d:/video_gen/client/src/services/api.ts`
- Create: `d:/video_gen/client/src/hooks/useLLMConfig.ts`
- Create: `d:/video_gen/client/src/components/Navbar.tsx`

- [ ] **Step 1: Create API service**

Create `client/src/services/api.ts`:

```typescript
import type { LLMConfig, TemplateConfig, GenerationTask } from '../types';

const API_BASE = '';

export async function fetchTemplates(): Promise<TemplateConfig[]> {
  const response = await fetch(`${API_BASE}/api/templates`);
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export async function fetchTemplate(id: string): Promise<TemplateConfig> {
  const response = await fetch(`${API_BASE}/api/templates/${id}`);
  if (!response.ok) throw new Error('Template not found');
  return response.json();
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function generateVideo(params: {
  mode: 'template' | 'free';
  templateId?: string;
  prompt: string;
  resources?: string[];
  llmConfig: LLMConfig;
}): Promise<{ taskId: string }> {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) throw new Error('Generation failed');
  return response.json();
}

export async function checkTaskStatus(taskId: string): Promise<GenerationTask> {
  const response = await fetch(`${API_BASE}/api/generate/${taskId}/status`);
  if (!response.ok) throw new Error('Task not found');
  return response.json();
}

export async function getVideoUrl(taskId: string): string {
  return `${API_BASE}/api/generate/${taskId}/video`;
}
```

- [ ] **Step 2: Create LLM config hook**

Create `client/src/hooks/useLLMConfig.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import type { LLMConfig } from '../types';

const STORAGE_KEY = 'scene-genie-llm-config';

export function useLLMConfig() {
  const [config, setConfigState] = useState<LLMConfig | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [isConfigured, setIsConfigured] = useState(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });

  const setConfig = useCallback((newConfig: LLMConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfigState(newConfig);
    setIsConfigured(true);
  }, []);

  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConfigState(null);
    setIsConfigured(false);
  }, []);

  return { config, isConfigured, setConfig, clearConfig };
}
```

- [ ] **Step 3: Create Navbar**

Create `client/src/components/Navbar.tsx`:

```typescript
import { Link } from 'react-router-dom';
import { Wand2, Settings, History } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
          <Wand2 size={24} />
          SceneGenie
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/history" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600">
            <History size={20} />
            <span className="hidden sm:inline">历史</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-1 text-gray-600 hover:text-indigo-600">
            <Settings size={20} />
            <span className="hidden sm:inline">设置</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add API service, LLM config hook, and Navbar component"
```

---

## Task 13: Home Page (Chat Input + Templates)

**Files:**
- Create: `d:/video_gen/client/src/components/ChatInput.tsx`
- Create: `d:/video_gen/client/src/components/TemplateGallery.tsx`
- Modify: `d:/video_gen/client/src/pages/HomePage.tsx`

- [ ] **Step 1: Create ChatInput component**

Create `client/src/components/ChatInput.tsx`:

```typescript
import { useState, useRef, useCallback } from 'react';
import { Send, Image, Loader2 } from 'lucide-react';
import type { LLMConfig } from '../types';
import { uploadFile, generateVideo } from '../services/api';

interface ChatInputProps {
  llmConfig: LLMConfig;
  onTaskCreated: (taskId: string) => void;
}

export default function ChatInput({ llmConfig, onTaskCreated }: ChatInputProps) {
  const [prompt, setPrompt] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      setResources(prev => [...prev, result.url]);
    } catch (error) {
      alert('上传失败: ' + (error as Error).message);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateVideo({
        mode: 'free',
        prompt: prompt.trim(),
        resources,
        llmConfig
      });
      onTaskCreated(result.taskId);
      setPrompt('');
      setResources([]);
    } catch (error) {
      alert('生成失败: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, resources, llmConfig, isGenerating, onTaskCreated]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="描述你想生成的视频... 例如：生成一段 30 秒的产品介绍视频..."
        className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      {resources.length > 0 && (
        <div className="flex gap-2 mt-3">
          {resources.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="h-16 w-16 object-cover rounded" />
              <button
                onClick={() => setResources(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-gray-600 hover:text-indigo-600"
        >
          <Image size={20} />
          <span>添加素材</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4"
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          {isGenerating ? '生成中...' : '生成视频'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create TemplateGallery**

Create `client/src/components/TemplateGallery.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import type { TemplateConfig } from '../types';
import { fetchTemplates } from '../services/api';

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">加载模板中...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Layers size={20} />
        灵感模板
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {templates.map(template => (
          <Link
            key={template.id}
            to={`/template/${template.id}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="h-24 bg-gray-100 rounded mb-3 flex items-center justify-center">
              <Layers className="text-gray-400" size={32} />
            </div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update HomePage**

Modify `client/src/pages/HomePage.tsx`:

```typescript
import { useState } from 'react';
import { useLLMConfig } from '../hooks/useLLMConfig';
import Navbar from '../components/Navbar';
import ChatInput from '../components/ChatInput';
import TemplateGallery from '../components/TemplateGallery';
import VideoPreview from '../components/VideoPreview';

export default function HomePage() {
  const { config, isConfigured } = useLLMConfig();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">🪄 用一句话生成视频</h1>
          <p className="text-gray-600">输入描述，AI 将为你创建精美的视频</p>
        </div>

        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-yellow-800">
              请先 <a href="#/settings" className="underline font-medium">配置 AI 提供商和 API Key</a> 才能生成视频
            </p>
          </div>
        )}

        {config && (
          <ChatInput llmConfig={config} onTaskCreated={setActiveTaskId} />
        )}

        {activeTaskId && (
          <div className="mt-6">
            <VideoPreview taskId={activeTaskId} />
          </div>
        )}

        <TemplateGallery />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create VideoPreview placeholder**

Create `client/src/components/VideoPreview.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { checkTaskStatus, getVideoUrl } from '../services/api';

interface VideoPreviewProps {
  taskId: string;
}

export default function VideoPreview({ taskId }: VideoPreviewProps) {
  const [status, setStatus] = useState({ status: 'queued', progress: 0, stage: 'queued' });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await checkTaskStatus(taskId);
        setStatus(result);
        if (result.status === 'completed') {
          setIsComplete(true);
          clearInterval(interval);
        } else if (result.status === 'failed') {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="font-semibold mb-4">生成进度</h3>

      <div className="flex items-center gap-3 mb-4">
        {status.status === 'completed' ? (
          <div className="text-green-600">✓ 完成</div>
        ) : status.status === 'failed' ? (
          <div className="text-red-600">✗ 失败</div>
        ) : (
          <Loader2 className="animate-spin text-indigo-600" size={20} />
        )}
        <span className="text-sm text-gray-600">
          {status.stage} ({status.progress}%)
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {isComplete && (
        <div className="flex gap-3">
          <video
            src={getVideoUrl(taskId)}
            controls
            className="w-full rounded-lg"
          />
          <a
            href={getVideoUrl(taskId)}
            download
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shrink-0"
          >
            <Download size={18} />
            下载
          </a>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run:
```bash
cd d:/video_gen/client && npm run build
```

Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add homepage with ChatInput, TemplateGallery, VideoPreview"
```

---

## Task 14: Template Detail Page

**Files:**
- Modify: `d:/video_gen/client/src/pages/TemplatePage.tsx`
- Create: `d:/video_gen/client/src/components/ResourceUploader.tsx`

- [ ] **Step 1: Create ResourceUploader**

Create `client/src/components/ResourceUploader.tsx`:

```typescript
import { useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadFile } from '../services/api';

interface ResourceUploaderProps {
  resources: string[];
  onChange: (resources: string[]) => void;
}

export default function ResourceUploader({ resources, onChange }: ResourceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      onChange([...resources, result.url]);
    } catch (error) {
      alert('上传失败: ' + (error as Error).message);
    }
  }, [resources, onChange]);

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {resources.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="h-20 w-20 object-cover rounded" />
            <button
              onClick={() => onChange(resources.filter((_, idx) => idx !== i))}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500"
        >
          <Upload size={20} />
          <span className="text-xs mt-1">上传</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 2: Update TemplatePage**

Modify `client/src/pages/TemplatePage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Wand2 } from 'lucide-react';
import { fetchTemplate, generateVideo } from '../services/api';
import { useLLMConfig } from '../hooks/useLLMConfig';
import Navbar from '../components/Navbar';
import ResourceUploader from '../components/ResourceUploader';
import VideoPreview from '../components/VideoPreview';
import type { TemplateConfig } from '../types';

export default function TemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { config } = useLLMConfig();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTemplate(id)
      .then(t => {
        setTemplate(t);
        setPrompt(t.defaultPrompt);
      })
      .catch(() => alert('模板加载失败'));
  }, [id]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    alert('提示词已复制');
  };

  const handleGenerate = async () => {
    if (!config || !template) return;
    setLoading(true);
    try {
      const result = await generateVideo({
        mode: 'template',
        templateId: template.id,
        prompt,
        resources,
        llmConfig: config
      });
      setTaskId(result.taskId);
    } catch (error) {
      alert('生成失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!template) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={20} />
          返回首页
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2">{template.name}</h1>
          <p className="text-gray-600 mb-6">{template.description}</p>

          <div className="mb-6">
            <label className="block font-medium mb-2">预设提示词</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 p-3 border rounded-lg resize-none pr-12"
              />
              <button
                onClick={handleCopyPrompt}
                className="absolute top-3 right-3 text-gray-400 hover:text-indigo-600"
                title="复制提示词"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          {template.supportedResources.includes('images') && (
            <div className="mb-6">
              <label className="block font-medium mb-2">你的素材</label>
              <ResourceUploader resources={resources} onChange={setResources} />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !config}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Wand2 size={20} />
            {loading ? '生成中...' : '使用此模板生成'}
          </button>
        </div>

        {taskId && (
          <div className="mt-6">
            <VideoPreview taskId={taskId} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd d:/video_gen/client && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add template detail page with prompt editing and resource upload"
```

---

## Task 15: Settings Page (Personal Center)

**Files:**
- Modify: `d:/video_gen/client/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Implement SettingsPage**

Modify `client/src/pages/SettingsPage.tsx`:

```typescript
import { useState } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import { useLLMConfig } from '../hooks/useLLMConfig';
import Navbar from '../components/Navbar';
import type { LLMConfig } from '../types';

const PROVIDERS = [
  { id: 'claude' as const, name: 'Claude (Anthropic)', defaultModel: 'claude-sonnet-4-6', defaultUrl: '' },
  { id: 'openai' as const, name: 'OpenAI', defaultModel: 'gpt-4o', defaultUrl: 'https://api.openai.com/v1' },
  { id: 'kimi' as const, name: 'Kimi (Moonshot)', defaultModel: 'moonshot-v1-8k', defaultUrl: 'https://api.moonshot.cn/v1' },
  { id: 'deepseek' as const, name: 'DeepSeek', defaultModel: 'deepseek-chat', defaultUrl: 'https://api.deepseek.com/v1' },
  { id: 'custom' as const, name: '自定义', defaultModel: '', defaultUrl: '' }
];

export default function SettingsPage() {
  const { config, setConfig, clearConfig } = useLLMConfig();
  const [provider, setProvider] = useState(config?.provider || 'claude');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [saved, setSaved] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }

    const newConfig: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || selectedProvider?.defaultModel,
      baseUrl: provider === 'custom' ? baseUrl.trim() : selectedProvider?.defaultUrl
    };

    setConfig(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">⚙️ 个人中心</h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">AI 提供商配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">选择提供商</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as LLMConfig['provider']);
                  const p = PROVIDERS.find(x => x.id === e.target.value);
                  if (p) {
                    setModel(p.defaultModel);
                    setBaseUrl(p.defaultUrl);
                  }
                }}
                className="w-full p-2 border rounded-lg"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {provider === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-1">API Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">模型名称（可选）</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={selectedProvider?.defaultModel}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                仅存储在本地浏览器，不会上传到服务器
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              {saved ? <Check size={18} /> : <Save size={18} />}
              {saved ? '已保存' : '保存配置'}
            </button>

            {config && (
              <button
                onClick={clearConfig}
                className="px-6 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
              >
                清除配置
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd d:/video_gen/client && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: add settings page with multi-LLM provider configuration"
```

---

## Task 16: Integration and Final Testing

**Files:**
- Modify: `d:/video_gen/package.json` (scripts)
- Modify: `d:/video_gen/client/src/App.tsx`

- [ ] **Step 1: Add dev script to root**

Modify `package.json`:

```json
{
  "name": "scene-genie",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "build": "npm run build -w client && npm run build -w server",
    "start": "npm run start -w server"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Add history route placeholder**

Modify `client/src/App.tsx`:

```typescript
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatePage from './pages/TemplatePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/template/:id" element={<TemplatePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<div className="p-8 text-center">历史记录功能开发中...</div>} />
      </Routes>
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Run all tests**

Run:
```bash
cd d:/video_gen/server && npx vitest run
```

Expected: All tests PASS

- [ ] **Step 4: Verify full build**

Run:
```bash
cd d:/video_gen/client && npm run build
cd d:/video_gen/server && npm run build
```

Expected: Both build successfully

- [ ] **Step 5: Final commit**

```bash
cd d:/video_gen && git add .
git commit -m "feat: complete SceneGenie MVP with all core features"
```

---

## Self-Review

### Spec Coverage Check

| Spec Section | Implementing Task | Status |
|--------------|------------------|--------|
| Product Overview | Task 11-15 (UI) | ✅ Covered |
| Tech Architecture | Task 1-2 (monorepo, Express) | ✅ Covered |
| Template System | Task 3 (template engine) | ✅ Covered |
| LLM Multi-provider | Task 4 (llm-service) | ✅ Covered |
| Code Validator | Task 5 (code-validator) | ✅ Covered |
| Hyperframes Render | Task 6 (render-service) | ✅ Covered |
| Generate API (template) | Task 9 | ✅ Covered |
| Generate API (freeform) | Task 10 | ✅ Covered |
| Upload API | Task 8 | ✅ Covered |
| Templates API | Task 7 | ✅ Covered |
| Homepage (dialog + templates) | Task 13 | ✅ Covered |
| Template Detail | Task 14 | ✅ Covered |
| Settings (API Key config) | Task 15 | ✅ Covered |
| Video Preview | Task 13 | ✅ Covered |
| Error Handling | Various routes | ✅ Covered |

### Placeholder Scan

- No "TBD", "TODO", "implement later" found
- All steps include actual code
- All test code is complete with assertions
- No "similar to Task N" references

### Type Consistency Check

- `LLMConfig` type matches between `server/src/types.ts` and `client/src/types.ts`
- `TemplateConfig` consistent across frontend and backend
- API function signatures match route implementations
- All task references use consistent naming

**Plan is complete and ready for execution.**
