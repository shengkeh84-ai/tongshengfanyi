import React, { useState } from 'react';
import { AppLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLang: AppLanguage;
  onChange: (lang: AppLanguage) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/10"
      >
        <Globe size={16} />
        <span className="text-sm font-medium">{currentLang}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  currentLang === lang.code ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLang === lang.code && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
