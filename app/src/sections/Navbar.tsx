import { useState } from 'react';
import { LogOut, User, Menu, X } from 'lucide-react';
import type { User as UserType } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-10">
      <div className="w-full flex items-center justify-between h-16">
        {/* Logo */}
        <button
          onClick={scrollToTop}
          className="font-grotesk text-[16px] uppercase text-cream tracking-[0.02em] hover:text-neon transition-colors"
        >
          SceneGenie
        </button>

        {/* Right — User + Logout */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neon/15 flex items-center justify-center border border-neon/25">
              <User size={14} className="text-neon" />
            </div>
            <span className="font-mono text-cream/60 text-[11px] tracking-wider max-w-[140px] truncate">
              {user.email}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="liquid-glass px-4 py-2 rounded-[999px] text-[11px] font-mono uppercase tracking-wider text-cream/50 hover:text-cream transition-colors flex items-center gap-1.5"
          >
            <LogOut size={12} />
            {t({ en: 'Sign Out', zh: '退出' })}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={20} className="text-cream" /> : <Menu size={20} className="text-cream" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden liquid-glass rounded-[20px] p-4 mx-auto max-w-[calc(100%-2rem)] mb-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-full bg-neon/15 flex items-center justify-center border border-neon/25">
              <User size={16} className="text-neon" />
            </div>
            <span className="font-mono text-cream text-[12px]">{user.email}</span>
          </div>
          <button
            onClick={() => { onLogout(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] text-[12px] font-mono uppercase tracking-wider text-cream/60 hover:text-cream hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            {t({ en: 'Sign Out', zh: '退出登录' })}
          </button>
        </div>
      )}
    </nav>
  );
}
