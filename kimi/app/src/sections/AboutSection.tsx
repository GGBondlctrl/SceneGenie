import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const bodyText = "A digital object fixed beyond time and place. An exploration of distance, form, and silence in space";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cursiveRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cursive = cursiveRef.current;
    const body = bodyRef.current;
    const ghost = ghostRef.current;
    if (!section || !heading || !cursive || !body || !ghost) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(heading,
        { x: '-55vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(cursive,
        { scale: 0.85, rotate: -16, opacity: 0 },
        { scale: 1, rotate: -8, opacity: 1, ease: 'power2.out' },
        0.05
      );

      scrollTl.fromTo(body,
        { x: '40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.08
      );

      scrollTl.fromTo(ghost,
        { opacity: 0 },
        { opacity: 0.10, ease: 'none' },
        0
      );

      // SETTLE (30-70%): Static

      // EXIT (70-100%)
      scrollTl.fromTo(heading,
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(cursive,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(body,
        { y: 0, opacity: 1 },
        { y: '18vh', opacity: 0, ease: 'power2.in' },
        0.70
      );

      scrollTl.fromTo(ghost,
        { opacity: 0.10 },
        { opacity: 0, ease: 'power2.in' },
        0.70
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
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
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center z-10">
        <div className="max-w-[1831px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-16 mb-16 lg:mb-24">
            {/* Left: Heading */}
            <div ref={headingRef} className="relative">
              <h2
                className="font-grotesk uppercase text-cream leading-[0.95]"
                style={{
                  fontSize: 'clamp(32px, 5vw, 60px)',
                }}
              >
                <span className="block">Hello!</span>
                <span className="block">I'm orbis</span>
              </h2>
              {/* Cursive Overlay */}
              <span
                ref={cursiveRef}
                className="font-condiment text-neon absolute -right-8 sm:right-[-60px] lg:right-[-100px] bottom-0 lg:bottom-2 -rotate-8 mix-blend-exclusion"
                style={{
                  fontSize: 'clamp(36px, 5vw, 68px)',
                }}
              >
                Orbis
              </span>
            </div>

            {/* Right: Body Paragraph */}
            <p
              ref={bodyRef}
              className="font-mono text-cream uppercase text-[14px] sm:text-[16px] leading-relaxed max-w-[266px] lg:pt-4"
            >
              {bodyText}
            </p>
          </div>

          {/* Bottom Row: Ghost paragraphs */}
          <div ref={ghostRef} className="flex flex-col lg:flex-row justify-between gap-8 opacity-0">
            {/* Left column */}
            <div className="flex flex-col sm:flex-row gap-8 lg:gap-16">
              <p className="font-mono text-[14px] sm:text-[16px] uppercase text-cream/10 max-w-[266px]">
                {bodyText}
              </p>
              <p className="font-mono text-[14px] sm:text-[16px] uppercase text-cream/10 max-w-[266px]">
                {bodyText}
              </p>
            </div>
            {/* Right column - hidden on mobile */}
            <div className="hidden lg:flex gap-16">
              <p className="font-mono text-[14px] sm:text-[16px] uppercase text-cream/10 max-w-[266px]">
                {bodyText}
              </p>
              <p className="font-mono text-[14px] sm:text-[16px] uppercase text-cream/10 max-w-[266px]">
                {bodyText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
