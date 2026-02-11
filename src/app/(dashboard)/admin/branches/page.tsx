'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { showDeleteConfirm } from '@/lib/swal';
import {
  GitBranch,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { staff: number };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const openCreateSheet = () => {
    setSheetMode('create');
    setSelectedBranch(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (branch: Branch) => {
    setSheetMode('edit');
    setSelectedBranch(branch);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('cabang ini');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBranches();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menghapus cabang');
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      if (res.ok) {
        fetchBranches();
      }
    } catch (error) {
      console.error('Failed to toggle branch:', error);
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    const endpoint =
      sheetMode === 'create' ? '/api/admin/branches' : `/api/admin/branches/${selectedBranch?.id}`;
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
        fetchBranches();
      } else {
        const result = await res.json();
        toast.error(result.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Failed to save branch:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Cabang</h1>
          <p className="text-slate-400">Kelola cabang kantor notaris</p>
        </div>
        <Button onClick={openCreateSheet} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Cabang
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="text-center py-12">
            <GitBranch className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
            <p className="text-slate-500">Belum ada cabang</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={`bg-slate-900 border-slate-800 transition-all hover:border-slate-700 ${
                !branch.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        branch.isActive ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                      }`}
                    >
                      <GitBranch
                        className={`w-5 h-5 ${
                          branch.isActive ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{branch.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          branch.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {branch.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(branch)}
                      className="text-slate-400 hover:text-white h-8 w-8"
                      title={branch.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {branch.isActive ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSheet(branch)}
                      className="text-slate-400 hover:text-white h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(branch.id)}
                      className="text-slate-400 hover:text-red-400 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {branch.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-400">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-400">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-400">{branch.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm pt-1 border-t border-slate-800">
                  <Users className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-400">{branch._count.staff} staff</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'create' ? 'Tambah Cabang' : 'Edit Cabang'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {sheetMode === 'create' ? 'Isi informasi cabang baru' : 'Perbarui informasi cabang'}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.currentTarget));
            }}
            className="space-y-4 mt-6"
          >
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Cabang *</Label>
              <Input
                name="name"
                defaultValue={selectedBranch?.name || ''}
                required
                placeholder="Cabang Jakarta Pusat"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Alamat</Label>
              <Input
                name="address"
                defaultValue={selectedBranch?.address || ''}
                placeholder="Jl. Sudirman No. 123"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Telepon</Label>
              <Input
                name="phone"
                defaultValue={selectedBranch?.phone || ''}
                placeholder="021-1234567"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                name="email"
                type="email"
                defaultValue={selectedBranch?.email || ''}
                placeholder="cabang@example.com"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

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
        </SheetContent>
      </Sheet>
    </div>
  );
}
