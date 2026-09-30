import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  GraduationCap,
  Search,
  Code,
  PenTool,
  Image as ImageIcon,
  FileText,
  Calendar,
  ArrowLeft,
  Sparkles,
  Paperclip,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { Conversation, ActiveTab } from '../../types';
import { api } from '../../services/api';

interface HomeScreenProps {
  onStartChat: (initialPrompt?: string, files?: File[]) => void;
  onOpenConversation: (convId: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartChat,
  onOpenConversation,
  setActiveTab,
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dynamic Egyptian greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'صباح الخير 👋';
    if (hour >= 12 && hour < 17) return 'مساء الورد 👋';
    return 'مساء الخير 👋';
  };

  useEffect(() => {
    api.getConversations()
      .then((res) => {
        setRecentConversations(res.conversations.slice(0, 4));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleSend = () => {
    if (!inputPrompt.trim()) return;
    onStartChat(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    {
      id: 'ask',
      label: 'اسألني',
      icon: MessageSquare,
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30',
      action: () => onStartChat('إيه أهم المواضيع اللي تقدر تساعدني فيها؟'),
    },
    {
      id: 'study',
      label: 'ذاكر معايا',
      icon: GraduationCap,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      action: () => setActiveTab('study'),
    },
    {
      id: 'search',
      label: 'ابحثلي',
      icon: Search,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
      action: () => onStartChat('ابحثلي عن آخر أخبار الذكاء الاصطناعي والتكنولوجيا هذا الأسبوع'),
    },
    {
      id: 'code',
      label: 'برمج معايا',
      icon: Code,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
      action: () => onStartChat('عايزك تساعدني في كتابة وتصميم كود React و TypeScript عالي الكفاءة'),
    },
    {
      id: 'write',
      label: 'اكتبلي',
      icon: PenTool,
      color: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
      action: () => onStartChat('اكتبلي مقال احترافي أو بوست شيق بالعامية المصرية الذكية'),
    },
    {
      id: 'image',
      label: 'حلل صورة',
      icon: ImageIcon,
      color: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30',
      action: () => {
        onStartChat('أنا هرفعلك صورة وعايزك تفحصها وتشرحلي تفاصيلها بدقة');
      },
    },
    {
      id: 'file',
      label: 'حلل ملف',
      icon: FileText,
      color: 'from-teal-500/20 to-cyan-500/20 text-teal-400 border-teal-500/30',
      action: () => {
        onStartChat('لخصلي المستند ده واستخرج منه أهم النقاط والأرقام');
      },
    },
    {
      id: 'plan',
      label: 'نظم يومي',
      icon: Calendar,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30',
      action: () => onStartChat('نظم يومي وروتيني: عندي مذاكرة وشغل ورياضة، ساعدني في جدول إنتاجي ذكي'),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Central Welcome Block */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        {/* Egyptian Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/20 shadow-inner">
          <span className="text-sm">🇪🇬</span>
          <span className="text-xs font-medium text-amber-300">ميزان AI — مساعدك المصري الذكي</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Greeting & Headline */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
            {getGreeting()}
          </h1>
          <p className="text-lg md:text-2xl font-medium text-slate-300">
            إيه اللي عايز تعرفه النهاردة؟
          </p>
        </div>

        {/* Big Central Search Input */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center rounded-2xl glass-panel p-2 shadow-2xl border border-slate-700/80 focus-within:border-amber-400/80 transition-all">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اسأل MIZAN AI أي حاجة... (مذاكرة، برمجة، بحث، تنظيم...)"
              className="w-full bg-transparent px-4 py-3 text-slate-100 placeholder-slate-400 text-sm md:text-base outline-none font-sans"
              autoFocus
            />

            <button
              onClick={handleSend}
              disabled={!inputPrompt.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-600 text-slate-950 transition-all active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer flex-shrink-0"
              title="إرسال"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="w-full max-w-3xl pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  onClick={qa.action}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br ${qa.color} border backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all text-right group cursor-pointer`}
                >
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-white/5 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white">
                    {qa.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Conversations Section */}
      <div className="w-full max-w-2xl mx-auto mt-8 pt-6 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>المحادثات الأخيرة</span>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="hover:text-amber-400 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {recentConversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onOpenConversation(c.id)}
              className="p-3 rounded-xl glass-card hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-slate-200 truncate group-hover:text-amber-300">
                    {c.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {c.lastMessagePreview || 'انقر للمتابعة...'}
                  </div>
                </div>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:-translate-x-1" />
            </div>
          ))}

          {recentConversations.length === 0 && !loadingHistory && (
            <div className="col-span-2 text-center py-4 text-xs text-slate-400">
              لسه مفيش محادثات سابقة. ابدأ أول محادثة مع MIZAN AI دلوقتي!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
