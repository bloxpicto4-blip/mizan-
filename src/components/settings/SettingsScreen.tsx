import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Globe,
  Sliders,
  Sun,
  Moon,
  Volume2,
  Brain,
  ShieldCheck,
  Trash2,
  Plus,
  Heart,
  Save,
  Check,
  Sparkles,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LanguageDialect, ResponseStyle, ThemeMode, Memory, AdminConfig } from '../../types';
import { api } from '../../services/api';

interface SettingsScreenProps {
  onOpenAbout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenAbout }) => {
  const { user, settings, updateSettings, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Memories
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemContent, setNewMemContent] = useState('');

  // Admin Config
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
    api.getMemories().then((res) => setMemories(res.memories));
    api.getAdminConfig().then((res) => setAdminConfig(res.config));
    api.getAdminStats().then((res) => setAdminStats(res.stats));
  }, [user]);

  const handleSaveProfile = async () => {
    await updateProfile(name);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLanguageChange = (lang: LanguageDialect) => {
    updateSettings({ language: lang });
  };

  const handleStyleChange = (style: ResponseStyle) => {
    updateSettings({ responseStyle: style });
  };

  const handleAddMemory = async () => {
    if (!newMemKey.trim() || !newMemContent.trim()) return;
    const res = await api.addMemory(newMemKey.trim(), newMemContent.trim());
    setMemories((prev) => [...prev, res.memory]);
    setNewMemKey('');
    setNewMemContent('');
  };

  const handleDeleteMemory = async (id: string) => {
    await api.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveAdminConfig = async () => {
    if (adminConfig) {
      await api.updateAdminConfig(adminConfig);
      alert('تم حفظ إعدادات النظام بنجاح');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 pb-20">
      {/* Title Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white font-sans flex items-center gap-2">
          <Sliders className="w-6 h-6 text-amber-400" />
          <span>الإعدادات والتخصيص</span>
        </h1>
        <p className="text-xs text-slate-400">
          خصص أسلوب ولغة MIZAN AI وراجع الذاكرة وخيارات الحساب.
        </p>
      </div>

      {/* 1. Profile Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          <UserIcon className="w-4 h-4 text-amber-400" />
          <span>الملف الشخصي والحساب</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">اسم المستخدم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl glass-card px-3.5 py-2.5 text-xs md:text-sm text-slate-100 outline-none focus:border-amber-400/80 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">البريد الإلكتروني</label>
            <input
              type="email"
              disabled
              value={user?.email || 'guest@mizan.ai'}
              className="w-full rounded-xl glass-card px-3.5 py-2.5 text-xs md:text-sm text-slate-500 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تم الحفظ!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Language & Dialect Selection */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>اللهجة وأسلوب المحادثة</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'egyptian' as LanguageDialect, title: 'العامية المصرية', flag: '🇪🇬', desc: 'طبيعي، ودود، وسلس' },
            { id: 'msa' as LanguageDialect, title: 'العربية الفصحى', flag: '📜', desc: 'لغة سليمة ورصينة' },
            { id: 'english' as LanguageDialect, title: 'English', flag: '🌐', desc: 'Fluent & Precise' },
            { id: 'franco' as LanguageDialect, title: 'الفرانكو', flag: '💬', desc: 'Franco-Arabic' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLanguageChange(item.id)}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                settings?.language === item.id
                  ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 font-semibold shadow-md ring-1 ring-amber-400/50'
                  : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{item.flag}</span>
                {settings?.language === item.id && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="mt-2">
                <span className="text-xs font-bold block">{item.title}</span>
                <span className="text-[10px] text-slate-400">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Response Length & Detail */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>طول وعمق الإجابات</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'short' as ResponseStyle, title: 'موجز ومباشر', desc: 'إجابات سريعة مركزة بدون تفاصيل زائدة' },
            { id: 'balanced' as ResponseStyle, title: 'متوازن (موصى به)', desc: 'مزيج مثالي بين الإيجاز والشمول حسب السؤال' },
            { id: 'detailed' as ResponseStyle, title: 'مفصل وشامل', desc: 'شرح عميق بأمثلة ومصادر وتفصيل دقيق' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleStyleChange(item.id)}
              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                settings?.responseStyle === item.id
                  ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 font-semibold shadow-md'
                  : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-bold block mb-1">{item.title}</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Theme & Appearance */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>المظهر والسمة</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark' as ThemeMode, label: 'الوضع الليلي', icon: Moon },
            { id: 'light' as ThemeMode, label: 'الوضع النهاري', icon: Sun },
            { id: 'system' as ThemeMode, label: 'تلقائي (الجهاز)', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const isAct = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  isAct
                    ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Memory Management */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <Brain className="w-4 h-4 text-amber-400" />
            <span>ذاكرة MIZAN AI الشخصية</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings?.enableMemory ?? true}
              onChange={(e) => updateSettings({ enableMemory: e.target.checked })}
              className="rounded accent-amber-500"
            />
            <span>تفعيل الذاكرة</span>
          </label>
        </div>

        <p className="text-xs text-slate-400">
          الذاكرة تساعد ميزان على تذكر اهتماماتك وأسلوبك المفضل، دون تخزين أي بيانات حساسة.
        </p>

        {/* Existing Memories */}
        <div className="space-y-2">
          {memories.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-2xl glass-card text-xs text-slate-200"
            >
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">{m.key}</span>
                <span>{m.content}</span>
              </div>
              <button
                onClick={() => handleDeleteMemory(m.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="حذف المعلومة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {memories.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-2">
              لا توجد ذكريات محفوظة حاليًا.
            </div>
          )}
        </div>

        {/* Add Memory */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="العنوان (مثال: مجال الدراسة)"
            value={newMemKey}
            onChange={(e) => setNewMemKey(e.target.value)}
            className="sm:w-1/3 rounded-xl glass-card px-3 py-2 text-xs text-slate-100 outline-none"
          />
          <input
            type="text"
            placeholder="المعلومة (مثال: بدرس في كلية الهندسة قسم حاسبات)"
            value={newMemContent}
            onChange={(e) => setNewMemContent(e.target.value)}
            className="flex-1 rounded-xl glass-card px-3 py-2 text-xs text-slate-100 outline-none"
          />
          <button
            onClick={handleAddMemory}
            disabled={!newMemKey.trim() || !newMemContent.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>
      </div>

      {/* 6. Dedicated About Shortcut Button (Section 32) */}
      <div
        onClick={onOpenAbout}
        className="rounded-3xl glass-panel p-6 border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer flex items-center justify-between group shadow-xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
            مـ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white group-hover:text-amber-300">
                عن MIZAN AI والمطور
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400 inline" />
                <span>صنع في مصر 🇪🇬</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تعرف على قصة MIZAN AI والمطور والديزاينر المصري عبد الرحمن محمد.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
      </div>

      {/* 7. Developer & Admin Controls Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>{showAdmin ? 'إخفاء إعدادات المطور والنظام' : 'إعدادات المطور والنظام (Admin Config)'}</span>
        </button>

        {showAdmin && adminConfig && (
          <div className="mt-3 glass-panel p-6 rounded-3xl space-y-4 border-amber-500/20 animate-in fade-in">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>إحصائيات النظام والاستخدام:</span>
            </h4>

            {adminStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">إجمالي الرسائل</span>
                  <span className="text-base font-bold text-amber-400">{adminStats.totalMessages}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">المحادثات</span>
                  <span className="text-base font-bold text-amber-400">{adminStats.totalConversations}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">المستخدمين</span>
                  <span className="text-base font-bold text-amber-400">{adminStats.totalUsers}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">استدعاءات الأدوات</span>
                  <span className="text-base font-bold text-amber-400">{adminStats.toolInvocations}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-xs text-slate-300 font-semibold">نموذج الذكاء الاصطناعي الافتراضي:</label>
              <select
                value={adminConfig.model}
                onChange={(e) => setAdminConfig({ ...adminConfig, model: e.target.value })}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="gemini-3.1-flash-lite">Google Gemini 3.1 Flash Lite (الافتراضي فائق السرعة وبدون حدود)</option>
                <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (توليد متعدد الوسائط وبحث حي)</option>
                <option value="gemini-3.1-pro-preview">Google Gemini 3.1 Pro (تفكير عميق)</option>
                <option value="openai-gpt-4o">OpenAI GPT-4o (عند توفر المفتاح)</option>
              </select>
            </div>

            <button
              onClick={handleSaveAdminConfig}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              حفظ الإعدادات
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
