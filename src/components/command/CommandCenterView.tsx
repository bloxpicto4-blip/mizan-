import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  History,
  GraduationCap,
  Settings as SettingsIcon,
  Heart,
  ChevronLeft,
  Plus,
  Share2,
  Trash2,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Conversation,
  Message,
  Attachment,
  AICoreState,
  RadialAction,
  SourceCitation,
  LanguageDialect,
} from '../../types';
import { api } from '../../services/api';
import { AICoreOrb } from '../core/AICoreOrb';
import { AIShortcutsBar } from '../shortcuts/AIShortcutsBar';
import { QuantumInputDock } from '../dock/QuantumInputDock';
import { EditorialMessageView } from '../conversation/EditorialMessageView';
import { QuantumMemoryCards } from '../home/QuantumMemoryCards';
import { QuantumBottomSheet } from '../sheets/QuantumBottomSheet';
import { StudyScreen } from '../study/StudyScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AboutView } from '../about/AboutView';
import { useAuth } from '../../context/AuthContext';

export const CommandCenterView: React.FC = () => {
  const { settings, updateSettings } = useAuth();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv_welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isHomeView, setIsHomeView] = useState(true);

  // AI Core & Execution State
  const [coreState, setCoreState] = useState<AICoreState>('idle');
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<string | undefined>(undefined);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Bottom Sheets
  const [activeSheet, setActiveSheet] = useState<'study' | 'settings' | 'about' | 'history' | null>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
    } catch (err) {
      console.error(err);
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
      if (res.messages.length > 0) {
        setIsHomeView(false);
      }
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Start completely new conversation
  const handleNewSession = async () => {
    try {
      const res = await api.createConversation('محادثة جديدة');
      setConversations((prev) => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setMessages([]);
      setIsHomeView(true);
      setActiveMode(undefined);
    } catch (err) {
      console.error(err);
      setActiveConversationId('conv_' + Date.now());
      setMessages([]);
      setIsHomeView(true);
    }
  };

  // Switch to existing conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsHomeView(false);
    setActiveSheet(null);
  };

  // Handle Radial Arc Action Select
  const handleRadialAction = (action: RadialAction) => {
    if (action === 'chat') {
      handleNewSession();
    } else if (action === 'study') {
      setActiveSheet('study');
    } else if (action === 'image') {
      setActiveMode('image');
    } else if (action === 'code') {
      setActiveMode('code');
    } else if (action === 'search') {
      setActiveMode('search');
    } else if (action === 'voice') {
      // Input dock will handle voice
      setActiveMode('voice');
    } else if (action === 'ask') {
      setActiveMode(undefined);
    } else {
      setActiveMode(action);
    }
  };

  // Send message
  const handleSendMessage = (text: string, attachments?: Attachment[], mode?: string) => {
    if ((!text.trim() && (!attachments || attachments.length === 0)) || isStreaming) return;

    setIsHomeView(false);
    setIsStreaming(true);
    setStreamingText('');
    setStreamingSources([]);
    setCoreState('thinking');

    // Optimistic user message
    const tempMsg: Message = {
      id: 'temp_' + Date.now(),
      conversationId: activeConversationId,
      role: 'user',
      content: text,
      attachments,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let forceTool: 'search' | 'calculator' | undefined = undefined;
    if (mode === 'search') forceTool = 'search';

    api.streamChat({
      conversationId: activeConversationId,
      content: text,
      attachments,
      forceTool,
      signal: abortController.signal,
      onToolResult: () => {
        setCoreState('generating');
      },
      onChunk: (chunk) => {
        setCoreState('generating');
        setStreamingText((prev) => prev + chunk);
      },
      onSources: (sources) => {
        setStreamingSources(sources);
      },
      onDone: (data) => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempMsg.id);
          return [
            ...filtered,
            data.userMessage,
            { ...data.assistantMessage, sources: data.sources },
          ];
        });
        setIsStreaming(false);
        setStreamingText('');
        setStreamingSources([]);
        setCoreState('finished');
        setTimeout(() => setCoreState('idle'), 1500);
        loadConversations();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setStreamingText('');
        setCoreState('idle');
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

  // Stop Generation
  const handleStopStreaming = () => {
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
            content: streamingText + ' [تم إيقاف التوليد]',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setStreamingText('');
      setCoreState('idle');
    }
  };

  // Egyptian time-based greeting
  const getEgyptianGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح النور يا بطل ☀️';
    if (hour >= 12 && hour < 17) return 'يومك سعيد ومنتج يا فندم 🇪🇬';
    return 'مساء الخير والروقان يا فندم 🌙';
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* ===================== TOP FLOATING QUANTUM APP BAR ===================== */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-slate-950/60 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          {!isHomeView ? (
            <button
              onClick={() => setIsHomeView(true)}
              className="p-2 rounded-2xl quantum-card hover:border-amber-400 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span className="font-semibold hidden sm:inline">الرئيسية</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveSheet('history')}
              className="p-2 rounded-2xl quantum-card hover:border-amber-400 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
              title="سجل الجلسات"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {/* Holographic Quantum Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20">
              مـ
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight bg-gradient-to-r from-amber-300 to-yellow-100 bg-clip-text text-transparent font-sans">
                  MIZAN CORE
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* New Session Button */}
          <button
            onClick={handleNewSession}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">جلسة جديدة</span>
          </button>

          {/* Study Center */}
          <button
            onClick={() => setActiveSheet('study')}
            className="p-2 rounded-2xl quantum-card text-emerald-400 hover:border-emerald-400 transition-all cursor-pointer"
            title="نظام المذاكرة"
          >
            <GraduationCap className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveSheet('settings')}
            className="p-2 rounded-2xl quantum-card text-slate-300 hover:text-white hover:border-amber-400 transition-all cursor-pointer"
            title="الإعدادات"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* About Abdelrahman Mohamed */}
          <button
            onClick={() => setActiveSheet('about')}
            className="p-2 rounded-2xl quantum-card text-rose-400 hover:border-rose-400 transition-all cursor-pointer"
            title="عن المطور والتطبيق 🇪🇬"
          >
            <Heart className="w-4 h-4 fill-rose-500/40 text-rose-500" />
          </button>
        </div>
      </header>

      {/* ===================== MAIN VIEWPORT AREA ===================== */}
      <main className="flex-1 flex flex-col justify-center overflow-x-hidden">
        {isHomeView && messages.length === 0 ? (
          /* ===================== REVOLUTIONARY LIVING HOME ===================== */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 max-w-xl mx-auto w-full animate-in fade-in duration-500">
            {/* Living AI Core in Home Center */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative mb-3">
                <AICoreOrb
                  state={coreState}
                  isOpen={isRadialOpen}
                  setIsOpen={setIsRadialOpen}
                  onSelectAction={handleRadialAction}
                  onNewChat={handleNewSession}
                />
              </div>
              <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest mt-1">
                مركز التحكم الذكي • AI Command Center
              </span>
            </div>

            {/* Greeting */}
            <div className="space-y-1.5 mb-6">
              <h1 className="text-xl md:text-3xl font-extrabold text-white font-sans tracking-tight">
                {getEgyptianGreeting()}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                مساعدك المصري فائق الذكاء — اسأل، برمج، ذاكر، أو ابتكر أي فكرة بضغطة زر واحدة.
              </p>
            </div>

            {/* Floating Memory Layers / Recent Conversations */}
            <QuantumMemoryCards
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              onNewSession={handleNewSession}
            />
          </div>
        ) : (
          /* ===================== EDITORIAL CONVERSATION VIEW ===================== */
          <EditorialMessageView
            messages={messages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamingSources={streamingSources}
            onActionPrompt={(prompt) => handleSendMessage(prompt)}
            onRegenerate={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === 'user');
              if (lastUser) handleSendMessage(lastUser.content);
            }}
          />
        )}
      </main>

      {/* ===================== FLOATING BOTTOM COMMAND DOCK ===================== */}
      <footer className="sticky bottom-0 z-40 w-full pt-1 pb-4 flex flex-col items-center space-y-2 pointer-events-none">
        {/* Dynamic Contextual AI Shortcuts Bar */}
        <div className="w-full pointer-events-auto">
          <AIShortcutsBar
            lastMessage={lastAssistantMessage}
            onSelectShortcut={(prompt) => handleSendMessage(prompt)}
            disabled={isStreaming}
          />
        </div>

        {/* Floating Input Dock & Central Floating AI Core */}
        <div className="w-full flex items-center justify-center gap-2 px-3 pointer-events-auto max-w-xl mx-auto">
          {/* Living AI Core Action Trigger */}
          <div className="flex-shrink-0">
            <AICoreOrb
              state={coreState}
              isOpen={isRadialOpen}
              setIsOpen={setIsRadialOpen}
              onSelectAction={handleRadialAction}
              onNewChat={handleNewSession}
            />
          </div>

          {/* Adaptive Floating Glass Input Dock */}
          <div className="flex-1 min-w-0">
            <QuantumInputDock
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              activeMode={activeMode}
              onClearMode={() => setActiveMode(undefined)}
            />
          </div>
        </div>
      </footer>

      {/* ===================== THUMB-FRIENDLY BOTTOM SHEETS ===================== */}

      {/* 1. Study Center Sheet */}
      <QuantumBottomSheet
        isOpen={activeSheet === 'study'}
        onClose={() => setActiveSheet(null)}
        title="نظام المذاكرة والواجب التدريجي"
        subtitle="اختبارات تفاعلية، بطاقات استذكار، وشرح مبسط"
        icon={<GraduationCap className="w-5 h-5 text-emerald-400" />}
      >
        <StudyScreen
          onStartChatWithPrompt={(prompt) => {
            setActiveSheet(null);
            handleSendMessage(prompt);
          }}
        />
      </QuantumBottomSheet>

      {/* 2. Settings Sheet */}
      <QuantumBottomSheet
        isOpen={activeSheet === 'settings'}
        onClose={() => setActiveSheet(null)}
        title="الإعدادات وتفضيلات الذكاء الاصطناعي"
        subtitle="تخصيص اللهجة، النماذج، والذاكرة"
        icon={<SettingsIcon className="w-5 h-5 text-amber-400" />}
      >
        <SettingsScreen onOpenAbout={() => setActiveSheet('about')} />
      </QuantumBottomSheet>

      {/* 3. About Abdelrahman Mohamed Sheet */}
      <QuantumBottomSheet
        isOpen={activeSheet === 'about'}
        onClose={() => setActiveSheet(null)}
        title="عن MIZAN AI والمطور المصري"
        subtitle="صنع بكل فخر وحب في مصر 🇪🇬"
        icon={<Heart className="w-5 h-5 fill-rose-500/40 text-rose-500" />}
      >
        <AboutView />
      </QuantumBottomSheet>

      {/* 4. History Sheet */}
      <QuantumBottomSheet
        isOpen={activeSheet === 'history'}
        onClose={() => setActiveSheet(null)}
        title="سجل الجلسات والمحادثات"
        subtitle="جميع أفكارك السابقة محفوظة بأمان"
        icon={<History className="w-5 h-5 text-amber-400" />}
      >
        <div className="space-y-2">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectConversation(c.id)}
              className="flex items-center justify-between p-3.5 rounded-2xl quantum-card hover:quantum-card-active cursor-pointer transition-all"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-xs text-slate-100 truncate">{c.title}</span>
                <span className="text-[11px] text-slate-400 truncate mt-0.5">
                  {c.lastMessagePreview || 'اضغط لفتح الجلسة'}
                </span>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">لا توجد محادثات سابقة بعد.</div>
          )}
        </div>
      </QuantumBottomSheet>
    </div>
  );
};
