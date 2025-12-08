'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, Loader2, User, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

const actionLabels: Record<string, { label: string; color: string }> = {
  CREATE_USER: { label: 'Buat User', color: 'bg-emerald-500/20 text-emerald-400' },
  UPDATE_USER: { label: 'Update User', color: 'bg-blue-500/20 text-blue-400' },
  DELETE_USER: { label: 'Hapus User', color: 'bg-red-500/20 text-red-400' },
  UPDATE_PROFILE: { label: 'Update Profil', color: 'bg-blue-500/20 text-blue-400' },
  CHANGE_PASSWORD: { label: 'Ganti Password', color: 'bg-yellow-500/20 text-yellow-400' },
  CREATE_DOCUMENT: { label: 'Buat Dokumen', color: 'bg-emerald-500/20 text-emerald-400' },
  UPDATE_DOCUMENT: { label: 'Update Dokumen', color: 'bg-blue-500/20 text-blue-400' },
  DELETE_DOCUMENT: { label: 'Hapus Dokumen', color: 'bg-red-500/20 text-red-400' },
  CREATE_APPOINTMENT: { label: 'Buat Jadwal', color: 'bg-emerald-500/20 text-emerald-400' },
  UPDATE_APPOINTMENT: { label: 'Update Jadwal', color: 'bg-blue-500/20 text-blue-400' },
  DELETE_APPOINTMENT: { label: 'Hapus Jadwal', color: 'bg-red-500/20 text-red-400' },
  UPLOAD_FILE: { label: 'Upload File', color: 'bg-purple-500/20 text-purple-400' },
  DELETE_FILE: { label: 'Hapus File', color: 'bg-red-500/20 text-red-400' },
  CREATE_DOCUMENT_TYPE: {
    label: 'Buat Jenis Dokumen',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  UPDATE_DOCUMENT_TYPE: { label: 'Update Jenis Dokumen', color: 'bg-blue-500/20 text-blue-400' },
  DELETE_DOCUMENT_TYPE: { label: 'Hapus Jenis Dokumen', color: 'bg-red-500/20 text-red-400' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });
  const [availableFilters, setAvailableFilters] = useState({
    actions: [] as string[],
    resourceTypes: [] as string[],
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '20',
        ...(filters.action && { action: filters.action }),
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
        if (data.filters) {
          setAvailableFilters(data.filters);
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    return actionLabels[action] || { label: action, color: 'bg-slate-500/20 text-slate-400' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400">Riwayat aktivitas sistem</p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters({ ...filters, action: value })}
            >
              <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Aksi</SelectItem>
                {availableFilters.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.resourceType}
              onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
            >
              <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700">
                <SelectValue placeholder="Semua Entitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Entitas</SelectItem>
                {availableFilters.resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full sm:w-40 bg-slate-800 border-slate-700"
              placeholder="Dari tanggal"
            />

            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full sm:w-40 bg-slate-800 border-slate-700"
              placeholder="Sampai tanggal"
            />

            <Button
              variant="outline"
              onClick={() =>
                setFilters({ action: '', resourceType: '', startDate: '', endDate: '' })
              }
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Log Aktivitas ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada log aktivitas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {logs.map((log) => {
                const actionConfig = getActionLabel(log.action);
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-medium">
                          {log.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">
                              {log.user?.name || 'Unknown'}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${actionConfig.color}`}
                            >
                              {actionConfig.label}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                              {log.resourceType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{log.user?.email}</p>
                          {(log.newValues || log.oldValues) && (
                            <div className="mt-2 text-xs text-slate-500 bg-slate-800/50 p-2 rounded">
                              <code>{JSON.stringify(log.newValues || log.oldValues, null, 2)}</code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
