# Dashboard 首页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将登录后的 Dashboard 从侧边栏 tab 布局重写为单页滚动工作台，包含固定导航栏、视频生成区（Canvas 背景 + 输入框 + 尺寸选择 + 结果区）、模板库和页脚，采用蓝色玻璃质感主题。

**Architecture:** Dashboard 页面作为容器组件，组合 Navbar（固定顶部）、GenerateSection（首屏全高，内含 Canvas 背景动画）、TemplateSection（模板网格）和 Footer。状态通过 useGenerate hook 集中管理，生成结果通过 props 回调传递。所有子组件均为纯展示组件。

**Tech Stack:** React 19 + TypeScript + Tailwind CSS + GSAP + Canvas 2D API + lucide-react

---

## 文件结构映射

| 文件 | 操作 | 职责 |
|------|------|------|
| `app/tailwind.config.js` | 修改 | neon 颜色从 `#6FFF00` 改为 `#00B4FF`（蓝色） |
| `app/src/index.css` | 修改 | liquid-glass 边框从白色渐变改为蓝色渐变 |
| `app/src/services/api.ts` | 修改 | 添加 `generateVideo` API 接口（MVP 阶段用 setTimeout 模拟） |
| `app/src/hooks/useGenerate.ts` | 新建 | 视频生成状态管理：prompt、ratio、isGenerating、result、regenerate |
| `app/src/sections/Navbar.tsx` | 新建 | 固定顶部导航栏：Logo + "视频生成" pill + 用户头像 + 登出 |
| `app/src/sections/GenerateSection.tsx` | 新建 | 核心生成区：Canvas 背景 + 标题 + 输入框 + 尺寸选择 + Timeline Preview + 结果区 |
| `app/src/sections/TemplateSection.tsx` | 新建 | 模板库：4 个模板卡片，点击填充 prompt 并滚动到输入区 |
| `app/src/pages/Dashboard.tsx` | 重写 | 整合所有 section 为单页滚动布局 |

---

### Task 1: 更新设计 Token（全局蓝色主题）

**Files:**
- Modify: `app/tailwind.config.js`
- Modify: `app/src/index.css`

- [ ] **Step 1: 修改 tailwind.config.js 中 neon 颜色**

将 `neon: '#6FFF00'` 改为 `neon: '#00B4FF'`：

```javascript
// tailwind.config.js 第 45 行
'neon': '#00B4FF',
```

- [ ] **Step 2: 修改 index.css 中 liquid-glass 边框为蓝色渐变**

将 `.liquid-glass::before` 的渐变从白色改为蓝色：

```css
/* index.css — 替换整个 liquid-glass 和 ::before 规则 */

@layer components {
  /* Liquid Glass Effect — Blue Theme */
  .liquid-glass {
    background: rgba(0, 20, 46, 0.6);
    border: 1px solid rgba(0, 180, 255, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }

  /* Edge highlight — blue tint */
  .liquid-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(180deg,
      rgba(0, 180, 255, 0.25) 0%, rgba(0, 180, 255, 0.08) 20%,
      rgba(0, 180, 255, 0) 40%, rgba(0, 180, 255, 0) 60%,
      rgba(0, 180, 255, 0.08) 80%, rgba(0, 180, 255, 0.25) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* Texture Overlay */
  .texture-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    pointer-events: none;
    background-image: url('/texture.png');
    background-size: cover;
    background-position: center;
    mix-blend-mode: lighten;
    opacity: 0.15;
  }

  /* Font utilities */
  .font-heading {
    font-family: 'Anton', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 0.95;
  }

  .font-script {
    font-family: 'Condiment', cursive;
    text-transform: none;
  }
}
```

注意：同时移除旧的 `.liquid-glass` 规则（带有 `backdrop-filter` 白色版本）。

- [ ] **Step 3: 验证无构建错误**

Run: `cd app && npm run build`
Expected: 成功编译，无错误

