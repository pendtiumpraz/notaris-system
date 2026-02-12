'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Bot,
  User,
  Loader2,
  Clock,
  Hash,
  Zap,
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  totalMessages: number;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface SessionMessage {
  id: string;
  role: string;
  content: string;
  totalTokens: number;
  createdAt: string;
}

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, SessionMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chatbot/history?page=${page}&limit=15`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadMessages = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }

    if (sessionMessages[sessionId]) {
      setExpandedSession(sessionId);
      return;
    }

    setLoadingMessages(sessionId);
    try {
      const res = await fetch(`/api/chatbot/history/${sessionId}`);
      const data = await res.json();
      setSessionMessages((prev) => ({ ...prev, [sessionId]: data.messages }));
      setExpandedSession(sessionId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(null);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Hapus percakapan ini?')) return;
    try {
      await fetch(`/api/chatbot/history/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const filteredSessions = sessions.filter(
    (s) => !search || s.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);
  const totalMessages = sessions.reduce((sum, s) => sum + s.totalMessages, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-400" />
            Riwayat Chat
          </h1>
          <p className="text-slate-400 mt-1">Lihat semua percakapan Anda dengan asisten AI</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Total Percakapan
            </div>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Hash className="w-3.5 h-3.5" />
              Total Pesan
            </div>
            <p className="text-2xl font-bold">{totalMessages}</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Zap className="w-3.5 h-3.5" />
              Total Token
            </div>
            <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
          />
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada percakapan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden"
              >
                {/* Session Header */}
                <div
                  onClick={() => loadMessages(session.id)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.title || 'Percakapan tanpa judul'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>{session.totalMessages} pesan</span>
                      <span>{session.totalTokens.toLocaleString()} tokens</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {loadingMessages === session.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : expandedSession === session.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Messages */}
                {expandedSession === session.id && sessionMessages[session.id] && (
                  <div className="border-t border-slate-800 p-4 space-y-3 max-h-80 overflow-y-auto bg-slate-950/50">
                    {sessionMessages[session.id].map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-slate-800 text-sm disabled:opacity-30 hover:bg-slate-700"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-slate-800 text-sm disabled:opacity-30 hover:bg-slate-700"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
