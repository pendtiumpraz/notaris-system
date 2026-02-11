'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
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
  Users,
  Shield,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
  attachments?: MessageAttachment[];
}

interface Conversation {
  id: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  document: { id: string; title: string; documentNumber: string } | null;
  participants: Array<{
    user: { id: string; name: string; avatarUrl: string | null; role?: string };
    lastReadAt: string | null;
  }>;
  messages: Message[];
  _count: { messages: number };
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  staff?: { position: string } | null;
  client?: { companyName: string } | null;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CLIENT: 'Klien',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/20 text-purple-400',
  ADMIN: 'bg-blue-500/20 text-blue-400',
  STAFF: 'bg-emerald-500/20 text-emerald-400',
  CLIENT: 'bg-slate-500/20 text-slate-400',
};

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
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<AvailableUser | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [aiDrafting, setAiDrafting] = useState(false);

  const userRole = (session?.user as { role?: string })?.role || '';
  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchAvailableUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/conversations/users');
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
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

  // Polling: refresh messages every 5 seconds when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConversation.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages]);

  // Polling: refresh conversation list every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation) return;

    setIsSending(true);
    try {
      let res;
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('content', newMessage || '📎 Lampiran');
        attachments.forEach((file) => formData.append('attachments', file));
        res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage }),
        });
      }

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
        setAttachments([]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024); // 10MB limit
    if (validFiles.length < files.length) {
      toast.warning('Beberapa file melebihi batas 10MB dan dilewati.');
    }
    setAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = ''; // reset input
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number | string) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImageMime = (mime: string) => mime.startsWith('image/');

  const handleOpenNewConversation = () => {
    setShowNewConversation(true);
    setSelectedRecipient(null);
    setUserSearchQuery('');
    fetchAvailableUsers();
  };

  const handleCreateConversation = async () => {
    if (!selectedRecipient) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedRecipient.id }),
      });

      if (res.ok) {
        const conv = await res.json();
        // Check if conversation already exists in list
        const existingIndex = conversations.findIndex((c) => c.id === conv.id);
        if (existingIndex === -1) {
          setConversations((prev) => [conv, ...prev]);
        }
        setSelectedConversation(conv);
        setShowNewConversation(false);
        setSelectedRecipient(null);
        fetchMessages(conv.id);
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

  const filteredUsers = availableUsers.filter((user) => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.staff?.position?.toLowerCase().includes(searchLower) ||
      user.client?.companyName?.toLowerCase().includes(searchLower)
    );
  });

  const getOtherParticipants = (conv: Conversation) => {
    return conv.participants
      .filter((p) => p.user.id !== session?.user?.id)
      .map((p) => p.user.name)
      .join(', ');
  };

  const getOtherParticipantRole = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.user.id !== session?.user?.id);
    return other?.user?.role || '';
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'STAFF':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
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
              onClick={handleOpenNewConversation}
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
              <Button
                size="sm"
                onClick={handleOpenNewConversation}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Mulai Percakapan
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMessage = getLastMessage(conv);
              const isSelected = selectedConversation?.id === conv.id;
              const otherRole = getOtherParticipantRole(conv);

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 text-left border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                    isSelected ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                      {conv.document ? <FileText className="w-5 h-5" /> : getRoleIcon(otherRole)}
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
                      {otherRole && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${roleColors[otherRole]}`}>
                          {roleLabels[otherRole]}
                        </span>
                      )}
                      {lastMessage && (
                        <p className="text-sm text-slate-400 truncate mt-1">
                          {lastMessage.isMe && <span className="text-emerald-400">Anda: </span>}
                          {lastMessage.content}
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
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {selectedConversation.document ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    getRoleIcon(getOtherParticipantRole(selectedConversation))
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedConversation.subject ||
                      selectedConversation.document?.title ||
                      getOtherParticipants(selectedConversation)}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {roleLabels[getOtherParticipantRole(selectedConversation)] || 'Percakapan'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada pesan. Mulai percakapan!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender.id === session?.user?.id;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] ${
                          isMe ? 'bg-emerald-600' : 'bg-slate-800'
                        } rounded-2xl px-4 py-2`}
                      >
                        {!isMe && (
                          <p className="text-xs text-emerald-400 mb-1">{msg.sender.name}</p>
                        )}
                        <p className="text-white">{msg.content}</p>
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors text-white/90"
                              >
                                {isImageMime(att.mimeType) ? (
                                  <img
                                    src={att.filePath}
                                    alt={att.fileName}
                                    className="w-20 h-20 object-cover rounded"
                                  />
                                ) : (
                                  <>
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs truncate">{att.fileName}</p>
                                      <p className="text-xs text-slate-400">
                                        {formatFileSize(att.fileSize)}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
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
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-slate-800">
              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="px-4 pt-3 flex gap-2 flex-wrap">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <Paperclip className="w-3 h-3 text-emerald-400" />
                      <span className="text-slate-300 max-w-[120px] truncate">{file.name}</span>
                      <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.txt"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-400 hover:text-emerald-400 shrink-0"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  {isStaffOrAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={aiDrafting || messages.length === 0}
                      onClick={async () => {
                        setAiDrafting(true);
                        try {
                          const recentMessages = messages.slice(-10).map((m) => ({
                            sender: m.sender.name,
                            content: m.content,
                          }));
                          const res = await fetch('/api/messages/ai-draft', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              conversationId: selectedConversation?.id,
                              recentMessages,
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setNewMessage(data.draft || '');
                          }
                        } catch (err) {
                          console.error('AI draft failed:', err);
                        } finally {
                          setAiDrafting(false);
                        }
                      }}
                      className="text-purple-400 hover:text-purple-300 shrink-0"
                      title="AI Draft Reply"
                    >
                      {aiDrafting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    type="submit"
                    disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Pilih percakapan untuk mulai chat</p>
              <Button
                onClick={handleOpenNewConversation}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Percakapan Baru
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-800 max-h-[80vh] flex flex-col">
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

            <div className="mb-4">
              <label className="text-sm text-slate-300 mb-2 block">Pilih Penerima</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Cari nama atau email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border border-slate-800 rounded-lg">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada pengguna ditemukan</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedRecipient(user)}
                      className={`w-full p-3 text-left hover:bg-slate-800/50 transition-colors ${
                        selectedRecipient?.id === user.id ? 'bg-emerald-600/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white truncate">{user.name}</p>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${roleColors[user.role]}`}
                            >
                              {roleLabels[user.role]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 truncate">{user.email}</p>
                          {user.staff?.position && (
                            <p className="text-xs text-slate-500">{user.staff.position}</p>
                          )}
                          {user.client?.companyName && (
                            <p className="text-xs text-slate-500">{user.client.companyName}</p>
                          )}
                        </div>
                        {selectedRecipient?.id === user.id && (
                          <CheckCheck className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowNewConversation(false)}
                className="border-slate-700"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={!selectedRecipient}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Mulai Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
