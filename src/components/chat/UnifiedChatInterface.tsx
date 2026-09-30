import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  X,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Search,
  Calculator,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Plus,
  Menu,
  Pin,
  Trash2,
  Clock,
  Globe,
  Sun,
  Moon,
  Heart,
  ChevronDown,
  Edit2,
  Play,
  ArrowRight,
  Code2,
  HelpCircle,
  Folder,
} from 'lucide-react';
import {
  Conversation,
  Message,
  Attachment,
  ToolInvocation,
  SourceCitation,
  LanguageDialect,
} from '../../types';
import { api } from '../../services/api';
import { MarkdownContent } from './MarkdownContent';
import { speechHandler } from '../../utils/speech';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface UnifiedChatInterfaceProps {
  onOpenStudy: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenAuth: () => void;
}

export const UnifiedChatInterface: React.FC<UnifiedChatInterfaceProps> = ({
  onOpenStudy,
  onOpenSettings,
  onOpenAbout,
  onOpenAuth,
}) => {
  const { user, settings, updateSettings } = useAuth();
  const { isDark, setTheme } = useTheme();

  // Conversations & active state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchConvQuery, setSearchConvQuery] = useState('');

  // Chat inputs & states
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState<ToolInvocation[]>([]);
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [studyScaffoldLevel, setStudyScaffoldLevel] = useState<number | undefined>(undefined);
  const [forceTool, setForceTool] = useState<'search' | 'calculator' | undefined>(undefined);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const dialectLabels: Record<LanguageDialect, { title: string; flag: string }> = {
    egyptian: { title: 'مصري', flag: '🇪🇬' },
    msa: { title: 'فصحى', flag: '📜' },
    english: { title: 'EN', flag: '🌐' },
    franco: { title: 'Franco', flag: '💬' },
  };

  const currentDialect = settings?.language || 'egyptian';

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0 && !activeConversationId) {
        setActiveConversationId(res.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load active conversation messages
  const loadMessages = async (convId: string) => {
    try {
      const res = await api.getConversation(convId);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages for conversation:', err);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, activeTools]);

  // Create brand new chat
  const handleNewChat = async () => {
    try {
      const res = await api.createConversation('محادثة جديدة');
      setConversations((prev) => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setMessages([]);
      setInputText('');
      setAttachments([]);
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
      const fallbackId = 'conv_' + Date.now();
      setActiveConversationId(fallbackId);
      setMessages([]);
    }
  };

  // Switch conversation
  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setSidebarOpen(false);
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه المحادثة؟')) {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    }
  };

  // Toggle pin
  const handleTogglePin = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await api.updateConversation(c.id, { pinned: !c.pinned });
    setConversations((prev) =>
      prev.map((item) => (item.id === c.id ? updated.conversation : item))
    );
  };

  // Send message
  const handleSend = (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText;
    if ((!textToSend.trim() && attachments.length === 0) || isStreaming) return;

    setInputText('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsStreaming(true);
    setStreamingText('');
    setActiveTools([]);
    setStreamingSources([]);

    // Temporary optimistic user message
    const tempUserMsg: Message = {
      id: 'temp_' + Date.now(),
      conversationId: activeConversationId,
      role: 'user',
      content: textToSend,
      attachments: currentAttachments,
      studyScaffoldLevel,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    api.streamChat({
      conversationId: activeConversationId,
      content: textToSend,
      attachments: currentAttachments,
      studyScaffoldLevel,
      forceTool,
      signal: abortController.signal,
      onToolResult: (tool) => {
        setActiveTools((prev) => [...prev, tool]);
      },
      onChunk: (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      onSources: (sources) => {
        setStreamingSources(sources);
      },
      onDone: (data) => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...filtered,
            data.userMessage,
            { ...data.assistantMessage, sources: data.sources },
          ];
        });
        setIsStreaming(false);
        setStreamingText('');
        setActiveTools([]);
        setStreamingSources([]);
        loadConversations();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setActiveTools([]);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            conversationId: activeConversationId,
            role: 'assistant',
            content: `⚠️ ${errMsg}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      },
    });
  };

  // Stop generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (streamingText) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'stopped_' + Date.now(),
            conversationId: activeConversationId,
            role: 'assistant',
            content: streamingText + ' [تم إيقاف الرد]',
            toolInvocations: activeTools,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setStreamingText('');
      setActiveTools([]);
    }
  };

  // Continue response
  const handleContinue = () => {
    handleSend('تابع واكمل الشرح من النقطة الأخيرة بالتفصيل.');
  };

  // Regenerate last response
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  // Copy text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to Speech
  const handleSpeak = (id: string, text: string) => {
    if (isSpeakingId === id) {
      speechHandler.stopSpeaking();
      setIsSpeakingId(null);
    } else {
      setIsSpeakingId(id);
      const rate = settings?.voiceRate || 1.0;
      const pitch = settings?.voicePitch || 1.0;
      speechHandler.speak(text, 'ar-EG', rate, pitch);
    }
  };

  // Voice Speech to Text
  const toggleListening = () => {
    if (isListening) {
      speechHandler.stopListening();
      setIsListening(false);
    } else {
      speechHandler.startListening(
        'ar-EG',
        (res) => {
          setInputText(res.transcript);
          if (res.isFinal) {
            setIsListening(false);
          }
        },
        (err) => {
          console.error(err);
          setIsListening(false);
        }
      );
      setIsListening(true);
    }
  };

  // File upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        alert('حجم الملف كبير، الحد الأقصى 20 ميجابايت');
        return;
      }
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv');

      if (isImg || isPdf) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
              size: file.size,
              dataUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isTxt) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              extractedText: reader.result as string,
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now(),
              name: file.name,
              type: file.type,
              size: file.size,
              extractedText: `[مستند: ${file.name}]`,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Suggested Prompts for Home Screen
  const suggestedPrompts = [
    {
      category: 'برمجة وتقنية',
      icon: Code2,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      title: 'اشرحلي مفهوم الـ API',
      prompt: 'ممكن تشرحلي يعني ايه API بالعامية المصرية وبمثال عملي من الواقع؟',
    },
    {
      category: 'مذاكرة وتلخيص',
      icon: GraduationCap,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      title: 'ذاكر واشرحلي درس',
      prompt: 'عايزك تساعدني في مذاكرة وفهم موضوع علمي بنظام تدرج تربوي يبدأ بتلميح ثم شرح الفكرة.',
    },
    {
      category: 'بحث ومعلومات',
      icon: Search,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      title: 'ابحث عن أحدث الأخبار',
      prompt: 'ابحثلي عن آخر أخبار الذكاء الاصطناعي والتطورات التقنية مع ذكر المصادر.',
    },
    {
      category: 'تنظيم وتخطيط',
      icon: Sparkles,
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      title: 'نظم جدول يومي ذكي',
      prompt: 'ساعدني في تنظيم روتيني اليومي بين المذاكرة، العمل، والرياضة بطريقة عملية ومرنة.',
    },
  ];

  // Filter conversations in sidebar
  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchConvQuery.toLowerCase()) ||
      (c.lastMessagePreview &&
        c.lastMessagePreview.toLowerCase().includes(searchConvQuery.toLowerCase()))
  );

  return (
    <div className="relative flex h-screen w-full overflow-hidden text-slate-100">
      {/* ===================== SIDEBAR DRAWER ===================== */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 md:w-80 backdrop-blur-2xl bg-slate-950/92 border-l border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top of Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow">
                مـ
              </div>
              <span className="font-bold text-sm text-slate-100 font-sans">
                سجل المحادثات
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </button>

          {/* Search Conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchConvQuery}
              onChange={(e) => setSearchConvQuery(e.target.value)}
              placeholder="ابحث في السجل..."
              className="w-full pl-3 pr-8 py-2 rounded-xl glass-card text-xs text-slate-200 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Conversations List */}
          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredConversations.map((c) => {
              const isActive = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-amber-400" />
                    <span className="truncate">{c.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleTogglePin(c, e)}
                      className={`p-1 rounded hover:bg-slate-800 ${
                        c.pinned ? 'text-amber-400' : 'text-slate-400'
                      }`}
                      title={c.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500">
                لا توجد محادثات مطابقة.
              </div>
            )}
          </div>
        </div>

        {/* Bottom of Sidebar */}
        <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
          <button
            onClick={() => {
              setSidebarOpen(false);
              onOpenStudy();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-slate-900 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>نظام المذاكرة والاختبارات</span>
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-slate-900 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>الإعدادات والذاكرة</span>
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              onOpenAbout();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-colors font-medium"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>عن MIZAN AI 🇪🇬</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* ===================== MAIN CHAT WORKSPACE ===================== */}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Floating Glass Header */}
        <header className="relative z-30 flex items-center justify-between px-4 py-2.5 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="سجل المحادثات"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo & Egyptian Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
                مـ
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-sans">
                    MIZAN AI
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">صنع في مصر 🇪🇬</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              title="محادثة جديدة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>

            {/* Dialect Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all"
                title="تغيير اللهجة"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{dialectLabels[currentDialect].flag}</span>
                <span className="hidden md:inline">{dialectLabels[currentDialect].title}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute left-0 mt-2 w-40 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50">
                  {(Object.keys(dialectLabels) as LanguageDialect[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        updateSettings({ language: d });
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-right flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                        currentDialect === d
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{dialectLabels[d].title}</span>
                      <span className="text-sm">{dialectLabels[d].flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Study Mode Shortcut */}
            <button
              onClick={onOpenStudy}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-400 transition-all cursor-pointer hidden sm:flex items-center justify-center"
              title="نظام المذاكرة والواجب التدريجي"
            >
              <GraduationCap className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="الإعدادات والذاكرة"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {/* About Abdelrahman Mohamed */}
            <button
              onClick={onOpenAbout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
              title="عن التطبيق والمطور"
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </button>
          </div>
        </header>

        {/* Message Scroll View */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* ================= CASE A: EMPTY STATE / WELCOMING HERO ================= */}
          {messages.length === 0 && (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 my-auto px-2 animate-in fade-in duration-500">
              {/* Emblem */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-3xl shadow-2xl shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300">
                  مـ
                </div>
                <div className="absolute -bottom-2 -left-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center gap-1 shadow-lg">
                  <span>🇪🇬</span>
                  <span>ميزان AI</span>
                </div>
              </div>

              {/* Welcoming Text */}
              <div className="space-y-2 max-w-lg">
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
                  أهلاً بك في MIZAN AI 👋
                </h1>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  مساعدك الشخصي الذكي الشامل — اسألني عن البرمجة، المذاكرة، حل الرياضيات، كتابة المحتوى، البحث المباشر، أو تنظيم يومك.
                </p>
              </div>

              {/* Suggested Prompts Grid */}
              <div className="w-full max-w-2xl pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                  {suggestedPrompts.map((sp, idx) => {
                    const Icon = sp.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(sp.prompt)}
                        className="group flex flex-col p-3.5 rounded-2xl glass-card hover:border-amber-500/50 transition-all text-right cursor-pointer hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-400">
                            {sp.category}
                          </span>
                          <div className={`p-1.5 rounded-lg border ${sp.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 mb-1">
                          {sp.title}
                        </span>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {sp.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= CASE B: CONVERSATION MESSAGES ================= */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Role header */}
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-medium">
                  <span>{isUser ? 'أنت' : 'MIZAN AI 🇪🇬'}</span>
                  {msg.studyScaffoldLevel && (
                    <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                      مستوى المساعدة {msg.studyScaffoldLevel}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[92%] md:max-w-[85%] rounded-2xl p-4 shadow-xl transition-all ${
                    isUser
                      ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/35 text-slate-100 rounded-tr-xs'
                      : 'liquid-glass text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 max-w-xs"
                        >
                          {att.dataUrl && att.type.startsWith('image/') ? (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <span className="text-xs truncate max-w-[120px] text-slate-300">
                            {att.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tool Invocations pills */}
                  {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.toolInvocations.map((tool, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-amber-300"
                        >
                          {tool.tool === 'calculator' && <Calculator className="w-3.5 h-3.5" />}
                          {tool.tool === 'search' && <Search className="w-3.5 h-3.5" />}
                          <span className="font-medium">
                            {tool.tool === 'calculator' && `حساب: ${tool.input} = ${tool.output}`}
                            {tool.tool === 'datetime' && `${tool.output}`}
                            {tool.tool === 'unit_converter' && `تحويل: ${tool.output}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Markdown Content */}
                  <MarkdownContent content={msg.content} />

                  {/* Citations & Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                        <Search className="w-3 h-3 text-amber-400" />
                        <span>المصادر والمراجع:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-[11px] transition-colors"
                          >
                            <span className="truncate max-w-[150px]">{s.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Action Toolbar */}
                <div className="flex items-center gap-1.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    title="نسخ الرسالة"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSpeak(msg.id, msg.content)}
                    className="p-1 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors"
                    title="استماع صوتي"
                  >
                    {isSpeakingId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {!isUser && (
                    <>
                      <button
                        onClick={handleContinue}
                        className="px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-[11px] transition-colors"
                        title="طلب تكملة الشرح"
                      >
                        تابع الشرح
                      </button>

                      <button
                        onClick={handleRegenerate}
                        className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="إعادة التوليد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live Streaming Assistant Output */}
          {isStreaming && (
            <div className="flex flex-col items-start animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-amber-400 font-medium">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>MIZAN AI بيكتب...</span>
              </div>

              <div className="relative max-w-[92%] md:max-w-[85%] rounded-2xl p-4 liquid-glass text-slate-100 rounded-tl-xs shadow-2xl border-amber-500/40">
                {activeTools.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeTools.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 animate-pulse"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{t.tool}: {t.output || 'جاري الفحص...'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {streamingText ? (
                  <MarkdownContent content={streamingText} />
                ) : (
                  <div className="flex items-center gap-2 py-1 text-slate-400 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs mr-2 font-medium">بيفكر ويفحص المعلومات...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar at Bottom */}
        <div className="relative z-20 p-3 md:p-4 bg-slate-950/75 backdrop-blur-2xl border-t border-slate-800/80 max-w-4xl mx-auto w-full">
          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700"
                >
                  {att.dataUrl && att.type.startsWith('image/') ? (
                    <img src={att.dataUrl} alt={att.name} className="w-6 h-6 object-cover rounded" />
                  ) : (
                    <FileText className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Tool Mode Selector Pills */}
          <div className="flex items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button
                onClick={() => setForceTool(forceTool === 'search' ? undefined : 'search')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  forceTool === 'search'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="تفعيل البحث المباشر في الويب"
              >
                <Search className="w-3 h-3 text-blue-400" />
                <span>بحث الويب</span>
              </button>

              <button
                onClick={() => setForceTool(forceTool === 'calculator' ? undefined : 'calculator')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  forceTool === 'calculator'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="تفعيل الآلة الحاسبة"
              >
                <Calculator className="w-3 h-3 text-amber-400" />
                <span>آلة حاسبة</span>
              </button>

              <button
                onClick={() => setStudyScaffoldLevel(studyScaffoldLevel ? undefined : 1)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  studyScaffoldLevel
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="مساعد المذاكرة التربوي"
              >
                <GraduationCap className="w-3 h-3 text-emerald-400" />
                <span>
                  {studyScaffoldLevel ? `مذاكرة (مستوى ${studyScaffoldLevel})` : 'مساعد المذاكرة'}
                </span>
              </button>
            </div>

            {isStreaming && (
              <button
                onClick={handleStop}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                <span>إيقاف الرد</span>
              </button>
            )}
          </div>

          {/* Liquid Glass Input Box */}
          <div className="relative flex items-center rounded-2xl liquid-glass p-1.5 shadow-2xl border border-slate-700/80 focus-within:border-amber-400/90 transition-all">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.docx,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="إرفاق صورة أو ملف (PDF, TXT, DOCX, CSV)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Microphone Button */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/80'
              }`}
              title={isListening ? 'جاري الاستماع...' : 'تحدث بالعامية المصرية'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Main Textarea */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                isListening
                  ? 'اتكلم، سامعك...'
                  : 'اسأل MIZAN AI أي حاجة... (Shift + Enter لسطر جديد)'
              }
              rows={1}
              className="flex-1 bg-transparent px-3 py-2 text-slate-100 placeholder-slate-400 text-sm md:text-base outline-none resize-none max-h-32 font-sans"
            />

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
                title="إيقاف الرد"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                title="إرسال"
              >
                <Send className="w-4 h-4 -rotate-90" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
