import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSelectModal: React.FC = () => {
  const { language, setLanguage, supportedLanguages, hasSelectedLanguage, setHasSelectedLanguage, t } = useLanguage();

  if (hasSelectedLanguage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3 text-blue-400">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{t('select_language')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('language_prompt')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                    : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-slate-100">{lang.nativeName}</span>
                  <span className="text-xs text-slate-500">({lang.name})</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setHasSelectedLanguage(true)}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all"
        >
          {t('save')} & Continue
        </button>
      </div>
    </div>
  );
};
