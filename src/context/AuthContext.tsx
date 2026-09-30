import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserSettings } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { user } = await api.getMe();
      setUser(user);
      const { settings } = await api.getSettings();
      setSettings(settings);
    } catch (err) {
      console.log('No active session, defaulting to guest');
      setUser({
        id: 'guest_user_1',
        email: 'guest@mizan.ai',
        name: 'صديق ميزان',
        role: 'user',
        createdAt: new Date().toISOString(),
      });
      setSettings({
        userId: 'guest_user_1',
        language: 'egyptian',
        responseStyle: 'balanced',
        theme: 'dark',
        voiceRate: 1.0,
        voicePitch: 1.0,
        enableMemory: true,
        progressiveStudy: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('mizan_token', res.token);
    setUser(res.user);
    const { settings } = await api.getSettings();
    setSettings(settings);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register(name, email, pass);
    localStorage.setItem('mizan_token', res.token);
    setUser(res.user);
    const { settings } = await api.getSettings();
    setSettings(settings);
  };

  const loginAsGuest = async () => {
    localStorage.setItem('mizan_token', 'guest_user_1');
    await loadUserData();
  };

  const logout = () => {
    localStorage.removeItem('mizan_token');
    loginAsGuest();
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const { settings: updated } = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  const updateProfile = async (name: string, avatar?: string) => {
    const { user: updated } = await api.updateProfile(name, avatar);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        loading,
        login,
        register,
        loginAsGuest,
        logout,
        updateSettings,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
