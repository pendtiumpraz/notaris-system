'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FileText, Plus, Search, Edit, Trash2, Loader2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  estimatedDurationDays: number;
  isActive: boolean;
  createdAt: string;
}

export default function DocumentTypesPage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedDurationDays: 7,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<DocumentType | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/document-types');
      const data = await res.json();
      if (res.ok) {
        setDocumentTypes(data.documentTypes);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  const filteredTypes = documentTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(search.toLowerCase()) ||
      type.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      estimatedDurationDays: 7,
      isActive: true,
    });
    setIsSheetOpen(true);
  };

  const handleEdit = (type: DocumentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      estimatedDurationDays: type.estimatedDurationDays,
      isActive: type.isActive,
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.warning('Nama jenis dokumen wajib diisi');
      return;
    }

    try {
      setSaving(true);

      const url = editingType
        ? `/api/admin/document-types/${editingType.id}`
        : '/api/admin/document-types';
      const method = editingType ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchDocumentTypes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error saving document type:', error);
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      const res = await fetch(`/api/admin/document-types/${typeToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteDialogOpen(false);
        setTypeToDelete(null);
        fetchDocumentTypes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menghapus');
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jenis Dokumen</h1>
          <p className="text-slate-400">Kelola jenis dokumen yang tersedia</p>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Cari jenis dokumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Daftar Jenis Dokumen ({filteredTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada jenis dokumen</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredTypes.map((type) => (
                <div
                  key={type.id}
                  className="p-4 hover:bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{type.name}</p>
                        {!type.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-slate-400 line-clamp-1">{type.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Estimasi: {type.estimatedDurationDays} hari
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(type)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTypeToDelete(type);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800">
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingType ? 'Edit Jenis Dokumen' : 'Tambah Jenis Dokumen Baru'}
            </SheetTitle>
            <SheetDescription>
              {editingType
                ? 'Perbarui informasi jenis dokumen'
                : 'Isi form untuk menambah jenis dokumen baru'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Nama Jenis Dokumen *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="Contoh: Akta Jual Beli"
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700"
                rows={3}
                placeholder="Deskripsi singkat..."
              />
            </div>

            <div className="space-y-2">
              <Label>Estimasi Durasi (hari)</Label>
              <Input
                type="number"
                value={formData.estimatedDurationDays}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDurationDays: parseInt(e.target.value) || 1 })
                }
                className="bg-slate-800 border-slate-700"
                min={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsSheetOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving || !formData.name}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Hapus Jenis Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jenis dokumen &quot;{typeToDelete?.name}&quot;?
              Jenis dokumen yang sedang digunakan tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 hover:bg-slate-700">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
