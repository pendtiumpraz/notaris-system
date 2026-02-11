'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, Save, Loader2, Globe, Phone, Mail, MapPin, Clock, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSetting {
  key: string;
  value: string;
  type: string;
  description?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        const settingsMap: Record<string, string> = {};
        data.settings.forEach((s: SiteSetting) => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert settings to array format
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        type: 'text',
      }));

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      });

      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan');
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pengaturan Sistem</h1>
          <p className="text-slate-400">Kelola pengaturan website dan kantor</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="social">Media Sosial</TabsTrigger>
          <TabsTrigger value="content">Konten</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informasi Kantor
              </CardTitle>
              <CardDescription>Informasi dasar tentang kantor notaris</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Kantor</Label>
                <Input
                  value={settings.site_name || ''}
                  onChange={(e) => updateSetting('site_name', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Nama kantor notaris"
                />
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={settings.site_tagline || ''}
                  onChange={(e) => updateSetting('site_tagline', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Tagline website"
                />
              </div>

              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={settings.site_description || ''}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  rows={3}
                  placeholder="Deskripsi singkat tentang kantor"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Jam Operasional
                </Label>
                <Input
                  value={settings.office_hours || ''}
                  onChange={(e) => updateSetting('office_hours', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Senin - Jumat: 08:00 - 17:00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Informasi Kontak
              </CardTitle>
              <CardDescription>Informasi kontak yang akan ditampilkan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Alamat
                </Label>
                <Textarea
                  value={settings.contact_address || ''}
                  onChange={(e) => updateSetting('contact_address', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  rows={2}
                  placeholder="Alamat lengkap kantor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon
                  </Label>
                  <Input
                    value={settings.contact_phone || ''}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="+62 21 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={settings.contact_whatsapp || ''}
                    onChange={(e) => updateSetting('contact_whatsapp', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  value={settings.contact_email || ''}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="info@notaris.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Google Maps Embed URL</Label>
                <Input
                  value={settings.google_maps_embed || ''}
                  onChange={(e) => updateSetting('google_maps_embed', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </div>

              <div className="space-y-2">
                <Label>Google Maps Link</Label>
                <Input
                  value={settings.google_maps_link || ''}
                  onChange={(e) => updateSetting('google_maps_link', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Media Sosial
              </CardTitle>
              <CardDescription>Link ke akun media sosial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={settings.social_facebook || ''}
                  onChange={(e) => updateSetting('social_facebook', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={settings.social_instagram || ''}
                  onChange={(e) => updateSetting('social_instagram', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={settings.social_linkedin || ''}
                  onChange={(e) => updateSetting('social_linkedin', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div className="space-y-2">
                <Label>Twitter/X</Label>
                <Input
                  value={settings.social_twitter || ''}
                  onChange={(e) => updateSetting('social_twitter', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Konten Website</CardTitle>
              <CardDescription>Teks yang ditampilkan di halaman publik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Hero</Label>
                <Input
                  value={settings.hero_title || ''}
                  onChange={(e) => updateSetting('hero_title', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Layanan Notaris & PPAT Profesional"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle Hero</Label>
                <Textarea
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Judul About</Label>
                <Input
                  value={settings.about_title || ''}
                  onChange={(e) => updateSetting('about_title', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Tentang Kami"
                />
              </div>

              <div className="space-y-2">
                <Label>Konten About</Label>
                <Textarea
                  value={settings.about_content || ''}
                  onChange={(e) => updateSetting('about_content', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Statistik Klien</Label>
                  <Input
                    value={settings.stats_clients || ''}
                    onChange={(e) => updateSetting('stats_clients', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="5000+"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statistik Dokumen</Label>
                  <Input
                    value={settings.stats_documents || ''}
                    onChange={(e) => updateSetting('stats_documents', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="15000+"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statistik Pengalaman</Label>
                  <Input
                    value={settings.stats_experience || ''}
                    onChange={(e) => updateSetting('stats_experience', e.target.value)}
                    className="bg-slate-800 border-slate-700"
                    placeholder="20+"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Copyright Footer</Label>
                <Input
                  value={settings.footer_copyright || ''}
                  onChange={(e) => updateSetting('footer_copyright', e.target.value)}
                  className="bg-slate-800 border-slate-700"
                  placeholder="© 2024 Kantor Notaris. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
