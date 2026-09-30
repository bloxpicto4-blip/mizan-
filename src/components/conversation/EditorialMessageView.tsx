import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Calculator,
  Search,
  FileText,
  Code2,
} from 'lucide-react';
import { Message, SourceCitation } from '../../types';
import { MarkdownContent } from '../chat/MarkdownContent';
import { speechHandler } from '../../utils/speech';

interface EditorialMessageViewProps {
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  streamingSources?: SourceCitation[];
  onActionPrompt: (prompt: string) => void;
  onRegenerate: () => void;
}

export const EditorialMessageView: React.FC<EditorialMessageViewProps> = ({
  messages,
  isStreaming,
  streamingText,
  streamingSources = [],
  onActionPrompt,
  onRegenerate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      speechHandler.stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      speechHandler.speak(text, 'ar-EG');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-32 pt-2 px-3">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';

        if (isUser) {
          // Lightweight, Editorial User Query
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-start pr-2 pl-6"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>أنت</span>
              </span>

              {/* User text with editorial simplicity */}
              <div className="text-sm md:text-base text-slate-200 font-medium leading-relaxed">
                {msg.content}
              </div>

              {/* Attachments preview if present */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300"
                    >
                      {att.dataUrl && att.type.startsWith('image/') ? (
                        <img src={att.dataUrl} alt={att.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="truncate max-w-[120px] text-[11px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        }

        // Assistant Intelligent Quantum Card
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
            className="group relative"
          >
            {/* Quantum Dimensional Card */}
            <div className="quantum-card rounded-3xl p-5 md:p-6 shadow-xl transition-all">
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                    مـ
                  </div>
                  <span className="font-bold text-xs bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                    MIZAN AI 🇪🇬
                  </span>
                  {msg.studyScaffoldLevel && (
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      مستوى دراسي {msg.studyScaffoldLevel}
                    </span>
                  )}
                </div>

                {/* Micro Actions Bar */}
                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="نسخ"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSpeak(msg.id, msg.content)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="استماع"
                  >
                    {speakingId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
                    title="إعادة التوليد"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tool Invocations Result Pills */}
              {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.toolInvocations.map((tool, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-amber-300"
                    >
                      {tool.tool === 'calculator' && <Calculator className="w-3.5 h-3.5 text-amber-400" />}
                      {tool.tool === 'search' && <Search className="w-3.5 h-3.5 text-blue-400" />}
                      <span className="font-medium text-[11px]">
                        {tool.tool === 'calculator' && `الحساب: ${tool.input} = ${tool.output}`}
                        {tool.tool === 'datetime' && `${tool.output}`}
                        {tool.tool === 'unit_converter' && `التحويل: ${tool.output}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Editorial Content Body */}
              <div className="text-slate-100 text-sm md:text-base leading-relaxed">
                <MarkdownContent content={msg.content} />
              </div>

              {/* Grounding Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>المصادر المعتمدة:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-[11px] border border-cyan-500/20 transition-colors"
                      >
                        <span className="truncate max-w-[140px]">{s.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Action Chips Below Card */}
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => onActionPrompt('تابع واكمل الشرح من النقطة الأخيرة بالتفصيل.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
                >
                  تابع الشرح
                </button>
                <button
                  onClick={() => onActionPrompt('لخص الإجابة السابقة في 3 نقاط محددة وسريعة.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
                >
                  لخص الإجابة
                </button>
                <button
                  onClick={() => onActionPrompt('اشرحلي النقطة دي بطريقة مبسطة جداً وبأمثلة من الواقع.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-[11px] transition-colors cursor-pointer"
                >
                  اشرح ببساطة
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Streaming Assistant Card */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="quantum-card rounded-3xl p-5 md:p-6 shadow-2xl border-cyan-400/40 relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-cyan-300 font-sans">
              MIZAN AI بيفكر ويكتب...
            </span>
          </div>

          {streamingText ? (
            <div className="text-slate-100 text-sm md:text-base leading-relaxed">
              <MarkdownContent content={streamingText} />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-3 text-slate-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]" />
              <span className="mr-2 font-medium">جاري معالجة السؤال واستخراج أدق إجابة...</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
