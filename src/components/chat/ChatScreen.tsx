import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
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
  Edit2,
  Trash2,
  Pin,
} from 'lucide-react';
import { Conversation, Message, Attachment, ToolInvocation, SourceCitation } from '../../types';
import { api } from '../../services/api';
import { MarkdownContent } from './MarkdownContent';
import { speechHandler } from '../../utils/speech';
import { useAuth } from '../../context/AuthContext';

interface ChatScreenProps {
  conversationId: string;
  initialPrompt?: string;
  onConversationUpdated?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  initialPrompt,
  onConversationUpdated,
}) => {
  const { settings } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
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
  const [editText, setEditText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation and messages
  useEffect(() => {
    if (!conversationId) return;
    api.getConversation(conversationId)
      .then((res) => {
        setConversation(res.conversation);
        setMessages(res.messages);
      })
      .catch((err) => console.error(err));
  }, [conversationId]);

  // Handle auto-send if initialPrompt was passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && messages.length === 0 && !isStreaming) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, activeTools]);

  // Send message handler
  const handleSend = (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if ((!textToSend.trim() && attachments.length === 0) || isStreaming) return;

    setInputText('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsStreaming(true);
    setStreamingText('');
    setActiveTools([]);
    setStreamingSources([]);

    // Optimistically add user message to list
    const tempUserMsg: Message = {
      id: 'temp_' + Date.now(),
      conversationId,
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
      conversationId,
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
          // Replace temp with real saved messages
          const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
          return [...filtered, data.userMessage, { ...data.assistantMessage, sources: data.sources }];
        });
        setIsStreaming(false);
        setStreamingText('');
        setActiveTools([]);
        setStreamingSources([]);
        onConversationUpdated?.();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setActiveTools([]);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            conversationId,
            role: 'assistant',
            content: `⚠️ ${errMsg}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      },
    });
  };

  // Stop Generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (streamingText) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'stopped_' + Date.now(),
            conversationId,
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

  // Copy message
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

  // Voice Input (Speech to Text)
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

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Max 15MB
      if (file.size > 15 * 1024 * 1024) {
        alert('حجم الملف كبير جدًا، الحد الأقصى 15 ميجابايت');
        return;
      }

      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv');

      if (isImg || isPdf) {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
              size: file.size,
              dataUrl,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isTxt) {
        reader.onload = () => {
          const text = reader.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              extractedText: text,
            },
          ]);
        };
        reader.readAsText(file);
      } else {
        // Fallback generic file read
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now(),
              name: file.name,
              type: file.type,
              size: file.size,
              extractedText: `[ملف: ${file.name}]`,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    await api.deleteMessage(msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full">
      {/* Chat Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-sm text-slate-200 truncate">
            {conversation?.title || 'محادثة ذكية'}
          </span>
          {conversation?.folder && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {conversation.folder}
            </span>
          )}
        </div>

        {/* Study Level Quick Selector */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <button
              onClick={() =>
                setStudyScaffoldLevel(studyScaffoldLevel ? undefined : 1)
              }
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                studyScaffoldLevel
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="نظام المذاكرة التربوي: تلميحات وشرح تدريجي بدلاً من إعطاء الحل المباشر"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {studyScaffoldLevel ? `مذاكرة: مستوى ${studyScaffoldLevel}` : 'وضع المذاكرة'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100 font-sans">
                لسه مفيش رسائل في المحادثة دي
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                ابدأ واسأل MIZAN AI عن أي حاجة، أو ارفع صورة لمسألة، أو اطلب تلخيص ملف، أو ابحث في الويب!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Role badge */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                <span>{isUser ? 'أنت' : 'MIZAN AI 🇪🇬'}</span>
                {msg.studyScaffoldLevel && (
                  <span className="text-[10px] text-emerald-400 font-medium px-1.5 py-0.2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                    مستوى المساعدة {msg.studyScaffoldLevel}
                  </span>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`relative max-w-[90%] md:max-w-[80%] rounded-2xl p-4 shadow-lg transition-all ${
                  isUser
                    ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-slate-100 rounded-tr-xs'
                    : 'glass-panel text-slate-100 rounded-tl-xs'
                }`}
              >
                {/* Attachments preview inside message */}
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
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-xs truncate max-w-[120px] text-slate-300">
                          {att.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tool Invocations pills (Calculator, Search, Datetime) */}
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

                {/* Main Content Markdown */}
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

              {/* Message Action Bar */}
              <div className="flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs">
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="p-1 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  title="نسخ الرسالة"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleSpeak(msg.id, msg.content)}
                  className="p-1 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  title="استماع صوتي"
                >
                  {isSpeakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                {isUser && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1 rounded-md hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Assistant Output */}
        {isStreaming && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-amber-400">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>MIZAN AI بيكتب...</span>
            </div>

            <div className="relative max-w-[90%] md:max-w-[80%] rounded-2xl p-4 glass-panel text-slate-100 rounded-tl-xs shadow-xl border-amber-500/30">
              {/* Active Tools in Streaming */}
              {activeTools.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {activeTools.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-pulse"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t.tool}: {t.output || 'جاري المعالجة...'}</span>
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

              {/* Streaming Sources */}
              {streamingSources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <div className="font-semibold text-slate-300 text-[11px] mb-1">المصادر المكتشفة:</div>
                  <div className="flex flex-wrap gap-1">
                    {streamingSources.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Area */}
      <div className="p-3 md:p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/80">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700"
              >
                {att.dataUrl && att.type.startsWith('image/') ? (
                  <img src={att.dataUrl} alt={att.name} className="w-6 h-6 object-cover rounded" />
                ) : (
                  <FileText className="w-4 h-4 text-amber-400" />
                )}
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tool quick switches & indicators */}
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
              title="تفعيل الآلة الحاسبة المباشرة"
            >
              <Calculator className="w-3 h-3 text-amber-400" />
              <span>حساب رياضي</span>
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

        {/* Input box */}
        <div className="relative flex items-center rounded-2xl glass-panel p-1.5 shadow-xl border border-slate-700/80 focus-within:border-amber-400/80 transition-all">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.docx,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="إرفاق صورة أو مستند (PDF, TXT, DOCX, CSV)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice Input Button */}
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

          {/* Text Input */}
          <textarea
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

          {/* Send / Stop Button */}
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
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex-shrink-0"
              title="إرسال"
            >
              <Send className="w-4 h-4 -rotate-90" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
