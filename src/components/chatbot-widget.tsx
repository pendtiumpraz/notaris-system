'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
  History,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  ragSources?: string[];
}

function generateSessionToken(): string {
  return 'ct_' + crypto.randomUUID();
}

function getGreeting(role: string, name?: string | null): string {
  switch (role) {
    case 'CLIENT':
      return `Halo${name ? ' ' + name : ''}! 👋 Butuh bantuan dengan dokumen atau appointment?`;
    case 'STAFF':
      return `Halo${name ? ' ' + name : ''}! 👋 Ada pertanyaan tentang fitur editor atau workflow?`;
    case 'ADMIN':
      return `Halo${name ? ' ' + name : ''}! 👋 Butuh panduan mengelola kantor atau fitur admin?`;
    case 'SUPER_ADMIN':
      return `Halo${name ? ' ' + name : ''}! 👋 Ada yang bisa saya bantu? Saya bisa membantu semua fitur sistem.`;
    default:
      return 'Halo! 👋 Selamat datang di kantor notaris kami. Ada yang bisa saya bantu?';
  }
}

export default function ChatbotWidget() {
  const { data: authSession } = useSession();
  const userRole = (authSession?.user as { role?: string } | undefined)?.role || 'GUEST';
  const userName = authSession?.user?.name;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSources, setShowSources] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    let token = localStorage.getItem('chatbot_session_token');
    if (!token) {
      token = generateSessionToken();
      localStorage.setItem('chatbot_session_token', token);
    }
    setSessionToken(token);
    setMessages([{ role: 'assistant', content: getGreeting(userRole, userName) }]);
  }, [userRole, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = useCallback(() => {
    const newToken = generateSessionToken();
    localStorage.setItem('chatbot_session_token', newToken);
    setSessionToken(newToken);
    setSessionId(null);
    setMessages([{ role: 'assistant', content: getGreeting(userRole, userName) }]);
    setShowSources(null);
  }, [userRole, userName]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content })),
          sessionId,
          sessionToken,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.error }]);
        return;
      }

      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          tokens: data.tokens?.totalTokens,
          ragSources: data.ragSources?.length > 0 ? data.ragSources : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Buka chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[560px] rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden border border-slate-700/50 bg-slate-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Asisten Virtual</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <p className="text-emerald-100 text-[10px]">
                    {userRole === 'GUEST' ? 'Tamu' : userRole} • Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* New Chat */}
              <button
                onClick={startNewChat}
                className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                title="Chat Baru"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {/* Chat History (logged in only) */}
              {authSession?.user && (
                <a
                  href="/chat-history"
                  className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  title="Riwayat Chat"
                >
                  <History className="w-4 h-4" />
                </a>
              )}
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[400px]">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* RAG Sources (collapsible) */}
                {msg.ragSources && msg.ragSources.length > 0 && (
                  <div className="ml-9 mt-1">
                    <button
                      onClick={() => setShowSources(showSources === idx ? null : idx)}
                      className="flex items-center gap-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{msg.ragSources.length} sumber</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showSources === idx ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showSources === idx && (
                      <div className="mt-1 space-y-0.5">
                        {msg.ragSources.map((src, i) => (
                          <p key={i} className="text-[10px] text-slate-500 pl-1">
                            • {src}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Token info (subtle) */}
                {msg.tokens && msg.role === 'assistant' && (
                  <p className="ml-9 mt-0.5 text-[9px] text-slate-600">{msg.tokens} tokens</p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-slate-800 px-4 py-3 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                id="chatbot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
                disabled={isLoading}
              />
              <button
                id="chatbot-send"
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
