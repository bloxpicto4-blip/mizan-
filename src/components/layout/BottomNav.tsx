import React from 'react';
import { Home, MessageSquare, GraduationCap, History, Settings } from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home' as ActiveTab, label: 'الرئيسية', icon: Home },
    { id: 'chat' as ActiveTab, label: 'المحادثة', icon: MessageSquare },
    { id: 'study' as ActiveTab, label: 'المذاكرة', icon: GraduationCap, badge: 'جديد' },
    { id: 'history' as ActiveTab, label: 'السجل', icon: History },
    { id: 'settings' as ActiveTab, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-slate-950/85 border-t border-slate-800/80 px-2 py-1.5 md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-amber-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {item.badge && !isActive && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
