import { useState, useRef, useEffect } from 'react';
import { Play, Code2, Flame, Clock, Star, BarChart3, Type, Monitor, Smartphone } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../hooks/useLanguage';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { label: { en: 'All', zh: '全部' }, icon: Star },
  { label: { en: 'Popular', zh: '热门' }, icon: Flame },
  { label: { en: 'Text', zh: '文字动画' }, icon: Type },
  { label: { en: 'Product', zh: '产品展示' }, icon: Monitor },
  { label: { en: 'Data', zh: '数据图表' }, icon: BarChart3 },
  { label: { en: 'Social', zh: '社媒视频' }, icon: Smartphone },
];

interface TemplateItem {
  id: number;
  title: { en: string; zh: string };
  prompt: { en: string; zh: string };
  gsapSnippet: string;
  video: string;
  category: string;
  duration: string;
  ratio: string;
  elements: number;
}

const templates: TemplateItem[] = [
  {
    id: 1,
    title: { en: 'Typewriter Title', zh: '标题打字机效果' },
    prompt: {
      en: 'SaaS landing page main title types in character by character with blinking cursor, subtitle fades in, CTA button bounces up from below',
      zh: 'SaaS落地页主标题打字机逐字出现，光标闪烁，副标题淡入，CTA按钮从下方弹性弹出',
    },
    gsapSnippet: 'gsap.to(".char", { opacity: 1, stagger: 0.05, ease: "none" })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4',
    category: 'zh:文字动画',
    duration: '5s',
    ratio: '16:9',
    elements: 5,
  },
  {
    id: 2,
    title: { en: 'Product Card Reveal', zh: '产品卡片展示' },
    prompt: {
      en: 'Product image slides in from right, feature list flies in with stagger delay, price tag scales in, bottom button pulses',
      zh: '产品图片从右侧滑入，特性列表逐个飞入带stagger延迟，价格标签缩放出现，底部按钮脉冲动画',
    },
    gsapSnippet: 'gsap.from(".feature", { x: 60, opacity: 0, stagger: 0.15 })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4',
    category: 'zh:产品展示',
    duration: '5s',
    ratio: '16:9',
    elements: 7,
  },
  {
    id: 3,
    title: { en: 'Bar Chart Growth', zh: '柱状图增长动画' },
    prompt: {
      en: 'Bar chart grows from bottom with scaleY to target value, number counter rolls to final value, grid lines fade in, final shadow added',
      zh: '柱状图从底部scaleY增长到目标值，数字计数器滚动到最终数值，网格线淡入，最后整体加阴影',
    },
    gsapSnippet: 'gsap.to(".bar", { scaleY: 1, stagger: 0.1, ease: "power2.out" })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
    category: 'zh:数据图表',
    duration: '3s',
    ratio: '1:1',
    elements: 4,
  },
  {
    id: 4,
    title: { en: 'TikTok Subtitle Style', zh: 'TikTok字幕风格' },
    prompt: {
      en: 'Text types out with typewriter effect, emoji bounces in, background color block slides from left to right, fast 0.8s transition',
      zh: '文字逐字打出带typewriter效果，emoji弹跳出现，背景色块从左到右滑动切换，快节奏0.8s转场',
    },
    gsapSnippet: 'gsap.from(".word", { y: 40, opacity: 0, stagger: 0.08 })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
    category: 'zh:社媒视频',
    duration: '5s',
    ratio: '9:16',
    elements: 6,
  },
  {
    id: 5,
    title: { en: 'Logo Reveal', zh: 'Logo揭示动效' },
    prompt: {
      en: 'Logo scales from center with elastic bounce, brand name letters stagger fade in, tagline slides in from below',
      zh: 'Logo从中心scale(0)放大出现带elastic弹性回弹，品牌名称字母stagger淡入，标语从下方向上滑入',
    },
    gsapSnippet: 'gsap.from(".logo", { scale: 0, ease: "elastic.out(1, 0.5)" })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
    category: 'zh:产品展示',
    duration: '3s',
    ratio: '1:1',
    elements: 3,
  },
  {
    id: 6,
    title: { en: 'Data Dashboard', zh: '数据仪表盘' },
    prompt: {
      en: 'Multiple KPI cards stagger fade in, ring progress bar animates from 0% to target, line chart draws left to right, key numbers highlighted at end',
      zh: '多个KPI卡片stagger淡入，环形进度条从0%动画到目标值，折线图从左到右绘制，最后高亮关键数字',
    },
    gsapSnippet: 'gsap.from(".kpi", { y: 30, opacity: 0, stagger: 0.1 })',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4',
    category: 'zh:数据图表',
    duration: '5s',
    ratio: '16:9',
    elements: 8,
  },
];

