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
