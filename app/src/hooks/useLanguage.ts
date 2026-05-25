import { useState, useCallback } from 'react';

const STORAGE_KEY = 'scene-genie-language';

export type Language = 'en' | 'zh';

export function useLanguage() {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback(
    (dict: Record<Language, string>) => {
      return dict[lang] || dict['en'];
    },
    [lang]
  );

  return { lang, setLang, t };
}
