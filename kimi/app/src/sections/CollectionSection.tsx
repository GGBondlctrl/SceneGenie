import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const nftCards = [
  {
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4',
    score: '8.7/10',
  },
  {
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4',
    score: '9/10',
  },
  {
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4',
    score: '8.2/10',
  },
];

export default function CollectionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(header,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 80%',
            end: 'top 55%',
            scrub: 0.6,
          },
        }
      );

      // Cards animation with stagger
      const cardEls = cards.querySelectorAll('.nft-card');
      gsap.fromTo(cardEls,
        { y: 80, scale: 0.96, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: cards,
            start: 'top 72%',
            end: 'top 40%',
            scrub: 0.6,
          },
        }
      );

      // Score bars animation
      const scoreBars = cards.querySelectorAll('.score-bar');
      gsap.fromTo(scoreBars,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: cards,
            start: 'top 60%',
            end: 'top 45%',
            scrub: 0.6,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-bg-dark py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1831px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header Row */}
        <div ref={headerRef} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 lg:mb-16">
          {/* Heading */}
          <h2 className="relative">
            <span
              className="font-grotesk uppercase text-cream leading-[0.95] block"
              style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}
            >
              Collection of
            </span>
            <span
              className="block ml-12 sm:ml-16 md:ml-24 lg:ml-32"
              style={{ fontSize: 'clamp(32px, 5vw, 60px)' }}
            >
              <span className="font-condiment text-neon normal-case">Space</span>{' '}
              <span className="font-grotesk uppercase text-cream leading-[0.95]">objects</span>
            </span>
          </h2>

          {/* CTA Button */}
          <button className="group text-left flex items-baseline gap-2 hover:opacity-80 transition-opacity duration-300">
            <div>
              <span
                className="font-grotesk uppercase text-cream block leading-[0.95]"
                style={{ fontSize: 'clamp(32px, 4vw, 60px)' }}
              >
                See
              </span>
              <div className="flex gap-2 items-baseline">
                <span
                  className="font-grotesk uppercase text-cream block leading-[0.95]"
                  style={{ fontSize: 'clamp(20px, 2.5vw, 36px)' }}
                >
                  All
                </span>
                <span
                  className="font-grotesk uppercase text-cream block leading-[0.95]"
                  style={{ fontSize: 'clamp(20px, 2.5vw, 36px)' }}
                >
                  Creators
                </span>
              </div>
              {/* Neon underline bar */}
              <div
                className="bg-neon w-full mt-1 origin-left transition-transform duration-300 group-hover:scale-x-100"
                style={{ height: 'clamp(6px, 1vw, 10px)' }}
              />
            </div>
          </button>
        </div>

        {/* NFT Card Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {nftCards.map((card, index) => (
            <div
              key={index}
              className="nft-card liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition-colors duration-300 cursor-pointer group"
            >
              {/* Video Container - Square aspect ratio */}
              <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={card.video} type="video/mp4" />
                </video>

                {/* Score Overlay Bar */}
                <div className="score-bar absolute bottom-3 left-3 right-3 liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-cream/70 text-[11px] uppercase block">
                      Rarity Score:
                    </span>
                    <span className="font-mono text-cream text-[16px]">
                      {card.score}
                    </span>
                  </div>
                  {/* Purple Arrow Button */}
                  <button
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform duration-300"
                    aria-label="View details"
                  >
                    <ChevronRight size={20} className="text-cream" />
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
