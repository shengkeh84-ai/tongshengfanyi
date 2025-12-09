export enum AppLanguage {
  ZH = 'ZH',
  EN = 'EN',
  RU = 'RU'
}

export interface TranslationResource {
  appTitle: string;
  tabConversation: string;
  tabText: string;
  tabCall: string; // New
  tabSettings: string;
  offlineMode: string;
  offlineDesc: string;
  downloadPacks: string;
  downloaded: string;
  download: string;
  settings: string;
  selectSource: string;
  selectTarget: string;
  holdToSpeak: string;
  listening: string;
  processing: string;
  history: string;
  clearHistory: string;
  sourceLang: string;
  targetLang: string;
  inputPlaceholder: string;
  translateBtn: string;
  // Call specific
  enterContact: string;
  call: string;
  calling: string;
  connected: string;
  endCall: string;
  mute: string;
  speaker: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  translation: string;
  sender: 'user' | 'partner';
  originalLang: AppLanguage;
  timestamp: number;
}