// 移动端兼容性修复
class TextTranslator {
  constructor() {
    // 检查是否是移动设备
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.init();
  }
  
  init() {
    console.log('初始化文本翻译器，移动端:', this.isMobile);
    
    // 找到翻译按钮
    const translateBtn = document.getElementById('translate-btn') || 
                        document.querySelector('.translate-btn') ||
                        document.querySelector('button[onclick*="translate"]');
    
    // 找到输入框
    const inputField = document.getElementById('text-input') ||
                      document.querySelector('.translation-input') ||
                      document.querySelector('textarea');
    
    if (!translateBtn || !inputField) {
      console.error('找不到翻译按钮或输入框');
      return;
    }
    
    // 移动端特殊处理
    if (this.isMobile) {
      // 移除原有事件（防止重复绑定）
      translateBtn.replaceWith(translateBtn.cloneNode(true));
      const newBtn = document.querySelector('.translate-btn');
      
      // 重新绑定事件
      newBtn.addEventListener('click', (e) => this.handleTranslate(e));
      newBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleTranslate(e);
      });
      
      // 输入框也处理
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleTranslate(e);
        }
      });
    } else {
      // 电脑端正常绑定
      translateBtn.addEventListener('click', (e) => this.handleTranslate(e));
    }
  }
  
  async handleTranslate(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('开始翻译...');
    
    // 显示加载中
    this.showLoading();
    
    try {
      // 获取输入文本
      const inputField = document.querySelector('.translation-input');
      const text = inputField.value.trim();
      
      if (!text) {
        alert('请输入要翻译的文本');
        return;
      }
      
      // 调用翻译API（根据你的实际情况修改）
      const result = await this.callTranslationAPI(text);
      
      // 显示结果
      this.showResult(result);
      
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请重试');
    } finally {
      this.hideLoading();
    }
  }
  
  async callTranslationAPI(text) {
    // 这里需要根据你的实际API来修改
    // 示例：使用fetch调用翻译API
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        targetLang: 'zh-CN'  // 根据你的设置调整
      })
    });
    
    if (!response.ok) {
      throw new Error('API调用失败');
    }
    
    return await response.json();
  }
  
  showLoading() {
    // 显示加载动画
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '翻译中...';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.background = 'rgba(0,0,0,0.7)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.borderRadius = '10px';
    loadingDiv.style.zIndex = '9999';
    
    document.body.appendChild(loadingDiv);
    this.loadingElement = loadingDiv;
  }
  
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
    }
  }
  
  showResult(result) {
    // 找到结果显示区域
    const resultDiv = document.getElementById('translation-result') ||
                     document.querySelector('.result-area');
    
    if (resultDiv) {
      resultDiv.innerHTML = `<div class="result-text">${result.translatedText}</div>`;
    } else {
      // 如果没有结果区域，创建一个
      const newResultDiv = document.createElement('div');
      newResultDiv.className = 'translation-result';
      newResultDiv.innerHTML = `
        <h3>翻译结果：</h3>
        <p>${result.translatedText}</p>
      `;
      newResultDiv.style.marginTop = '20px';
      newResultDiv.style.padding = '15px';
      newResultDiv.style.background = '#f0f0f0';
      newResultDiv.style.borderRadius = '8px';
      
      // 插入到翻译按钮后面
      const translateBtn = document.querySelector('.translate-btn');
      translateBtn.parentNode.insertBefore(newResultDiv, translateBtn.nextSibling);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.textTranslator = new TextTranslator();
});
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
