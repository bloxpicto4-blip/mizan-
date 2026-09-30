import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, User } from './server/db.js';
import { aiService, analyzeToolNeed, buildSystemPrompt } from './server/ai-service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers with support for base64 image/file uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Simple Auth & Session Middleware
// In a full production app this verifies JWTs; here we support bearer tokens & user IDs seamlessly
function authenticate(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  let userId = 'guest_user_1';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token !== 'null' && token !== 'undefined') {
      userId = token;
    }
  }

  // Ensure user exists
  let user = db.getUserById(userId);
  if (!user) {
    user = db.getUserById('guest_user_1');
  }

  (req as any).user = user;
  next();
}

// ======================== API ROUTES ========================

// 1. Auth Routes
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'الرجاء إدخال جميع البيانات المطلوبة' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      passwordHash: password, // In production: bcrypt hash
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);
    return res.json({ user: newUser, token: newUser.id });
  } catch (err) {
    return res.status(500).json({ error: 'حصلت مشكلة بسيطة، جرّب تاني.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    return res.json({ user, token: user.id });
  } catch (err) {
    return res.status(500).json({ error: 'حصلت مشكلة بسيطة، جرّب تاني.' });
  }
});

app.post('/api/auth/guest', (_req: Request, res: Response) => {
  const guest = db.getUserById('guest_user_1');
  return res.json({ user: guest, token: 'guest_user_1' });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  return res.json({ user });
});

app.put('/api/auth/profile', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, avatar } = req.body;
  const updated = db.updateUser(user.id, { name, avatar });
  return res.json({ user: updated });
});

// 2. Settings Routes
app.get('/api/settings', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const settings = db.getUserSettings(user.id);
  return res.json({ settings });
});

app.put('/api/settings', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const updated = db.updateUserSettings(user.id, req.body);
  return res.json({ settings: updated });
});

// 3. Memories Routes
app.get('/api/memories', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const memories = db.getMemories(user.id);
  return res.json({ memories });
});

app.post('/api/memories', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { key, content } = req.body;
  if (!key || !content) {
    return res.status(400).json({ error: 'الرجاء إدخال العنوان والمحتوى' });
  }
  const mem = db.addMemory({
    id: 'mem_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    key,
    content,
    createdAt: new Date().toISOString(),
  });
  return res.json({ memory: mem });
});

app.delete('/api/memories/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const success = db.deleteMemory(req.params.id, user.id);
  return res.json({ success });
});

// 4. Conversations Routes
app.get('/api/conversations', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversations = db.getConversations(user.id);
  return res.json({ conversations });
});

app.post('/api/conversations', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title = 'محادثة جديدة', folder } = req.body;
  const newConv = db.createConversation({
    id: 'conv_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    title,
    pinned: false,
    archived: false,
    folder: folder || 'عام',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return res.json({ conversation: newConv });
});

app.get('/api/conversations/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = db.getConversation(req.params.id, user.id);
  if (!conversation) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }
  const messages = db.getMessages(conversation.id);
  return res.json({ conversation, messages });
});

app.put('/api/conversations/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const updated = db.updateConversation(req.params.id, user.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'المحادثة غير موجودة' });
  }
  return res.json({ conversation: updated });
});

app.delete('/api/conversations/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const success = db.deleteConversation(req.params.id, user.id);
  return res.json({ success });
});

// Delete individual message
app.delete('/api/messages/:id', authenticate, (_req: Request, res: Response) => {
  const success = db.deleteMessage(_req.params.id);
  return res.json({ success });
});

