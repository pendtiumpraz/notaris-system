'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { showDeleteConfirm } from '@/lib/swal';
import {
  Settings,
  HelpCircle,
  MessageSquare,
  Users,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
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

type ContentTab = 'settings' | 'faq' | 'testimonial' | 'team' | 'services';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order: number;
  isActive: boolean;
}

interface Testimonial {
  id: string;
  clientName: string;
  clientTitle: string | null;
  content: string;
  rating: number;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string | null;
  photo: string | null;
  email: string | null;
  phone: string | null;
  order: number;
  isActive: boolean;
}

interface ServiceInfo {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  features: string[] | null;
  price: string | null;
  order: number;
  isActive: boolean;
}

const tabs = [
  { id: 'settings' as ContentTab, label: 'Pengaturan', icon: Settings },
  { id: 'faq' as ContentTab, label: 'FAQ', icon: HelpCircle },
  { id: 'testimonial' as ContentTab, label: 'Testimoni', icon: MessageSquare },
  { id: 'team' as ContentTab, label: 'Tim', icon: Users },
  { id: 'services' as ContentTab, label: 'Layanan', icon: Briefcase },
];

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('settings');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<
    FAQ | Testimonial | TeamMember | ServiceInfo | null
  >(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
        setFaqs(data.faqs || []);
        setTestimonials(data.testimonials || []);
        setTeamMembers(data.teamMembers || []);
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateSheet = () => {
    setSheetMode('create');
    setEditingItem(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (item: FAQ | Testimonial | TeamMember | ServiceInfo) => {
    setSheetMode('edit');
    setEditingItem(item);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('item ini');
    if (!confirmed) return;

    const endpoint = `/api/admin/${activeTab}/${id}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSaveItem = async (formData: FormData) => {
    setIsSaving(true);
    const endpoint =
      sheetMode === 'create'
        ? `/api/admin/${activeTab}`
        : `/api/admin/${activeTab}/${editingItem?.id}`;
    const method = sheetMode === 'create' ? 'POST' : 'PUT';

    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (key === 'features') {
        data[key] = (value as string).split('\n').filter(Boolean);
      } else if (key === 'order' || key === 'rating') {
        data[key] = parseInt(value as string, 10);
      } else if (key === 'isActive' || key === 'isFeatured') {
        data[key] = value === 'true';
      } else {
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
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manajemen Konten</h1>
        <p className="text-slate-400">Kelola konten website publik</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'settings' && (
        <SettingsTab
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveSettings}
          isSaving={isSaving}
        />
      )}

      {activeTab === 'faq' && (
        <ListTab
          title="FAQ"
          items={faqs}
          onAdd={openCreateSheet}
          onEdit={openEditSheet}
          onDelete={handleDelete}
          renderItem={(item: FAQ) => (
            <div>
              <p className="font-medium text-white">{item.question}</p>
              <p className="text-sm text-slate-400 line-clamp-2">{item.answer}</p>
            </div>
          )}
        />
      )}

      {activeTab === 'testimonial' && (
        <ListTab
          title="Testimoni"
          items={testimonials}
          onAdd={openCreateSheet}
          onEdit={openEditSheet}
          onDelete={handleDelete}
          renderItem={(item: Testimonial) => (
            <div>
              <p className="font-medium text-white">{item.clientName}</p>
              <p className="text-sm text-emerald-400">{item.clientTitle}</p>
              <p className="text-sm text-slate-400 line-clamp-2 mt-1">{item.content}</p>
            </div>
          )}
        />
      )}

      {activeTab === 'team' && (
        <ListTab
          title="Tim"
          items={teamMembers}
          onAdd={openCreateSheet}
          onEdit={openEditSheet}
          onDelete={handleDelete}
          renderItem={(item: TeamMember) => (
            <div>
              <p className="font-medium text-white">{item.name}</p>
              <p className="text-sm text-emerald-400">{item.position}</p>
            </div>
          )}
        />
      )}

      {activeTab === 'services' && (
        <ListTab
          title="Layanan"
          items={services}
          onAdd={openCreateSheet}
          onEdit={openEditSheet}
          onDelete={handleDelete}
          renderItem={(item: ServiceInfo) => (
            <div>
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
            </div>
          )}
        />
      )}

      {/* Sheet for Create/Edit */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'create' ? 'Tambah' : 'Edit'} {activeTab === 'faq' && 'FAQ'}
              {activeTab === 'testimonial' && 'Testimoni'}
              {activeTab === 'team' && 'Anggota Tim'}
              {activeTab === 'services' && 'Layanan'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">Isi form di bawah ini</SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveItem(new FormData(e.currentTarget));
            }}
            className="space-y-4 mt-6"
          >
            {activeTab === 'faq' && <FAQForm item={editingItem as FAQ | null} />}
            {activeTab === 'testimonial' && (
              <TestimonialForm item={editingItem as Testimonial | null} />
            )}
            {activeTab === 'team' && <TeamForm item={editingItem as TeamMember | null} />}
            {activeTab === 'services' && <ServiceForm item={editingItem as ServiceInfo | null} />}

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

// Settings Tab Component
function SettingsTab({
  settings,
  setSettings,
  onSave,
  isSaving,
}: {
  settings: Record<string, string>;
  setSettings: (s: Record<string, string>) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const settingGroups = [
    {
      title: 'Informasi Umum',
      fields: [
        { key: 'site_name', label: 'Nama Kantor', type: 'text' },
        { key: 'site_tagline', label: 'Tagline', type: 'text' },
        { key: 'site_description', label: 'Deskripsi', type: 'textarea' },
      ],
    },
    {
      title: 'Hero Section',
      fields: [
        { key: 'hero_title', label: 'Judul Hero', type: 'text' },
        { key: 'hero_subtitle', label: 'Subtitle Hero', type: 'textarea' },
      ],
    },
    {
      title: 'Tentang Kami',
      fields: [
        { key: 'about_title', label: 'Judul About', type: 'text' },
        { key: 'about_content', label: 'Konten About', type: 'textarea' },
      ],
    },
    {
      title: 'Statistik',
      fields: [
        { key: 'stats_clients', label: 'Jumlah Klien', type: 'text' },
        { key: 'stats_documents', label: 'Jumlah Dokumen', type: 'text' },
        { key: 'stats_experience', label: 'Tahun Pengalaman', type: 'text' },
      ],
    },
    {
      title: 'Kontak',
      fields: [
        { key: 'contact_address', label: 'Alamat', type: 'textarea' },
        { key: 'contact_phone', label: 'Telepon', type: 'text' },
        { key: 'contact_whatsapp', label: 'WhatsApp', type: 'text' },
        { key: 'contact_email', label: 'Email', type: 'text' },
        { key: 'office_hours', label: 'Jam Operasional', type: 'text' },
      ],
    },
    {
      title: 'Google Maps',
      fields: [
        { key: 'google_maps_embed', label: 'Embed URL', type: 'text' },
        { key: 'google_maps_link', label: 'Link Maps', type: 'text' },
      ],
    },
    {
      title: 'Social Media',
      fields: [
        { key: 'social_facebook', label: 'Facebook URL', type: 'text' },
        { key: 'social_instagram', label: 'Instagram URL', type: 'text' },
        { key: 'social_linkedin', label: 'LinkedIn URL', type: 'text' },
      ],
    },
    {
      title: 'Footer',
      fields: [{ key: 'footer_copyright', label: 'Copyright Text', type: 'text' }],
    },
  ];

  return (
    <div className="space-y-6">
      {settingGroups.map((group) => (
        <Card key={group.title} className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-slate-300">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <Input
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}

// List Tab Component
function ListTab<T extends { id: string; isActive: boolean; order: number }>({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  renderItem,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-800">
          {items.length === 0 ? (
            <p className="text-slate-500 py-8 text-center">Belum ada data</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4 gap-4">
                <div className="flex-1 min-w-0">{renderItem(item)}</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Form Components
function FAQForm({ item }: { item: FAQ | null }) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-300">Pertanyaan</Label>
        <Input
          name="question"
          defaultValue={item?.question || ''}
          required
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Jawaban</Label>
        <textarea
          name="answer"
          defaultValue={item?.answer || ''}
          required
          className="w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Kategori</Label>
        <Input
          name="category"
          defaultValue={item?.category || ''}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Urutan</Label>
          <Input
            name="order"
            type="number"
            defaultValue={item?.order || 0}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Status</Label>
          <select
            name="isActive"
            defaultValue={item?.isActive !== false ? 'true' : 'false'}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>
    </>
  );
}

function TestimonialForm({ item }: { item: Testimonial | null }) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-300">Nama Klien</Label>
        <Input
          name="clientName"
          defaultValue={item?.clientName || ''}
          required
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Jabatan/Perusahaan</Label>
        <Input
          name="clientTitle"
          defaultValue={item?.clientTitle || ''}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Testimoni</Label>
        <textarea
          name="content"
          defaultValue={item?.content || ''}
          required
          className="w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Rating (1-5)</Label>
          <Input
            name="rating"
            type="number"
            min={1}
            max={5}
            defaultValue={item?.rating || 5}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Urutan</Label>
          <Input
            name="order"
            type="number"
            defaultValue={item?.order || 0}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Status</Label>
          <select
            name="isActive"
            defaultValue={item?.isActive !== false ? 'true' : 'false'}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Featured</Label>
          <select
            name="isFeatured"
            defaultValue={item?.isFeatured ? 'true' : 'false'}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
          >
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </div>
      </div>
    </>
  );
}

function TeamForm({ item }: { item: TeamMember | null }) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-300">Nama</Label>
        <Input
          name="name"
          defaultValue={item?.name || ''}
          required
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Posisi/Jabatan</Label>
        <Input
          name="position"
          defaultValue={item?.position || ''}
          required
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Bio</Label>
        <textarea
          name="bio"
          defaultValue={item?.bio || ''}
          className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">URL Foto</Label>
        <Input
          name="photo"
          defaultValue={item?.photo || ''}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Email</Label>
          <Input
            name="email"
            type="email"
            defaultValue={item?.email || ''}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Telepon</Label>
          <Input
            name="phone"
            defaultValue={item?.phone || ''}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Urutan</Label>
          <Input
            name="order"
            type="number"
            defaultValue={item?.order || 0}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Status</Label>
          <select
            name="isActive"
            defaultValue={item?.isActive !== false ? 'true' : 'false'}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>
    </>
  );
}

function ServiceForm({ item }: { item: ServiceInfo | null }) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-slate-300">Judul Layanan</Label>
        <Input
          name="title"
          defaultValue={item?.title || ''}
          required
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Deskripsi</Label>
        <textarea
          name="description"
          defaultValue={item?.description || ''}
          required
          className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">
          Icon (Building2, Home, Gift, FileCheck, FileSignature, Scale)
        </Label>
        <Input
          name="icon"
          defaultValue={item?.icon || ''}
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Fitur (satu per baris)</Label>
        <textarea
          name="features"
          defaultValue={item?.features?.join('\n') || ''}
          className="w-full min-h-[100px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          placeholder="Fitur 1&#10;Fitur 2&#10;Fitur 3"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Harga (opsional)</Label>
          <Input
            name="price"
            defaultValue={item?.price || ''}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Urutan</Label>
          <Input
            name="order"
            type="number"
            defaultValue={item?.order || 0}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Status</Label>
        <select
          name="isActive"
          defaultValue={item?.isActive !== false ? 'true' : 'false'}
          className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
        >
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
    </>
  );
}
