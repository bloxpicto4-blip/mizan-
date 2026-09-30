import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FuturisticPyramidEnvironment } from './components/background/FuturisticPyramidEnvironment';
import { CommandCenterView } from './components/command/CommandCenterView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

function MainApp() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('mizan_onboarded_v2');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans transition-colors selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      {/* Subtle Egyptian 3D Pyramid & Quantum Glass Environment */}
      <FuturisticPyramidEnvironment activeTab="chat" />

      {/* The Revolutionary AI Command Center */}
      <CommandCenterView />

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <OnboardingModal onComplete={() => {
          localStorage.setItem('mizan_onboarded_v2', 'true');
          setShowOnboarding(false);
        }} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
