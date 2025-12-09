import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RefreshCw, Radio } from 'lucide-react';
import { AppLanguage, ChatMessage, TranslationResource } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LiveClient } from '../services/liveClient';

interface ConversationModeProps {
  uiLang: AppLanguage;
  t: TranslationResource;
}

const ConversationMode: React.FC<ConversationModeProps> = ({ uiLang, t }) => {
  const [langA, setLangA] = useState<AppLanguage>(AppLanguage.ZH);
  const [langB, setLangB] = useState<AppLanguage>(AppLanguage.EN);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Real-time transcript buffers
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');

  const liveClientRef = useRef<LiveClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userTranscript, aiTranscript]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const playAudioChunk = (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    const ctx = audioContextRef.current;
    
    // Simple queueing logic
    const now = ctx.currentTime;
    // If next start time is in the past, reset it to now
    if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(nextStartTimeRef.current);
    
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const toggleSession = async () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = () => {
    setStatus('connecting');
    
    // Initialize Live Client
    const client = new LiveClient({
        onOpen: () => {
            setStatus('active');
            setIsActive(true);
        },
        onClose: () => {
            setStatus('idle');
            setIsActive(false);
        },
        onError: () => {
            setStatus('error');
            setIsActive(false);
        },
        onAudioData: (buffer) => {
            playAudioChunk(buffer);
        },
        onTranscript: (text, isUser, isFinal) => {
            if (isUser) {
                setUserTranscript(prev => prev + text);
                // Simple heuristic to commit message to history on pause (optional)
            } else {
                setAiTranscript(prev => prev + text);
            }
        }
    });

    liveClientRef.current = client;
    client.connect(langA, langB);
  };

  const stopSession = () => {
    if (liveClientRef.current) {
        liveClientRef.current.disconnect();
        liveClientRef.current = null;
    }
    setIsActive(false);
    setStatus('idle');
    
    // Commit any pending transcripts to history when stopping
    if (userTranscript || aiTranscript) {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            text: userTranscript,
            translation: aiTranscript,
            sender: 'user',
            originalLang: langA, // Approximation
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
        setUserTranscript('');
        setAiTranscript('');
    }
  };

  const swapLanguages = () => {
    if (isActive) {
        // Must restart to change system instructions or prompts effectively
        stopSession();
        setLangA(langB);
        setLangB(langA);
        setTimeout(startSession, 500); 
    } else {
        setLangA(langB);
        setLangB(langA);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 shadow-sm z-10 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="font-bold text-slate-800 dark:text-white">
                {SUPPORTED_LANGUAGES.find(l => l.code === langA)?.label}
            </span>
        </div>
        
        <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <RefreshCw size={20} />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center">
             <span className="font-bold text-slate-800 dark:text-white">
                {SUPPORTED_LANGUAGES.find(l => l.code === langB)?.label}
            </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isActive && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60">
             <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Radio size={40} />
             </div>
             <p className="text-center">Press the mic to start<br/>simultaneous interpretation</p>
          </div>
        )}
        
        {/* History */}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-sm opacity-60 mb-1">{msg.text}</p>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">{msg.translation}</p>
          </div>
        ))}

        {/* Live Active Transcripts */}
        {isActive && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {(userTranscript || aiTranscript) ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                        {userTranscript && (
                             <div className="mb-2">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Listening</span>
                                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{userTranscript}</p>
                             </div>
                        )}
                        {aiTranscript && (
                             <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/50">
                                <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Translating</span>
                                <p className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">{aiTranscript}</p>
                             </div>
                        )}
                        <div className="flex gap-1 mt-3">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-blue-500">
                        <span className="animate-pulse font-medium">Listening for speech...</span>
                    </div>
                )}
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
            onClick={toggleSession}
            disabled={status === 'connecting'}
            className={`w-full h-20 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 touch-manipulation shadow-lg ${
                isActive 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
            } text-white disabled:opacity-70 disabled:cursor-not-allowed`}
        >
            {status === 'connecting' ? (
                <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isActive ? (
                <>
                    <div className="bg-white/20 p-3 rounded-full animate-pulse">
                        <Mic size={32} />
                    </div>
                    <span className="font-bold text-xl">Stop Interpreter</span>
                </>
            ) : (
                <>
                    <div className="bg-white/20 p-3 rounded-full">
                        <MicOff size={32} />
                    </div>
                    <span className="font-bold text-xl">Start Simultaneous Mode</span>
                </>
            )}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">
            {isActive ? 'Simultaneous translation active. Just speak naturally.' : t.holdToSpeak}
        </p>
      </div>
    </div>
  );
};

export default ConversationMode;