- [ ] **Step 4: Commit**

```bash
git add app/tailwind.config.js app/src/index.css
git commit -m "design: switch neon from green to blue (#00B4FF), update liquid-glass to blue edge gradient"
```

---

### Task 2: 添加视频生成 API 接口

**Files:**
- Modify: `app/src/services/api.ts`

- [ ] **Step 1: 在 api.ts 中添加 generateVideo 类型和函数**

在现有 `api` 对象之前添加接口定义，然后扩展 `api` 对象：

```typescript
// 添加到 api.ts 第 20 行之后（ApiError 类之后）

export interface GenerateVideoRequest {
  prompt: string;
  ratio: '16:9' | '9:16' | '1:1' | '4:3';
}

export interface TimelineKeyframe {
  label: string;
  width: string;
  color: string;
}

export interface GenerateVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  timeline?: TimelineKeyframe[];
  createdAt: string;
}

// MVP 阶段模拟数据
const mockTimeline: TimelineKeyframe[] = [
  { label: '0.0s', width: '15%', color: '#00B4FF' },
  { label: '0.5s', width: '10%', color: '#b724ff' },
  { label: '1.2s', width: '20%', color: '#3b82f6' },
  { label: '2.0s', width: '15%', color: '#00B4FF' },
  { label: '3.0s', width: '25%', color: '#f59e0b' },
  { label: '4.5s', width: '15%', color: '#b724ff' },
];
```

然后将 `api` 对象扩展为包含 `generateVideo`：

```typescript
// 替换现有的 api 对象导出（第 48 行开始）

export const api = {
  sendCode: (email: string): Promise<{ message: string }> =>
    fetchJson('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  register: (email: string, password: string, name: string, code: string): Promise<AuthResponse> =>
    fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, code }),
    }),

  login: (email: string, password: string): Promise<AuthResponse> =>
    fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (): Promise<{ message: string }> =>
    fetchJson('/auth/logout', { method: 'POST' }),

  me: (): Promise<{ user: ApiUser }> =>
    fetchJson('/auth/me'),

  // MVP: simulate video generation with setTimeout
  generateVideo: async (req: GenerateVideoRequest): Promise<GenerateVideoResponse> => {
    // Simulate network delay 3-5s
    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Simulate API call (will fail until backend is ready, so we return mock data)
    // In production, replace with:
    // return fetchJson('/video/generate', { method: 'POST', body: JSON.stringify(req) });

    return {
      id: `vid_${Date.now()}`,
      status: 'completed',
      videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4',
      timeline: mockTimeline,
      createdAt: new Date().toISOString(),
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add app/src/services/api.ts
git commit -m "feat(api): add generateVideo endpoint with MVP mock implementation"
```

---

### Task 3: 创建 useGenerate Hook

**Files:**
- Create: `app/src/hooks/useGenerate.ts`

- [ ] **Step 1: 创建 useGenerate hook**

```typescript
import { useState, useCallback, useRef } from 'react';
import { api, type GenerateVideoResponse } from '../services/api.js';

export interface GenerateResult {
  id: string;
  videoUrl: string;
  timeline: { label: string; width: string; color: string }[];
  createdAt: string;
}

export function useGenerate() {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track last generation params for "regenerate"
  const lastPromptRef = useRef('');
  const lastRatioRef = useRef<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    lastPromptRef.current = prompt;
    lastRatioRef.current = selectedRatio;

    try {
      const res = await api.generateVideo({ prompt, ratio: selectedRatio });

      if (res.status === 'completed' && res.videoUrl && res.timeline) {
        setResult({
          id: res.id,
          videoUrl: res.videoUrl,
          timeline: res.timeline,
          createdAt: res.createdAt,
        });
      } else {
        setError('生成失败，请重试');
      }
    } catch (err) {
      setError((err as Error).message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedRatio]);

  const regenerate = useCallback(() => {
    setPrompt(lastPromptRef.current);
    setSelectedRatio(lastRatioRef.current);
    setResult(null);
    setError(null);
    // Scroll to top is handled by the caller via ref
  }, []);

  const appendTag = useCallback((tag: string) => {
    setPrompt((prev) => (prev ? `${prev}，${tag}` : tag));
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating,
    result,
    error,
    generate,
    regenerate,
    appendTag,
    clearResult,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/hooks/useGenerate.ts
git commit -m "feat(hooks): add useGenerate hook for video generation state management"
```

