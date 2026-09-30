import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  HelpCircle,
  Sparkles,
  Camera,
  FolderOpen,
  Mic,
  Palette,
  Search,
  Code2,
  GraduationCap,
  Plus,
  X,
} from 'lucide-react';
import { AICoreState, RadialAction } from '../../types';

interface AICoreOrbProps {
  state: AICoreState;
  onSelectAction: (action: RadialAction) => void;
  onNewChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const AICoreOrb: React.FC<AICoreOrbProps> = ({
  state,
  onSelectAction,
  onNewChat,
  isOpen,
  setIsOpen,
}) => {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const actions: Array<{
    id: RadialAction;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    angle: number; // in degrees across the arc
    color: string;
    bgColor: string;
  }> = [
    { id: 'chat', label: 'محادثة', icon: MessageSquare, angle: 175, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/40' },
    { id: 'ask', label: 'سؤال سريع', icon: HelpCircle, angle: 145, color: 'text-yellow-300', bgColor: 'bg-yellow-500/20 border-yellow-500/40' },
    { id: 'code', label: 'كود وبرمجة', icon: Code2, angle: 115, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/40' },
    { id: 'search', label: 'بحث حي', icon: Search, angle: 85, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/40' },
    { id: 'image', label: 'توليد صور', icon: Palette, angle: 55, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/40' },
    { id: 'voice', label: 'صوت حر', icon: Mic, angle: 25, color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/40' },
    { id: 'files', label: 'ملف/مستند', icon: FolderOpen, angle: -5, color: 'text-teal-400', bgColor: 'bg-teal-500/20 border-teal-500/40' },
    { id: 'study', label: 'مذاكرة واختبار', icon: GraduationCap, angle: -35, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/40' },
    { id: 'camera', label: 'كاميرا وفحص', icon: Camera, angle: -65, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20 border-indigo-500/40' },
    { id: 'create', label: 'ابتكار فكرة', icon: Sparkles, angle: -95, color: 'text-amber-300', bgColor: 'bg-amber-500/20 border-amber-500/40' },
  ];

  // Touch gesture for swipe up
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const diffY = touchStartY - e.changedTouches[0].clientY;
      if (diffY > 40) {
        // Swipe up gesture triggered: Start new conversation!
        onNewChat();
        setIsOpen(false);
      }
      setTouchStartY(null);
    }
  };

  // Radius for the arc menu around the core
  const radius = 105;

  return (
    <div className="relative flex items-center justify-center pointer-events-auto select-none">
      {/* Radial / Arc Menu Elements */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Dismiss Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Arc Actions */}
            <div className="absolute z-50 pointer-events-none">
              {actions.map((act, index) => {
                // Angle in radians (converted from degrees)
                const rad = (act.angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = -Math.sin(rad) * radius; // negative so it fans upwards
                const Icon = act.icon;

                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    animate={{
                      opacity: 1,
                      x,
                      y,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        damping: 18,
                        stiffness: 280,
                        delay: index * 0.02,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 0,
                      y: 0,
                      scale: 0.2,
                      transition: { duration: 0.18 },
                    }}
                    className="absolute -top-5 -left-5 pointer-events-auto"
                  >
                    <button
                      onClick={() => {
                        onSelectAction(act.id);
                        setIsOpen(false);
                      }}
                      className={`group relative flex flex-col items-center justify-center w-11 h-11 rounded-2xl ${act.bgColor} border backdrop-blur-xl shadow-lg transition-transform active:scale-90 hover:scale-110 cursor-pointer`}
                      title={act.label}
                    >
                      <Icon className={`w-5 h-5 ${act.color}`} />
                      {/* Floating mini label */}
                      <span className="absolute -bottom-5 text-[9px] font-bold text-slate-200 whitespace-nowrap opacity-90 px-1 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                        {act.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ===================== THE LIVING QUANTUM AI CORE ===================== */}
      <div
        className="relative z-50 flex items-center justify-center cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* State-dependent Outer Energy Wave Rings */}
        {state === 'listening' && (
          <div className="absolute w-20 h-20 rounded-full border border-cyan-400/60 animate-pulse-ring pointer-events-none" />
        )}
        {state === 'generating' && (
          <div className="absolute w-20 h-20 rounded-full border border-amber-400/50 animate-pulse-ring [animation-duration:1.2s] pointer-events-none" />
        )}

        {/* Ambient Halo */}
        <div
          className={`absolute w-16 h-16 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
            state === 'idle'
              ? 'bg-amber-500/25'
              : state === 'listening'
              ? 'bg-cyan-500/40'
              : state === 'thinking'
              ? 'bg-purple-500/40'
              : state === 'generating'
              ? 'bg-amber-400/50'
              : 'bg-emerald-400/40'
          }`}
        />

        {/* Main Quantum Glass Orb Body */}
        <motion.div
          animate={
            state === 'idle'
              ? { scale: [1, 1.04, 1], rotate: [0, 2, 0] }
              : state === 'listening'
              ? { scale: [1, 1.12, 1] }
              : state === 'thinking'
              ? { rotate: 360 }
              : state === 'generating'
              ? { scale: [1, 1.08, 1], rotate: [0, -360] }
              : { scale: [1.2, 1] }
          }
          transition={{
            repeat: state === 'finished' ? 0 : Infinity,
            duration: state === 'thinking' ? 6 : state === 'generating' ? 3 : 4,
            ease: 'easeInOut',
          }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center p-0.5 backdrop-blur-2xl transition-all duration-500 border shadow-2xl ${
            isOpen
              ? 'border-amber-400/80 bg-slate-900/90'
              : state === 'idle'
              ? 'border-amber-500/40 bg-gradient-to-tr from-slate-950 via-[#0a1226] to-[#040816] core-glow-idle'
              : state === 'listening'
              ? 'border-cyan-400/70 bg-gradient-to-tr from-slate-950 via-[#071d2c] to-[#03101c] core-glow-listening'
              : state === 'thinking'
              ? 'border-purple-400/70 bg-gradient-to-tr from-slate-950 via-[#180a2c] to-[#0a0316] core-glow-thinking'
              : state === 'generating'
              ? 'border-amber-400/90 bg-gradient-to-tr from-slate-950 via-[#261705] to-[#0c0702] core-glow-generating'
              : 'border-emerald-400/70 bg-gradient-to-tr from-slate-950 via-[#08201a] to-[#030e0a]'
          }`}
        >
          {/* Internal Geometric Egyptian Facets */}
          <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />

          {/* Central Core Emblem / Glyph */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5 text-amber-300 transition-transform rotate-90 duration-200" />
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Ancient Egyptian "Ma'at Scale" Quantum Glyph */}
                <span className="font-black text-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-sans tracking-tighter">
                  مـ
                </span>

                {/* Micro Quantum Energy Spark */}
                <div
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-colors ${
                    state === 'generating'
                      ? 'bg-amber-400 animate-ping'
                      : state === 'listening'
                      ? 'bg-cyan-400 animate-ping'
                      : 'bg-amber-400/70'
                  }`}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
