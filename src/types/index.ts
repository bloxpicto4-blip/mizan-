export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type LanguageDialect = 'egyptian' | 'msa' | 'english' | 'franco';
export type ResponseStyle = 'short' | 'balanced' | 'detailed';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserSettings {
  userId: string;
  language: LanguageDialect;
  responseStyle: ResponseStyle;
  theme: ThemeMode;
  voiceRate: number;
  voicePitch: number;
  enableMemory: boolean;
  progressiveStudy: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  extractedText?: string;
}

export interface SourceCitation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ToolInvocation {
  tool: 'search' | 'calculator' | 'datetime' | 'code' | 'document' | 'vision' | 'unit_converter';
  input?: any;
  output?: any;
  sources?: SourceCitation[];
  status: 'running' | 'success' | 'error';
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  toolInvocations?: ToolInvocation[];
  studyScaffoldLevel?: number;
  sources?: SourceCitation[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  folder?: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

export interface Memory {
  id: string;
  userId: string;
  key: string;
  content: string;
  createdAt: string;
}

export interface StudyFlashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySession {
  id: string;
  userId: string;
  title: string;
  subject: string;
  type: 'quiz' | 'flashcards' | 'summary' | 'scaffold';
  flashcards?: StudyFlashcard[];
  quizQuestions?: QuizQuestion[];
  score?: number;
  total?: number;
  createdAt: string;
}

export interface AdminConfig {
  aiProvider: 'gemini' | 'openai';
  model: string;
  temperature: number;
  maxOutputTokens: number;
  customSystemPrompt: string;
  enabledTools: {
    webSearch: boolean;
    calculator: boolean;
    codeAnalysis: boolean;
    imageUnderstanding: boolean;
    documentAnalysis: boolean;
    dateTime: boolean;
    unitConverter: boolean;
  };
  rateLimitPerMin: number;
  maintenanceMode: boolean;
}

export type ActiveTab = 'home' | 'chat' | 'study' | 'history' | 'settings' | 'about';

export type AICoreState = 'idle' | 'listening' | 'thinking' | 'generating' | 'finished';

export type RadialAction =
  | 'chat'
  | 'ask'
  | 'image'
  | 'camera'
  | 'files'
  | 'voice'
  | 'create'
  | 'search'
  | 'code'
  | 'study';

export interface AIShortcut {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  badge?: string;
}
