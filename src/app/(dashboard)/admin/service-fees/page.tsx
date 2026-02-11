'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { showDeleteConfirm } from '@/lib/swal';

interface ServiceFee {
  id: string;
  name: string;
  category: string;
  baseFee: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'notaris', label: 'Notaris' },
  { value: 'ppat', label: 'PPAT' },
  { value: 'legalisasi', label: 'Legalisasi' },
  { value: 'lainnya', label: 'Lainnya' },
];

const categoryColors: Record<string, string> = {
  notaris: 'bg-emerald-500/20 text-emerald-400',
  ppat: 'bg-blue-500/20 text-blue-400',
  legalisasi: 'bg-purple-500/20 text-purple-400',
  lainnya: 'bg-slate-500/20 text-slate-400',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ServiceFeesPage() {
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<ServiceFee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'notaris',
    baseFee: '',
    description: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      const res = await fetch(`/api/service-fees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFees(data.fees || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const filtered = fees.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreate = () => {
    setEditingFee(null);
    setFormData({ name: '', category: 'notaris', baseFee: '', description: '', isActive: true });
    setIsSheetOpen(true);
  };

  const handleEdit = (fee: ServiceFee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      category: fee.category,
      baseFee: fee.baseFee.toString(),
      description: fee.description || '',
      isActive: fee.isActive,
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.baseFee) {
      toast.warning('Nama dan tarif dasar wajib diisi');
      return;
    }

    try {
      setSaving(true);
      const url = editingFee ? `/api/service-fees/${editingFee.id}` : '/api/service-fees';
      const method = editingFee ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingFee ? 'Tarif berhasil diperbarui' : 'Tarif berhasil ditambahkan');
        setIsSheetOpen(false);
        fetchFees();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fee: ServiceFee) => {
    const confirmed = await showDeleteConfirm(`Hapus tarif "${fee.name}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/service-fees/${fee.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Tarif berhasil dihapus');
        fetchFees();
      } else {
        toast.error('Gagal menghapus');
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Tarif Layanan
          </h1>
          <p className="text-slate-400">
            Kelola tarif standar per jenis akta dan layanan notaris/PPAT
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tarif
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Cari tarif..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const catFees = fees.filter((f) => f.category === cat.value && f.isActive);
          const avgFee =
            catFees.length > 0
              ? catFees.reduce((sum, f) => sum + f.baseFee, 0) / catFees.length
              : 0;
          return (
            <Card key={cat.value} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 uppercase">{cat.label}</p>
                <p className="text-xl font-bold text-white mt-1">{catFees.length}</p>
                {avgFee > 0 && (
                  <p className="text-xs text-slate-500 mt-1">Rata-rata: {formatCurrency(avgFee)}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Daftar Tarif ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada tarif</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                      Tarif Dasar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paginated.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{fee.name}</p>
                        {fee.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{fee.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[fee.category] || categoryColors.lainnya}`}
                        >
                          {CATEGORIES.find((c) => c.value === fee.category)?.label || fee.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-mono font-medium">
                        {formatCurrency(fee.baseFee)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs ${fee.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                        >
                          {fee.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(fee)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(fee)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="border-slate-700 text-slate-400"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="border-slate-700 text-slate-400"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800">
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingFee ? 'Edit Tarif' : 'Tambah Tarif Baru'}
            </SheetTitle>
            <SheetDescription>
              {editingFee ? 'Perbarui informasi tarif' : 'Isi form untuk menambah tarif layanan'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="Contoh: Akta Pendirian PT"
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tarif Dasar (Rp) *</Label>
              <Input
                type="number"
                value={formData.baseFee}
                onChange={(e) => setFormData({ ...formData, baseFee: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="500000"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700"
                rows={3}
                placeholder="Catatan tambahan..."
              />
            </div>

            {editingFee && (
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}

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
                disabled={saving || !formData.name || !formData.baseFee}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
