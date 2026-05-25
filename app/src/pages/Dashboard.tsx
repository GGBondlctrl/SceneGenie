import { useState } from 'react';
import { Send, Image, Settings, History, Wand2, User, LogOut } from 'lucide-react';
import type { User as UserType } from '../hooks/useAuth';
import type { Language } from '../hooks/useLanguage';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
  lang: Language;
  t: (dict: Record<Language, string>) => string;
}

const templates = [
  { id: 1, name: 'Space Intro', desc: 'Cosmic text animation' },
  { id: 2, name: 'Photo Story', desc: 'Slideshow with transitions' },
  { id: 3, name: 'Product Reveal', desc: 'Sleek showcase motion' },
  { id: 4, name: 'Greeting Card', desc: 'Animated message' },
];

export default function Dashboard({ user, onLogout, lang: _lang, t }: DashboardProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('generate');

  const navItems = [
    { id: 'generate', label: t({ en: 'Generate', zh: '生成' }), icon: Wand2 },
    { id: 'templates', label: t({ en: 'Templates', zh: '模板' }), icon: Image },
    { id: 'history', label: t({ en: 'History', zh: '历史' }), icon: History },
    { id: 'settings', label: t({ en: 'Settings', zh: '设置' }), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Sidebar */}
      <aside className="w-[72px] lg:w-64 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
          <Wand2 size={24} className="text-neon" />
          <span className="hidden lg:block font-grotesk uppercase text-cream text-[16px] ml-3 tracking-wider">
            SceneGenie
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-center lg:justify-start lg:px-5 py-3 transition-colors ${
                activeTab === id
                  ? 'text-neon bg-white/5'
                  : 'text-cream/50 hover:text-cream hover:bg-white/5'
              }`}
            >
              <Icon size={20} />
              <span className="hidden lg:block font-mono uppercase text-[12px] tracking-wider ml-3">
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-9 h-9 rounded-full bg-neon/20 flex items-center justify-center">
              <User size={16} className="text-neon" />
            </div>
            <div className="hidden lg:block">
              <p className="font-mono text-cream text-[12px] truncate max-w-[140px]">
                {user.email}
              </p>
              <button
                onClick={onLogout}
                className="font-mono text-cream/40 text-[11px] uppercase tracking-wider hover:text-cream/70 transition-colors flex items-center gap-1 mt-0.5"
              >
                <LogOut size={10} />
                {t({ en: 'Sign Out', zh: '退出' })}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6">
          <h1 className="font-grotesk uppercase text-cream text-[18px] tracking-wider">
            {activeTab === 'generate' && t({ en: 'Generate Video', zh: '生成视频' })}
            {activeTab === 'templates' && t({ en: 'Templates', zh: '模板' })}
            {activeTab === 'history' && t({ en: 'History', zh: '历史' })}
            {activeTab === 'settings' && t({ en: 'Settings', zh: '设置' })}
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          {activeTab === 'generate' && (
            <div className="max-w-3xl mx-auto">
              {/* Input area */}
              <div className="liquid-glass rounded-[24px] p-6 lg:p-8">
                <label className="font-mono text-cream/50 text-[11px] uppercase tracking-wider block mb-3">
                  {t({ en: 'Describe your video', zh: '描述您的视频' })}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t({
                    en: "e.g. A 20-second intro with floating neon text 'SceneGenie' against a dark space background...",
                    zh: "例如：一段20秒的片头，深色太空背景上漂浮着霓虹文字'SceneGenie'..."
                  })}
                  className="w-full bg-transparent text-cream text-[15px] placeholder:text-cream/20 resize-none outline-none min-h-[120px] leading-relaxed"
                />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <button className="flex items-center gap-2 text-cream/40 hover:text-cream/70 transition-colors">
                    <Image size={18} />
                    <span className="font-mono text-[12px] uppercase tracking-wider">
                      {t({ en: 'Add Image', zh: '添加图片' })}
                    </span>
                  </button>

                  <button
                    disabled={!prompt.trim()}
                    className="flex items-center gap-2 bg-neon text-bg-dark font-grotesk uppercase text-[13px] tracking-wider px-6 py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    {t({ en: 'Generate', zh: '生成' })}
                  </button>
                </div>
              </div>

              {/* Template shortcuts */}
              <div className="mt-8">
                <h3 className="font-mono text-cream/40 text-[11px] uppercase tracking-wider mb-4">
                  {t({ en: 'Quick Templates', zh: '快捷模板' })}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {templates.map((templ) => (
                    <button
                      key={templ.id}
                      onClick={() => setPrompt(templ.desc)}
                      className="liquid-glass rounded-[16px] p-4 text-left hover:bg-white/10 transition-colors"
                    >
                      <h4 className="font-grotesk uppercase text-cream text-[14px] tracking-wider">
                        {templ.name}
                      </h4>
                      <p className="font-mono text-cream/30 text-[11px] mt-1">
                        {templ.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((templ) => (
                <div
                  key={templ.id}
                  className="liquid-glass rounded-[24px] p-5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="aspect-video bg-white/5 rounded-[16px] mb-4 flex items-center justify-center">
                    <Image size={32} className="text-cream/20" />
                  </div>
                  <h4 className="font-grotesk uppercase text-cream text-[16px] tracking-wider">
                    {templ.name}
                  </h4>
                  <p className="font-mono text-cream/30 text-[12px] mt-1">
                    {templ.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-3xl mx-auto text-center py-20">
              <History size={48} className="text-cream/10 mx-auto mb-4" />
              <p className="font-mono text-cream/30 text-[14px] uppercase tracking-wider">
                {t({ en: 'No generation history yet', zh: '暂无生成历史' })}
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="liquid-glass rounded-[24px] p-6">
                <h3 className="font-grotesk uppercase text-cream text-[16px] tracking-wider mb-4">
                  {t({ en: 'LLM Configuration', zh: 'LLM 配置' })}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-cream/50 text-[11px] uppercase tracking-wider block mb-2">
                      {t({ en: 'Provider', zh: '提供商' })}
                    </label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-cream text-[14px] outline-none focus:border-blue-400/50">
                      <option>Claude</option>
                      <option>OpenAI</option>
                      <option>Kimi</option>
                      <option>DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-cream/50 text-[11px] uppercase tracking-wider block mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-cream text-[14px] placeholder:text-cream/20 outline-none focus:border-blue-400/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
