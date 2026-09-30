import {
  Attachment,
  Conversation,
  Memory,
  Message,
  SourceCitation,
  StudySession,
  ToolInvocation,
  User,
  UserSettings,
  AdminConfig,
} from '../types';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('mizan_token') || 'guest_user_1';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تسجيل الدخول');
    }
    return res.json();
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء الحساب');
    }
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('فشل جلب بيانات المستخدم');
    return res.json();
  },

  async updateProfile(name: string, avatar?: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({ name, avatar }),
    });
    return res.json();
  },

  // Settings
  async getSettings(): Promise<{ settings: UserSettings }> {
    const res = await fetch('/api/settings', { headers: getAuthHeader() });
    return res.json();
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Memories
  async getMemories(): Promise<{ memories: Memory[] }> {
    const res = await fetch('/api/memories', { headers: getAuthHeader() });
    return res.json();
  },

  async addMemory(key: string, content: string): Promise<{ memory: Memory }> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ key, content }),
    });
    return res.json();
  },

  async deleteMemory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await fetch('/api/conversations', { headers: getAuthHeader() });
    return res.json();
  },

  async createConversation(title?: string, folder?: string): Promise<{ conversation: Conversation }> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ title, folder }),
    });
    return res.json();
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('المحادثة غير موجودة');
    return res.json();
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<{ conversation: Conversation }> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  async deleteMessage(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return res.json();
  },

  // SSE Stream Chat
  streamChat(params: {
    conversationId: string;
    content: string;
    attachments?: Attachment[];
    studyScaffoldLevel?: number;
    forceTool?: 'search' | 'calculator';
    signal?: AbortSignal;
    onToolResult?: (tool: ToolInvocation) => void;
    onChunk: (chunk: string) => void;
    onSources?: (sources: SourceCitation[]) => void;
    onDone: (data: { userMessage: Message; assistantMessage: Message; sources?: SourceCitation[] }) => void;
    onError: (err: string) => void;
  }) {
    const token = localStorage.getItem('mizan_token') || 'guest_user_1';

    fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: params.conversationId,
        content: params.content,
        attachments: params.attachments,
        studyScaffoldLevel: params.studyScaffoldLevel,
        forceTool: params.forceTool,
      }),
      signal: params.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('فشل بدء الإرسال');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('لا يوجد مدخل بيانات');

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            let event = 'message';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                event = line.replace('event: ', '').trim();
              } else if (line.startsWith('data: ')) {
                data = line.replace('data: ', '').trim();
              }
            }

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              if (event === 'chunk') {
                params.onChunk(parsed.text || '');
              } else if (event === 'tool_result') {
                params.onToolResult?.(parsed);
              } else if (event === 'sources') {
                params.onSources?.(parsed);
              } else if (event === 'done') {
                params.onDone(parsed);
              } else if (event === 'error') {
                params.onError(parsed.message || 'حصلت مشكلة بسيطة، جرّب تاني.');
              }
            } catch (err) {
              console.warn('SSE JSON parse chunk skip:', err);
            }
          }
        }

        // Process any remaining trailing buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          let event = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              event = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              data = line.replace('data: ', '').trim();
            }
          }
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (event === 'chunk') {
                params.onChunk(parsed.text || '');
              } else if (event === 'done') {
                params.onDone(parsed);
              } else if (event === 'sources') {
                params.onSources?.(parsed);
              }
            } catch (err) {
              // Benign trailing partial segment
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          params.onError('حصلت مشكلة بسيطة، جرّب تاني.');
        }
      });
  },

  // Study Mode
  async generateQuiz(topic: string, count = 5): Promise<{ session: StudySession }> {
    const res = await fetch('/api/study/generate-quiz', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ topic, count }),
    });
    if (!res.ok) throw new Error('فشل إنشاء الاختبار');
    return res.json();
  },

  async generateFlashcards(topic: string, count = 6): Promise<{ session: StudySession }> {
    const res = await fetch('/api/study/generate-flashcards', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ topic, count }),
    });
    if (!res.ok) throw new Error('فشل إنشاء البطاقات');
    return res.json();
  },

  async summarizeLesson(content: string): Promise<{ summary: string }> {
    const res = await fetch('/api/study/summarize', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('فشل التلخيص');
    return res.json();
  },

  async getStudySessions(): Promise<{ sessions: StudySession[] }> {
    const res = await fetch('/api/study/sessions', { headers: getAuthHeader() });
    return res.json();
  },

  // Admin
  async getAdminConfig(): Promise<{ config: AdminConfig }> {
    const res = await fetch('/api/admin/config', { headers: getAuthHeader() });
    return res.json();
  },

  async updateAdminConfig(config: Partial<AdminConfig>): Promise<{ config: AdminConfig }> {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getAdminStats(): Promise<{ stats: any }> {
    const res = await fetch('/api/admin/stats', { headers: getAuthHeader() });
    return res.json();
  },
};
