import React, { useState } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Plus,
  Globe,
  User as UserIcon,
  Heart,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ActiveTab, LanguageDialect } from '../../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewChat: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  setActiveTab,
  onNewChat,
  onOpenAuth,
}) => {
  const { user, settings, updateSettings } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const dialectLabels: Record<LanguageDialect, { title: string; flag: string }> = {
    egyptian: { title: 'مصري', flag: '🇪🇬' },
    msa: { title: 'فصحى', flag: '📜' },
    english: { title: 'EN', flag: '🌐' },
    franco: { title: 'Franco', flag: '💬' },
  };

  const currentDialect = settings?.language || 'egyptian';

  const selectDialect = (d: LanguageDialect) => {
    updateSettings({ language: d });
    setLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/80 border-b border-slate-800/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand & Made in Egypt badge */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <span className="text-xl">مـ</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center text-[10px]">
              🇪🇬
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-sans">
                MIZAN AI
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              مساعدك الشخصي الذكي
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs md:text-sm font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            title="محادثة جديدة"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>

          {/* Dialect Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-medium transition-all"
              title="تغيير اللهجة واللغة"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{dialectLabels[currentDialect].flag}</span>
              <span className="hidden sm:inline">{dialectLabels[currentDialect].title}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] text-slate-400 px-2 py-1 font-semibold border-b border-slate-800/80 mb-1">
                  اللهجة والأسلوب
                </div>
                {(Object.keys(dialectLabels) as LanguageDialect[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => selectDialect(d)}
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

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>

          {/* About MIZAN AI Heart Button */}
          <button
            onClick={() => setActiveTab('about')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition-all cursor-pointer"
            title="عن MIZAN AI والمطور عبد الرحمن محمد"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
            <span className="hidden md:inline font-bold">صنع في مصر</span>
          </button>

          {/* Profile / Auth Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition-all cursor-pointer"
            title={user ? user.name : 'تسجيل الدخول'}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
              {user?.name ? user.name[0] : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <span className="hidden lg:inline text-xs font-medium text-slate-200 truncate max-w-[100px]">
              {user?.name || 'حسابي'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
