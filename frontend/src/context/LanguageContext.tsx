import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, LanguageInfo } from '../i18n/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  supportedLanguages: LanguageInfo[];
  isRTL: boolean;
  hasSelectedLanguage: boolean;
  setHasSelectedLanguage: (selected: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const [hasSelectedLanguage, setHasSelectedLanguageState] = useState<boolean>(() => {
    return localStorage.getItem('app_language_selected') === 'true';
  });

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = currentLangInfo.dir === 'rtl';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('app_language', language);
  }, [language, isRTL]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setHasSelectedLanguageState(true);
    localStorage.setItem('app_language_selected', 'true');
  };

  const setHasSelectedLanguage = (selected: boolean) => {
    setHasSelectedLanguageState(selected);
    if (selected) {
      localStorage.setItem('app_language_selected', 'true');
    }
  };

  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        isRTL,
        hasSelectedLanguage,
        setHasSelectedLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
