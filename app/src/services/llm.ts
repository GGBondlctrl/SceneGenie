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