---

### Task 4: 创建 Navbar 组件

**Files:**
- Create: `app/src/sections/Navbar.tsx`

- [ ] **Step 1: 创建 Navbar 组件**

```typescript
import { useState } from 'react';
import { LogOut, User, Menu, X } from 'lucide-react';
import type { User as UserType } from '../hooks/useAuth';

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={scrollToTop}
          className="font-grotesk text-[16px] uppercase text-cream tracking-[0.02em] hover:text-neon transition-colors"
        >
          SceneGenie
        </button>

        {/* Center — Active Nav Pill (Desktop) */}
        <div className="hidden md:flex items-center">
          <span className="liquid-glass px-5 py-2 rounded-[999px] text-[12px] font-mono uppercase tracking-wider text-neon bg-neon/15 border border-neon/40">
            视频生成
          </span>
        </div>

        {/* Right — User + Logout */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neon/15 flex items-center justify-center border border-neon/25">
              <User size={14} className="text-neon" />
            </div>
            <span className="font-mono text-cream/60 text-[11px] uppercase tracking-wider max-w-[120px] truncate">
              {user.email}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="liquid-glass px-4 py-2 rounded-[999px] text-[11px] font-mono uppercase tracking-wider text-cream/50 hover:text-cream transition-colors flex items-center gap-1.5"
          >
            <LogOut size={12} />
            退出
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {mobileMenuOpen ? <X size={20} className="text-cream" /> : <Menu size={20} className="text-cream" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden liquid-glass rounded-[20px] p-4 mx-auto max-w-[calc(100%-2rem)] mb-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-neon/15 flex items-center justify-center border border-neon/25">
              <User size={16} className="text-neon" />
            </div>
            <span className="font-mono text-cream text-[12px]">{user.email}</span>
          </div>
          <button
            onClick={() => { onLogout(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[12px] font-mono uppercase tracking-wider text-cream/60 hover:text-cream hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/sections/Navbar.tsx
git commit -m "feat(navbar): add fixed navbar with logo, active pill, user avatar and logout"
```

---

### Task 5: 创建 GenerateSection 组件

**Files:**
- Create: `app/src/sections/GenerateSection.tsx`

- [ ] **Step 1: 创建 GenerateSection 完整组件**

该组件是核心且较大的组件，包含 Canvas 背景动画、标题、输入对话框、GSAP Timeline Preview、生成结果区。

