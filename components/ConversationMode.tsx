import React, { useState, useEffect, useRef } from 'react';
import { LiveClient } from '../services/liveClient';
import { AppLanguage } from '../types';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isFinal: boolean;
}

interface Props {
  sourceLang: AppLanguage;
  targetLang: AppLanguage;
}

export default function ConversationMode({ sourceLang, targetLang }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const clientRef = useRef<LiveClient | null>(null);

  // 初始化引擎
  useEffect(() => {
    clientRef.current = new LiveClient({
      onOpen: () => {
        console.log("Connected");
      },
      onClose: () => {
        console.log("Disconnected");
        setIsActive(false);
      },
      onTranscript: (text, isUser, isFinal) => {
        // 收到文字，更新界面
        setMessages(prev => {
          const newMsg = { id: Date.now().toString(), text, isUser, isFinal };
          // 简单的逻辑：如果是最终结果，就加新行；如果是临时结果，替换最后一行（这里简化处理直接追加，保证能看到）
          return [...prev, newMsg];
        });
      },
      onError: (err) => {
        console.error(err);
        setIsActive(false);
        alert("出错啦: " + JSON.stringify(err));
      }
    });

    return () => {
      // 退出页面时自动挂断
      clientRef.current?.disconnect();
    };
  }, []);

  const toggleRecording = async () => {
    if (!clientRef.current) return;

    if (isActive) {
      // 正在运行 -> 停止
      clientRef.current.disconnect();
      setIsActive(false);
    } else {
      // 没运行 -> 开启
      setIsActive(true);
      setMessages([]); // 清空旧记录
      try {
        await clientRef.current.connect(sourceLang, targetLang);
      } catch (e) {
        setIsActive(false);
        alert("启动失败: " + e);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 聊天记录显示区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && isActive && (
          <div className="text-center text-gray-400 mt-10 animate-pulse">
            正在聆听中... 请说话...
          </div>
        )}
        
        {messages.length === 0 && !isActive && (
          <div className="text-center text-gray-400 mt-10">
            点击下方蓝色按钮开始同声传译
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.isUser
                ? 'bg-blue-100 ml-auto text-blue-900'
                : 'bg-white mr-auto text-gray-900 shadow-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* 底部按钮区 */}
      <div className="p-6 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={toggleRecording}
          className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {isActive ? (
            <>
              <span className="animate-pulse">●</span> 停止翻译 (Stop)
            </>
          ) : (
            <>
              <span>🎙️</span> 开始同声传译 (Start)
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          {isActive ? "正在接收音频流..." : "点击开始后，请允许麦克风权限"}
        </p>
      </div>
    </div>
  );
}
