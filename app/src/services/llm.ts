export type LLMProvider = 'claude' | 'openai' | 'kimi' | 'deepseek' | 'custom';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
}

const SYSTEM_PROMPT = `你是一个专业的动画视频生成专家。请根据用户的描述，生成动画视频所需的三段代码。

## 极其重要的格式要求
你必须只返回一个 JSON 对象（不要 markdown 代码块标记，不要解释文字），格式如下：
{
  "custom_css": "CSS 样式代码",
  "html_elements": "HTML 元素代码",
  "gsap_animations": "GSAP 动画调用代码",
  "duration": 5
}

## 三段代码的规范

### 1. custom_css
- 只写 CSS 选择器和属性，不要写 <style> 标签
- 所有元素必须用 position: absolute 定位
- 颜色：背景 #0a0a12，文字 #f0f0f5，强调色可用 #00B4FF、#b724ff、#f59e0b
- 元素必须在画布范围内，不要溢出

### 2. html_elements
- 只写 HTML 标签（如 <div class="...">...</div>），不要写 <body> 或 <script>
- 所有动画元素必须在这里静态定义，禁止用 JS 动态创建
- 使用语义化的 class 名（如 .title、.feature-1、.icon-ai）

### 3. gsap_animations
- 只写 GSAP timeline 的动画调用，不要写 var tl = gsap.timeline(...) 或 window.__hf
- 使用 tl.fromTo('.class', { ... }, { ... }) 和 tl.to('.class', { ... })
- 使用相对时间偏移（如 '-=0.5'）来控制动画节奏
- 只使用 opacity 和 transform（x, y, scale, rotate）做动画，性能最优
- 动画结束后保持最终状态，不要循环
- 【极其重要】所有动画必须均匀分布在总时长内，不要全部挤在前面。例如 60 秒视频，每个场景应占约 20 秒

### 4. duration
- 根据用户提示词中的时长要求设置（秒数）
- 如用户未指定，默认 5
- GSAP Timeline 总时长必须等于此 duration

## 场景格式处理（当用户使用 === SCENE N === + [timestamp] 格式时）

用户可能提供带时间戳的精确场景规格，每个条目描述特定秒数的动画。你必须逐条转换：

### 转换规则
1. **每个 [timestamp] 条目 = 至少一个 CSS class + 至少一个 HTML 元素 + 至少一条 GSAP 动画**
2. **时间戳映射**：使用 GSAP timeline 的 position 参数定位到精确秒数
   - 例：[2.5s] 标题飞入 → tl.fromTo('.title', {opacity:0, x:-100}, {opacity:1, x:0, duration:1}, '2.5')
   - 例：[55.0s] 淡出 → tl.to('.scene', {opacity:0, duration:1}, '55')
3. **场景过渡**：场景切换时，旧元素使用 tl.to() 在时间戳处淡出/滑出，新元素在相同位置淡入/滑入，形成交叉过渡，不可直接跳变
4. **特效模拟**：如果规格中描述了特殊效果：
   - "CSS animation: blink" → tl.fromTo('.el', {opacity:1}, {opacity:0.3, duration:0.5, repeat:-1, yoyo:true})
   - "typewriter 效果" → 为每个字符创建 span，用 stagger opacity
   - "脉冲" → tl.fromTo('.el', {scale:1}, {scale:1.05, duration:0.8, repeat:-1, yoyo:true})
5. **不要遗漏**：规格中明确列出的每个描述条目都必须有对应的代码
6. **不要自由发挥**：不要添加规格中未提及的装饰元素或额外的动画

## 绝对禁止
- JSX 语法（如 <div />）
- TypeScript 类型注解
- 正则表达式、eval、Function 构造函数
- document.createElement 等动态创建元素
- 在 gsap_animations 中写 HTML 标签
- 在 custom_css 中写 <style> 或 HTML
- 在 html_elements 中写 <script> 或 CSS

## 正确示例
{
  "custom_css": ".title { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: 80px; color: #f0f0f5; font-weight: bold; } .subtitle { position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); font-size: 36px; color: #f0f0f5; opacity: 0.8; }",
  "html_elements": "<div class=\\\"title\\\"\\u003eClaude Code</div><div class=\\\"subtitle\\\"\\u003eAI 编程助手</div>",
  "gsap_animations": "tl.fromTo('.title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }); tl.fromTo('.subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.6');",
  "duration": 5
}`;

export function parseDurationFromPrompt(prompt: string): number {
  // Match Chinese and Arabic numerals for minutes
  const minuteMatch = prompt.match(/(\d+)\s*分钟?/);
  if (minuteMatch) {
    return Math.min(parseInt(minuteMatch[1], 10) * 60, 300); // cap at 5 min
  }
  // Match seconds
  const secondMatch = prompt.match(/(\d+)\s*秒/);
  if (secondMatch) {
    return Math.min(parseInt(secondMatch[1], 10), 300);
  }
  return 5;
}

const DIMS_MAP: Record<string, string> = {
  '16:9': '1920x1080', '9:16': '1080x1920', '1:1': '1080x1080', '4:3': '1440x1080',
};

