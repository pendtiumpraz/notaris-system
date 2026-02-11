'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { User, Mail, Phone, Building, MapPin, Save, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  staff?: {
    employeeId: string;
    position: string;
    phone?: string;
  };
  client?: {
    clientNumber: string;
    companyName?: string;
    address?: string;
    phone?: string;
    idNumber?: string;
    idType?: string;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CLIENT: 'Klien',
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    companyName: '',
    position: '',
    idNumber: '',
    idType: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.staff?.phone || data.user.client?.phone || '',
          address: data.user.client?.address || '',
          companyName: data.user.client?.companyName || '',
          position: data.user.staff?.position || '',
          idNumber: data.user.client?.idNumber || '',
          idType: data.user.client?.idType || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update({ name: formData.name });
        fetchProfile();
        toast.success('Profil berhasil diperbarui');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Profil Saya</h1>
        <p className="text-slate-400">Kelola informasi profil Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="bg-slate-900 border-slate-800 md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-slate-300 hover:bg-slate-600">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{profile?.name}</h2>
              <p className="text-slate-400">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-sm rounded-full bg-emerald-500/20 text-emerald-400">
                {roleLabels[profile?.role || 'CLIENT']}
              </span>

              {profile?.staff && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-left">
                  <p className="text-sm text-slate-400">ID Karyawan</p>
                  <p className="text-white">{profile.staff.employeeId}</p>
                </div>
              )}

              {profile?.client && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-left">
                  <p className="text-sm text-slate-400">Nomor Klien</p>
                  <p className="text-white">{profile.client.clientNumber}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400">Terdaftar sejak</p>
                <p className="text-white">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </p>
              </div>

              <div className="mt-4">
                <Link href="/profile/security">
                  <Button variant="outline" className="w-full">
                    Pengaturan Keamanan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Informasi Pribadi</CardTitle>
            <CardDescription>Perbarui informasi profil Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nama Lengkap
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-slate-800/50 border-slate-700 text-slate-500"
              />
              <p className="text-xs text-slate-500">Email tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Nomor Telepon
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="+62 812 3456 7890"
              />
            </div>

            {profile?.role === 'STAFF' && (
              <div className="space-y-2">
                <Label>Posisi/Jabatan</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            )}

            {profile?.role === 'CLIENT' && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Nama Perusahaan
                  </Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="PT Example"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Alamat
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    placeholder="Alamat lengkap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Identitas</Label>
                    <Input
                      value={formData.idType}
                      onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                      className="bg-slate-800 border-slate-700"
                      placeholder="KTP/SIM/Paspor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor Identitas</Label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="bg-slate-800 border-slate-700"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