interface TemplateSectionProps {
  onUseTemplate: (prompt: string, duration: number) => void;
}

export default function TemplateSection({ onUseTemplate }: TemplateSectionProps) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { t } = useLanguage();

  const tx = {
    badge: t({ en: 'GSAP Presets', zh: 'GSAP Presets' }),
    title: t({ en: 'Templates', zh: '编排模板' }),
    subtitle: t({ en: 'Select template → AI generates GSAP code → Precise video render', zh: '选择模板 → AI 生成 GSAP 代码 → 精确渲染视频' }),
    useTemplate: t({ en: 'Use Template', zh: '使用模板' }),
    elements: t({ en: 'animation elements', zh: '个动画元素' }),
  };

  const filtered = activeCategory === '全部'
    ? templates
    : activeCategory === '热门'
    ? [...templates].sort((a, b) => b.elements - a.elements)
    : templates.filter((templ) => templ.category.includes(activeCategory));

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;
    if (!section || !header || !grid) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(header,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: header, start: 'top 85%', toggleActions: 'play none none reverse' },
        }
      );
      const cards = grid.querySelectorAll('.template-card');
      gsap.fromTo(cards,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08,
          scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    }, section);
    return () => ctx.revert();
  }, [activeCategory]);

  return (
    <section ref={sectionRef} className="relative w-full py-16 sm:py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-dark via-[#08080f] to-bg-dark" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 size={14} className="text-neon" />
              <span className="font-mono text-neon text-[10px] uppercase tracking-wider">{tx.badge}</span>
            </div>
            <h2
              className="font-grotesk uppercase text-cream leading-[0.95] mb-2"
              style={{ fontSize: 'clamp(24px, 3.5vw, 40px)' }}
            >
              {tx.title}
            </h2>
            <p className="font-mono text-cream/35 text-[12px]">
              {tx.subtitle}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const label = t(cat.label);
              return (
                <button
                  key={label}
                  onClick={() => setActiveCategory(label)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-mono uppercase transition-all duration-300 ${
                    activeCategory === label
                      ? 'bg-neon/15 text-neon border border-neon/30'
                      : 'text-cream/45 border border-white/5 hover:border-white/15 hover:text-cream/70'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="template-card group liquid-glass rounded-[24px] overflow-hidden cursor-pointer hover:bg-white/5 transition-all duration-500"
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Video Preview */}
              <div className="relative aspect-video overflow-hidden">
                <video
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                >
                  <source src={template.video} type="video/mp4" />
                </video>
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
                  hoveredId === template.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button
                    onClick={() => onUseTemplate(t(template.prompt), parseInt(template.duration, 10))}
                    className="flex items-center gap-2 bg-neon text-bg-dark px-5 py-2.5 rounded-[999px] font-grotesk text-[12px] uppercase hover:shadow-[0_0_30px_rgba(0,180,255,0.4)] transition-shadow duration-300"
                  >
                    <Code2 size={14} />
                    {tx.useTemplate}
                  </button>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-sm text-cream/80 text-[10px] font-mono px-2 py-1 rounded-[6px]">
                    {template.category.replace('zh:', '')}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-sm text-cream/50 text-[10px] font-mono px-2 py-1 rounded-[6px] flex items-center gap-1">
                    <Clock size={9} />
                    {template.duration}
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm text-cream/50 text-[10px] font-mono px-2 py-1 rounded-[6px]">
                    {template.ratio}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-dark/80 to-transparent" />
              </div>

              {/* Card Info */}
              <div className="px-4 py-4">
                <h3 className="font-grotesk text-cream text-[14px] uppercase mb-1.5 group-hover:text-neon transition-colors duration-300">
                  {t(template.title)}
                </h3>
                <p className="font-mono text-cream/25 text-[11px] leading-relaxed line-clamp-2 mb-2">
                  {t(template.prompt)}
                </p>
                {/* GSAP Code Snippet */}
                <div className="bg-black/30 rounded-[8px] px-3 py-2 mb-3 border border-white/5">
                  <code className="font-mono text-[10px] text-neon/60 block truncate">
                    {template.gsapSnippet}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cream/20 text-[10px]">
                    {template.elements} {tx.elements}
                  </span>
                  <button
                    onClick={() => onUseTemplate(t(template.prompt), parseInt(template.duration, 10))}
                    className="text-cream/25 hover:text-neon transition-colors duration-300"
                  >
                    <Play size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
