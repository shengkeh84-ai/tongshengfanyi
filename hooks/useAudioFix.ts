import { useState, useRef, useEffect } from 'react';

// 修复麦克风闪烁和状态管理
export const useAudioFix = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioPermission, setAudioPermission] = useState<PermissionState>('prompt');
    const [isProcessing, setIsProcessing] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    
    // 检查麦克风权限
    useEffect(() => {
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then(permissionStatus => {
                    setAudioPermission(permissionStatus.state);
                    permissionStatus.onchange = () => {
                        setAudioPermission(permissionStatus.state);
                    };
                })
                .catch(() => {
                    // 如果浏览器不支持Permissions API
                    console.log('不支持Permissions API');
                });
        }
    }, []);
    
    // 开始录音
    const startRecording = async (): Promise<MediaStream | null> => {
        if (isProcessing) return null;
        setIsProcessing(true);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            streamRef.current = stream;
            setIsRecording(true);
            setIsProcessing(false);
            
            // 添加事件监听器，处理音轨结束
            stream.getAudioTracks().forEach(track => {
                track.addEventListener('ended', () => {
                    console.log('音频轨道已结束');
                    handleStopRecording();
                });
            });
            
            return stream;
        } catch (error) {
            console.error('获取麦克风权限失败:', error);
            setIsProcessing(false);
            return null;
        }
    };
    
    // 停止录音
    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        setIsRecording(false);
    };
    
    // 处理停止录音
    const handleStopRecording = () => {
        stopRecording();
        // 添加延迟，防止按钮状态立即变化
        setTimeout(() => {
            setIsRecording(false);
        }, 300);
    };
    
    // 切换录音状态
    const toggleRecording = async () => {
        if (isRecording) {
            handleStopRecording();
        } else {
            await startRecording();
        }
    };
    
    return {
        isRecording,
        isProcessing,
        audioPermission,
        startRecording,
        stopRecording,
        toggleRecording
    };
};
