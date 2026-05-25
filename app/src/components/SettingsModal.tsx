import { X, Globe } from 'lucide-react';
import type { Language } from '../hooks/useLanguage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

export default function SettingsModal({ isOpen, onClose, lang, onLangChange }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="liquid-glass rounded-[2rem] p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-cream/70" />
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-grotesk uppercase text-cream text-[24px] leading-tight tracking-wide">
              {lang === 'zh' ? '设置' : 'Settings'}
            </h2>
            <p className="font-mono text-cream/50 text-[12px] uppercase mt-2 tracking-wider">
              {lang === 'zh' ? '偏好与配置' : 'Preferences & Config'}
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-3">
              <Globe size={14} className="inline mr-2 -mt-0.5" />
              {lang === 'zh' ? '语言' : 'Language'}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => onLangChange('en')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-mono uppercase tracking-wider transition-colors ${
                  lang === 'en'
                    ? 'bg-neon text-bg-dark'
                    : 'bg-white/5 text-cream border border-white/10 hover:bg-white/10'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLangChange('zh')}
                className={`flex-1 py-3 rounded-xl text-[14px] font-mono uppercase tracking-wider transition-colors ${
                  lang === 'zh'
                    ? 'bg-neon text-bg-dark'
                    : 'bg-white/5 text-cream border border-white/10 hover:bg-white/10'
                }`}
              >
                中文
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
