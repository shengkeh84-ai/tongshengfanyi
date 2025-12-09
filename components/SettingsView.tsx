import React, { useState } from 'react';
import { Download, WifiOff, CheckCircle2, CloudLightning } from 'lucide-react';
import { TranslationResource, AppLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

interface SettingsViewProps {
  t: TranslationResource;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ t, isOffline, setIsOffline }) => {
  const [downloadedPacks, setDownloadedPacks] = useState<AppLanguage[]>([]);
  const [downloading, setDownloading] = useState<AppLanguage | null>(null);

  const handleDownload = (code: AppLanguage) => {
    setDownloading(code);
    // Simulate download
    setTimeout(() => {
      setDownloadedPacks(prev => [...prev, code]);
      setDownloading(null);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 space-y-6 overflow-y-auto">
      
      {/* Offline Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOffline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    <WifiOff size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t.offlineMode}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight max-w-[200px]">{t.offlineDesc}</p>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isOffline}
                    onChange={(e) => setIsOffline(e.target.checked)}
                />
                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
            </label>
        </div>
      </div>

      {/* Language Packs */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">{t.downloadPacks}</h4>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isDownloaded = downloadedPacks.includes(lang.code);
          const isDownloading = downloading === lang.code;

          return (
            <div key={lang.code} className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{lang.label}</p>
                        <p className="text-xs text-slate-500">{isDownloaded ? '145 MB' : 'Not downloaded'}</p>
                    </div>
                </div>

                {isDownloaded ? (
                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} />
                        <span>{t.downloaded}</span>
                    </div>
                ) : (
                    <button
                        onClick={() => handleDownload(lang.code)}
                        disabled={isDownloading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isDownloading 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100'
                        }`}
                    >
                        {isDownloading ? (
                             <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Download size={16} />
                                {t.download}
                            </>
                        )}
                    </button>
                )}
            </div>
          );
        })}
      </div>

      {/* Model Info */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg mt-auto">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CloudLightning size={24} className="text-yellow-300" />
            </div>
            <div>
                <h4 className="font-bold text-lg">Powered by Gemini</h4>
                <p className="text-white/80 text-sm mt-1">
                   Translation and Speech Synthesis are powered by the latest Gemini 2.5 Flash models for ultra-low latency.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
