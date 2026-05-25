import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './hooks/useLanguage';
import HeroSection from './sections/HeroSection';
import LoginModal from './components/LoginModal';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user, isLoggedIn, error, login, logout, register, clearError } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      setShowLogin(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string, code: string) => {
    const success = await register(email, password, name, code);
    if (success) {
      setShowLogin(false);
    }
  };

  // Logged in → show Dashboard
  if (isLoggedIn && user) {
    return (
      <Dashboard
        user={user}
        onLogout={logout}
      />
    );
  }

  // Not logged in → show Hero landing page + modals
  return (
    <main className="relative bg-bg-dark min-h-screen">
      <HeroSection
        lang={lang}
        t={t}
        onOpenLogin={() => setShowLogin(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <LoginModal
        isOpen={showLogin}
        onClose={() => { clearError(); setShowLogin(false); }}
        onLogin={handleLogin}
        onRegister={handleRegister}
        apiError={error || undefined}
        lang={lang}
        t={t}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        lang={lang}
        onLangChange={setLang}
      />
    </main>
  );
}
