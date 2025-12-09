import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AppLanguage } from "../types";

// ==========================================================
// 🔴 必填区：请把你的 API Key 填在引号里，不要有空格！
// ==========================================================
const API_KEY = "AIzaSyDyTqBSuUsS6ksJ4r4gNH3yaeo393X4qnVU"; 
// (上面这串是你之前截图里的 Key，如果不对请换成你最新的)

const MODEL_NAME = "gemini-2.0-flash-exp"; 
// (这是目前唯一能用的模型，千万别改！)

// ==========================================================
// 🛠️ 内置工具区 (原本在 audioUtils 里，现在搬过来防止报错)
// ==========================================================
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

function base64Encode(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// ==========================================================
// 🧠 核心逻辑区
// ==========================================================
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
  private aiClient: GoogleGenAI;

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;
    this.aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }

  public async connect(sourceLang: AppLanguage, targetLang: AppLanguage) {
    if (this.isConnected) return;
    
    // 🔔 调试弹窗：告诉用户开始连接了
    // alert("正在尝试连接谷歌服务器..."); 

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.session = await this.aiClient.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a translator. Translate between ${sourceLang} and ${targetLang}.`,
        },
        callbacks: {
          onopen: () => {
            // 🔔 调试弹窗：连接成功！
            // alert("连接成功！请说话！");
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
            // 🔴 错误弹窗：最重要的部分！
            alert("发生错误: " + JSON.stringify(err));
            console.error(err);
            this.callbacks.onError?.(err);
          }
        }
      });

    } catch (error) {
      // 🔴 错误弹窗：捕捉连接阶段的错误
      alert("连接失败 (Catch): " + String(error));
      console.error(error);
      this.disconnect();
    }
  }

  private startAudioStreaming() {
    if (!this.audioContext || !this.stream || !this.session) return;

    this.inputSource = this.audioContext.createMediaStreamSource(this.stream);
    // 使用 4096 缓冲区，兼容性更好
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = float32ToInt16(inputData);
      const base64Data = base64Encode(pcmData.buffer);
      
      this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=' + this.audioContext?.sampleRate, 
          data: base64Data
        }
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // 处理音频返回
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      try {
        // 解码 Base64
        const binaryString = window.atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // 简单解码，虽然可能有采样率问题，但起码能听到声音
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        this.callbacks.onAudioData?.(audioBuffer);
      } catch (e) {
        console.error("Audio Decode Error", e);
      }
    }

    // 处理文字返回
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
    if (this.inputSource) this.inputSource.disconnect();
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.audioContext) this.audioContext.close();
    
    this.session = null;
    this.callbacks.onClose?.();
  }
}
