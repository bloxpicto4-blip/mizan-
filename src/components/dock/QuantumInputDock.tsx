import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  Search,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import { Attachment } from '../../types';
import { speechHandler } from '../../utils/speech';

interface QuantumInputDockProps {
  onSendMessage: (text: string, attachments?: Attachment[], mode?: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  activeMode?: string;
  onClearMode?: () => void;
}

export const QuantumInputDock: React.FC<QuantumInputDockProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  activeMode,
  onClearMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Handle voice recording
  const handleToggleVoice = () => {
    if (isVoiceActive) {
      speechHandler.stopListening();
      setIsVoiceActive(false);
      if (voiceTranscript.trim()) {
        setInputText((prev) => (prev ? `${prev} ${voiceTranscript}` : voiceTranscript));
        setVoiceTranscript('');
      }
    } else {
      setVoiceTranscript('');
      setIsVoiceActive(true);
      speechHandler.startListening(
        'ar-EG',
        (res) => {
          setVoiceTranscript(res.transcript);
          if (res.isFinal) {
            setInputText((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
            setIsVoiceActive(false);
            setVoiceTranscript('');
          }
        },
        (err) => {
          console.error(err);
          setIsVoiceActive(false);
        }
      );
    }
  };

  // Handle file uploads
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (isImg || isPdf) {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now() + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: file.type || (isPdf ? 'application/pdf' : 'image/png'),
              size: file.size,
              dataUrl: reader.result as string,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          setAttachments((prev) => [
            ...prev,
            {
              id: 'att_' + Date.now(),
              name: file.name,
              type: file.type || 'text/plain',
              size: file.size,
              extractedText: reader.result as string,
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit message
  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(inputText, attachments, activeMode);
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full max-w-xl mx-auto px-3"
    >
      <div className="quantum-dock rounded-3xl p-2 transition-all duration-300">
        {/* Active Mode Banner (when triggered from Radial Menu, e.g., Image/Code/Search) */}
        <AnimatePresence>
          {activeMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between px-3 py-1 mb-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {activeMode === 'image' && 'وضع توليد وتصميم الصور الفنية 🎨'}
                  {activeMode === 'code' && 'وضع البرمجة والأكواد التقنية 💻'}
                  {activeMode === 'search' && 'وضع البحث المباشر في الويب 🌐'}
                  {activeMode === 'study' && 'وضع المذاكرة والواجب التدريجي 📚'}
                </span>
              </div>
              <button
                onClick={onClearMode}
                className="p-0.5 rounded-full hover:bg-cyan-500/20 text-cyan-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Preview Chips */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 mb-2 px-1"
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200"
                >
                  {att.dataUrl && att.type.startsWith('image/') ? (
                    <img src={att.dataUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="truncate max-w-[110px] text-[11px]">{att.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Recording Mode View */}
        <AnimatePresence>
          {isVoiceActive ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-xs text-cyan-300 font-medium mr-2">
                  {voiceTranscript || 'اتكلم، سامعك بالعامية المصرية...'}
                </span>
              </div>
              <button
                onClick={handleToggleVoice}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold active:scale-95"
              >
                إنهاء وتسجيل
              </button>
            </motion.div>
          ) : (
            /* Standard Text Composer View */
            <div className="flex items-center gap-1.5">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.docx,.csv"
                onChange={handleFiles}
                className="hidden"
              />

              {/* Attach action */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-2xl hover:bg-slate-800/80 text-slate-400 hover:text-amber-400 transition-colors active:scale-95 cursor-pointer"
                title="إرفاق ملف أو صورة"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Input Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  activeMode === 'image'
                    ? 'اكتب وصف الصورة الفنية التي تريد توليدها...'
                    : activeMode === 'code'
                    ? 'اكتب سؤالك البرمجي أو الكود المطلوب...'
                    : 'اسأل MIZAN AI أي فكرة أو سؤال...'
                }
                className="flex-1 bg-transparent px-2 py-1.5 text-slate-100 placeholder-slate-400 text-xs md:text-sm outline-none resize-none max-h-28 font-sans"
              />

              {/* Voice input mic */}
              <button
                onClick={handleToggleVoice}
                className="p-2 rounded-2xl hover:bg-slate-800/80 text-slate-400 hover:text-cyan-400 transition-colors active:scale-95 cursor-pointer"
                title="تحدث صوتياً"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send or Stop Button */}
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 cursor-pointer"
                  title="إيقاف التوليد"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() && attachments.length === 0}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  title="إرسال"
                >
                  <Send className="w-3.5 h-3.5 -rotate-90" />
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
