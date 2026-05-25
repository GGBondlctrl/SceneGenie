import { useState } from 'react';
import { Link } from 'react-router';
import { Wand2, Image, Video, Compass, User } from 'lucide-react';

const navItems = [
  { label: '视频生成', icon: Video, href: '#generate', active: true },
  { label: '文生图', icon: Image, href: '#image' },
  { label: '智能画布', icon: Wand2, href: '#canvas' },
  { label: '探索', icon: Compass, href: '#explore' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10 py-4">
      <div className="max-w-[1831px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-grotesk text-[16px] uppercase text-cream tracking-[0.02em] hover:text-neon transition-colors"
        >
          Orbis.Nft
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center liquid-glass rounded-[999px] px-2 py-1.5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-[999px] text-[13px] font-medium transition-all duration-300 ${
                  item.active
                    ? 'bg-neon/15 text-neon'
                    : 'text-cream/70 hover:text-cream hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span className="font-mono uppercase tracking-wider">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 liquid-glass rounded-[999px] px-5 py-2.5 text-[13px] font-mono uppercase text-cream hover:text-neon transition-colors duration-300"
          >
            <User size={14} />
            登录
          </Link>
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-5 h-0.5 bg-cream relative before:content-[''] before:absolute before:w-5 before:h-0.5 before:bg-cream before:-top-1.5 after:content-[''] after:absolute after:w-5 after:h-0.5 after:bg-cream after:top-1.5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-3 liquid-glass rounded-[20px] p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-cream/80 hover:text-neon transition-colors"
              >
                <Icon size={16} />
                <span className="font-mono text-[14px] uppercase">{item.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}