// 5. Chat Streaming Route (SSE - Server Sent Events)
app.post('/api/chat/stream', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    conversationId,
    content,
    attachments = [],
    studyScaffoldLevel,
    forceTool,
  } = req.body;

  if (!conversationId || (!content && attachments.length === 0)) {
    return res.status(400).json({ error: 'الرسالة أو المرفقات مطلوبة' });
  }

  // Ensure conversation exists or create it
  let conv = db.getConversation(conversationId, user.id);
  if (!conv) {
    conv = db.createConversation({
      id: conversationId,
      userId: user.id,
      title: content ? content.slice(0, 30) : 'تحليل مستند / صورة',
      pinned: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Save User Message
  const userMessage = db.addMessage({
    id: 'msg_' + Math.random().toString(36).substring(2, 9),
    conversationId,
    role: 'user',
    content: content || (attachments.length ? 'تحليل المرفقات' : ''),
    attachments,
    studyScaffoldLevel,
    createdAt: new Date().toISOString(),
  });

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Check user settings & memories
  const settings = db.getUserSettings(user.id);
  const memories = db.getMemories(user.id);
  const adminConfig = db.getAdminConfig();

  // Analyze tools
  const toolDecision = analyzeToolNeed(content || '');
  if (forceTool === 'search') toolDecision.needsWebSearch = true;
  if (forceTool === 'calculator') toolDecision.needsCalculator = true;

  // Execute local fast tools (calculator, date/time, unit converter)
  const { toolInvocations, contextAdditions } = await aiService.executeLocalTools(toolDecision);

  for (const inv of toolInvocations) {
    sendEvent('tool_start', { tool: inv.tool, status: 'running' });
    sendEvent('tool_result', inv);
  }

  // Build system prompt & prompt augmentation
  const systemInstruction = buildSystemPrompt(settings, memories, adminConfig.customSystemPrompt);

  let augmentedPrompt = content;
  if (contextAdditions.length > 0) {
    augmentedPrompt += `\n\n[نتائج الأدوات المساعدة]:\n${contextAdditions.join('\n')}`;
  }

  // Fetch recent messages for conversational context
  const previousMessages = db.getMessages(conversationId)
    .filter((m) => m.id !== userMessage.id)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  let fullAssistantResponse = '';
  let finalSources: Array<{ title: string; url: string }> = [];

  try {
    const stream = aiService.streamChat({
      prompt: augmentedPrompt,
      systemInstruction,
      attachments,
      conversationHistory: previousMessages,
      enableSearchGrounding: toolDecision.needsWebSearch && adminConfig.enabledTools.webSearch,
      studyScaffoldLevel,
    });

    for await (const chunkObj of stream) {
      if (chunkObj.type === 'chunk') {
        fullAssistantResponse += chunkObj.data;
        sendEvent('chunk', { text: chunkObj.data });
      } else if (chunkObj.type === 'sources') {
        finalSources = chunkObj.data;
        sendEvent('sources', chunkObj.data);
      }
    }

    // Save Assistant message to Database if generated
    if (fullAssistantResponse.trim()) {
      const assistantMessage = db.addMessage({
        id: 'msg_' + Math.random().toString(36).substring(2, 9),
        conversationId,
        role: 'assistant',
        content: fullAssistantResponse,
        toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
        studyScaffoldLevel,
        createdAt: new Date().toISOString(),
      });

      db.logUsage(user.id, 'chat_turn');

      sendEvent('done', {
        userMessage,
        assistantMessage,
        sources: finalSources,
      });
    } else {
      sendEvent('error', { message: 'حصلت مشكلة بسيطة، جرّب تاني.' });
    }
  } catch (err: any) {
    console.error('Streaming error in chat route:', err);
    if (!fullAssistantResponse.trim()) {
      sendEvent('error', { message: 'حصلت مشكلة بسيطة، جرّب تاني.' });
    }
  } finally {
    res.end();
  }
});

// 6. Study Mode Routes
app.post('/api/study/generate-quiz', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { topic, count = 5 } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'الموضوع مطلوب' });
  }

  try {
    const quizData = await aiService.generateQuiz(topic, count);
    const session = db.addStudySession({
      id: 'study_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      title: quizData.title || `اختبار: ${topic}`,
      subject: topic,
      type: 'quiz',
      quizQuestions: quizData.questions || [],
      createdAt: new Date().toISOString(),
    });
    return res.json({ session });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    return res.status(500).json({ error: 'تعذر إنشاء الاختبار حاليًا، جرّب تاني.' });
  }
});

app.post('/api/study/generate-flashcards', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { topic, count = 6 } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'الموضوع مطلوب' });
  }

  try {
    const cardData = await aiService.generateFlashcards(topic, count);
    const session = db.addStudySession({
      id: 'study_' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      title: `بطاقات: ${topic}`,
      subject: topic,
      type: 'flashcards',
      flashcards: cardData.flashcards || [],
      createdAt: new Date().toISOString(),
    });
    return res.json({ session });
  } catch (err: any) {
    console.error('Flashcard generation error:', err);
    return res.status(500).json({ error: 'تعذر إنشاء البطاقات، جرّب تاني.' });
  }
});

app.post('/api/study/summarize', authenticate, async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'المحتوى مطلوب' });
  }

  try {
    const summary = await aiService.summarizeContent(content);
    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: 'حصلت مشكلة بسيطة في التلخيص، جرّب تاني.' });
  }
});

app.get('/api/study/sessions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const sessions = db.getStudySessions(user.id);
  return res.json({ sessions });
});

// 7. Admin Config & Stats Routes
app.get('/api/admin/config', authenticate, (req: Request, res: Response) => {
  const config = db.getAdminConfig();
  return res.json({ config });
});

app.put('/api/admin/config', authenticate, (req: Request, res: Response) => {
  const updated = db.updateAdminConfig(req.body);
  return res.json({ config: updated });
});

app.get('/api/admin/stats', authenticate, (_req: Request, res: Response) => {
  const stats = db.getUsageStats();
  return res.json({ stats });
});

// ======================== SERVER & VITE SETUP ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 MIZAN AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
