import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, register, loginAsGuest, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('الاسم مطلوب');
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'حصلت مشكلة بسيطة، جرّب تاني.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    await loginAsGuest();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 md:p-8 border-slate-800 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-amber-500/20">
            مـ
          </div>
          <h2 className="text-xl font-bold text-white font-sans">
            {user && user.id !== 'guest_user_1'
              ? `أهلاً بك، ${user.name}`
              : isRegister
              ? 'إنشاء حساب جديد في MIZAN AI'
              : 'تسجيل الدخول إلى MIZAN AI'}
          </h2>
          <p className="text-xs text-slate-400">
            احفظ محادثاتك وذاكرتك واستمتع بتجربة شخصية متكاملة
          </p>
        </div>

        {/* If already logged in with full account */}
        {user && user.id !== 'guest_user_1' ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl glass-card text-center space-y-1">
              <span className="text-xs text-slate-400 block">أنت مسجل حالياً بالبريد:</span>
              <span className="text-sm font-bold text-amber-300">{user.email}</span>
            </div>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  !isRegister ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  isRegister ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
                }`}
              >
                حساب جديد
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400">الاسم بالكامل</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد مصطفى"
                    className="w-full pl-3 pr-9 py-2 rounded-xl glass-card text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-9 py-2 rounded-xl glass-card text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">كلمة المرور</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2 rounded-xl glass-card text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {loading
                ? 'جاري التحميل...'
                : isRegister
                ? 'إنشاء الحساب والمتابعة'
                : 'دخول'}
            </button>

            {/* Quick Guest mode */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleGuest}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>متابعة تجريبية سريعة كضيف</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
