'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Wrench, Plus, Search, Edit, Trash2, Loader2, Clock } from 'lucide-react';
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

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMinutes: 30,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      durationMinutes: 30,
      isActive: true,
    });
    setIsSheetOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
    });
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.warning('Nama layanan wajib diisi');
      return;
    }

    try {
      setSaving(true);

      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const res = await fetch(`/api/admin/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menghapus');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Gagal menghapus');
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Layanan</h1>
          <p className="text-slate-400">Kelola layanan yang tersedia untuk jadwal</p>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Layanan
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Cari layanan..."
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
            <Wrench className="w-5 h-5" />
            Daftar Layanan ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada layanan</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4 hover:bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{service.name}</p>
                        {!service.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-slate-400 line-clamp-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Durasi: {formatDuration(service.durationMinutes)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setServiceToDelete(service);
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
              {editingService ? 'Edit Layanan' : 'Tambah Layanan Baru'}
            </SheetTitle>
            <SheetDescription>
              {editingService
                ? 'Perbarui informasi layanan'
                : 'Isi form untuk menambah layanan baru'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="Contoh: Konsultasi"
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
              <Label>Durasi (menit)</Label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 15 })
                }
                className="bg-slate-800 border-slate-700"
                min={15}
                step={15}
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
            <AlertDialogTitle className="text-white">Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus layanan &quot;{serviceToDelete?.name}&quot;?
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
