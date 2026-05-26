const BASE_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SceneGenie Video</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #0a0a12;
  width: {{WIDTH}}px;
  height: {{HEIGHT}}px;
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
{{CUSTOM_CSS}}
</style>
</head>
<body data-composition-id="main" data-width="{{WIDTH}}" data-height="{{HEIGHT}}">
{{HTML_ELEMENTS}}
<script>
(function() {
  var duration = {{DURATION}};
  var tl = gsap.timeline({ paused: true });
{{GSAP_ANIMATIONS}}
  var actualDuration = tl.duration();
  if (actualDuration < duration) {
    tl.to({}, { duration: duration - actualDuration });
  }
  window.__timelines = { main: tl };
  window.__hf = { duration: duration, seek: function(t) { tl.seek(t); } };
})();
</script>
</body>
</html>`;

export interface TemplateData {
  custom_css: string;
  html_elements: string;
  gsap_animations: string;
  duration: number;
}

const RATIO_DIMS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '4:3': { w: 1440, h: 1080 },
};

export function renderTemplate(data: TemplateData, ratio: string): string {
  const dims = RATIO_DIMS[ratio] || RATIO_DIMS['16:9'];
  return BASE_TEMPLATE
    .replace(/\{\{WIDTH\}\}/g, String(dims.w))
    .replace(/\{\{HEIGHT\}\}/g, String(dims.h))
    .replace(/\{\{DURATION\}\}/g, String(data.duration))
    .replace(/\{\{CUSTOM_CSS\}\}/g, data.custom_css.trim())
    .replace(/\{\{HTML_ELEMENTS\}\}/g, data.html_elements.trim())
    .replace(/\{\{GSAP_ANIMATIONS\}\}/g, data.gsap_animations.trim());
}

function decodeHTMLEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export function validateTemplateData(data: TemplateData): void {
  if (!data.custom_css || !data.html_elements || !data.gsap_animations) {
    throw new Error('LLM 返回的数据不完整，缺少 CSS/HTML/JS 中的某一部分');
  }

  // Decode HTML entities that may have leaked during JSON escaping
  data.custom_css = decodeHTMLEntities(data.custom_css);
  data.html_elements = decodeHTMLEntities(data.html_elements);
  data.gsap_animations = decodeHTMLEntities(data.gsap_animations);

  // Validate GSAP animations syntax
  const testScript = data.gsap_animations.trim();
  if (testScript) {
    try {
      new Function(testScript);
    } catch (err) {
      const msg = (err as Error).message;
      console.error('[Template] GSAP syntax error:', msg, '\nSnippet:', testScript.slice(0, 300));
      if (msg.includes("Unexpected token '<")) {
        throw new Error('LLM 生成的动画代码中混入了 HTML/JSX 标签');
      }
      if (msg.includes("Unexpected token '&'")) {
        throw new Error('LLM 生成的动画代码中包含未转义的 HTML 实体（如 &lt; &amp;），请重试');
      }
      throw new Error(`LLM 生成的动画代码有语法错误: ${msg}`);
    }
  }

  // Validate duration
  if (!data.duration || data.duration <= 0 || data.duration > 300) {
    throw new Error('LLM 返回的时长无效，请重试');
  }
}
