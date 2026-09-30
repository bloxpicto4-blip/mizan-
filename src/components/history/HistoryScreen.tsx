import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Archive,
  Folder,
  Plus,
  ChevronLeft,
  Clock,
  Check,
} from 'lucide-react';
import { Conversation } from '../../types';
import { api } from '../../services/api';

interface HistoryScreenProps {
  onSelectConversation: (convId: string) => void;
  onNewChat: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onSelectConversation,
  onNewChat,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = () => {
    api.getConversations().then((res) => setConversations(res.conversations));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleTogglePin = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.updateConversation(c.id, { pinned: !c.pinned });
    loadConversations();
  };

  const handleToggleArchive = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.updateConversation(c.id, { archived: !c.archived });
    loadConversations();
  };

  const handleDelete = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`هل أنت متأكد من حذف محادثة "${c.title}"؟`)) {
      await api.deleteConversation(c.id);
      loadConversations();
    }
  };

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = async (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await api.updateConversation(c.id, { title: editTitle.trim() });
      setEditingId(null);
      loadConversations();
    }
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedFolder === 'pinned') return matchesSearch && c.pinned;
    if (selectedFolder === 'archived') return matchesSearch && c.archived;
    return matchesSearch && !c.archived;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header & New Chat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white font-sans flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <span>سجل المحادثات والأرشيف</span>
          </h1>
          <p className="text-xs text-slate-400">
            جميع محادثاتك مع MIZAN AI محفوظة ومنظمة للرجوع إليها في أي وقت.
          </p>
        </div>

        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>محادثة جديدة</span>
        </button>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في المحادثات..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl glass-card text-xs md:text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-amber-400/80 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSelectedFolder('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setSelectedFolder('pinned')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              selectedFolder === 'pinned'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>المثبتة</span>
          </button>
          <button
            onClick={() => setSelectedFolder('archived')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              selectedFolder === 'archived'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-3 h-3" />
            <span>الأرشيف</span>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-2.5">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className="p-4 rounded-2xl glass-panel hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2.5 rounded-xl ${c.pinned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-400'}`}>
                {c.pinned ? <Pin className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>

              <div className="truncate flex-1">
                {editingId === c.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleSaveRename(c, e)}
                      className="p-1 rounded bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 truncate">
                      {c.title}
                    </span>
                    {c.pinned && (
                      <span className="text-[10px] text-amber-400 px-1.5 py-0.2 bg-amber-500/10 rounded-full border border-amber-500/20">
                        مثبتة
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-slate-400 truncate mt-0.5">
                  {c.lastMessagePreview || 'لا توجد رسائل بعد...'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleTogglePin(c, e)}
                className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${c.pinned ? 'text-amber-400' : 'text-slate-400'}`}
                title={c.pinned ? 'إلغاء التثبيت' : 'تثبيت في الأعلى'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleStartRename(c, e)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="إعادة التسمية"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleToggleArchive(c, e)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={c.archived ? 'إلغاء الأرشفة' : 'أرشفة'}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => handleDelete(c, e)}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="حذف المحادثة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-transform group-hover:-translate-x-1 mr-1" />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="glass-panel p-10 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">لسه مفيش محادثات هنا</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              ابدأ أول محادثة ذكية مع MIZAN AI واستفد من كل الأدوات!
            </p>
            <button
              onClick={onNewChat}
              className="mt-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>محادثة جديدة الآن</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
