// 语言包管理器
class LanguagePackManager {
  constructor() {
    this.STORAGE_KEY = 'downloaded_language_packs';
    this.init();
  }
  
  init() {
    console.log('初始化语言包管理器');
    
    // 页面加载时恢复状态
    this.restoreDownloadStatus();
    
    // 监听页面可见性变化（切换标签页或应用）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('页面重新显示，恢复下载状态');
        this.restoreDownloadStatus();
      }
    });
    
    // 找到所有下载按钮并绑定事件
    setTimeout(() => {
      this.bindDownloadButtons();
    }, 1000); // 等待1秒确保DOM完全加载
  }
  
  // 绑定下载按钮事件
  bindDownloadButtons() {
    const downloadButtons = document.querySelectorAll('.download-btn, button[onclick*="download"]');
    
    console.log('找到下载按钮数量:', downloadButtons.length);
    
    downloadButtons.forEach(button => {
      // 移除旧的事件监听器（防止重复绑定）
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // 重新绑定事件
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDownload(e.target);
      });
    });
  }
  
  // 处理下载
  async handleDownload(button) {
    // 获取语言信息
    const languageCard = button.closest('.language-card, .lang-item, div');
    let languageName = '未知语言';
    
    if (languageCard) {
      const nameElement = languageCard.querySelector('.lang-name, h3, h4, strong');
      if (nameElement) {
        languageName = nameElement.textContent;
      }
    }
    
    console.log(`开始下载: ${languageName}`);
    
    // 禁用按钮，防止重复点击
    button.disabled = true;
    button.textContent = '下载中...';
    button.style.opacity = '0.7';
    
    try {
      // 模拟下载过程（这里需要替换为实际的下载代码）
      await this.downloadLanguagePack(languageName);
      
      // 下载成功，保存状态
      this.saveDownloadStatus(languageName, true);
      
      // 更新按钮状态
      button.textContent = '已下载 ✓';
      button.style.background = '#4CAF50';
      button.disabled = true;
      
      // 显示成功消息
      this.showToast(`${languageName} 下载完成！`);
      
    } catch (error) {
      console.error('下载失败:', error);
      button.textContent = '下载失败，重试';
      button.disabled = false;
      button.style.opacity = '1';
      
      this.showToast('下载失败，请检查网络连接');
    }
  }
  
  // 保存下载状态到本地存储
  saveDownloadStatus(languageName, isDownloaded) {
    try {
      // 读取现有的下载状态
      const currentStatus = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      
      // 更新状态
      currentStatus[languageName] = {
        downloaded: isDownloaded,
        timestamp: new Date().toISOString()
      };
      
      // 保存到localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentStatus));
      
      console.log('已保存下载状态:', currentStatus);
      
      // 同时保存到sessionStorage作为备份
      sessionStorage.setItem(`lang_${languageName}`, isDownloaded);
      
    } catch (error) {
      console.error('保存状态失败:', error);
      
      // 如果localStorage失败，尝试使用cookie
      document.cookie = `lang_${languageName}=${isDownloaded}; max-age=2592000; path=/`; // 30天过期
    }
  }
  
  // 恢复下载状态
  restoreDownloadStatus() {
    try {
      // 从localStorage读取状态
      const savedStatus = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      
      console.log('恢复下载状态:', savedStatus);
      
      // 遍历所有语言包，更新UI
      Object.keys(savedStatus).forEach(languageName => {
        if (savedStatus[languageName].downloaded) {
          this.updateLanguageUI(languageName, true);
        }
      });
      
    } catch (error) {
      console.error('恢复状态失败:', error);
      
      // 尝试从cookie恢复
      this.restoreFromCookies();
    }
  }
  
  // 更新语言包UI
  updateLanguageUI(languageName, isDownloaded) {
    // 找到对应的语言包元素
    const languageCards = document.querySelectorAll('.language-card, .lang-item, div');
    
    languageCards.forEach(card => {
      const nameElement = card.querySelector('.lang-name, h3, h4, strong');
      if (nameElement && nameElement.textContent.includes(languageName)) {
        const button = card.querySelector('.download-btn, button');
        if (button) {
          if (isDownloaded) {
            button.textContent = '已下载 ✓';
            button.style.background = '#4CAF50';
            button.disabled = true;
            button.style.opacity = '0.7';
          } else {
            button.textContent = '下载';
            button.disabled = false;
            button.style.opacity = '1';
          }
        }
      }
    });
  }
  
  // 模拟下载过程（需要替换为实际下载代码）
  async downloadLanguagePack(languageName) {
    return new Promise((resolve, reject) => {
      console.log(`模拟下载语言包: ${languageName}`);
      
      // 模拟网络延迟
      setTimeout(() => {
        // 这里应该替换为实际的下载逻辑
        // 例如：fetch下载文件，保存到IndexedDB等
        
        // 模拟下载成功
        resolve();
      }, 2000); // 模拟2秒下载时间
    });
  }
  
  // 显示提示消息
  showToast(message) {
    // 创建提示框
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '20px';
    toast.style.zIndex = '10000';
    toast.style.fontSize = '14px';
    
    document.body.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
  
  // 从cookie恢复状态（备用方案）
  restoreFromCookies() {
    const cookies = document.cookie.split('; ');
    cookies.forEach(cookie => {
      if (cookie.startsWith('lang_')) {
        const [name, value] = cookie.split('=');
        const languageName = name.replace('lang_', '');
        const isDownloaded = value === 'true';
        
        if (isDownloaded) {
          this.updateLanguageUI(languageName, true);
        }
      }
    });
  }
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，确保DOM完全加载
  setTimeout(() => {
    window.languagePackManager = new LanguagePackManager();
  }, 500);
});
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
