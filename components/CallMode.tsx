import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, User, ArrowRightLeft } from 'lucide-react';
import { AppLanguage, TranslationResource } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LiveClient } from '../services/liveClient';

interface CallModeProps {
  t: TranslationResource;
}

const CallMode: React.FC<CallModeProps> = ({ t }) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [contactName, setContactName] = useState('');
  const [myLang, setMyLang] = useState<AppLanguage>(AppLanguage.ZH);
  const [theirLang, setTheirLang] = useState<AppLanguage>(AppLanguage.RU);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Real-time buffers
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');

  const timerRef = useRef<number>(0);
  const liveClientRef = useRef<LiveClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      startLiveSession();
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopLiveSession();
    }
  }, [callStatus]);

  const playAudioChunk = (audioBuffer: AudioBuffer) => {
    if (isMuted) return; // Don't play if "speaker" is off (conceptually mapped to mute here for simplicity, or we add speaker toggle)

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    const ctx = audioContextRef.current;
    
    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(nextStartTimeRef.current);
    
    nextStartTimeRef.current += audioBuffer.duration;
  };

  const startLiveSession = () => {
    const client = new LiveClient({
        onAudioData: (buffer) => {
            playAudioChunk(buffer);
        },
        onTranscript: (text, isUser) => {
            if (isUser) {
                setTranscript(prev => {
                    const newVal = prev + text;
                    return newVal.slice(-100); // Keep last 100 chars
                });
            } else {
                setTranslation(prev => {
                    const newVal = prev + text;
                    return newVal.slice(-100);
                });
            }
        },
        onError: (e) => {
            console.error("Live Call Error", e);
            // Optionally hang up or retry
        }
    });

    liveClientRef.current = client;
    client.connect(myLang, theirLang);
  };

  const stopLiveSession = () => {
    if (liveClientRef.current) {
        liveClientRef.current.disconnect();
        liveClientRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
  };

  const handleCall = () => {
    if (!contactName.trim()) return;
    setCallStatus('calling');
    setTimeout(() => {
      setCallStatus('connected');
    }, 1500);
  };

  const stopCall = () => {
    setCallStatus('idle');
    setCallDuration(0);
    setTranscript('');
    setTranslation('');
    stopLiveSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const swapLanguages = () => {
    setMyLang(theirLang);
    setTheirLang(myLang);
  };

  if (callStatus === 'idle') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-6">
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
            <User size={64} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          <input
            type="text"
            placeholder={t.enterContact}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full text-center text-2xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-slate-700 pb-2 focus:border-blue-500 outline-none text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
          />

          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400 font-medium">ME</span>
                    <select 
                        value={myLang}
                        onChange={(e) => setMyLang(e.target.value as AppLanguage)}
                        className="w-full bg-transparent text-center font-bold text-slate-700 dark:text-slate-200 outline-none"
                    >
                        {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                </div>
                
                <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                    <ArrowRightLeft size={18} />
                </button>

                <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400 font-medium">THEM</span>
                    <select 
                        value={theirLang}
                        onChange={(e) => setTheirLang(e.target.value as AppLanguage)}
                        className="w-full bg-transparent text-center font-bold text-blue-600 dark:text-blue-400 outline-none"
                    >
                        {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                </div>
             </div>
          </div>
        </div>

        <button
          onClick={handleCall}
          disabled={!contactName.trim()}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Phone size={24} fill="currentColor" />
          {t.call}
        </button>
      </div>
    );
  }

  // In-Call UI
  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-black opacity-90 z-0" />
        {translation && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none transition-opacity duration-500">
                 <div className="w-96 h-96 bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
            </div>
        )}

        <div className="relative z-10 flex flex-col h-full p-6">
            
            {/* Header Info */}
            <div className="flex flex-col items-center mt-8 space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{contactName}</h2>
                <p className="text-blue-300 font-medium tracking-wide">
                    {callStatus === 'calling' ? t.calling : formatTime(callDuration)}
                </p>
            </div>

            {/* Avatar */}
            <div className="flex-1 flex items-center justify-center py-8">
                <div className={`w-40 h-40 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center shadow-2xl relative ${callStatus === 'calling' ? 'animate-pulse' : ''}`}>
                    <User size={80} className="text-slate-300" />
                </div>
            </div>

            {/* Transcription Stream */}
            <div className="h-40 mb-8 flex flex-col justify-end">
                {transcript && (
                    <div className="text-center mb-4 opacity-70">
                        <p className="text-xs text-slate-400 mb-1">Detecting ({myLang})</p>
                        <p className="text-white text-lg leading-snug line-clamp-2">{transcript}</p>
                    </div>
                )}
                {translation && (
                     <div className="text-center">
                         <p className="text-xs text-green-400 mb-1">Speaking ({theirLang})</p>
                         <p className="text-white font-bold text-2xl leading-snug line-clamp-2 animate-in slide-in-from-bottom-2">{translation}</p>
                     </div>
                )}
                 {!transcript && !translation && (
                    <p className="text-center text-slate-500 italic">Listening for speech...</p>
                 )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-6 mb-8 items-center">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                    </div>
                    <span className="text-xs font-medium tracking-wide">{t.mute}</span>
                </button>

                <button 
                    onClick={stopCall}
                    className="flex flex-col items-center gap-2 group col-start-2 -mt-4"
                >
                    <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 hover:bg-red-600 transition-all active:scale-95">
                        <PhoneOff size={32} fill="currentColor" />
                    </div>
                    <span className="text-xs font-medium tracking-wide">{t.endCall}</span>
                </button>

                <button 
                    className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed"
                >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 text-white">
                        <Volume2 size={28} />
                    </div>
                    <span className="text-xs font-medium tracking-wide">{t.speaker}</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default CallMode;
