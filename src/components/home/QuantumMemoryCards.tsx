import React from 'react';
import { motion } from 'motion/react';
import { Clock, MessageSquare, Pin, Sparkles, ChevronLeft } from 'lucide-react';
import { Conversation } from '../../types';

interface QuantumMemoryCardsProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewSession: () => void;
}

export const QuantumMemoryCards: React.FC<QuantumMemoryCardsProps> = ({
  conversations,
  onSelectConversation,
  onNewSession,
}) => {
  if (conversations.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>طبقات الذاكرة والمحادثات الأخيرة</span>
        </span>
        <span className="text-[11px] text-cyan-400/80 font-medium">اسحب للتنقل</span>
      </div>

      {/* Floating horizontal or stacked glass memory cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 pr-1">
        {conversations.slice(0, 5).map((conv, idx) => (
          <motion.div
            key={conv.id}
            layoutId={`conv-card-${conv.id}`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectConversation(conv.id)}
            className="flex-shrink-0 w-64 p-3.5 rounded-2xl quantum-card hover:quantum-card-active border border-amber-500/20 cursor-pointer shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>جلسة محفوظة</span>
              </span>
              {conv.pinned && <Pin className="w-3 h-3 text-amber-400" />}
            </div>

            <h3 className="text-xs font-bold text-slate-100 truncate mb-1">
              {conv.title}
            </h3>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {conv.lastMessagePreview || 'اضغط لاستئناف المحادثة الذكية...'}
            </p>

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] text-slate-400">
              <span>{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString('ar-EG')}</span>
              <span className="flex items-center gap-0.5 text-cyan-400 font-semibold">
                <span>فتح</span>
                <ChevronLeft className="w-3 h-3" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
