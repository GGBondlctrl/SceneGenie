import { useState, useEffect } from 'react';
import { X, Globe, Key, Server, Check, AlertCircle } from 'lucide-react';
import type { Language } from '../hooks/useLanguage';
import type { LLMProvider } from '../services/llm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

export default function SettingsModal({ isOpen, onClose, lang, onLangChange }: SettingsModalProps) {
  const [llmProvider, setLlmProvider] = useState('claude');
  const [llmKey, setLlmKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLlmProvider(localStorage.getItem('scene-genie-llm-provider') || 'claude');
      setLlmKey(localStorage.getItem('scene-genie-llm-key') || '');
      setLlmBaseUrl(localStorage.getItem('scene-genie-llm-baseurl') || '');
      setTestStatus('idle');
      setTestError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedKey = llmKey.trim();
    localStorage.setItem('scene-genie-llm-provider', llmProvider);
    localStorage.setItem('scene-genie-llm-key', trimmedKey);
    localStorage.setItem('scene-genie-llm-baseurl', llmBaseUrl.trim());
    setLlmKey(trimmedKey);
    onClose();
  };

  const handleTest = async () => {
    const trimmedKey = llmKey.trim();
    if (!trimmedKey) {
      setTestStatus('error');
      setTestError(lang === 'zh' ? '请先输入 API Key' : 'Please enter an API Key first');
      return;
    }

    setTestStatus('testing');
    setTestError('');

    try {
      const provider = llmProvider as LLMProvider;
      let url: string;
      let headers: Record<string, string>;
      let body: Record<string, unknown>;

      if (provider === 'claude') {
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
        };
        body = {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        };
      } else {
        // OpenAI-compatible: OpenAI, Kimi, DeepSeek, Custom
        url = provider === 'custom' && llmBaseUrl.trim()
          ? llmBaseUrl.trim()
          : provider === 'openai'
            ? 'https://api.openai.com/v1/chat/completions'
            : provider === 'kimi'
              ? 'https://api.moonshot.cn/v1/chat/completions'
              : provider === 'deepseek'
                ? 'https://api.deepseek.com/v1/chat/completions'
                : '';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`,
        };
        body = {
          model: provider === 'openai' ? 'gpt-4o' : provider === 'kimi' ? 'moonshot-v1-8k' : provider === 'deepseek' ? 'deepseek-chat' : 'default',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setTestStatus('success');
      } else {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const msg = (data.error as Record<string, string>)?.message || `HTTP ${res.status}`;
        setTestStatus('error');
        setTestError(msg);
      }
    } catch (err) {
      setTestStatus('error');
      setTestError((err as Error).message);
    }
  };

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

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* LLM Config */}
          <div>
            <label className="font-mono text-cream/70 text-[11px] uppercase tracking-wider block mb-3">
              <Key size={14} className="inline mr-2 -mt-0.5" />
              {lang === 'zh' ? 'AI 模型配置' : 'AI Model Config'}
            </label>

            {/* Provider */}
            <div className="mb-4">
              <label className="font-mono text-cream/50 text-[10px] uppercase tracking-wider block mb-2">
                {lang === 'zh' ? '模型提供商' : 'Provider'}
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-[13px] text-cream uppercase tracking-wider focus:outline-none focus:border-neon/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="claude">Claude</option>
                <option value="openai">OpenAI</option>
                <option value="kimi">Kimi</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="font-mono text-cream/50 text-[10px] uppercase tracking-wider block mb-2">
                API Key
              </label>
              <input
                type="password"
                value={llmKey}
                onChange={(e) => setLlmKey(e.target.value)}
                placeholder={lang === 'zh' ? '输入你的 API Key' : 'Enter your API Key'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-[13px] text-cream tracking-wider placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors"
              />
            </div>

            {/* Base URL (custom only) */}
            {llmProvider === 'custom' && (
              <div className="mb-4">
                <label className="font-mono text-cream/50 text-[10px] uppercase tracking-wider block mb-2">
                  <Server size={12} className="inline mr-1.5 -mt-0.5" />
                  Base URL
                </label>
                <input
                  type="text"
                  value={llmBaseUrl}
                  onChange={(e) => setLlmBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-[13px] text-cream tracking-wider placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors"
                />
              </div>
            )}

            {/* Test Connection */}
            {testStatus !== 'idle' && (
              <div className={`mb-3 p-3 rounded-xl flex items-start gap-2 ${
                testStatus === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : testStatus === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-white/5 border border-white/10'
              }`}>
                {testStatus === 'success' && <Check size={14} className="text-green-400 mt-0.5 shrink-0" />}
                {testStatus === 'error' && <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />}
                {testStatus === 'testing' && (
                  <div className="w-3.5 h-3.5 border-2 border-cream/30 border-t-cream/70 rounded-full animate-spin shrink-0 mt-0.5" />
                )}
                <span className={`font-mono text-[11px] leading-relaxed ${
                  testStatus === 'success'
                    ? 'text-green-400'
                    : testStatus === 'error'
                      ? 'text-red-400'
                      : 'text-cream/50'
                }`}>
                  {testStatus === 'success'
                    ? (lang === 'zh' ? '连接成功！API Key 有效' : 'Connection successful! API Key is valid')
                    : testStatus === 'error'
                      ? testError
                      : (lang === 'zh' ? '正在测试连接...' : 'Testing connection...')}
                </span>
              </div>
            )}

            <button
              onClick={handleTest}
              disabled={testStatus === 'testing' || !llmKey.trim()}
              className="w-full mb-4 py-2.5 rounded-xl text-[13px] font-mono uppercase tracking-wider border border-white/10 text-cream/70 hover:text-cream hover:border-white/20 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lang === 'zh' ? '测试连接' : 'Test Connection'}
            </button>

            {/* Privacy Note */}
            <p className="font-mono text-cream/40 text-[11px] leading-relaxed">
              {lang === 'zh'
                ? 'API Key 仅存储在本地浏览器，不会上传到服务器'
                : 'API Key is stored locally in your browser and never uploaded to the server'}
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full mt-6 py-3 rounded-xl text-[14px] font-mono uppercase tracking-wider bg-neon text-bg-dark hover:bg-neon/90 transition-colors"
          >
            {lang === 'zh' ? '保存' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
