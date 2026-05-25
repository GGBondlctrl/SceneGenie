import { useState, useEffect } from 'react';
import { X, LogIn, Mail, Lock, UserPlus, User } from 'lucide-react';
import type { Language } from '../hooks/useLanguage';
import { api } from '../services/api.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string, code: string) => void;
  lang: Language;
  t: (dict: Record<Language, string>) => string;
}

export default function LoginModal({ isOpen, onClose, onLogin, onRegister, lang: _lang, t }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Reset to login mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setError('');
      setCode('');
      setCodeSent(false);
      setCountdown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(t({ en: 'Please enter both email and password', zh: '请输入邮箱和密码' }));
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError(t({ en: 'Please enter your name', zh: '请输入您的姓名' }));
        return;
      }
      if (password !== confirmPassword) {
        setError(t({ en: 'Passwords do not match', zh: '密码不一致' }));
        return;
      }
      if (!code.trim() || code.length !== 6) {
        setError(t({ en: 'Please enter the 6-digit verification code', zh: '请输入6位验证码' }));
        return;
      }
      onRegister(email, password, name, code);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setCode('');
      setCodeSent(false);
      return;
    }

    onLogin(email, password);
    setEmail('');
    setPassword('');
  };

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError(t({ en: 'Please enter a valid email first', zh: '请先输入有效邮箱' }));
      return;
    }
    setError('');
    try {
      await api.sendCode(email);
      setCodeSent(true);
      setCountdown(60);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setCode('');
    setCodeSent(false);
    setCountdown(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Close button — outside scrollable area so it stays fixed */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-cream/70" />
        </button>

        <div className="liquid-glass rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <div className="p-8 sm:p-10">
            {/* Header */}
          <div className="mb-8">
            <h2 className="font-grotesk uppercase text-cream text-[28px] leading-tight tracking-wide">
              {mode === 'login'
                ? t({ en: 'Welcome Back', zh: '欢迎回来' })
                : t({ en: 'Create Account', zh: '创建账号' })}
            </h2>
            <p className="font-mono text-cream/50 text-[13px] uppercase mt-2 tracking-wider">
              {mode === 'login'
                ? t({ en: 'Sign in to create your videos', zh: '登录以创建您的视频' })
                : t({ en: 'Join SceneGenie today', zh: '立即加入 SceneGenie' })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                  {t({ en: 'Name', zh: '姓名' })}
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t({ en: 'Your name', zh: '您的姓名' })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                {t({ en: 'Email', zh: '邮箱' })}
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                {t({ en: 'Password', zh: '密码' })}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t({ en: 'Enter your password', zh: '输入密码' })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                  {t({ en: 'Confirm Password', zh: '确认密码' })}
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t({ en: 'Confirm your password', zh: '再次输入密码' })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-2">
                  {t({ en: 'Verification Code', zh: '验证码' })}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t({ en: '6-digit code', zh: '6位数字' })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors text-center tracking-[0.3em]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-cream text-[12px] font-mono uppercase tracking-wider hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {countdown > 0
                      ? `${countdown}s`
                      : t({ en: 'Send Code', zh: '发送验证码' })}
                  </button>
                </div>
                {codeSent && countdown > 0 && (
                  <p className="font-mono text-neon/70 text-[11px] mt-2">
                    {t({ en: 'Code sent! Check your inbox.', zh: '验证码已发送！请查收邮箱。' })}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="font-mono text-red-400 text-[12px]">{error}</p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-neon text-bg-dark font-grotesk uppercase text-[14px] tracking-wider py-4 rounded-xl hover:brightness-110 transition-all duration-200"
            >
              {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {mode === 'login'
                ? t({ en: 'Sign In', zh: '登录' })
                : t({ en: 'Sign Up', zh: '注册' })}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="font-mono text-cream/40 text-[12px] uppercase tracking-wider hover:text-blue-400 transition-colors"
            >
              {mode === 'login'
                ? t({ en: "Don't have an account? Sign Up", zh: '没有账号？立即注册' })
                : t({ en: 'Already have an account? Sign In', zh: '已有账号？立即登录' })}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-mono text-cream/30 text-[11px] uppercase">
              {t({ en: 'Or', zh: '或' })}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 text-cream text-[13px] hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 text-cream text-[13px] hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
