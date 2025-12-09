import React, { useState } from 'react';
import { ArrowRightLeft, Copy, Check } from 'lucide-react';
import { AppLanguage, TranslationResource } from '../types';
import { translateText, synthesizeSpeech } from '../services/geminiService';
import { SUPPORTED_LANGUAGES } from '../constants';

interface TextTranslationProps {
  t: TranslationResource;
}

const TextTranslation: React.FC<TextTranslationProps> = ({ t }) => {
  const [sourceLang, setSourceLang] = useState<AppLanguage>(AppLanguage.EN);
  const [targetLang, setTargetLang] = useState<AppLanguage>(AppLanguage.ZH);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const result = await translateText(inputText, sourceLang, targetLang);
      setTranslatedText(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLangs = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 space-y-4">
      
      {/* Language Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700">
        <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as AppLanguage)}
            className="flex-1 bg-transparent text-center font-medium p-2 outline-none text-slate-700 dark:text-slate-200"
        >
             {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        
        <button onClick={swapLangs} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
            <ArrowRightLeft size={18} />
        </button>

        <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as AppLanguage)}
            className="flex-1 bg-transparent text-center font-medium p-2 outline-none text-blue-600 dark:text-blue-400"
        >
             {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* Input Area */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all flex flex-col">
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.inputPlaceholder}
                className="w-full h-full bg-transparent resize-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
             {inputText && (
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={() => synthesizeSpeech(inputText, sourceLang)}
                        className="text-slate-400 hover:text-blue-500 text-sm font-medium"
                    >
                        Listen
                    </button>
                </div>
            )}
        </div>

        {/* Action Button */}
        <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center"
        >
            {isLoading ? (
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : t.translateBtn}
        </button>

        {/* Output Area */}
        <div className={`flex-1 bg-blue-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-blue-100 dark:border-slate-700 transition-all ${translatedText ? 'opacity-100' : 'opacity-60'}`}>
            {translatedText ? (
                <div className="flex flex-col h-full">
                    <p className="flex-1 text-xl font-medium text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{translatedText}</p>
                    <div className="flex items-center justify-end gap-3 mt-2 border-t border-slate-200 dark:border-slate-700/50 pt-3">
                        <button 
                            onClick={() => synthesizeSpeech(translatedText, targetLang)}
                            className="text-blue-600 dark:text-blue-400 font-medium text-sm px-3 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                            Play Audio
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                    {t.processing.replace('...', '')}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TextTranslation;
