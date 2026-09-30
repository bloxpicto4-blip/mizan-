import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Code2,
  Minimize2,
  Languages,
  ListOrdered,
  FileCheck,
  Palette,
  Lightbulb,
} from 'lucide-react';
import { AIShortcut, Message } from '../../types';

interface AIShortcutsBarProps {
  lastMessage?: Message;
  onSelectShortcut: (prompt: string) => void;
  disabled?: boolean;
}

export const AIShortcutsBar: React.FC<AIShortcutsBarProps> = ({
  lastMessage,
  onSelectShortcut,
  disabled = false,
}) => {
  // Dynamically generate intelligent contextual shortcuts based on the conversation state
  const getContextualShortcuts = (): AIShortcut[] => {
    if (!lastMessage) {
      // Starting conversation shortcuts
      return [
        { id: 'sc_code', label: 'كود وشرح', prompt: 'اكتبلي كود عملي نظيف مع شرح فكرته واستخدامه', icon: 'code' },
        { id: 'sc_study', label: 'ذاكرلي درس', prompt: 'اشرحلي مفهوم علمي خطوة بخطوة بالعامية المصرية', icon: 'study' },
        { id: 'sc_search', label: 'أحدث التطورات', prompt: 'ابحثلي عن آخر أخبار التكنولوجيا والذكاء الاصطناعي النهاردة', icon: 'search' },
        { id: 'sc_plan', label: 'جدول إنتاجية', prompt: 'نظم جدول يومي واقعي لإدارة وقتي بين العمل والمذاكرة', icon: 'lightbulb' },
      ];
    }

    const content = lastMessage.content.toLowerCase();
    const isAssistant = lastMessage.role === 'assistant';

    if (isAssistant) {
      // If code was in the response
      if (content.includes('```') || content.includes('function') || content.includes('const ') || content.includes('كود')) {
        return [
          { id: 'sc_cont', label: 'كمل الكود', prompt: 'تابع واكمل باقي الكود والتفاصيل', icon: 'arrow' },
          { id: 'sc_simpler', label: 'اشرح ببساطة', prompt: 'اشرحلي الكود ده بطريقة مبسطة جداً وبالأمثلة', icon: 'lightbulb' },
          { id: 'sc_notes', label: 'حولها لملاحظات', prompt: 'لخص الخطوات دي في نقاط وملاحظات سريعة وسهلة', icon: 'notes' },
          { id: 'sc_test', label: 'اكتب اختبارات', prompt: 'اكتب كود اختبارات Unit Tests للكود ده', icon: 'code' },
        ];
      }

      // If long explanation
      if (content.length > 300) {
        return [
          { id: 'sc_cont', label: 'كمل الشرح', prompt: 'تابع من النقطة الأخيرة بالتفصيل', icon: 'arrow' },
          { id: 'sc_short', label: 'لخص الإجابة', prompt: 'لخص الإجابة السابقة في 3 نقاط محددة وسريعة', icon: 'short' },
          { id: 'sc_trans', label: 'ترجم للإنجليزية', prompt: 'ترجم الإجابة السابقة للغة الإنجليزية باحترافية', icon: 'lang' },
          { id: 'sc_ex', label: 'أمثلة واقعية', prompt: 'اديني أمثلة عملية من الحياة اليومية لتوضيح الفكرة', icon: 'lightbulb' },
        ];
      }

      // Default contextual shortcuts after assistant response
      return [
        { id: 'sc_cont', label: 'كمل', prompt: 'كمل الشرح من النقطة الأخيرة', icon: 'arrow' },
        { id: 'sc_simpler', label: 'وضح أكتر', prompt: 'وضح النقطة دي أكتر وبمثال توضيحي', icon: 'lightbulb' },
        { id: 'sc_notes', label: 'حول لملاحظات', prompt: 'حول الإجابة السابقة لنقاط استذكار سريعة', icon: 'notes' },
        { id: 'sc_pro', label: 'صيغة رسمية', prompt: 'أعد صياغة الكلام السابق بأسلوب بروفيشنال ورسمي', icon: 'check' },
      ];
    }

    // Default general shortcuts
    return [
      { id: 'sc_simpler', label: 'اشرح ببساطة', prompt: 'اشرحلي ده بطريقة مبسطة جداً', icon: 'lightbulb' },
      { id: 'sc_short', label: 'خليه مختصر', prompt: 'جاوب باختصار في نقاط مباشرة', icon: 'short' },
      { id: 'sc_ex', label: 'أمثلة عملية', prompt: 'وضح بأمثلة عملية من الواقع', icon: 'lightbulb' },
    ];
  };

  const shortcuts = getContextualShortcuts();

  const getIcon = (type?: string) => {
    switch (type) {
      case 'arrow':
        return <ArrowRight className="w-3 h-3 text-amber-400 rotate-180" />;
      case 'code':
        return <Code2 className="w-3 h-3 text-cyan-400" />;
      case 'short':
        return <Minimize2 className="w-3 h-3 text-amber-400" />;
      case 'lang':
        return <Languages className="w-3 h-3 text-emerald-400" />;
      case 'notes':
        return <ListOrdered className="w-3 h-3 text-blue-400" />;
      case 'check':
        return <FileCheck className="w-3 h-3 text-teal-400" />;
      case 'palette':
        return <Palette className="w-3 h-3 text-purple-400" />;
      case 'study':
        return <BookOpen className="w-3 h-3 text-emerald-400" />;
      default:
        return <Lightbulb className="w-3 h-3 text-amber-300" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 px-3">
      <div className="flex items-center gap-1.5 min-w-max mx-auto justify-center">
        {shortcuts.map((sc, i) => (
          <motion.button
            key={sc.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            disabled={disabled}
            onClick={() => onSelectShortcut(sc.prompt)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full quantum-card hover:quantum-card-active active:scale-95 text-xs text-slate-200 hover:text-white transition-all cursor-pointer border border-amber-500/20 hover:border-cyan-400/50 shadow-sm"
          >
            {getIcon(sc.icon)}
            <span className="font-medium text-[11px] whitespace-nowrap">{sc.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
