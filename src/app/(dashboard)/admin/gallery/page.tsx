'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { showDeleteConfirm } from '@/lib/swal';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  GripVertical,
  Eye,
  EyeOff,
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

interface GalleryImage {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/gallery');
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const categories = Array.from(new Set(images.map((img) => img.category).filter(Boolean)));

  const filteredImages = categoryFilter
    ? images.filter((img) => img.category === categoryFilter)
    : images;

  const openCreateSheet = () => {
    setSheetMode('create');
    setSelectedImage(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (image: GalleryImage) => {
    setSheetMode('edit');
    setSelectedImage(image);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('gambar ini');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchImages();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleActive = async (image: GalleryImage) => {
    try {
      await fetch(`/api/admin/gallery/${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !image.isActive }),
      });
      fetchImages();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    const endpoint =
      sheetMode === 'create' ? '/api/admin/gallery' : `/api/admin/gallery/${selectedImage?.id}`;
    const method = sheetMode === 'create' ? 'POST' : 'PUT';

    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key === 'order') {
        data[key] = parseInt(value as string) || 0;
      } else if (value) {
        data[key] = value;
      }
    });

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsSheetOpen(false);
        fetchImages();
      } else {
        const result = await res.json();
        toast.error(result.error || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Galeri</h1>
          <p className="text-slate-400">Kelola gambar galeri website</p>
        </div>
        <Button onClick={openCreateSheet} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Gambar
        </Button>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={categoryFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('')}
            className={categoryFilter === '' ? 'bg-emerald-600' : 'border-slate-700 text-slate-400'}
          >
            Semua
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat!)}
              className={
                categoryFilter === cat ? 'bg-emerald-600' : 'border-slate-700 text-slate-400'
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : filteredImages.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
            <p className="text-slate-500">Belum ada gambar di galeri</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredImages.map((image) => (
            <Card
              key={image.id}
              className={`bg-slate-900 border-slate-800 overflow-hidden group transition-all hover:border-slate-700 ${
                !image.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="aspect-video relative">
                <img
                  src={image.imageUrl}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditSheet(image)}
                    className="text-white hover:bg-white/20 h-9 w-9"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(image)}
                    className="text-white hover:bg-white/20 h-9 w-9"
                    title={image.isActive ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {image.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(image.id)}
                    className="text-white hover:bg-red-500/50 h-9 w-9"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {image.title || 'Tanpa judul'}
                    </p>
                    {image.category && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {image.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs">{image.order}</span>
                  </div>
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
              {sheetMode === 'create' ? 'Tambah Gambar' : 'Edit Gambar'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {sheetMode === 'create'
                ? 'Tambah gambar baru ke galeri'
                : 'Perbarui informasi gambar'}
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
              <Label className="text-slate-300">Judul</Label>
              <Input
                name="title"
                defaultValue={selectedImage?.title || ''}
                placeholder="Judul gambar"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">URL Gambar *</Label>
              <Input
                name="imageUrl"
                defaultValue={selectedImage?.imageUrl || ''}
                required
                placeholder="https://example.com/image.jpg"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Kategori</Label>
              <Input
                name="category"
                defaultValue={selectedImage?.category || ''}
                placeholder="Kantor, Acara, dll."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Urutan</Label>
              <Input
                name="order"
                type="number"
                defaultValue={selectedImage?.order ?? 0}
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
