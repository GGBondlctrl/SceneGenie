# SceneGenie Dashboard 首页设计规格

> **日期**: 2026-05-25
> **主题**: 登录后工作台（Dashboard）首页内容开发

---

## 1. 概述

Dashboard 是用户登录后的核心工作台，采用单页应用形式，所有内容在同一页面滚动展示。设计延续登录弹窗的蓝色玻璃质感风格，背景使用 Canvas 动画营造科技感。

**核心功能**: 视频生成（唯一功能，去掉文生图/智能画布/探索）

---

## 2. 设计系统

### 2.1 配色

| Token | 值 | 用途 |
|-------|-----|------|
| `bg-dark` | `#000C1A` | 页面主背景 |
| `bg-panel` | `#00142E` | 面板/卡片背景底色 |
| `cream` | `#E8F4FF` | 主文字色 |
| `cream-muted` | `#7A9EC2` | 次要/禁用文字 |
| `neon` | `#00B4FF` | 强调色（按钮、高亮、边框发光）|
| `neon-muted` | `rgba(0, 180, 255, 0.12)` | 玻璃边框 |

### 2.2 字体

- **标题**: Anton（Grotesk），uppercase，letter-spacing 0.02em
- **装饰**: Condiment（cursive）
- **正文/标签**: monospace，uppercase，letter-spacing 0.1em

### 2.3 玻璃质感（liquid-glass）

```css
.liquid-glass {
  background: rgba(0, 20, 46, 0.6);
  border: 1px solid rgba(0, 180, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

/* 边缘蓝色渐变高亮 */
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
```

### 2.4 背景效果

1. **Canvas 动画层**: 时间线轨道 + 脉冲关键帧节点 + 浮动粒子
2. **暗角遮罩**: `radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(1,8,40,0.6) 100%)`
3. **纹理叠加**: `texture.png` + `mix-blend-mode: lighten` + opacity 0.15

---

## 3. 页面布局

### 3.1 固定导航栏（Navbar）

- **位置**: fixed top, z-50
- **结构**:
  - 左侧: Logo "SceneGenie"（Anton 字体，点击回到顶部）
  - 中间: 导航项 —— 只保留 **"视频生成"** 一个 pill 按钮（`liquid-glass` 背景，active 状态为 `bg-neon/15 text-neon`）
  - 右侧: 用户头像/信息 + 登出按钮（`liquid-glass` pill）
- **移动端**: 汉堡菜单展开 `liquid-glass` 面板

### 3.2 页面滚动结构

```
HomePage
├── Navbar（固定）
├── GenerateSection（视频生成核心区域）
│   ├── Canvas 背景动画
│   ├── 标题区
│   ├── 主输入对话框（liquid-glass）
│   │   ├── 文本输入区
│   │   ├── 尺寸选择
│   │   ├── GSAP Timeline 预览（生成后显示）
│   │   └── 生成按钮
│   ├── 快捷标签
│   └── 滚动提示
├── TemplateSection（模板库）
│   ├── 标题
│   └── 模板卡片网格
└── Footer（版权信息）
```

---

## 4. GenerateSection 详细设计

### 4.1 标题区

- 小标签: "GSAP + HyperFrames"（`Code2` icon + `border border-neon/25` pill）
- 大标题: "编排你的视频"（Anton，响应式 `clamp(28px, 5vw, 52px)`）
- 副标题: "输入需求，AI 生成 GSAP Timeline 编排，精确控制每一帧"

### 4.2 主输入对话框（liquid-glass + 四角光点）

**四角装饰**: 每个角一个 `w-1.5 h-1.5 rounded-full bg-neon/40`

**文本输入区**:
- `textarea`，4 行
- 背景 `bg-black/30`，圆角 20px
- placeholder 轮播（每 4 秒切换）:
  - "一个SaaS产品落地页：标题从左侧滑入，副标题淡入，CTA按钮弹性弹出..."
  - "数据可视化视频：柱状图从底部增长到目标值，数字滚动计数..."
  - "产品介绍：Logo缩放出现，产品图从右侧滑入，特性列表逐个飞入..."
  - "TikTok字幕风格：文字逐字打出，emoji弹跳出现，背景色块滑动切换..."
- 底部显示字符计数 `prompt.length/500`
- 提示文字: "支持自然语言描述动画需求"（`Code2` icon）

**尺寸选择**（唯一参数）:
- 标签: `Frame` icon + "比例"
- 选项: `16:9` | `9:16` | `1:1` | `4:3`
- 选中态: `bg-neon/20 text-neon border border-neon/40 rounded-[999px]`
- 未选中态: `text-cream/45 border border-white/5 hover:border-white/15`

**GSAP Timeline 预览**（生成后显示）:
- 标题栏: "GSAP Timeline Preview" + 总时长
- 彩色时间条（fadeIn/slideX/scaleUp/stagger 等）
- 图例说明

