'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  completedDocuments: number;
  upcomingAppointments: number;
  unreadMessages: number;
  totalClients?: number;
  totalStaff?: number;
}

interface RecentDocument {
  id: string;
  title: string;
  documentNumber: string;
  status: string;
  client: string;
  type: string;
  createdAt: string;
}

interface UpcomingAppointment {
  id: string;
  service: string;
  client: string;
  scheduledAt: string;
  status: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400' },
  SUBMITTED: { label: 'Diajukan', color: 'bg-blue-500/20 text-blue-400' },
  IN_REVIEW: { label: 'Dalam Review', color: 'bg-yellow-500/20 text-yellow-400' },
  WAITING_SIGNATURE: { label: 'Menunggu TTD', color: 'bg-purple-500/20 text-purple-400' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400' },
  PENDING: { label: 'Menunggu', color: 'bg-yellow-500/20 text-yellow-400' },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-emerald-500/20 text-emerald-400' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentDocuments(data.recentDocuments || []);
          setUpcomingAppointments(data.upcomingAppointments || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const userRole = session?.user?.role;
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Selamat datang kembali, {session?.user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{stats?.totalDocuments || 0}</p>
              <p className="text-sm text-slate-400">Total Dokumen</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{stats?.pendingDocuments || 0}</p>
              <p className="text-sm text-slate-400">Dokumen Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{stats?.upcomingAppointments || 0}</p>
              <p className="text-sm text-slate-400">Jadwal Mendatang</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-white">{stats?.unreadMessages || 0}</p>
              <p className="text-sm text-slate-400">Pesan Belum Dibaca</p>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stats?.totalClients || 0}</p>
                  <p className="text-sm text-slate-400">Total Klien</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stats?.totalStaff || 0}</p>
                  <p className="text-sm text-slate-400">Total Staff</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stats?.completedDocuments || 0}</p>
                  <p className="text-sm text-slate-400">Dokumen Selesai</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Documents & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Dokumen Terbaru</CardTitle>
            <Link href="/documents" className="text-sm text-emerald-400 hover:text-emerald-300">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada dokumen</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="block p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{doc.title}</p>
                        <p className="text-sm text-slate-400">{doc.client}</p>
                        <p className="text-xs text-slate-500 mt-1">{doc.documentNumber}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full ${statusLabels[doc.status]?.color}`}
                      >
                        {statusLabels[doc.status]?.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Jadwal Mendatang</CardTitle>
            <Link href="/appointments" className="text-sm text-emerald-400 hover:text-emerald-300">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada jadwal mendatang</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {upcomingAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/appointments/${apt.id}`}
                    className="block p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{apt.service}</p>
                        <p className="text-sm text-slate-400">{apt.client}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(apt.scheduledAt).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full ${statusLabels[apt.status]?.color}`}
                      >
                        {statusLabels[apt.status]?.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/documents"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <FileText className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Dokumen</p>
            <p className="text-sm text-slate-400">Kelola dokumen</p>
          </Link>
          <Link
            href="/appointments"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Calendar className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Jadwal</p>
            <p className="text-sm text-slate-400">Kelola jadwal</p>
          </Link>
          <Link
            href="/messages"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <MessageSquare className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Pesan</p>
            <p className="text-sm text-slate-400">Kirim pesan</p>
          </Link>
          <Link
            href="/notifications"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <AlertCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Notifikasi</p>
            <p className="text-sm text-slate-400">Lihat notifikasi</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
