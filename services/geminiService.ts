import { GoogleGenAI, Modality } from "@google/genai";
import { AppLanguage } from "../types";
import { decode, decodeAudioData } from "./audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Singleton AudioContext to prevent browser limits
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const translateText = async (
  text: string,
  sourceLang: AppLanguage,
  targetLang: AppLanguage
): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translated text, no explanations. Text: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "Translation failed. Please try again.";
  }
};

export const synthesizeSpeech = async (text: string, lang: AppLanguage) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        await playAudio(base64Audio);
    }
  } catch (error) {
    console.error("TTS error:", error);
  }
};

const playAudio = async (base64EncodedAudioString: string) => {
    try {
        const ctx = getAudioContext();
        const outputNode = ctx.createGain();
        outputNode.connect(ctx.destination);
        
        const audioBuffer = await decodeAudioData(
            decode(base64EncodedAudioString),
            ctx,
            24000,
            1,
        );
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputNode);
        source.start();
    } catch (e) {
        console.error("Error playing audio", e);
    }
};
