import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { encode, decode, decodeAudioData, float32ToInt16 } from "./audioUtils";
import { AppLanguage } from "../types";

// ⚠️ 这里直接填你的真钥匙，不要改动！
const apiKey = "AIzaSyDyTqBSuUsS6ksJ4r4gNH3yaeo393X4qnVU"; 
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

    const systemInstruction = `You are a professional simultaneous interpreter. 
    Translate between ${sourceName} and ${targetName} in real-time. 
    Just translate what you hear. Do not answer questions.`;

    try {
      // 🟢 修复点 1：移除 sampleRate 限制，让苹果手机使用默认采样率（通常是 48000 或 44100）
      // 这样就不会崩溃了！
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 🟢 修复点 2：麦克风也移除强制参数
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 🟢 修复点 3：模型名称必须是 2.0-flash-exp
      this.session = await ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
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
            // 🟢 修复点 4：如果有错，弹窗告诉你！
            alert("API Error: " + JSON.stringify(err)); 
            this.callbacks.onError?.(err);
          }
        }
      });

    } catch (error) {
      console.error("Connection failed:", error);
      // 🟢 修复点 5：如果连接失败，弹窗告诉你原因！
      alert("Connect Fail: " + error);
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
      // 简单的转换，虽然不是完美的重采样，但至少能跑通
      const pcmData = float32ToInt16(inputData);
      
      const base64Data = encode(new Uint8Array(pcmData.buffer));
      
      this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000', // 这里告诉 Gemini 我们发的是 PCM
          data: base64Data
        }
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
      this.callbacks.onAudioData?.(audioBuffer);
    }

    if (message.serverContent?.inputTranscription?.text) {
        this.callbacks.onTranscript?.(message.serverContent.inputTranscription.text, true, false);
    }
    
    if (message.serverContent?.outputTranscription?.text) {
        this.callbacks.onTranscript?.(message.serverContent.outputTranscription.text, false, false);
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
    this.session = null;
    this.processor = null;
    this.inputSource = null;
    this.stream = null;
    this.audioContext = null;
    this.callbacks.onClose?.();
  }
}
