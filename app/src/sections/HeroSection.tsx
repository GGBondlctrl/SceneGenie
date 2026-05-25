import { useEffect, useRef } from 'react';
import { HelpCircle, Sun, MessageSquare } from 'lucide-react';
import gsap from 'gsap';
import type { Language } from '../hooks/useLanguage';

gsap.registerPlugin();

interface HeroSectionProps {
  lang: Language;
  t: (dict: Record<Language, string>) => string;
  onOpenLogin: () => void;
  onOpenSettings: () => void;
}

export default function HeroSection({ lang: _lang, t, onOpenLogin, onOpenSettings }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLDivElement>(null);
  const cursiveRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { key: 'login', label: t({ en: 'Log In', zh: '登录' }), action: 'login' },
    { key: 'home', label: t({ en: 'Home', zh: '首页' }), action: 'login' },
    { key: 'features', label: t({ en: 'Features', zh: '功能' }), action: 'none' },
    { key: 'settings', label: t({ en: 'Settings', zh: '设置' }), action: 'settings' },
  ] as const;

  const handleNavClick = (action: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (action === 'login') onOpenLogin();
    if (action === 'settings') onOpenSettings();
  };

  useEffect(() => {
    const section = sectionRef.current;
    const h1 = h1Ref.current;
    const cursive = cursiveRef.current;
    const nav = navRef.current;
    if (!section || !h1 || !cursive || !nav) return;

    const ctx = gsap.context(() => {
      const loadTl = gsap.timeline();

      loadTl.fromTo(nav,
        { opacity: 0, y: -24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
      );

      const h1Lines = h1.querySelectorAll('.h1-line');
      loadTl.fromTo(h1Lines,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 },
        '-=0.4'
      );

      loadTl.fromTo(cursive,
        { opacity: 0, scale: 0.96, rotate: -10 },
        { opacity: 1, scale: 1, rotate: -6, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Video Background - Full screen cover */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-bottom"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
          type="video/mp4"
        />
      </video>

      {/* Header / Nav */}
      <header className="absolute top-0 left-0 right-0 z-10 pt-4 sm:pt-6 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1831px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="font-grotesk text-[16px] uppercase text-cream tracking-[0.02em]">
            SceneGenie
          </div>

          {/* Desktop Nav - Liquid Glass */}
          <div
            ref={navRef}
            className="hidden lg:flex items-center liquid-glass rounded-[28px] px-[52px] py-[24px] gap-8"
          >
            {navItems.map((item) => (
              <a
                key={item.key}
                href="#"
                onClick={handleNavClick(item.action)}
                className="font-grotesk text-[13px] uppercase text-cream hover:text-blue-400 transition-colors duration-300 tracking-[0.02em]"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden w-10 h-10 flex items-center justify-center">
            <div className="w-5 h-0.5 bg-cream relative before:content-[''] before:absolute before:w-5 before:h-0.5 before:bg-cream before:-top-1.5 after:content-[''] after:absolute after:w-5 after:h-0.5 after:bg-cream after:top-1.5" />
          </button>
        </div>
      </header>

      {/* Hero Content - Top Left */}
      <div className="absolute top-[15%] left-4 sm:left-6 lg:left-10 z-10">
        <div ref={h1Ref} className="relative">
          <h1 className="font-grotesk uppercase text-cream leading-[1.1] max-w-[900px]"
            style={{
              fontSize: 'clamp(32px, 6vw, 72px)',
              wordSpacing: '0.18em',
            }}
          >
            <span className="h1-line block">
              {t({ en: 'Welcome Aboard,', zh: '欢迎着陆,' })}
            </span>
            <span className="h1-line block">
              {t({ en: 'One Line to Create', zh: '一句话创建' })}
            </span>
            <span className="h1-line block">
              {t({ en: 'Your Video', zh: '你的专属视频' })}
            </span>
          </h1>

          {/* Cursive Accent */}
          <span
            ref={cursiveRef}
            className="font-condiment text-neon block mt-2 -rotate-2 opacity-90"
            style={{
              fontSize: 'clamp(20px, 3vw, 36px)',
            }}
          >
            SceneGenie
          </span>
        </div>
      </div>

      {/* Quick Action Icons - Bottom Right */}
      <div className="absolute right-[4vw] bottom-[8vh] z-10 flex flex-col gap-2.5">
        {[
          { icon: HelpCircle, label: t({ en: 'Help', zh: '帮助' }) },
          { icon: Sun, label: t({ en: 'Theme', zh: '主题' }) },
          { icon: MessageSquare, label: t({ en: 'Feedback', zh: '反馈' }) },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="liquid-glass w-[56px] h-[56px] rounded-[1rem] flex items-center justify-center hover:bg-white/10 transition-colors duration-300"
            aria-label={label}
          >
            <Icon size={20} className="text-cream" />
          </button>
        ))}
      </div>
    </section>
  );
}