function isSceneFormat(prompt: string): boolean {
  return /===\s*SCENE\s*\d/.test(prompt) || /\[\d+\.?\d*s\]/.test(prompt);
}

function buildUserPrompt(prompt: string, ratio: string, duration: number): string {
  const dims = DIMS_MAP[ratio] || '1920x1080';

  if (isSceneFormat(prompt)) {
    return `## 任务：将下面的精确场景时间线规格转换为动画代码

你是编译器，下面的规格是源代码。每行 [timestamp] 描述都必须转换为对应的 CSS class + HTML 元素 + GSAP 动画调用，一条不漏。

---

${prompt}

---

## 硬性约束
- 总时长：${duration} 秒，不可更改
- 画布：${dims}（比例 ${ratio}）
- 只返回 JSON，不要任何解释文字
- 严格按规格逐条转换，不要自由发挥或添加规格中没有的元素
- 如果规格中描述的动画效果无法用 opacity/transform 实现，用最接近的 GSAP 方式模拟（如 CSS blink → tl.fromTo + repeat: -1 + yoyo: true）
- 文字类元素用 typewriter 效果 = staggered opacity 逐个字符`;
  }

  return `请创建一个 ${ratio} 比例、${duration}秒 时长的视频动画，内容如下：\n${prompt}\n\n要求：\n- 总时长必须为 ${duration} 秒，不可更改\n- 动画流畅自然，风格现代科技感\n- 深色背景，浅色文字\n- 画布尺寸：${dims}`;
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
        max_tokens: 8192,
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
        max_tokens: 8192,
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

import { type TemplateData, renderTemplate, validateTemplateData } from './template.js';

function repairJSON(raw: string): string {
  let s = raw.trim();

  // Step 1: Extract outermost JSON object
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }

  // Step 2: Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Step 3: Check for truncation — count braces/brackets and close if needed
  let inString = false;
  let escaped = false;
  let braceDepth = 0;
  let bracketDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"' && !escaped) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '[') bracketDepth++;
    if (ch === ']') bracketDepth--;
  }
  if (inString) s += '"';
  while (braceDepth > 0) { s += '}'; braceDepth--; }
  while (bracketDepth > 0) { s += ']'; bracketDepth--; }

  return s;
}

function tryParseJSON(raw: string): TemplateData {
  const strategies: Array<{ label: string; fn: (s: string) => string }> = [
    { label: 'raw', fn: (s) => s },
    { label: 'repaired', fn: repairJSON },
  ];

  for (const { label, fn } of strategies) {
    try {
      const result = JSON.parse(fn(raw)) as TemplateData;
      if (label !== 'raw') console.log('[LLM] JSON parsed after repair strategy:', label);
      return result;
    } catch {
      // try next strategy
    }
  }

  throw new Error('LLM 返回的内容不是有效的 JSON 格式，请重试');
}

export interface GenerateHTMLResult {
  html: string;
  duration: number;
}

export async function generateHTML(config: LLMConfig, userPrompt: string, ratio: string, forcedDuration?: number): Promise<GenerateHTMLResult> {
  const parsedDuration = forcedDuration ?? parseDurationFromPrompt(userPrompt);
  const url = getApiUrl(config.provider, config.baseUrl);
  const headers = getHeaders(config.provider, config.apiKey);
  const body = buildBody(config.provider, buildUserPrompt(userPrompt, ratio, parsedDuration));

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg = (data.error as Record<string, string>)?.message || `LLM API error: ${res.status}`;
    if (res.status === 401 || msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('auth')) {
      throw new Error(`[${config.provider}] API Key 无效或已过期，请在 Settings 中检查配置`);
    }
    throw new Error(`[${config.provider}] ${msg}`);
  }

  const content = extractContent(config.provider, data);

  // Debug: log raw response
  console.log('[LLM] Raw response length:', content.length);
  console.log('[LLM] Raw response preview:', content.slice(0, 500));

  // Extract JSON from markdown code blocks if present
  let jsonStr = content.trim();
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
    console.log('[LLM] Extracted JSON from markdown code block');
  }

  // Parse JSON with progressive repair strategies
  let templateData: TemplateData;
  try {
    templateData = tryParseJSON(jsonStr);
  } catch (err) {
    console.error('[LLM] All JSON repair strategies failed:', (err as Error).message);
    console.error('[LLM] Content (first 1000 chars):', jsonStr.slice(0, 1000));
    throw err;
  }

  // Validate template data
  validateTemplateData(templateData);

  // Force correct duration: override LLM's value with parsed value from prompt
  const finalDuration = parsedDuration;
  if (templateData.duration !== finalDuration) {
    console.log('[LLM] Overriding LLM duration', templateData.duration, '→', finalDuration);
    templateData.duration = finalDuration;
  }

  // Render HTML from template
  const html = renderTemplate(templateData, ratio);

  console.log('[LLM] Final HTML length:', html.length, '| Duration:', finalDuration, 's');
  return { html, duration: finalDuration };
}
