import { useEffect, useRef } from 'react';
import { Mail, Twitter, Github } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const socialButtons = [
  { icon: Mail, label: 'Mail' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Github, label: 'Github' },
];

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cursiveRef = useRef<HTMLSpanElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const cursive = cursiveRef.current;
    const social = socialRef.current;
    if (!section || !text || !cursive || !social) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(text,
        { x: '55vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(cursive,
        { scale: 0.88, rotate: -18, opacity: 0 },
        { scale: 1, rotate: -10, opacity: 1, ease: 'power2.out' },
        0.05
      );

      scrollTl.fromTo(social,
        { x: '-40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.10
      );

      // SETTLE (30-70%): Static viewing

      // EXIT (70-100%)
      scrollTl.fromTo(text,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(cursive,
        { x: 0, opacity: 1 },
        { x: '8vw', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(social,
        { y: 0, opacity: 1 },
        { y: '12vh', opacity: 0, ease: 'power2.in' },
        0.70
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-bg-dark"
    >
      {/* Video Background - NOT object-cover, native aspect ratio */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto block min-h-full"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Text Content - Right aligned */}
      <div className="absolute inset-0 flex items-center justify-end z-10">
        <div className="max-w-[1831px] w-full mx-auto px-4 sm:px-6 lg:px-10">
          <div className="relative lg:pl-[15%] lg:pr-[20%]">
            {/* Cursive Accent */}
            <span
              ref={cursiveRef}
              className="font-condiment text-neon absolute -top-8 sm:-top-12 lg:-top-16 left-0 sm:left-4 lg:left-8 -rotate-10 mix-blend-exclusion"
              style={{
                fontSize: 'clamp(17px, 4vw, 68px)',
              }}
            >
              Go beyond
            </span>

            {/* Heading */}
            <div ref={textRef}>
              <h2
                className="font-grotesk uppercase text-cream leading-[1.1] mb-4 sm:mb-6 lg:mb-12"
                style={{
                  fontSize: 'clamp(16px, 5vw, 60px)',
                }}
              >
                <span className="block">Join us.</span>
              </h2>
              <h2
                className="font-grotesk uppercase text-cream leading-[1.1]"
                style={{
                  fontSize: 'clamp(16px, 5vw, 60px)',
                }}
              >
                <span className="block">Reveal what's hidden.</span>
                <span className="block">Define what's next.</span>
                <span className="block">Follow the signal.</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Social Icons - Bottom Left */}
      <div
        ref={socialRef}
        className="absolute left-[8%] z-10 liquid-glass overflow-hidden"
        style={{
          bottom: 'clamp(12%, 15vh, 20%)',
          borderRadius: 'clamp(0.5rem, 1vw, 1.25rem)',
        }}
      >
        <div className="flex flex-col">
          {socialButtons.map(({ icon: Icon, label }, index) => (
            <button
              key={label}
              className={`flex items-center justify-center text-cream hover:bg-white/10 transition-colors duration-300 ${
                index < socialButtons.length - 1 ? 'border-b border-white/10' : ''
              }`}
              style={{
                width: 'clamp(3rem, 14vw, 16.77rem)',
                height: 'clamp(3rem, 10vw, 5rem)',
              }}
              aria-label={label}
            >
              <Icon
                size={20}
                className="text-cream"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
