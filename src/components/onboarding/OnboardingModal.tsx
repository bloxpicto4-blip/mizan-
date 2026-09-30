import React, { useState } from 'react';
import { Sparkles, MessageSquare, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      step: 1,
      badge: '🇪🇬 صنع في مصر',
      title: 'أهلاً بيك في MIZAN AI 👋',
      description: 'مساعدك الشخصي الذكي الأول باللهجة المصرية والعربية الفصحى، صُمم علشان يكون دايماً في ضهرك ويفهمك من أول كلمة.',
      icon: Sparkles,
      iconColor: 'text-amber-400 bg-amber-500/10',
    },
    {
      step: 2,
      badge: '💬 اسأل عن أي حاجة',
      title: 'اسأل عن أي حاجة تدور في بالك.',
      description: 'معلومات عامة، تكنولوجيا، حل مشاكل برمجية، حسابات دقيقة، أو حتى استشارة في يومك… ميزان جاهز يجاوبك فورًا.',
      icon: MessageSquare,
      iconColor: 'text-blue-400 bg-blue-500/10',
    },
    {
      step: 3,
      badge: '📚 إنتاجية ومذاكرة',
      title: 'ذاكر، خطط، اكتب، وابحث.',
      description: 'نظام مذاكرة تربوي ذكي يشرحلك بالتدريج، ينشئلك اختبارات وبطاقات استذكار، ويبحثلك في الويب بأحدث المعلومات.',
      icon: GraduationCap,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      step: 4,
      badge: '🚀 رفيقك اليومي',
      title: 'وخلّي MIZAN يساعدك في يومك.',
      description: 'ارفع صور، حلل مستندات PDF، اتكلم بالصوت واسمع الرد… تجربة ذكاء اصطناعي كاملة وممتعة بين إيديك.',
      icon: CheckCircle2,
      iconColor: 'text-rose-400 bg-rose-500/10',
    },
  ];

  const current = steps[step - 1];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      localStorage.setItem('mizan_onboarded', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-8 border-amber-500/30 shadow-2xl text-center space-y-6">
        {/* Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl -z-10" />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((s) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s.step === step ? 'w-8 bg-amber-400' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Icon & Badge */}
        <div className="space-y-3">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${current.iconColor} border border-white/5 shadow-xl`}>
            <Icon className="w-8 h-8" />
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-300 inline-block">
            {current.badge}
          </span>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-white font-sans">
            {current.title}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            {current.description}
          </p>
        </div>

        {/* Button */}
        <div className="pt-2">
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{step === 4 ? 'ابدأ دلوقتي 🚀' : 'التالي'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
