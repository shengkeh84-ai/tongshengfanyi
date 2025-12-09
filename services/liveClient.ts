import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { encode, decode, decodeAudioData, float32ToInt16 } from "./audioUtils";
import { AppLanguage } from "../types";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface LiveClientCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onAudioData?: (audioBuffer: AudioBuffer) => void;
  onTranscript?: (text: string, isUser: boolean, isFinal: boolean) => void;
  onError?: (error: any) => void;
}

export class LiveClient {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private callbacks: LiveClientCallbacks = {};

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;
  }

  private getLanguageName(code: AppLanguage): string {
    switch (code) {
      case AppLanguage.ZH: return "Chinese (Mandarin)";
      case AppLanguage.EN: return "English";
      case AppLanguage.RU: return "Russian";
      default: return "English";
    }
  }

  public async connect(sourceLang: AppLanguage, targetLang: AppLanguage) {
    if (this.isConnected) return;

    const sourceName = this.getLanguageName(sourceLang);
    const targetName = this.getLanguageName(targetLang);

    const systemInstruction = `You are a world-class professional simultaneous interpreter. 
    Your task is to translate speech bidirectionally between ${sourceName} and ${targetName} in real-time.
    
    Rules:
    1. If you hear ${sourceName}, translate it immediately to ${targetName}.
    2. If you hear ${targetName}, translate it immediately to ${sourceName}.
    3. Maintain the original tone, emotion, and nuance.
    4. Do NOT answer questions or engage in conversation. ONLY translate.
    5. Be concise and accurate. Do not add filler words.
    6. If the speech is unclear, do your best to translate the context.
    `;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }});

      this.session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.startAudioStreaming();
            this.callbacks.onOpen?.();
          },
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onclose: () => {
            this.isConnected = false;
            this.callbacks.onClose?.();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            this.callbacks.onError?.(err);
          }
        }
      });

    } catch (error) {
      console.error("Connection failed:", error);
      this.callbacks.onError?.(error);
      this.disconnect();
    }
  }

  private startAudioStreaming() {
    if (!this.audioContext || !this.stream || !this.session) return;

    this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16 PCM
      const pcmData = float32ToInt16(inputData);
      
      // Send to Gemini
      const base64Data = encode(new Uint8Array(pcmData.buffer));
      
      this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Data
        }
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
      this.callbacks.onAudioData?.(audioBuffer);
    }

    // Handle Transcriptions
    if (message.serverContent?.inputTranscription?.text) {
        this.callbacks.onTranscript?.(message.serverContent.inputTranscription.text, true, false);
    }
    
    if (message.serverContent?.outputTranscription?.text) {
        this.callbacks.onTranscript?.(message.serverContent.outputTranscription.text, false, false);
    }

    // Handle Turn Complete (Finalize transcriptions if needed, though for live we mainly stream)
    if (message.serverContent?.turnComplete) {
       // Optional: Mark current transcript block as complete
    }
  }

  public disconnect() {
    this.isConnected = false;
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    
    if (this.inputSource) {
      this.inputSource.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    // Currently no explicit close method on the session object returned by connect?
    // The library manages the websocket. We can just release references.
    this.session = null;
    this.processor = null;
    this.inputSource = null;
    this.stream = null;
    this.audioContext = null;
    
    this.callbacks.onClose?.();
  }
}
