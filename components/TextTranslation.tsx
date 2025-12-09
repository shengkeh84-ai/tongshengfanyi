import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TranslationTexts {
    inputPlaceholder: string;
    translateButton: string;
    clearText: string;
    copyText: string;
    translatedText: string;
    enterText: string;
    translationFailed: string;
}

interface TextTranslationProps {
    t: TranslationTexts;
}

const TextTranslation: React.FC<TextTranslationProps> = ({ t }) => {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // 检测是否是移动设备
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // 移动端特殊处理：避免键盘遮挡
    useEffect(() => {
        if (!isMobile || !inputRef.current) return;
        
        const handleFocus = () => {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        };
        
        const inputElement = inputRef.current;
        inputElement.addEventListener('focus', handleFocus);
        
        return () => {
            inputElement.removeEventListener('focus', handleFocus);
        };
    }, [isMobile]);
    
    // 处理翻译
    const handleTranslate = async () => {
        if (!inputText.trim()) {
            setError(t.enterText || '请输入要翻译的文本');
            return;
        }
        
        setIsTranslating(true);
        setError('');
        
        try {
            // 这里调用你的翻译API
            // 由于我不知道你的API，这里先用模拟
            console.log('翻译文本:', inputText);
            
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 模拟翻译结果（这里应该替换为真实API调用）
            const mockTranslation = `翻译结果: ${inputText} (模拟)`;
            setTranslatedText(mockTranslation);
            
            // 如果是移动端，翻译后滚动到结果
            if (isMobile) {
                setTimeout(() => {
                    const resultElement = document.querySelector('.translation-result');
                    if (resultElement) {
                        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
            }
            
        } catch (err) {
            console.error('翻译失败:', err);
            setError(t.translationFailed || '翻译失败，请重试');
        } finally {
            setIsTranslating(false);
        }
    };
    
    // 清空文本
    const handleClear = () => {
        setInputText('');
        setTranslatedText('');
        setError('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    
    // 复制结果
    const handleCopy = async () => {
        if (!translatedText) return;
        
        try {
            await navigator.clipboard.writeText(translatedText);
            alert('已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = translatedText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('已复制到剪贴板');
        }
    };
    
    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleTranslate();
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 bg-gray-50 dark:bg-slate-900">
            {/* 输入区域 */}
            <div className="flex-1">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        输入文本
                    </label>
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t.inputPlaceholder || "请输入要翻译的文本..."}
                        className="w-full h-40 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isTranslating}
                    />
                </div>
                
                {/* 操作按钮 */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !inputText.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                            isTranslating || !inputText.trim()
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                翻译中...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {t.translateButton || "翻译"}
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={handleClear}
                        disabled={isTranslating || (!inputText && !translatedText)}
                        className="px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t.clearText || "清空"}
                    </button>
                </div>
                
                {/* 错误提示 */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}
                
                {/* 翻译结果 */}
                {translatedText && (
                    <div className="translation-result mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.translatedText || "翻译结果"}
                            </label>
                            <button
                                onClick={handleCopy}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                                {t.copyText || "复制"}
                            </button>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {translatedText}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 移动端提示 */}
            {isMobile && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
                        💡 提示：长按输入框可以粘贴文本
                    </p>
                </div>
            )}
        </div>
    );
};

export default TextTranslation;
