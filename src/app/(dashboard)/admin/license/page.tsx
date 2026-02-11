'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  KeyRound,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Globe,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Building2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showConfirm } from '@/lib/swal';
import { useFeatureFlags } from '@/contexts/feature-flags-context';

interface LicenseInfo {
  id: string;
  licenseKey: string;
  packageType: string;
  domain: string;
  holderName: string | null;
  officeName: string | null;
  activatedAt: string;
  expiresAt: string | null;
  lastVerified: string | null;
  isActive: boolean;
}

const PACKAGE_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  complete: { label: 'Paket Lengkap', color: 'emerald', icon: '🏆' },
  no_ai: { label: 'Tanpa AI', color: 'blue', icon: '📋' },
  limited_ai: { label: 'AI Terbatas', color: 'purple', icon: '🤖' },
};

export default function LicensePage() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [currentDomain, setCurrentDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { refreshFlags } = useFeatureFlags();

  const fetchLicense = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/license');
      if (res.ok) {
        const data = await res.json();
        setLicense(data.license);
        setCurrentDomain(data.currentDomain);
      }
    } catch (error) {
      console.error('Failed to fetch license:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.warning('Masukkan license key');
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch('/api/admin/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('License berhasil diaktifkan!');
        setLicenseKey('');
        await fetchLicense();
        await refreshFlags();
      } else {
        toast.error(data.error || 'Gagal mengaktifkan license');
      }
    } catch (error) {
      console.error('Activation error:', error);
      toast.error('Gagal menghubungi server');
    } finally {
      setIsActivating(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/license/verify', { method: 'POST' });
      const data = await res.json();

      if (data.valid) {
        toast.success('License valid ✓');
      } else {
        toast.error(data.error || 'License tidak valid');
      }
      await fetchLicense();
    } catch (error) {
      toast.error('Gagal verifikasi');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmed = await showConfirm(
      'Nonaktifkan License?',
      'License akan dinonaktifkan. Fitur yang memerlukan license tidak akan tersedia.',
      'Ya, Nonaktifkan'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/license', { method: 'DELETE' });
      if (res.ok) {
        toast.success('License dinonaktifkan');
        await fetchLicense();
      } else {
        toast.error('Gagal menonaktifkan');
      }
    } catch {
      toast.error('Gagal menonaktifkan');
    }
  };

  // Format license key as user types (NTRS-XXXX-XXXX-XXXX-XXXX)
  const handleKeyInput = (value: string) => {
    // Remove non-alphanumeric except dashes
    const clean = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setLicenseKey(clean);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const pkg = license ? PACKAGE_DISPLAY[license.packageType] : null;
  const isExpired = license?.expiresAt && new Date(license.expiresAt) < new Date();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          Aktivasi License
        </h1>
        <p className="text-slate-400 mt-1">
          Masukkan license key untuk mengaktifkan fitur sesuai paket
        </p>
      </div>

      {/* Current Domain Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 flex items-center gap-3">
          <Globe className="w-5 h-5 text-slate-400 shrink-0" />
          <div>
            <p className="text-sm text-slate-300">Domain Server</p>
            <p className="text-xs text-slate-500 font-mono">
              {currentDomain || 'Tidak terdeteksi'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active License */}
      {license && license.isActive ? (
        <Card
          className={`border ${
            isExpired ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
          }`}
        >
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              {isExpired ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              {isExpired ? 'License Kedaluwarsa' : 'License Aktif'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* License Key */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-xs text-slate-500">License Key</p>
                <p className="text-sm font-mono text-white tracking-wider">{license.licenseKey}</p>
              </div>
              <Shield className="w-5 h-5 text-slate-400" />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">Paket</p>
                </div>
                <p className="text-sm text-white font-medium">
                  {pkg ? `${pkg.icon} ${pkg.label}` : license.packageType}
                </p>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">Domain Terikat</p>
                </div>
                <p className="text-sm text-white font-mono">{license.domain}</p>
              </div>

              {license.holderName && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-500">Nama Notaris</p>
                  </div>
                  <p className="text-sm text-white">{license.holderName}</p>
                </div>
              )}

              {license.officeName && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-500">Kantor Notaris</p>
                  </div>
                  <p className="text-sm text-white">{license.officeName}</p>
                </div>
              )}

              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">Diaktifkan</p>
                </div>
                <p className="text-sm text-white">
                  {new Date(license.activatedAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">Berlaku Sampai</p>
                </div>
                <p className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                  {license.expiresAt
                    ? new Date(license.expiresAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '♾️ Selamanya'}
                </p>
              </div>

              {license.lastVerified && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-500">Terakhir Dicek</p>
                  </div>
                  <p className="text-sm text-white">
                    {new Date(license.lastVerified).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={isVerifying}
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verifikasi
              </Button>
              <Button
                variant="ghost"
                onClick={handleDeactivate}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Nonaktifkan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* No License / Expired Warning */}
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-300 font-medium">
                  {license ? 'License tidak aktif' : 'Belum ada license aktif'}
                </p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Masukkan license key di bawah untuk mengaktifkan fitur sesuai paket yang dibeli.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Activation Form */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Aktivasi License
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleActivate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">License Key</label>
                  <Input
                    type="text"
                    placeholder="NTRS-XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => handleKeyInput(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white font-mono tracking-wider placeholder:text-slate-600 text-center text-lg py-6"
                    maxLength={24}
                  />
                  <p className="text-xs text-slate-500">
                    Masukkan license key yang diberikan saat pembelian sistem
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isActivating || !licenseKey.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 py-6 text-base"
                >
                  {isActivating ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-5 h-5 mr-2" />
                  )}
                  Aktifkan License
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {/* Package Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-white">Paket Tersedia</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {Object.entries(PACKAGE_DISPLAY).map(([key, info]) => (
              <div
                key={key}
                className={`flex items-center gap-4 px-5 py-4 ${
                  license?.packageType === key ? 'bg-emerald-500/5' : ''
                }`}
              >
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{info.label}</p>
                  <p className="text-xs text-slate-500">
                    {key === 'complete' && 'Semua fitur termasuk AI penuh'}
                    {key === 'no_ai' && 'Fitur dasar tanpa AI'}
                    {key === 'limited_ai' && 'Fitur dasar + AI ringkasan'}
                  </p>
                </div>
                {license?.packageType === key && license.isActive && (
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    Aktif
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
