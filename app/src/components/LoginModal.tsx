import { useState, useEffect } from 'react';
import { X, LogIn, Mail, Lock, UserPlus, User, Eye, EyeOff } from 'lucide-react';
import type { Language } from '../hooks/useLanguage';
import { api } from '../services/api.js';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string, code: string) => void;
  apiError?: string;
  lang: Language;
  t: (dict: Record<Language, string>) => string;
}

export default function LoginModal({ isOpen, onClose, onLogin, onRegister, apiError, lang: _lang, t }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Show API errors passed from parent
  useEffect(() => {
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

  // Reset all form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setError('');
      setCode('');
      setCodeSent(false);
      setCountdown(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
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
    <>
      <style>{`
        .sg-input:-webkit-autofill,
        .sg-input:-webkit-autofill:hover,
        .sg-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.05) inset !important;
          -webkit-text-fill-color: #EFF4FF !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="liquid-glass rounded-[2rem] max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header with close button */}
          <div className="relative px-8 sm:px-10 pt-8 sm:pt-10 pb-0 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-cream/70" />
            </button>
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
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-8 sm:px-10 pb-8 sm:pb-10" style={{ scrollbarWidth: 'none' }}>
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
                    className="sg-input w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
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
                  className="sg-input w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t({ en: 'Enter your password', zh: '输入密码' })}
                  className="sg-input w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
                  aria-label={showPassword ? t({ en: 'Hide password', zh: '隐藏密码' }) : t({ en: 'Show password', zh: '显示密码' })}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t({ en: 'Confirm your password', zh: '再次输入密码' })}
                    className="sg-input w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-11 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
                    aria-label={showConfirmPassword ? t({ en: 'Hide password', zh: '隐藏密码' }) : t({ en: 'Show password', zh: '显示密码' })}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                      className="sg-input w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-blue-400/50 transition-colors text-center tracking-[0.3em]"
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
              className="w-full flex items-center justify-center gap-2 bg-neon text-bg-dark font-grotesk uppercase text-[14px] tracking-wider py-4 rounded-xl hover:brightness-110 transition-all duration-200 border-none"
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

        </div>
      </div>
    </div>
  </div>
  </>
  );
}
