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
