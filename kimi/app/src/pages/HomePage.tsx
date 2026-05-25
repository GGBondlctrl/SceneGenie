import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import GenerateSection from '../sections/GenerateSection';
import TemplateSection from '../sections/TemplateSection';

export default function HomePage() {
  const [templatePrompt, setTemplatePrompt] = useState('');

  const handleUseTemplate = useCallback((prompt: string) => {
    setTemplatePrompt(prompt);
    // Scroll to generate section
    const generateSection = document.getElementById('generate');
    if (generateSection) {
      generateSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <div id="generate" className="relative min-h-screen">
      <Navbar />
      <GenerateSection key={templatePrompt} initialPrompt={templatePrompt} />
      <TemplateSection onUseTemplate={handleUseTemplate} />
    </div>
  );
}
