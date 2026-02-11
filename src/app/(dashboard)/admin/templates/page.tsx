'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { showDeleteConfirm } from '@/lib/swal';
import { Stamp, Plus, Search, Eye, Edit, Trash2, Loader2, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface DocumentType {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  documentType: DocumentType | null;
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholders: any[];
  category: string | null;
  isActive: boolean;
  createdBy: { name: string };
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: 'akta', label: 'Akta Notaris' },
  { value: 'surat', label: 'Surat' },
  { value: 'perjanjian', label: 'Perjanjian' },
  { value: 'kuasa', label: 'Surat Kuasa' },
  { value: 'keterangan', label: 'Keterangan' },
  { value: 'lainnya', label: 'Lainnya' },
];

const DEFAULT_PLACEHOLDERS = [
  { key: 'nama_klien', label: 'Nama Klien' },
  { key: 'nik', label: 'NIK' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'tempat_lahir', label: 'Tempat Lahir' },
  { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
  { key: 'agama', label: 'Agama' },
  { key: 'pekerjaan', label: 'Pekerjaan' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'status_perkawinan', label: 'Status Perkawinan' },
  { key: 'kewarganegaraan', label: 'Kewarganegaraan' },
  { key: 'nama_pasangan', label: 'Nama Pasangan' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'nomor_akta', label: 'Nomor Akta' },
  { key: 'nama_kantor', label: 'Nama Kantor Notaris' },
  { key: 'nama_notaris', label: 'Nama Notaris' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [sheetMode, setSheetMode] = useState<'closed' | 'create' | 'view' | 'edit'>('closed');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDocTypeId, setFormDocTypeId] = useState('');
  const [formContent, setFormContent] = useState('');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDocTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/document-types');
      if (res.ok) {
        const data = await res.json();
        setDocTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error('Failed to fetch doc types:', error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchDocTypes();
  }, [fetchTemplates, fetchDocTypes]);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormCategory('');
    setFormDocTypeId('');
    setFormContent('');
    setSheetMode('create');
  };

  const openView = (t: Template) => {
    setSelectedTemplate(t);
    setSheetMode('view');
  };

  const openEdit = (t: Template) => {
    setSelectedTemplate(t);
    setFormName(t.name);
    setFormDesc(t.description || '');
    setFormCategory(t.category || '');
    setFormDocTypeId(t.documentType?.id || '');
    setFormContent(t.content);
    setSheetMode('edit');
  };

  const insertPlaceholder = (key: string) => {
    setFormContent((prev) => prev + `{{${key}}}`);
  };

  const handleSave = async () => {
    if (!formName || !formContent) {
      toast.warning('Nama dan konten template harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDesc || null,
        category: formCategory || null,
        documentTypeId: formDocTypeId || null,
        content: formContent,
        placeholders: DEFAULT_PLACEHOLDERS,
      };

      const isEdit = sheetMode === 'edit' && selectedTemplate;
      const url = isEdit ? `/api/templates/${selectedTemplate.id}` : '/api/templates';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Template diperbarui' : 'Template dibuat');
        setSheetMode('closed');
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('Hapus template ini?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Template dihapus');
        fetchTemplates();
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Konten template disalin');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Stamp className="w-7 h-7 text-emerald-400" />
            Template Akta
          </h1>
          <p className="text-slate-400 mt-1">
            Template dokumen notaris dengan placeholder otomatis
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Buat Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari template..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template List */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Belum ada template</p>
            <p className="text-sm text-slate-500 mt-1">Buat template akta pertama Anda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{t.name}</h3>
                    {t.category && (
                      <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs mt-1">
                        {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                      </span>
                    )}
                  </div>
                </div>
                {t.description && (
                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{t.description}</p>
                )}
                {t.documentType && (
                  <p className="text-xs text-slate-500 mb-2">Jenis: {t.documentType.name}</p>
                )}
                <p className="text-xs text-slate-500 mb-3">
                  {t.content.length > 100 ? t.content.substring(0, 100) + '...' : t.content}
                </p>
                <div className="flex items-center gap-1 border-t border-slate-700 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => openView(t)} title="Lihat">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)} title="Edit">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyContent(t.content)}
                    title="Salin"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(t.id)}
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet
        open={sheetMode === 'create' || sheetMode === 'edit'}
        onOpenChange={() => setSheetMode('closed')}
      >
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'edit' ? 'Edit Template' : 'Buat Template Baru'}
            </SheetTitle>
            <SheetDescription>
              Gunakan placeholder {'{{nama}}'} untuk isi otomatis dari data klien
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nama Template *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Contoh: Akta Jual Beli"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Pilih...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Jenis Dokumen
                </label>
                <select
                  value={formDocTypeId}
                  onChange={(e) => setFormDocTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Pilih...</option>
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>

            {/* Placeholder Buttons */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sisipkan Placeholder
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => insertPlaceholder(p.key)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-emerald-400 transition-colors"
                    title={`Sisipkan {{${p.key}}}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Konten Template *
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm leading-relaxed"
                placeholder={
                  'Pada hari ini, {{tanggal}}, menghadap kepada saya, {{nama_notaris}}, Notaris di {{nama_kantor}}, dengan dihadiri oleh saksi-saksi yang akan disebut pada bagian akhir akta ini:\n\nNama: {{nama_klien}}\nNIK: {{nik}}\nTempat/Tanggal Lahir: {{tempat_lahir}}, {{tanggal_lahir}}\n...'
                }
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetMode('closed')}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {sheetMode === 'edit' ? 'Simpan Perubahan' : 'Buat Template'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View Sheet */}
      <Sheet open={sheetMode === 'view'} onOpenChange={() => setSheetMode('closed')}>
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-2xl overflow-y-auto">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selectedTemplate.name}</SheetTitle>
                <SheetDescription>
                  {selectedTemplate.description || 'Preview template'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {selectedTemplate.category && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                      {CATEGORIES.find((c) => c.value === selectedTemplate.category)?.label}
                    </span>
                  )}
                  {selectedTemplate.documentType && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {selectedTemplate.documentType.name}
                    </span>
                  )}
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <pre className="text-white text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedTemplate.content}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyContent(selectedTemplate.content)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Salin Konten
                  </Button>
                  <Button
                    onClick={() => openEdit(selectedTemplate)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
