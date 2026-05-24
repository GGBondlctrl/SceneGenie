import { useEffect, useRef } from 'react';
import { Mail, Twitter, Github } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const navLinks = ['首页', '模板', '生成视频', '历史', '设置'];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLDivElement>(null);
  const cursiveRef = useRef<HTMLSpanElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const h1 = h1Ref.current;
    const cursive = cursiveRef.current;
    const social = socialRef.current;
    const nav = navRef.current;
    if (!section || !h1 || !cursive || !social || !nav) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation on load
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

      loadTl.fromTo(social,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' },
        '-=0.5'
      );

      // Scroll-driven exit animation (pinned)
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
          onLeaveBack: () => {
            // Reset all elements when scrolling back to top
            gsap.set(h1Lines, { opacity: 1, x: 0 });
            gsap.set(cursive, { opacity: 1, x: 0, y: 0 });
            gsap.set(social, { opacity: 1, x: 0 });
            gsap.set(nav, { opacity: 1 });
          },
        },
      });

      // ENTRANCE (0-30%): Hold at settle state (auto-play handled entrance)
      // SETTLE (30-70%): Static
      // EXIT (70-100%)
      scrollTl.fromTo(h1,
        { x: 0, opacity: 1 },
        { x: '-22vw', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(cursive,
        { x: 0, y: 0, opacity: 1 },
        { x: '10vw', y: '-6vh', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(social,
        { x: 0, opacity: 1 },
        { x: '8vw', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(nav,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.70
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const socialButtons = [
    { icon: Mail, label: 'Mail' },
    { icon: Twitter, label: 'Twitter' },
    { icon: Github, label: 'Github' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden rounded-b-[32px]"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />

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
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="font-grotesk text-[13px] uppercase text-cream hover:text-neon transition-colors duration-300 tracking-[0.02em]"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Mobile menu button placeholder */}
          <button className="lg:hidden w-10 h-10 flex items-center justify-center">
            <div className="w-5 h-0.5 bg-cream relative before:content-[''] before:absolute before:w-5 before:h-0.5 before:bg-cream before:-top-1.5 after:content-[''] after:absolute after:w-5 after:h-0.5 after:bg-cream after:top-1.5" />
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-[1831px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="lg:ml-32 relative">
            {/* Main Heading */}
            <div ref={h1Ref} className="relative">
              <h1 className="font-grotesk uppercase text-cream leading-[1.05] lg:leading-[1] max-w-[780px]"
                style={{
                  fontSize: 'clamp(40px, 8vw, 90px)',
                }}
              >
                <span className="h1-line block">用一句话</span>
                <span className="h1-line block">创造</span>
                <span className="h1-line block">你的视频</span>
              </h1>

              {/* Cursive Accent */}
              <span
                ref={cursiveRef}
                className="font-condiment text-neon absolute -right-4 sm:right-0 lg:right-[-120px] top-[60%] lg:top-[50%] -rotate-6 mix-blend-exclusion opacity-90"
                style={{
                  fontSize: 'clamp(24px, 4vw, 48px)',
                }}
              >
                AI Video
              </span>
            </div>

            {/* Mobile Social Icons */}
            <div className="flex lg:hidden justify-center gap-3 mt-10">
              {socialButtons.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="liquid-glass w-14 h-14 rounded-[1rem] flex items-center justify-center hover:bg-white/10 transition-colors duration-300"
                  aria-label={label}
                >
                  <Icon size={20} className="text-cream" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Social Icons - Right Side */}
      <div
        ref={socialRef}
        className="hidden lg:flex absolute right-[4vw] top-[36vh] z-10 flex-col gap-2.5"
      >
        {socialButtons.map(({ icon: Icon, label }) => (
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
