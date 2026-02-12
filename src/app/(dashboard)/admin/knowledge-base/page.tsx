'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Save,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Shield,
} from 'lucide-react';

interface KBItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: string;
  allowedRoles: string[];
  isActive: boolean;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
  createdBy: { name: string } | null;
}

const CATEGORIES = ['fitur', 'flow', 'faq', 'legal', 'harga', 'prosedur', 'lainnya'];
const ROLES = ['GUEST', 'CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'];

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('fitur');
  const [formContent, setFormContent] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(ROLES);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge-base');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch KB items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('fitur');
    setFormContent('');
    setFormRoles(ROLES);
    setCreating(false);
    setEditing(null);
  };

  const startEdit = (item: KBItem) => {
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormCategory(item.category);
    setFormContent(item.content);
    setFormRoles(item.allowedRoles);
    setEditing(item.id);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!formTitle || !formContent) return;
    setSaving(true);

    try {
      const payload = {
        title: formTitle,
        description: formDescription || null,
        category: formCategory,
        content: formContent,
        allowedRoles: formRoles,
      };

      if (editing) {
        await fetch(`/api/admin/knowledge-base/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item knowledge base ini?')) return;
    try {
      await fetch(`/api/admin/knowledge-base/${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleActive = async (item: KBItem) => {
    try {
      await fetch(`/api/admin/knowledge-base/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      fetchItems();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const toggleRole = (role: string) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const filtered = items.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    return true;
  });

  const isFormOpen = creating || editing;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-400" />
              Knowledge Base
            </h1>
            <p className="text-slate-400 mt-1">Kelola knowledge base untuk chatbot AI RAG</p>
          </div>
          {!isFormOpen && (
            <button
              onClick={() => {
                resetForm();
                setCreating(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Item
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {isFormOpen && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {editing ? 'Edit Knowledge' : 'Tambah Knowledge Baru'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Judul *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                    placeholder="Contoh: Panduan Navigasi Client"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  placeholder="Deskripsi singkat (opsional)"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Konten (Markdown) *</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-600 resize-y"
                  placeholder="# Judul&#10;&#10;## Bagian 1&#10;Konten..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Role yang bisa akses
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        formRoles.includes(role)
                          ? 'bg-emerald-600/20 border-emerald-600/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle || !formContent}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editing ? 'Update' : 'Simpan'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari knowledge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada item knowledge base</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900 rounded-xl border transition-colors ${
                  item.isActive ? 'border-slate-800' : 'border-red-900/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                        <Layers className="w-3 h-3" />
                        {item._count.chunks}
                      </span>
                      {!item.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/30 text-red-400">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex gap-0.5">
                        {item.allowedRoles.map((r) => (
                          <span
                            key={r}
                            className={`text-[8px] px-1 py-0 rounded ${
                              r === 'GUEST'
                                ? 'bg-gray-700 text-gray-300'
                                : r === 'CLIENT'
                                  ? 'bg-blue-900/40 text-blue-300'
                                  : r === 'STAFF'
                                    ? 'bg-green-900/40 text-green-300'
                                    : r === 'ADMIN'
                                      ? 'bg-amber-900/40 text-amber-300'
                                      : 'bg-purple-900/40 text-purple-300'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                      title="Preview"
                    >
                      {expandedId === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-blue-400"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className={`p-1.5 rounded hover:bg-slate-800 text-xs ${
                        item.isActive ? 'text-green-400' : 'text-red-400'
                      }`}
                      title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {item.isActive ? '●' : '○'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded hover:bg-red-900/20 text-slate-500 hover:text-red-400"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Preview */}
                {expandedId === item.id && (
                  <div className="border-t border-slate-800 px-4 py-3 bg-slate-950/50">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                      {item.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-6 text-center text-xs text-slate-600">
          {items.length} item · {items.reduce((sum, i) => sum + i._count.chunks, 0)} chunks · Seed
          data: <code className="text-emerald-600">npx tsx prisma/seed-knowledge.ts</code>
        </div>
      </div>
    </div>
  );
}
