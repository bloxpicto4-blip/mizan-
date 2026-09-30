import React from 'react';
import {
  Heart,
  Code2,
  Palette,
  Sparkles,
  Bot,
  MapPin,
  Cpu,
  GraduationCap,
  Globe2,
  CheckCircle,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Hero Header Card with Egyptian Identity */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass-panel border-amber-500/30 shadow-2xl text-center">
        {/* Subtle decorative glowing background orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Logo & Egyptian Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 shadow-inner">
            <span className="text-base">🇪🇬</span>
            <span className="text-xs font-bold text-amber-300">صنع بحب في مصر</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-mono text-slate-400">v1.0.0 Pro</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-500/30">
              مـ
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-sans">
              MIZAN AI
            </h1>
          </div>

          <p className="text-base md:text-lg font-medium text-slate-300">
            مساعدك الشخصي الذكي الأول بنكهة وهوية مصرية أصيلة
          </p>
        </div>
      </div>

      {/* Developer Profile Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 md:p-8 border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
          {/* Developer Avatar / Badge */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 p-0.5 shadow-2xl shadow-amber-500/20">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center text-amber-400 font-bold">
                <span className="text-2xl font-black">AM</span>
                <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">DEV</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-2 px-2 py-0.5 rounded-full bg-slate-900 border border-amber-500/40 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow-md">
              <span>🇪🇬</span>
              <span>مصر</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                👨‍💻 المطور والمصمم
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-sans">
              عبد الرحمن محمد
            </h2>
            <div className="text-sm font-medium text-amber-400/90 font-mono">
              Abdelrahman Mohamed • Programmer & Designer
            </div>
            <div className="text-xs text-slate-400">
              مصري • مبرمج • ديزاينر
            </div>
          </div>
        </div>

        {/* Developer Personal Word (Exact text from brief) */}
        <div className="rounded-2xl glass-card p-5 md:p-6 border-amber-500/20 relative">
          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-sans text-justify sm:text-right">
            "أنا عبد الرحمن محمد، مبرمج وديزاينر مصري، عملت MIZAN AI علشان يكون مساعد بسيط وذكي يساعدنا في أي حاجة ممكن نقابلها في يومنا.
            <br /><br />
            من المذاكرة والبرمجة، للكتابة والتخطيط والبحث والأسئلة اليومية، الفكرة إنك تلاقي مساعد واحد تقدر ترجعله وقت ما تحتاج.
            <br /><br />
            وبالعكس… البرنامج حلو جدًا 😄
            <br />
            جرّبه بنفسك، واستنى الجديد… اللي جاي أجمد! 🔥"
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Made in Egypt */}
        <div className="rounded-3xl glass-panel p-6 border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">🇪🇬 صنع في مصر</h3>
              <span className="text-xs text-slate-400">Made in Egypt</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Designed and developed with passion by an Egyptian developer to deliver a natural, localized, and world-class AI experience.
          </p>
        </div>

        {/* About MIZAN AI */}
        <div className="rounded-3xl glass-panel p-6 border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">🤖 عن MIZAN AI</h3>
              <span className="text-xs text-slate-400">About MIZAN AI</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            A personal AI assistant designed to help users with everyday questions, learning, planning, creativity, programming, research, and more.
          </p>
        </div>
      </div>

      {/* Key Core Values */}
      <div className="rounded-3xl glass-panel p-6 md:p-8 border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>المميزات والقدرات الأساسية في MIZAN AI:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>لهجة مصرية أصيلة وذكية، مع دعم الفصحى والإنجليزية</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>نظام مذاكرة وتربية تدريجي يمنع الغش ويساعد على الفهم</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>بحث مباشر في الويب مع استخراج المصادر والمراجع</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>رؤية بصرية وفحص صور ومستندات (PDF, TXT, DOCX, CSV)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>استجابة تدفقية حية وسريعة (Streaming SSE)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>أمان وسرية تامة لمعلومات المستخدم والذاكرة الشخصية</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-8 space-y-1 text-xs text-slate-400 border-t border-slate-800">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-300">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse inline" />
          <span>in Egypt</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          © 2026 Abdelrahman Mohamed. All rights reserved.
        </div>
      </div>
    </div>
  );
};
