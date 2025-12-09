import { GoogleGenAI } from "@google/genai";
import { AppLanguage } from "../types";

// 🔴 同样填入你的真 Key
const API_KEY = "AIzaSyDyTqBSuUsS6ksJ4r4gNH3yaeo393X4qnVU"; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const translateText = async (
  text: string,
  sourceLang: AppLanguage,
  targetLang: AppLanguage
): Promise<string> => {
  if (!text.trim()) return "";

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // 构建提示词
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
    Only output the translated text, no explanations.
    
    Text: ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Text Translation Error:", error);
    return "翻译失败，请检查网络或 Key。";
  }
};
