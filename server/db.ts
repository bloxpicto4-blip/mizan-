import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  language: 'egyptian' | 'msa' | 'english' | 'franco';
  responseStyle: 'short' | 'balanced' | 'detailed';
  theme: 'dark' | 'light' | 'system';
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
  dataUrl?: string; // Base64 data for images or text preview
  extractedText?: string;
}

export interface ToolInvocation {
  tool: 'search' | 'calculator' | 'datetime' | 'code' | 'document' | 'vision' | 'unit_converter';
  input?: any;
  output?: any;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  status: 'running' | 'success' | 'error';
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  toolInvocations?: ToolInvocation[];
  studyScaffoldLevel?: number; // 1: Hint, 2: Concept, 3: First Step, 4: Solution, 5: Full Detail
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

export interface UsageLog {
  id: string;
  userId: string;
  action: string;
  tokensUsed?: number;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  settings: Record<string, UserSettings>;
  conversations: Conversation[];
  messages: Message[];
  memories: Memory[];
  studySessions: StudySession[];
  adminConfig: AdminConfig;
  usageLogs: UsageLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mizan_db.json');

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  aiProvider: 'gemini',
  model: 'gemini-3.1-flash-lite',
  temperature: 0.7,
  maxOutputTokens: 2048,
  customSystemPrompt: '',
  enabledTools: {
    webSearch: true,
    calculator: true,
    codeAnalysis: true,
    imageUnderstanding: true,
    documentAnalysis: true,
    dateTime: true,
    unitConverter: true,
  },
  rateLimitPerMin: 60,
  maintenanceMode: false,
};

// Seed guest user & sample conversation for instant readiness
const INITIAL_GUEST_USER: User = {
  id: 'guest_user_1',
  email: 'guest@mizan.ai',
  name: 'صديق ميزان',
  passwordHash: 'guest_password_mizan',
  role: 'user',
  createdAt: new Date().toISOString(),
};

const INITIAL_SETTINGS: UserSettings = {
  userId: 'guest_user_1',
  language: 'egyptian',
  responseStyle: 'balanced',
  theme: 'dark',
  voiceRate: 1.0,
  voicePitch: 1.0,
  enableMemory: true,
  progressiveStudy: true,
};

const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem_1',
    userId: 'guest_user_1',
    key: 'أسلوب الشرح المفضل',
    content: 'يفضل الأمثلة العملية الواقعية بالعامية المصرية مع مصطلحات تقنية إنجليزية واضحة.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem_2',
    userId: 'guest_user_1',
    key: 'الاهتمامات',
    content: 'مهتم بالبرمجة، وتطوير الويب، والتكنولوجيا، والمذاكرة الذكية.',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_CONVERSATION: Conversation = {
  id: 'conv_welcome',
  userId: 'guest_user_1',
  title: 'مرحبًا بك في MIZAN AI 🇪🇬',
  pinned: true,
  archived: false,
  folder: 'عام',
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
  lastMessagePreview: 'يا هلا بيك في ميزان! أنا هنا عشان أساعدك في أي حاجة تخطر على بالك...',
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_welcome_1',
    conversationId: 'conv_welcome',
    role: 'assistant',
    content: `يا هلا بيك في **MIZAN AI**! 🇪🇬✨

أنا مساعدك الشخصي الذكي، صُممت مخصوص عشان أكون جنبك في كل تفصيلة في يومك:

- 📚 **مذاكرة وشرح دروس:** بلخص، بعمل كروت استذكار (Flashcards)، واختبارات تفاعلية ذكية بنظام مساعدة تدريجي.
- 💻 **برمجة وتكنولوجيا:** بنكتب كود سوا، بنحلل أخطاء ونشرح أحدث التقنيات.
- 🔎 **بحث مباشر على الويب:** بجيبلك آخر الأخبار والأسعار والمعلومات المحدثة مع المصادر.
- 📸 **تحليل صور وملفات:** ارفع أي صورة، ملخص، PDF، أو مستند، وهفصصهولك كلمة كلمة.
- 📅 **تنظيم اليوم والأفكار:** تخطيط وإدارة مهامك ببساطة.

جاهز؟ اسألني أي حاجة تدور في بالك! 🚀`,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [INITIAL_GUEST_USER],
          settings: parsed.settings || { [INITIAL_GUEST_USER.id]: INITIAL_SETTINGS },
          conversations: parsed.conversations || [INITIAL_CONVERSATION],
          messages: parsed.messages || INITIAL_MESSAGES,
          memories: parsed.memories || INITIAL_MEMORIES,
          studySessions: parsed.studySessions || [],
          adminConfig: { ...DEFAULT_ADMIN_CONFIG, ...(parsed.adminConfig || {}) },
          usageLogs: parsed.usageLogs || [],
        };
      }
    } catch (err) {
      console.error('Failed to load database from disk, using defaults:', err);
    }

    return {
      users: [INITIAL_GUEST_USER],
      settings: { [INITIAL_GUEST_USER.id]: INITIAL_SETTINGS },
      conversations: [INITIAL_CONVERSATION],
      messages: INITIAL_MESSAGES,
      memories: INITIAL_MEMORIES,
      studySessions: [],
      adminConfig: DEFAULT_ADMIN_CONFIG,
      usageLogs: [],
    };
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    if (!this.data.settings[user.id]) {
      this.data.settings[user.id] = {
        userId: user.id,
        language: 'egyptian',
        responseStyle: 'balanced',
        theme: 'dark',
        voiceRate: 1.0,
        voicePitch: 1.0,
        enableMemory: true,
        progressiveStudy: true,
      };
    }
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (user) {
      Object.assign(user, updates);
      this.save();
    }
    return user;
  }

  // Settings
  getUserSettings(userId: string): UserSettings {
    if (!this.data.settings[userId]) {
      this.data.settings[userId] = {
        userId,
        language: 'egyptian',
        responseStyle: 'balanced',
        theme: 'dark',
        voiceRate: 1.0,
        voicePitch: 1.0,
        enableMemory: true,
        progressiveStudy: true,
      };
      this.save();
    }
    return this.data.settings[userId];
  }

  updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings(userId);
    this.data.settings[userId] = { ...current, ...updates };
    this.save();
    return this.data.settings[userId];
  }

  // Conversations
  getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  getConversation(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id && c.userId === userId);
  }

  createConversation(conv: Conversation): Conversation {
    this.data.conversations.unshift(conv);
    this.save();
    return conv;
  }

  updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.getConversation(id, userId);
    if (conv) {
      Object.assign(conv, updates, { updatedAt: new Date().toISOString() });
      this.save();
    }
    return conv;
  }

  deleteConversation(id: string, userId: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter((c) => !(c.id === id && c.userId === userId));
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    if (this.data.conversations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Messages
  getMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage(message: Message): Message {
    this.data.messages.push(message);
    const conv = this.data.conversations.find((c) => c.id === message.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      conv.lastMessagePreview = message.content.slice(0, 120);
    }
    this.save();
    return message;
  }

  updateMessage(messageId: string, content: string): Message | undefined {
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.content = content;
      this.save();
    }
    return msg;
  }

  deleteMessage(messageId: string): boolean {
    const initialLen = this.data.messages.length;
    this.data.messages = this.data.messages.filter((m) => m.id !== messageId);
    if (this.data.messages.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Memories
  getMemories(userId: string): Memory[] {
    return this.data.memories.filter((m) => m.userId === userId);
  }

  addMemory(memory: Memory): Memory {
    this.data.memories.push(memory);
    this.save();
    return memory;
  }

  deleteMemory(id: string, userId: string): boolean {
    const initialLen = this.data.memories.length;
    this.data.memories = this.data.memories.filter((m) => !(m.id === id && m.userId === userId));
    if (this.data.memories.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Study Sessions
  getStudySessions(userId: string): StudySession[] {
    return this.data.studySessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addStudySession(session: StudySession): StudySession {
    this.data.studySessions.unshift(session);
    this.save();
    return session;
  }

  // Admin Config & Usage
  getAdminConfig(): AdminConfig {
    return this.data.adminConfig;
  }

  updateAdminConfig(updates: Partial<AdminConfig>): AdminConfig {
    this.data.adminConfig = { ...this.data.adminConfig, ...updates };
    this.save();
    return this.data.adminConfig;
  }

  logUsage(userId: string, action: string, tokensUsed = 0): void {
    this.data.usageLogs.push({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId,
      action,
      tokensUsed,
      timestamp: new Date().toISOString(),
    });
    // Keep max 1000 logs
    if (this.data.usageLogs.length > 1000) {
      this.data.usageLogs = this.data.usageLogs.slice(-1000);
    }
    this.save();
  }

  getUsageStats(): { totalMessages: number; totalUsers: number; totalConversations: number; toolInvocations: number } {
    return {
      totalMessages: this.data.messages.length,
      totalUsers: this.data.users.length,
      totalConversations: this.data.conversations.length,
      toolInvocations: this.data.usageLogs.length,
    };
  }
}

export const db = new Database();
