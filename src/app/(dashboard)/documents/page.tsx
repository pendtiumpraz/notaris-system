'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { formatDate } from '@/lib/utils';

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  client: { user: { name: string } };
  staff: { user: { name: string } } | null;
  documentType: { name: string };
}

interface DocumentType {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-slate-500/20 text-slate-400',
    icon: <FileText className="w-4 h-4" />,
  },
  SUBMITTED: {
    label: 'Diajukan',
    color: 'bg-blue-500/20 text-blue-400',
    icon: <Upload className="w-4 h-4" />,
  },
  IN_REVIEW: {
    label: 'Dalam Review',
    color: 'bg-yellow-500/20 text-yellow-400',
    icon: <Clock className="w-4 h-4" />,
  },
  WAITING_SIGNATURE: {
    label: 'Menunggu TTD',
    color: 'bg-purple-500/20 text-purple-400',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-emerald-500/20 text-emerald-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-500/20 text-red-400',
    icon: <X className="w-4 h-4" />,
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-slate-500/20 text-slate-400' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-500/20 text-orange-400' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/document-types');
      if (res.ok) {
        const data = await res.json();
        setDocumentTypes(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
  }, [fetchDocuments, fetchDocumentTypes]);

  const openCreateSheet = () => {
    setSheetMode('create');
    setSelectedDocument(null);
    setIsSheetOpen(true);
  };

  const openViewSheet = (doc: Document) => {
    setSheetMode('view');
    setSelectedDocument(doc);
    setIsSheetOpen(true);
  };

  const openEditSheet = (doc: Document) => {
    setSheetMode('edit');
    setSelectedDocument(doc);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    const endpoint =
      sheetMode === 'create' ? '/api/documents' : `/api/documents/${selectedDocument?.id}`;
    const method = sheetMode === 'create' ? 'POST' : 'PUT';

    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (value) data[key] = value;
    });

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsSheetOpen(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dokumen</h1>
          <p className="text-slate-400">Kelola dokumen dan lacak statusnya</p>
        </div>
        <Button onClick={openCreateSheet} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Buat Dokumen
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Cari dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada dokumen</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-500">{doc.documentNumber}</span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[doc.status]?.color}`}
                        >
                          {statusConfig[doc.status]?.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${priorityConfig[doc.priority]?.color}`}
                        >
                          {priorityConfig[doc.priority]?.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-white truncate">{doc.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span>{doc.documentType.name}</span>
                        <span>Klien: {doc.client.user.name}</span>
                        {doc.staff && <span>Staff: {doc.staff.user.name}</span>}
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewSheet(doc)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isStaffOrAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditSheet(doc)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'create' && 'Buat Dokumen Baru'}
              {sheetMode === 'edit' && 'Edit Dokumen'}
              {sheetMode === 'view' && 'Detail Dokumen'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {sheetMode === 'view' ? 'Informasi lengkap dokumen' : 'Isi form di bawah ini'}
            </SheetDescription>
          </SheetHeader>

          {sheetMode === 'view' && selectedDocument ? (
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-slate-500 text-xs">Nomor Dokumen</Label>
                <p className="text-white">{selectedDocument.documentNumber}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Judul</Label>
                <p className="text-white">{selectedDocument.title}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Jenis Dokumen</Label>
                <p className="text-white">{selectedDocument.documentType.name}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Status</Label>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${statusConfig[selectedDocument.status]?.color}`}
                >
                  {statusConfig[selectedDocument.status]?.label}
                </span>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Prioritas</Label>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${priorityConfig[selectedDocument.priority]?.color}`}
                >
                  {priorityConfig[selectedDocument.priority]?.label}
                </span>
              </div>
              {selectedDocument.description && (
                <div>
                  <Label className="text-slate-500 text-xs">Deskripsi</Label>
                  <p className="text-white">{selectedDocument.description}</p>
                </div>
              )}
              <div>
                <Label className="text-slate-500 text-xs">Klien</Label>
                <p className="text-white">{selectedDocument.client.user.name}</p>
              </div>
              {selectedDocument.staff && (
                <div>
                  <Label className="text-slate-500 text-xs">Staff</Label>
                  <p className="text-white">{selectedDocument.staff.user.name}</p>
                </div>
              )}
              <div>
                <Label className="text-slate-500 text-xs">Tanggal Dibuat</Label>
                <p className="text-white">{formatDate(selectedDocument.createdAt)}</p>
              </div>
              {selectedDocument.dueDate && (
                <div>
                  <Label className="text-slate-500 text-xs">Tenggat Waktu</Label>
                  <p className="text-white">{formatDate(selectedDocument.dueDate)}</p>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(new FormData(e.currentTarget));
              }}
              className="space-y-4 mt-6"
            >
              <div className="space-y-2">
                <Label className="text-slate-300">Judul Dokumen</Label>
                <Input
                  name="title"
                  defaultValue={selectedDocument?.title || ''}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Jenis Dokumen</Label>
                <select
                  name="documentTypeId"
                  defaultValue={selectedDocument?.documentType?.name || ''}
                  required
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                >
                  <option value="">Pilih Jenis</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Deskripsi</Label>
                <textarea
                  name="description"
                  defaultValue={selectedDocument?.description || ''}
                  className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>
              {isStaffOrAdmin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Status</Label>
                      <select
                        name="status"
                        defaultValue={selectedDocument?.status || 'DRAFT'}
                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                      >
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Prioritas</Label>
                      <select
                        name="priority"
                        defaultValue={selectedDocument?.priority || 'NORMAL'}
                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                      >
                        {Object.entries(priorityConfig).map(([key, { label }]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tenggat Waktu</Label>
                    <Input
                      name="dueDate"
                      type="date"
                      defaultValue={selectedDocument?.dueDate?.split('T')[0] || ''}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </>
              )}

              <SheetFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSheetOpen(false)}
                  className="border-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
