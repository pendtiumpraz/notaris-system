'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize } from '@/lib/utils';

interface GoogleDrive {
  id: string;
  email: string;
  accountName: string | null;
  storageUsed: string;
  storageLimit: string;
  isActive: boolean;
  isConnected: boolean;
  connectedAt: string;
}

export default function DrivesPage() {
  const [drives, setDrives] = useState<GoogleDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchDrives = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/drives');
      if (res.ok) {
        const data = await res.json();
        setDrives(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch drives:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/drive/auth-url');
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/drives/${id}/activate`, { method: 'POST' });
      if (res.ok) {
        fetchDrives();
      }
    } catch (error) {
      console.error('Failed to activate drive:', error);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Yakin ingin memutuskan koneksi Google Drive ini?')) return;

    try {
      const res = await fetch(`/api/admin/drives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDrives();
      }
    } catch (error) {
      console.error('Failed to disconnect drive:', error);
    }
  };

  const handleRefresh = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/drives/${id}/refresh`, { method: 'POST' });
      if (res.ok) {
        fetchDrives();
      }
    } catch (error) {
      console.error('Failed to refresh drive:', error);
    }
  };

  const getStoragePercentage = (used: string, limit: string) => {
    const usedNum = parseInt(used);
    const limitNum = parseInt(limit);
    return Math.round((usedNum / limitNum) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Google Drive</h1>
          <p className="text-slate-400">Kelola akun Google Drive untuk penyimpanan file</p>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Hubungkan Drive Baru
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <p className="text-sm text-blue-300">
            <strong>Info:</strong> Anda dapat menghubungkan beberapa akun Google Drive. Hanya satu
            drive yang aktif untuk upload file baru, namun semua file dari drive yang terhubung
            tetap dapat diakses.
          </p>
        </CardContent>
      </Card>

      {/* Drives List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : drives.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center text-slate-500">
            <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada Google Drive yang terhubung</p>
            <p className="text-sm mt-2">Hubungkan akun Google Drive untuk mulai menyimpan file</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drives.map((drive) => {
            const storagePercent = getStoragePercentage(drive.storageUsed, drive.storageLimit);

            return (
              <Card
                key={drive.id}
                className={`bg-slate-900 border-slate-800 ${
                  drive.isActive ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          drive.isConnected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">
                          {drive.accountName || drive.email}
                        </CardTitle>
                        <p className="text-sm text-slate-400">{drive.email}</p>
                      </div>
                    </div>
                    {drive.isActive && (
                      <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Storage Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-400">Penyimpanan</span>
                      <span className="text-white">
                        {formatFileSize(parseInt(drive.storageUsed))} /{' '}
                        {formatFileSize(parseInt(drive.storageLimit))}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          storagePercent > 90
                            ? 'bg-red-500'
                            : storagePercent > 70
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{storagePercent}% terpakai</p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {drive.isConnected ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">Terhubung</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Terputus</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    {!drive.isActive && drive.isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(drive.id)}
                        className="border-slate-700 text-white"
                      >
                        Jadikan Aktif
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRefresh(drive.id)}
                      className="text-slate-400 hover:text-white"
                      title="Refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(drive.id)}
                      className="text-slate-400 hover:text-red-400"
                      title="Putuskan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