```typescript
import { useState, useRef, useEffect, useCallback } from 'react';
import { Code2, Frame, Sparkles, Download, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import type { GenerateResult } from '../hooks/useGenerate';

const ratios = ['16:9', '9:16', '1:1', '4:3'] as const;
type Ratio = (typeof ratios)[number];

const placeholderPrompts = [
  '一个SaaS产品落地页：标题从左侧滑入，副标题淡入，CTA按钮弹性弹出，持续5秒...',
  '数据可视化视频：柱状图从底部增长到目标值，数字滚动计数，最后整体淡出...',
  '产品介绍：Logo缩放出现，产品图从右侧滑入，特性列表逐个飞入，底部行动号召...',
  'TikTok字幕风格：文字逐字打出，emoji弹跳出现，背景色块滑动切换，快节奏剪辑...',
];

const animTypes = ['fadeIn', 'slideX', 'scaleUp', 'stagger'];
const animColors = ['#00B4FF', '#b724ff', '#3b82f6', '#f59e0b'];

interface Track {
  y: number;
  speed: number;
  nodes: { x: number; alpha: number; pulseSpeed: number; pulseOffset: number }[];
}

interface GenerateSectionProps {
  prompt: string;
  setPrompt: (v: string) => void;
  selectedRatio: Ratio;
  setSelectedRatio: (v: Ratio) => void;
  isGenerating: boolean;
  result: GenerateResult | null;
  error: string | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onAppendTag: (tag: string) => void;
}

export default function GenerateSection({
  prompt,
  setPrompt,
  selectedRatio,
  setSelectedRatio,
  isGenerating,
  result,
  error,
  onGenerate,
  onRegenerate,
  onAppendTag,
}: GenerateSectionProps) {
  const [placeholder, setPlaceholder] = useState(placeholderPrompts[0]);
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracksRef = useRef<Track[]>([]);
  const animFrameRef = useRef<number>(0);

  // Placeholder rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((prev) => {
        const idx = placeholderPrompts.indexOf(prev);
        return placeholderPrompts[(idx + 1) % placeholderPrompts.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Entrance animation
  useEffect(() => {
    const section = sectionRef.current;
    const dialog = dialogRef.current;
    const title = titleRef.current;
    if (!section || !dialog || !title) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(dialog,
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.5 }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  // Result area entrance animation
  useEffect(() => {
    if (result && resultRef.current) {
      gsap.fromTo(resultRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      );
    }
  }, [result]);

  // Canvas timeline background animation
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const trackCount = 5;
    const tracks: Track[] = [];
    for (let i = 0; i < trackCount; i++) {
      const nodeCount = 4 + Math.floor(Math.random() * 4);
      const nodes = [];
      for (let j = 0; j < nodeCount; j++) {
        nodes.push({
          x: Math.random() * rect.width,
          alpha: 0.1 + Math.random() * 0.3,
          pulseSpeed: 0.5 + Math.random() * 1.5,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
      tracks.push({
        y: rect.height * (0.2 + (i / trackCount) * 0.6),
        speed: 0.15 + Math.random() * 0.25,
        nodes,
      });
    }
    tracksRef.current = tracks;
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 0.016;

      const tracks = tracksRef.current;
      for (let ti = 0; ti < tracks.length; ti++) {
        const track = tracks[ti];

        // Track line
        ctx.beginPath();
        ctx.moveTo(0, track.y);
        ctx.lineTo(rect.width, track.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Vertical grid markers
        for (let gx = 0; gx < rect.width; gx += 120) {
          const offsetX = ((time * 8) % 120);
          const x = gx - offsetX;
          if (x < 0 || x > rect.width) continue;
          ctx.beginPath();
          ctx.moveTo(x, track.y - 3);
          ctx.lineTo(x, track.y + 3);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Keyframe nodes
        for (let ni = 0; ni < track.nodes.length; ni++) {
          const node = track.nodes[ni];
          node.x -= track.speed;
          if (node.x < -20) node.x = rect.width + 20;

          const pulseAlpha = node.alpha + Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.08;
          const clampedAlpha = Math.max(0.05, Math.min(0.5, pulseAlpha));

          // Glow
          const gradient = ctx.createRadialGradient(node.x, track.y, 0, node.x, track.y, 12);
          gradient.addColorStop(0, `rgba(0, 180, 255, ${clampedAlpha * 0.4})`);
          gradient.addColorStop(1, 'rgba(0, 180, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(node.x - 12, track.y - 12, 24, 24);

          // Dot
          ctx.beginPath();
          ctx.arc(node.x, track.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 180, 255, ${clampedAlpha})`;
          ctx.fill();

          // Connector
          if (ni < track.nodes.length - 1) {
            const nextNode = track.nodes[ni + 1];
            let dx = nextNode.x - node.x;
            if (dx < 0) dx += rect.width;
            ctx.beginPath();
            ctx.moveTo(node.x + 4, track.y);
            ctx.lineTo(node.x + dx / 2, track.y);
            ctx.strokeStyle = `rgba(0, 180, 255, ${clampedAlpha * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Floating particles
      for (let i = 0; i < 15; i++) {
        const px = ((time * 3 + i * 73.7) % (rect.width + 40)) - 20;
        const py = ((Math.sin(time * 0.3 + i * 1.7) * 0.5 + 0.5) * rect.height);
        const pAlpha = 0.03 + Math.sin(time * 0.5 + i) * 0.02;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, pAlpha)})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-12"
    >
      {/* Canvas Timeline Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#010828' }}
      />

      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(1,8,40,0.6) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Code2 size={18} className="text-neon" />
            <span className="font-mono text-neon text-[10px] uppercase tracking-[0.25em] border border-neon/25 px-3 py-1 rounded-[999px]">
              GSAP + HyperFrames
            </span>
          </div>
          <h1
            className="font-grotesk uppercase text-cream leading-[1.05] mb-2"
            style={{ fontSize: 'clamp(28px, 5vw, 52px)' }}
          >
            编排你的视频
          </h1>
          <p className="font-mono text-cream/35 text-[12px] sm:text-[13px] tracking-wide">
            输入需求，AI 生成 GSAP Timeline 编排，精确控制每一帧
          </p>
        </div>

        {/* Main Dialog */}
        <div
          ref={dialogRef}
          className="w-full liquid-glass rounded-[32px] p-5 sm:p-7"
        >
          {/* Corner anchor lights */}
          <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-neon/40" />
          <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-neon/40" />
          <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-neon/40" />
          <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-neon/40" />

          {/* Textarea */}
          <div className="relative mb-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full bg-black/30 rounded-[20px] px-5 py-4 text-cream font-mono text-[13px] sm:text-[14px] leading-relaxed resize-none outline-none border border-white/5 focus:border-neon/30 transition-colors duration-300 placeholder:text-cream/18"
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="flex items-center gap-2 text-cream/25 text-[11px] font-mono">
                <Code2 size={11} />
                支持自然语言描述动画需求
              </span>
              <span className="text-cream/18 text-[11px] font-mono">
                {prompt.length}/500
              </span>
            </div>
          </div>

          {/* Ratio selection */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Frame size={13} className="text-cream/35" />
              <span className="font-mono text-cream/35 text-[11px] uppercase tracking-wider">比例</span>
              <div className="flex gap-1">
                {ratios.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRatio(r)}
                    className={`px-3 py-1.5 rounded-[999px] text-[11px] font-mono transition-all duration-300 ${
                      selectedRatio === r
                        ? 'bg-neon/20 text-neon border border-neon/40'
                        : 'text-cream/45 border border-white/5 hover:border-white/15 hover:text-cream/70'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GSAP Timeline Preview (shown during/after generation) */}
          {(isGenerating || result) && (
            <div className="mb-5 p-4 bg-black/30 rounded-[16px] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-neon uppercase tracking-wider">GSAP Timeline Preview</span>
                <span className="font-mono text-[10px] text-cream/25">~5s total</span>
              </div>
              <div className="flex gap-1 h-6">
                {(result?.timeline || [
                  { label: '0.0s', width: '15%', color: '#00B4FF' },
                  { label: '0.5s', width: '10%', color: '#b724ff' },
                  { label: '1.2s', width: '20%', color: '#3b82f6' },
                  { label: '2.0s', width: '15%', color: '#00B4FF' },
                  { label: '3.0s', width: '25%', color: '#f59e0b' },
                  { label: '4.5s', width: '15%', color: '#b724ff' },
                ]).map((kf, i) => (
                  <div key={i} className="relative group" style={{ width: kf.width }}>
                    <div
                      className="h-full rounded-[4px] transition-all duration-300 group-hover:brightness-125"
                      style={{ backgroundColor: kf.color, opacity: 0.7 }}
                    />
                    <span className="absolute -bottom-4 left-0 font-mono text-[8px] text-cream/18">{kf.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-5">
                {animTypes.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: animColors[i] }} />
                    <span className="font-mono text-[9px] text-cream/25">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-[20px] font-grotesk text-[15px] uppercase tracking-[0.05em] flex items-center justify-center gap-3 transition-all duration-500 ${
              isGenerating || !prompt.trim()
                ? 'bg-cream/10 text-cream/40 cursor-not-allowed'
                : 'bg-neon text-bg-dark hover:shadow-[0_0_50px_rgba(0,180,255,0.35)] hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
                正在编排 GSAP 动画...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                生成编排
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-[12px]">
              <p className="font-mono text-red-400 text-[11px]">{error}</p>
            </div>
          )}
        </div>

        {/* Result Area */}
        {result && (
          <div
            ref={resultRef}
            className="w-full liquid-glass rounded-[32px] p-5 sm:p-7 mt-6"
          >
            {/* Video Player */}
            <div className="relative aspect-video bg-black/40 rounded-[20px] overflow-hidden mb-5">
              <video
                src={result.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <a
                href={result.videoUrl}
                download
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] bg-neon text-bg-dark font-grotesk text-[13px] uppercase tracking-wider hover:shadow-[0_0_40px_rgba(0,180,255,0.3)] transition-all"
              >
                <Download size={15} />
                下载视频
              </a>
              <button
                onClick={onRegenerate}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] liquid-glass font-grotesk text-[13px] uppercase tracking-wider text-cream hover:text-neon transition-colors"
              >
                <RotateCcw size={15} />
                重新生成
              </button>
            </div>

            {/* Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] text-cream/25 uppercase tracking-wider">
              <span>尺寸: {selectedRatio}</span>
              <span>时长: ~5s</span>
              <span>生成时间: {formatDate(result.createdAt)}</span>
            </div>
          </div>
        )}

        {/* Quick tags */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {['产品展示', '数据图表', '社媒推广', '字幕视频', '落地页', 'TikTok'].map((tag) => (
            <button
              key={tag}
              onClick={() => onAppendTag(tag)}
              className="liquid-glass px-4 py-2 rounded-[999px] text-[11px] font-mono text-cream/45 hover:text-neon hover:bg-white/5 transition-all duration-300"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-10 flex flex-col items-center gap-2 text-cream/20">
          <span className="font-mono text-[10px] uppercase tracking-widest">编排模板</span>
          <div className="w-px h-6 bg-gradient-to-b from-cream/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/sections/GenerateSection.tsx
git commit -m "feat(generate): add GenerateSection with canvas background, input dialog, ratio selector, timeline preview and result area"
```

---

### Task 6: 创建 TemplateSection 组件

**Files:**
- Create: `app/src/sections/TemplateSection.tsx`

- [ ] **Step 1: 创建 TemplateSection 组件**

```typescript
import { useRef, useEffect } from 'react';
import { Sparkles, Image, Layers, Heart } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Template {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  defaultPrompt: string;
}

const templates: Template[] = [
  {
    id: 'space-intro',
    name: 'Space Intro',
    desc: 'Cosmic text animation',
    icon: Sparkles,
    defaultPrompt: '一段宇宙风格的片头，文字从星空深处飞入，带光晕拖尾效果，最后汇聚成品牌Logo...',
  },
  {
    id: 'photo-story',
    name: 'Photo Story',
    desc: 'Slideshow with transitions',
    icon: Image,
    defaultPrompt: '照片故事 slideshow，带淡入淡出转场，每张图片配文字说明，背景音乐节奏同步...',
  },
  {
    id: 'product-reveal',
    name: 'Product Reveal',
    desc: 'Sleek showcase motion',
    icon: Layers,
    defaultPrompt: '产品展示视频，sleek 的展示动效，产品从暗处缓缓浮现，特性标签逐个弹出...',
  },
  {
    id: 'greeting-card',
    name: 'Greeting Card',
    desc: 'Animated message',
    icon: Heart,
    defaultPrompt: '动态贺卡，带弹跳文字和粒子效果，祝福语逐字打出，结尾有彩带动画...',
  },
];

interface TemplateSectionProps {
  onUseTemplate: (prompt: string) => void;
}

export default function TemplateSection({ onUseTemplate }: TemplateSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current;
    if (!section || !title || !cards) return;

    const ctx = gsap.context(() => {
      // Title entrance
      gsap.fromTo(title,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Cards stagger entrance
      const cardEls = cards.querySelectorAll('.template-card');
      gsap.fromTo(cardEls,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: {
            trigger: cards,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 sm:py-32"
      style={{ background: '#010828' }}
    >
      <div className="max-w-[960px] mx-auto px-4 sm:px-6">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-12">
          <h2
            className="font-grotesk uppercase text-cream leading-[1.05] mb-3"
            style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}
          >
            编排模板
          </h2>
          <p className="font-mono text-cream/35 text-[12px] sm:text-[13px] tracking-wide">
            选择一个模板快速开始
          </p>
        </div>

        {/* Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {templates.map((templ) => {
            const Icon = templ.icon;
            return (
              <div
                key={templ.id}
                className="template-card liquid-glass rounded-[20px] p-5 flex flex-col group hover:bg-white/[0.03] transition-colors duration-300"
              >
                {/* Placeholder image area */}
                <div className="h-[120px] bg-neon/10 rounded-[12px] mb-4 flex items-center justify-center group-hover:bg-neon/[0.08] transition-colors">
                  <Icon size={32} className="text-neon/50 group-hover:text-neon/70 transition-colors" />
                </div>

                {/* Title */}
                <h3 className="font-grotesk uppercase text-cream text-[14px] tracking-wider mb-1">
                  {templ.name}
                </h3>

                {/* Desc */}
                <p className="font-mono text-cream/30 text-[11px] leading-relaxed mb-4 flex-1">
                  {templ.desc}
                </p>

                {/* Button */}
                <button
                  onClick={() => onUseTemplate(templ.defaultPrompt)}
                  className="w-full py-2.5 rounded-[12px] text-[11px] font-mono uppercase tracking-wider text-cream/50 hover:text-neon border border-white/5 hover:border-neon/30 transition-all duration-300"
                >
                  使用此模板
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/sections/TemplateSection.tsx
git commit -m "feat(templates): add TemplateSection with 4 template cards and GSAP scroll animations"
```

---

### Task 7: 重写 Dashboard 页面

**Files:**
- Rewrite: `app/src/pages/Dashboard.tsx`

- [ ] **Step 1: 重写 Dashboard.tsx**

```typescript
import { useRef } from 'react';
import Navbar from '../sections/Navbar';
import GenerateSection from '../sections/GenerateSection';
import TemplateSection from '../sections/TemplateSection';
import { useGenerate } from '../hooks/useGenerate';
import type { User } from '../hooks/useAuth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating,
    result,
    error,
    generate,
    regenerate,
    appendTag,
    clearResult,
  } = useGenerate();

  const generateTopRef = useRef<HTMLDivElement>(null);

  const handleUseTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    clearResult();
    generateTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegenerate = () => {
    regenerate();
    generateTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={generateTopRef} className="relative bg-bg-dark min-h-screen">
      <Navbar user={user} onLogout={onLogout} />

      <GenerateSection
        prompt={prompt}
        setPrompt={setPrompt}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        isGenerating={isGenerating}
        result={result}
        error={error}
        onGenerate={generate}
        onRegenerate={handleRegenerate}
        onAppendTag={appendTag}
      />

      <TemplateSection onUseTemplate={handleUseTemplate} />

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/5">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-grotesk text-cream/20 text-[12px] uppercase tracking-wider">
            SceneGenie
          </span>
          <span className="font-mono text-cream/15 text-[10px] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} SceneGenie. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 删除旧的 Dashboard 相关 import 和类型（无需，已完全替换）**

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/Dashboard.tsx
git commit -m "refactor(dashboard): rewrite Dashboard as single-page scroll layout with Navbar, GenerateSection and TemplateSection"
```

---

### Task 8: 验证与清理

**Files:**
- Verify: 所有修改的文件

- [ ] **Step 1: 检查 TypeScript 编译**

Run: `cd app && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 2: 检查构建**

Run: `cd app && npm run build`
Expected: 成功编译

- [ ] **Step 3: 运行开发服务器并手动验证**

Run: `cd app && npm run dev`
验证项：
1. 登录后跳转到 Dashboard，显示蓝色主题
2. Navbar 固定在顶部，Logo 可点击回到顶部
3. GenerateSection 有 Canvas 背景动画（时间线轨道 + 脉冲节点）
4. 输入框 placeholder 每 4 秒轮播
5. 尺寸选择 16:9 / 9:16 / 1:1 / 4:3 可切换
6. 点击"生成编排"后按钮进入 loading 状态，3-5 秒后显示结果
7. 结果区显示视频播放器（自动播放、静音、循环）、下载按钮、重新生成按钮
8. 点击模板卡片的"使用此模板"平滑滚动到输入区并填充 prompt
9. 重新生成按钮将 prompt 和 ratio 回填到输入区并滚动到顶部
10. 页脚显示版权信息
11. 移动端 Navbar 汉堡菜单可展开/收起

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address review feedback from Dashboard implementation" || echo "No changes to commit"
```

---

## 自审清单

### 1. Spec 覆盖度检查

| 设计文档要求 | 对应任务 |
|-------------|---------|
| neon 颜色 #00B4FF | Task 1 |
| liquid-glass 蓝色边框 | Task 1 |
| 固定 Navbar（Logo + 视频生成 pill + 用户 + 登出） | Task 4 |
| Canvas 背景动画（时间线轨道 + 脉冲节点 + 浮动粒子） | Task 5 |
| 标题区（GSAP + HyperFrames badge + 编排你的视频） | Task 5 |
| 主输入对话框（四角光点 + textarea + 字符计数） | Task 5 |
| placeholder 轮播（4 秒切换） | Task 5 |
| 尺寸选择（仅 ratio: 16:9/9:16/1:1/4:3） | Task 5 |
| GSAP Timeline Preview（生成后显示彩色条） | Task 5 |
| 生成按钮（常态/loading/禁用） | Task 5 |
| 快捷标签（点击追加到 prompt） | Task 5 |
| 滚动提示（编排模板 + 渐变竖线） | Task 5 |
| 结果区（视频播放器 + 下载 + 重新生成 + 信息） | Task 5 |
| 重新生成（复制 prompt + ratio 到输入区并滚动顶部） | Task 3 + Task 5 |
| TemplateSection（4 模板卡片 + 使用此模板按钮） | Task 6 |
| 模板点击后填充 prompt 并滚动到输入区 | Task 7 |
| Footer | Task 7 |
| 移动端汉堡菜单 | Task 4 |
| API 接口（generateVideo mock） | Task 2 |

### 2. Placeholder 扫描

- 无 "TBD"、"TODO"、"implement later"
- 无 "add appropriate error handling" 等模糊描述
- 所有代码步骤包含完整代码
- 无 "Similar to Task N" 引用

### 3. 类型一致性检查

- `Ratio` 类型在 Task 5 中定义为 `'16:9' | '9:16' | '1:1' | '4:3'`
- `useGenerate` hook 中 `selectedRatio` 类型与之匹配
- `GenerateResult` 类型在 Task 3 定义，Task 5 中通过 import 使用
- `TimelineKeyframe` 类型在 Task 2 定义，Task 5 中使用
- API 中 `GenerateVideoRequest.ratio` 类型与前端一致

---

## 执行交接

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-dashboard-homepage.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
