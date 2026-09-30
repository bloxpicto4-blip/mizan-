import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface QuantumBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const QuantumBottomSheet: React.FC<QuantumBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl quantum-sheet flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 flex-shrink-0 cursor-grab" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {icon && <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">{icon}</div>}
                <div>
                  <h3 className="font-bold text-sm md:text-base text-slate-100 font-sans">{title}</h3>
                  {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
