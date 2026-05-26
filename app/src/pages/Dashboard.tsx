import { useRef } from 'react';
import Navbar from '../sections/Navbar';
import GenerateSection from '../sections/GenerateSection';
import TemplateSection from '../sections/TemplateSection';
import { useGenerate } from '../hooks/useGenerate';
import type { User } from '../hooks/useAuth';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const {
    prompt,
    setPrompt,
    selectedRatio,
    setSelectedRatio,
    isGenerating,
    phase,
    result,
    error,
    duration,
    setDuration,
    generate,
    regenerate,
    clearResult,
  } = useGenerate();

  const generateTopRef = useRef<HTMLDivElement>(null);

  const handleUseTemplate = (templatePrompt: string, templateDuration: number) => {
    setPrompt(templatePrompt);
    setDuration(templateDuration);
    clearResult();
    generateTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRegenerate = () => {
    regenerate();
    generateTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={generateTopRef} className="relative bg-bg-dark min-h-screen">
      <Navbar user={user} onLogout={onLogout} />

      <GenerateSection
        prompt={prompt}
        setPrompt={setPrompt}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        isGenerating={isGenerating}
        phase={phase}
        result={result}
        error={error}
        duration={duration}
        setDuration={setDuration}
        onGenerate={generate}
        onRegenerate={handleRegenerate}
      />

      <TemplateSection onUseTemplate={handleUseTemplate} />

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/5">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-grotesk text-cream/20 text-[12px] uppercase tracking-wider">
            SceneGenie
          </span>
          <span className="font-mono text-cream/15 text-[10px] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} SceneGenie. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
