import React, { useState, useEffect } from 'react';
import { MessageSquare, Mic, Settings, WifiOff, Phone } from 'lucide-react';
import { AppLanguage } from './types';
import { TRANSLATIONS } from './constants';
import LanguageSelector from './components/LanguageSelector';
import ConversationMode from './components/ConversationMode';
import TextTranslation from './components/TextTranslation';
import CallMode from './components/CallMode';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [uiLang, setUiLang] = useState<AppLanguage>(AppLanguage.ZH);
  const [activeTab, setActiveTab] = useState<'conversation' | 'text' | 'call' | 'settings'>('conversation');
  const [isOffline, setIsOffline] = useState(false);

  // Set html lang attribute for accessibility
  useEffect(() => {
    document.documentElement.lang = uiLang === AppLanguage.ZH ? 'zh' : uiLang === AppLanguage.RU ? 'ru' : 'en';
  }, [uiLang]);

  const t = TRANSLATIONS[uiLang];

  const renderContent = () => {
    switch (activeTab) {
      case 'conversation':
        return <ConversationMode uiLang={uiLang} t={t} />;
      case 'text':
        return <TextTranslation t={t} />;
      case 'call':
        return <CallMode t={t} />;
      case 'settings':
        return <SettingsView t={t} isOffline={isOffline} setIsOffline={setIsOffline} />;
      default:
        return <ConversationMode uiLang={uiLang} t={t} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-black font-sans">
      <div className="w-full max-w-md h-[100dvh] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <header className="bg-blue-600 dark:bg-blue-900 text-white p-4 pt-safe-top pb-3 shadow-lg z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">{t.appTitle}</h1>
                {isOffline && <WifiOff size={16} className="text-green-300 opacity-80" />}
            </div>
            <LanguageSelector currentLang={uiLang} onChange={setUiLang} />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
            {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pb-safe-bottom">
          <div className="grid grid-cols-4 h-16">
            <button 
                onClick={() => setActiveTab('conversation')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                    activeTab === 'conversation' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
            >
                <div className={`p-1 rounded-lg ${activeTab === 'conversation' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <Mic size={22} />
                </div>
                <span className="text-[10px] font-medium mt-1">{t.tabConversation}</span>
            </button>

            <button 
                onClick={() => setActiveTab('call')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                    activeTab === 'call' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
            >
                <div className={`p-1 rounded-lg ${activeTab === 'call' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <Phone size={22} />
                </div>
                <span className="text-[10px] font-medium mt-1">{t.tabCall}</span>
            </button>

            <button 
                onClick={() => setActiveTab('text')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                    activeTab === 'text' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
            >
                <div className={`p-1 rounded-lg ${activeTab === 'text' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <MessageSquare size={22} />
                </div>
                <span className="text-[10px] font-medium mt-1">{t.tabText}</span>
            </button>

            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                    activeTab === 'settings' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
            >
                <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <Settings size={22} />
                </div>
                <span className="text-[10px] font-medium mt-1">{t.tabSettings}</span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  );
};

export default App;