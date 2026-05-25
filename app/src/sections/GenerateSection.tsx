import { useState, useRef, useEffect } from 'react';
import { Code2, Frame, Sparkles, Download, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import type { GenerateResult } from '../hooks/useGenerate';
import { useLanguage } from '../hooks/useLanguage';

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

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4';

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

  const { t } = useLanguage();

  // Translations
  const tx = {
    title: t({ en: 'Orchestrate Your Video', zh: '编排你的视频' }),
    subtitle: t({ en: 'Describe your needs, AI generates GSAP Timeline choreography, precise control over every frame', zh: '输入需求，AI 生成 GSAP Timeline 编排，精确控制每一帧' }),
    textareaHint: t({ en: 'Supports natural language animation descriptions', zh: '支持自然语言描述动画需求' }),
    ratioLabel: t({ en: 'Ratio', zh: '比例' }),
    timelinePreview: t({ en: 'GSAP Timeline Preview', zh: 'GSAP Timeline Preview' }),
    totalDuration: t({ en: '~5s total', zh: '~5s total' }),
    generating: t({ en: 'Orchestrating GSAP animation...', zh: '正在编排 GSAP 动画...' }),
    generateBtn: t({ en: 'Generate', zh: '生成编排' }),
    downloadVideo: t({ en: 'Download Video', zh: '下载视频' }),
    regenerate: t({ en: 'Regenerate', zh: '重新生成' }),
    dimension: t({ en: 'Dimension', zh: '尺寸' }),
    duration: t({ en: 'Duration', zh: '时长' }),
    generatedAt: t({ en: 'Generated at', zh: '生成时间' }),
    scrollHint: t({ en: 'Templates', zh: '编排模板' }),
    errorMsg: t({ en: 'Generation failed, please try again', zh: '生成失败，请重试' }),
  };

  const tags = [
    { en: 'Product Showcase', zh: '产品展示' },
    { en: 'Data Charts', zh: '数据图表' },
    { en: 'Social Media', zh: '社媒推广' },
    { en: 'Subtitles', zh: '字幕视频' },
    { en: 'Landing Page', zh: '落地页' },
    { en: 'TikTok', zh: 'TikTok' },
  ];

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
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-35"
      >
        <source src={BG_VIDEO} type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(8, 8, 14, 0.55)' }}
      />

      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(8,8,14,0.4) 100%)',
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
            {tx.title}
          </h1>
          <p className="font-mono text-cream/35 text-[12px] sm:text-[13px] tracking-wide">
            {tx.subtitle}
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
                {tx.textareaHint}
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
              <span className="font-mono text-cream/35 text-[11px] uppercase tracking-wider">{tx.ratioLabel}</span>
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
                <span className="font-mono text-[10px] text-neon uppercase tracking-wider">{tx.timelinePreview}</span>
                <span className="font-mono text-[10px] text-cream/25">{tx.totalDuration}</span>
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
                {tx.generating}
              </>
            ) : (
              <>
                <Sparkles size={17} />
                {tx.generateBtn}
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
                {tx.downloadVideo}
              </a>
              <button
                onClick={onRegenerate}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] liquid-glass font-grotesk text-[13px] uppercase tracking-wider text-cream hover:text-neon transition-colors"
              >
                <RotateCcw size={15} />
                {tx.regenerate}
              </button>
            </div>

            {/* Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] text-cream/25 uppercase tracking-wider">
              <span>{tx.dimension}: {selectedRatio}</span>
              <span>{tx.duration}: ~5s</span>
              <span>{tx.generatedAt}: {formatDate(result.createdAt)}</span>
            </div>
          </div>
        )}

        {/* Quick tags */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag.en}
              onClick={() => onAppendTag(tag.zh)}
              className="liquid-glass px-4 py-2 rounded-[999px] text-[11px] font-mono text-cream/45 hover:text-neon hover:bg-white/5 transition-all duration-300"
            >
              {t(tag)}
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-10 flex flex-col items-center gap-2 text-cream/20">
          <span className="font-mono text-[10px] uppercase tracking-widest">{tx.scrollHint}</span>
          <div className="w-px h-6 bg-gradient-to-b from-cream/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
