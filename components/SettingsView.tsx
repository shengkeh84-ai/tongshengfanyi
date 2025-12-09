import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, WifiOff, Wifi } from 'lucide-react';

interface SettingsTexts {
    settingsTitle: string;
    offlineMode: string;
    downloadLanguagePack: string;
    downloaded: string;
    download: string;
    delete: string;
    size: string;
    poweredBy: string;
    enableOffline: string;
    disableOffline: string;
    confirmDelete: string;
    downloadSuccess: string;
    downloadFailed: string;
}

interface SettingsViewProps {
    t: SettingsTexts;
    isOffline: boolean;
    setIsOffline: (value: boolean) => void;
}

interface LanguagePack {
    id: string;
    name: string;
    code: string;
    size: string;
    downloaded: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ t, isOffline, setIsOffline }) => {
    const [languagePacks, setLanguagePacks] = useState<LanguagePack[]>([
        { id: 'zh', name: '中文 (Chinese)', code: 'CN', size: '165 MB', downloaded: false },
        { id: 'en', name: 'English', code: 'US', size: '165 MB', downloaded: false },
        { id: 'ru', name: 'Pyccкий (Russian)', code: 'RU', size: '165 MB', downloaded: false },
    ]);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [storageError, setStorageError] = useState('');
    
    // 初始化：从localStorage加载下载状态
    useEffect(() => {
        console.log('SettingsView: 初始化，加载下载状态');
        loadDownloadedPacks();
        
        // 监听页面可见性变化（切换标签页时重新加载状态）
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('页面重新显示，重新加载下载状态');
                loadDownloadedPacks();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    
    // 加载已下载的语言包
    const loadDownloadedPacks = () => {
        try {
            const saved = localStorage.getItem('downloaded_language_packs');
            if (saved) {
                const downloadedIds = JSON.parse(saved) as string[];
                console.log('已下载的语言包ID:', downloadedIds);
                
                setLanguagePacks(prev => prev.map(pack => ({
                    ...pack,
                    downloaded: downloadedIds.includes(pack.id)
                })));
            }
        } catch (error) {
            console.error('加载下载状态失败:', error);
            setStorageError('无法加载保存的数据');
        }
    };
    
    // 保存下载状态
    const saveDownloadStatus = (packId: string, downloaded: boolean) => {
        try {
            const saved = localStorage.getItem('downloaded_language_packs');
            const downloadedIds = saved ? JSON.parse(saved) as string[] : [];
            
            if (downloaded) {
                if (!downloadedIds.includes(packId)) {
                    downloadedIds.push(packId);
                }
            } else {
                const index = downloadedIds.indexOf(packId);
                if (index > -1) {
                    downloadedIds.splice(index, 1);
                }
            }
            
            localStorage.setItem('downloaded_language_packs', JSON.stringify(downloadedIds));
            console.log('保存下载状态成功:', downloadedIds);
            
            // 同时保存到sessionStorage作为备份
            sessionStorage.setItem(`lang_${packId}`, downloaded.toString());
            
            // 同步到indexedDB（如果支持）
            saveToIndexedDB(packId, downloaded);
            
        } catch (error) {
            console.error('保存下载状态失败:', error);
            setStorageError('无法保存数据到本地存储');
            // 使用cookie作为备选方案
            document.cookie = `lang_${packId}=${downloaded}; max-age=2592000; path=/`;
        }
    };
    
    // 保存到indexedDB（备用存储）
    const saveToIndexedDB = async (packId: string, downloaded: boolean) => {
        if (!('indexedDB' in window)) return;
        
        try {
            const request = indexedDB.open('LinguaFlowDB', 1);
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('languagePacks')) {
                    db.createObjectStore('languagePacks', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = db.transaction(['languagePacks'], 'readwrite');
                const store = transaction.objectStore('languagePacks');
                
                store.put({
                    id: packId,
                    downloaded,
                    timestamp: Date.now()
                });
            };
        } catch (error) {
            console.log('IndexedDB保存失败，使用备选方案');
        }
    };
    
    // 处理下载语言包
    const handleDownloadPack = async (pack: LanguagePack) => {
        if (pack.downloaded || isDownloading === pack.id) return;
        
        console.log(`开始下载语言包: ${pack.name}`);
        setIsDownloading(pack.id);
        setStorageError('');
        
        try {
            // 模拟下载过程（这里应该替换为实际的下载逻辑）
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 下载成功，更新状态
            setLanguagePacks(prev => prev.map(p => 
                p.id === pack.id ? { ...p, downloaded: true } : p
            ));
            
            // 保存到本地存储
            saveDownloadStatus(pack.id, true);
            
            // 显示成功消息（使用更友好的方式）
            showToast(t.downloadSuccess || `${pack.name} 下载完成！`);
            
        } catch (error) {
            console.error('下载失败:', error);
            setStorageError(t.downloadFailed || '下载失败，请检查网络连接');
            
            // 显示错误消息
            showToast('下载失败，请重试', 'error');
        } finally {
            setIsDownloading(null);
        }
    };
    
    // 处理删除语言包
    const handleDeletePack = (pack: LanguagePack) => {
        if (!pack.downloaded) return;
        
        if (window.confirm(t.confirmDelete || `确定要删除 ${pack.name} 吗？`)) {
            setLanguagePacks(prev => prev.map(p => 
                p.id === pack.id ? { ...p, downloaded: false } : p
            ));
            
            // 从本地存储移除
            saveDownloadStatus(pack.id, false);
            
            showToast(`${pack.name} 已删除`);
        }
    };
    
    // 显示提示消息
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        // 移除现有的toast
        const existingToasts = document.querySelectorAll('.language-toast');
        existingToasts.forEach(toast => toast.remove());
        
        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `language-toast fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };
    
    // 切换离线模式
    const handleToggleOffline = () => {
        const newOfflineState = !isOffline;
        setIsOffline(newOfflineState);
        
        // 保存离线模式状态
        localStorage.setItem('offline_mode', newOfflineState.toString());
        
        showToast(newOfflineState ? 
            (t.enableOffline || '已启用离线模式') : 
            (t.disableOffline || '已禁用离线模式')
        );
    };
    
    return (
        <div className="h-full bg-gray-50 dark:bg-slate-900 overflow-y-auto no-scrollbar">
            <div className="p-4">
                {/* 离线模式开关 */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isOffline ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                {isOffline ? (
                                    <WifiOff className={`w-5 h-5 ${isOffline ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                ) : (
                                    <Wifi className={`w-5 h-5 ${!isOffline ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t.offlineMode || "离线模式"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {isOffline 
                                        ? (t.disableOffline || "禁用离线模式以使用在线翻译") 
                                        : (t.enableOffline || "启用离线模式以在没有网络时使用")
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleOffline}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                isOffline ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isOffline ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
                
                {/* 语言包下载 */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {t.downloadLanguagePack || "离线语言包"}
                        </h3>
                        {storageError && (
                            <span className="text-xs text-red-500 dark:text-red-400">{storageError}</span>
                        )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        下载语言包以在离线环境下使用
                    </p>
                    
                    {/* 语言包列表 */}
                    <div className="space-y-3">
                        {languagePacks.map(pack => (
                            <div 
                                key={pack.id} 
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-medium">
                                        {pack.code}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                            {pack.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t.size || "大小"}: {pack.size}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {pack.downloaded ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <button
                                                onClick={() => handleDeletePack(pack)}
                                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-3 py-1 rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                {t.delete || "删除"}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleDownloadPack(pack)}
                                            disabled={isDownloading === pack.id}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                                isDownloading === pack.id
                                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-wait'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            {isDownloading === pack.id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    下载中...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    {t.download || "下载"}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* 技术支持信息 */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.poweredBy || "Translation and Speech Synthesis are powered by the latest Gemini 2.5 Flash model for ultra-flow latency."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
