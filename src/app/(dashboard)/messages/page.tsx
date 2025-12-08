'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Search,
  User,
  FileText,
  Paperclip,
  X,
  MoreVertical,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
}

interface Conversation {
  id: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  document: { id: string; title: string; documentNumber: string } | null;
  participants: Array<{
    user: { id: string; name: string; avatarUrl: string | null };
    lastReadAt: string | null;
  }>;
  messages: Message[];
  _count: { messages: number };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Mark as read
      fetch(`/api/conversations/${selectedConversation.id}/read`, { method: 'POST' });
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
        fetchConversations(); // Update last message preview
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject }),
      });

      if (res.ok) {
        const conv = await res.json();
        setConversations((prev) => [conv, ...prev]);
        setSelectedConversation(conv);
        setShowNewConversation(false);
        setNewSubject('');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(searchLower) ||
      conv.document?.title.toLowerCase().includes(searchLower) ||
      conv.participants.some((p) => p.user.name.toLowerCase().includes(searchLower))
    );
  });

  const getOtherParticipants = (conv: Conversation) => {
    return conv.participants
      .filter((p) => p.user.id !== session?.user?.id)
      .map((p) => p.user.name)
      .join(', ');
  };

  const getLastMessage = (conv: Conversation) => {
    if (conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1];
      return {
        content: last.content,
        time: last.createdAt,
        isMe: last.sender.id === session?.user?.id,
      };
    }
    return null;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversations List */}
      <div className="w-80 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Pesan</h2>
            <Button
              size="icon"
              onClick={() => setShowNewConversation(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada percakapan</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMessage = getLastMessage(conv);
              const isSelected = selectedConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 text-left border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    isSelected ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      {conv.document ? (
                        <FileText className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <User className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white truncate">
                          {conv.subject || conv.document?.title || getOtherParticipants(conv)}
                        </p>
                        {lastMessage && (
                          <span className="text-xs text-slate-500 shrink-0">
                            {new Date(lastMessage.time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-sm text-slate-400 truncate mt-1">
                          {lastMessage.isMe && <span className="text-emerald-400">Anda: </span>}
                          {lastMessage.content}
                        </p>
                      )}
                      {conv.document && (
                        <p className="text-xs text-slate-500 mt-1">
                          {conv.document.documentNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  {selectedConversation.document ? (
                    <FileText className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <User className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedConversation.subject ||
                      selectedConversation.document?.title ||
                      getOtherParticipants(selectedConversation)}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {selectedConversation.participants.length} peserta
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender.id === session?.user?.id;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] ${
                        isMe ? 'bg-emerald-600' : 'bg-slate-800'
                      } rounded-2xl px-4 py-2`}
                    >
                      {!isMe && <p className="text-xs text-emerald-400 mb-1">{msg.sender.name}</p>}
                      <p className="text-white">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span className="text-xs text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-slate-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="text-slate-400">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Pilih percakapan untuk mulai chat</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Percakapan Baru</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewConversation(false)}
                className="text-slate-400"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleCreateConversation}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Subjek</label>
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Masukkan subjek percakapan..."
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewConversation(false)}
                    className="border-slate-700"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Buat Percakapan
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