**生成按钮**:
- 文字: "生成编排"（未生成）/ "生成中..."（loading）
- 常态: `bg-neon text-bg-dark`，hover 发光 `shadow-[0_0_50px_rgba(0,180,255,0.35)]`
- Loading: 旋转动画 + `bg-cream/10 text-cream/40`
- 禁用态（空输入）: `cursor-not-allowed`

### 4.3 快捷标签

- 标签列表: 产品展示、数据图表、社媒推广、字幕视频、落地页、TikTok
- 样式: `liquid-glass px-4 py-2 rounded-[999px]`
- 点击: 追加到 prompt 中

### 4.4 滚动提示

- 文字: "编排模板"
- 下方: 渐变竖线 `bg-gradient-to-b from-cream/20 to-transparent`

---

## 5. 视频生成流程

### 5.1 触发条件

用户输入描述 + 选择尺寸 → 点击"生成编排"

### 5.2 生成中状态（3-5 秒模拟）

- 按钮变为 loading 状态
- 显示 GSAP Timeline Preview 区域（彩色条动态展开）
- 状态文字: "正在编排 GSAP 动画..."

### 5.3 生成完成

在 GenerateSection 下方展开结果区域:

```
ResultArea（liquid-glass 卡片）
├── 视频预览播放器（自动播放，muted，loop）
│   └── 视频 URL（由后端生成后返回）
├── 操作按钮行
│   ├── [下载视频] —— bg-neon text-bg-dark
│   └── [重新生成] —— 复制当前 prompt + 尺寸参数到新输入，用户可修改后再次生成
└── 生成信息
    ├── 尺寸: 16:9
    ├── 时长: 自动计算
    └── 生成时间: 2026-05-25 14:32
```

**重新生成逻辑**:
- 点击后将当前 `prompt` 和 `selectedRatio` 复制到输入区
- 自动滚动到输入区顶部
- 用户可修改后再次点击生成

---

## 6. TemplateSection 设计

### 6.1 标题区

- 标题: "编排模板"（Anton，大写）
- 副标题: "选择一个模板快速开始"

### 6.2 模板卡片网格

- 布局: 响应式网格（移动端 1 列，平板 2 列，桌面 3 列）
- 卡片样式: `liquid-glass rounded-[20px]`
- 卡片内容:
  - 顶部: 占位图区域（`bg-neon/10`，高度 120px，居中 icon）
  - 标题: 模板名称（Space Intro / Photo Story / Product Reveal / Greeting Card）
  - 描述: 一句话说明
  - 按钮: "使用此模板" —— 点击后将模板描述填入 GenerateSection 的 prompt，并平滑滚动到输入区

### 6.3 模板数据

| 名称 | 描述 | 默认 Prompt |
|------|------|-------------|
| Space Intro | Cosmic text animation | 一段宇宙风格的片头，文字从星空深处飞入... |
| Photo Story | Slideshow with transitions | 照片故事 slideshow，带淡入淡出转场... |
| Product Reveal | Sleek showcase motion | 产品展示视频， sleek 的展示动效... |
| Greeting Card | Animated message | 动态贺卡，带弹跳文字和粒子效果... |

---

## 7. 技术实现要点

### 7.1 文件结构

```
app/src/
├── pages/
│   └── Dashboard.tsx          # 主页面（整合所有 section）
├── sections/
│   ├── Navbar.tsx             # 固定导航栏（从现有 Dashboard 改造）
│   ├── GenerateSection.tsx    # 视频生成核心区域
│   └── TemplateSection.tsx    # 模板库
├── components/
│   └── ui/
│       └── ...                # shadcn 组件
├── hooks/
│   └── useGenerate.ts         # 视频生成状态管理 hook
├── services/
│   └── api.ts                 # 添加 generateVideo API
└── index.css                  # liquid-glass 样式、全局变量
```

### 7.2 依赖

- `gsap` —— 入场动画（已存在）
- `lucide-react` —— 图标（已存在）
- Canvas 2D API —— 背景动画（原生，无需额外依赖）

### 7.3 响应式断点

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| 默认 | < 640px | 单列，输入框全宽，标签换行 |
| sm | >= 640px | 标签不换行 |
| md | >= 768px | Navbar 显示完整导航 |
| lg | >= 1024px | 模板网格 3 列 |

### 7.4 性能注意

- Canvas 动画使用 `requestAnimationFrame`，组件卸载时取消
- 视频预览使用 `video` 标签，`preload="metadata"`
- 纹理图片 `texture.png` 需压缩至 < 100KB

---

## 8. API 接口（预留）

```typescript
// POST /api/video/generate
interface GenerateVideoRequest {
  prompt: string;
  ratio: '16:9' | '9:16' | '1:1' | '4:3';
}

interface GenerateVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  timeline?: TimelineKeyframe[];
  createdAt: string;
}
```

MVP 阶段可先用 `setTimeout` 模拟生成过程，后续接入真实后端。

---

## 9. 无障碍

- 所有按钮有明确的 `aria-label`
- 颜色对比度 >= 4.5:1
- 键盘可导航（Tab 顺序符合视觉顺序）
- 视频播放器有播放/暂停控制

---

*设计规格完成，等待审查。*
