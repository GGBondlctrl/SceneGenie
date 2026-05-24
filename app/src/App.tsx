import HeroSection from './sections/HeroSection';
import AboutSection from './sections/AboutSection';
import CollectionSection from './sections/CollectionSection';
import CTASection from './sections/CTASection';

export default function App() {
  return (
    <main className="relative bg-bg-dark min-h-screen">
      <div className="texture-overlay" />
      <HeroSection />
      <AboutSection />
      <CollectionSection />
      <CTASection />
    </main>
  );
}
