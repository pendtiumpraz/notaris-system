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
  Bell,
  ArrowRight,
  BarChart3,
  Settings,
  ClipboardList,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  completedDocuments: number;
  upcomingAppointments: number;
  unreadMessages: number;
  totalClients?: number;
  totalStaff?: number;
  overdueDocuments?: number;
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

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
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

function getGreeting(name: string | undefined): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam';
  return `${time}, ${name || 'User'}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================
// Stat Card Component
// ============================================================
function StatCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// CLIENT DASHBOARD
// ============================================================
function ClientDashboard({
  stats,
  recentDocuments,
  upcomingAppointments,
  recentNotifications,
  userName,
}: {
  stats: DashboardStats;
  recentDocuments: RecentDocument[];
  upcomingAppointments: UpcomingAppointment[];
  recentNotifications: NotificationItem[];
  userName: string | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">{getGreeting(userName)}</h1>
        <p className="text-slate-400">Pantau status dokumen dan jadwal Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/20"
          value={stats.totalDocuments}
          label="Total Dokumen"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
          value={stats.pendingDocuments}
          label="Dalam Proses"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/20"
          value={stats.completedDocuments}
          label="Selesai"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/20"
          value={stats.upcomingAppointments}
          label="Jadwal Mendatang"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">📋 Dokumen Saya</CardTitle>
            <Link
              href="/documents"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
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
                        <p className="text-xs text-slate-500 mt-0.5">{doc.documentNumber}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full shrink-0 ml-2 ${statusLabels[doc.status]?.color}`}
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

        {/* Notifications */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">🔔 Notifikasi Terbaru</CardTitle>
            <Link
              href="/notifications"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentNotifications.map((n) => (
                  <div key={n.id} className={`p-4 ${!n.readAt ? 'bg-emerald-500/5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-slate-500 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">⚡ Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/documents"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Plus className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Ajukan Dokumen</p>
            <p className="text-sm text-slate-400">Buat pengajuan baru</p>
          </Link>
          <Link
            href="/appointments"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Calendar className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Buat Jadwal</p>
            <p className="text-sm text-slate-400">Jadwalkan konsultasi</p>
          </Link>
          <Link
            href="/messages"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <MessageSquare className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Kirim Pesan</p>
            <p className="text-sm text-slate-400">Hubungi staff</p>
          </Link>
          <Link
            href="/notifications"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Bell className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Notifikasi</p>
            <p className="text-sm text-slate-400">Lihat update</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// STAFF DASHBOARD
// ============================================================
function StaffDashboard({
  stats,
  recentDocuments,
  todayAppointments,
  userName,
}: {
  stats: DashboardStats;
  recentDocuments: RecentDocument[];
  todayAppointments: UpcomingAppointment[];
  userName: string | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">{getGreeting(userName)}</h1>
        <p className="text-slate-400">Dashboard Staff — Kelola tugas dan jadwal Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/20"
          value={stats.totalDocuments}
          label="Total Tugas"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
          value={stats.pendingDocuments}
          label="Perlu Review"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/20"
          value={stats.upcomingAppointments}
          label="Jadwal Mendatang"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/20"
          value={stats.unreadMessages}
          label="Pesan Belum Dibaca"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">📄 Dokumen Ditugaskan</CardTitle>
            <Link
              href="/documents"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentDocuments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada tugas baru</p>
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
                        <p className="text-sm text-slate-400">Klien: {doc.client}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.documentNumber}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full shrink-0 ml-2 ${statusLabels[doc.status]?.color}`}
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

        {/* Today's Schedule */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">📅 Jadwal Hari Ini</CardTitle>
            <Link
              href="/appointments"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Semua Jadwal <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada jadwal hari ini</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 flex items-center gap-3">
                    <div className="w-14 text-center shrink-0">
                      <p className="text-lg font-bold text-emerald-400">
                        {formatTime(apt.scheduledAt)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{apt.service}</p>
                      <p className="text-sm text-slate-400">{apt.client}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${statusLabels[apt.status]?.color}`}
                    >
                      {statusLabels[apt.status]?.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">⚡ Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/documents"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <ClipboardList className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Lihat Tugas</p>
            <p className="text-sm text-slate-400">Dokumen yang ditugaskan</p>
          </Link>
          <Link
            href="/appointments"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Calendar className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Jadwal Hari Ini</p>
            <p className="text-sm text-slate-400">Lihat jadwal</p>
          </Link>
          <Link
            href="/messages"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <MessageSquare className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Pesan</p>
            <p className="text-sm text-slate-400">Balas pesan klien</p>
          </Link>
          <Link
            href="/profile"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <UserCheck className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Profil</p>
            <p className="text-sm text-slate-400">Pengaturan akun</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// ADMIN / SUPER_ADMIN DASHBOARD
// ============================================================
function AdminDashboard({
  stats,
  recentDocuments,
  upcomingAppointments,
  userName,
  isSuperAdmin,
}: {
  stats: DashboardStats;
  recentDocuments: RecentDocument[];
  upcomingAppointments: UpcomingAppointment[];
  userName: string | undefined;
  isSuperAdmin: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting(userName)}</h1>
          <p className="text-slate-400">
            Dashboard {isSuperAdmin ? 'Super Admin' : 'Admin'} — Overview seluruh sistem
          </p>
        </div>
        {(stats.overdueDocuments ?? 0) > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">
              {stats.overdueDocuments} dokumen overdue!
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-cyan-400" />}
          iconBg="bg-cyan-500/20"
          value={stats.totalClients ?? 0}
          label="Total Klien"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/20"
          value={stats.totalDocuments}
          label="Total Dokumen"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          iconBg="bg-yellow-500/20"
          value={stats.pendingDocuments}
          label="Pending"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          iconBg="bg-emerald-500/20"
          value={stats.completedDocuments}
          label="Selesai"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/20"
          value={stats.upcomingAppointments}
          label="Jadwal"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-orange-400" />}
          iconBg="bg-orange-500/20"
          value={stats.totalStaff ?? 0}
          label="Staff"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/20"
          value={stats.unreadMessages}
          label="Pesan"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">📋 Dokumen Terbaru</CardTitle>
            <Link
              href="/documents"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Kelola <ArrowRight className="w-3 h-3" />
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
                        <p className="text-sm text-slate-400">
                          {doc.client} · {doc.type}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.documentNumber}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full shrink-0 ml-2 ${statusLabels[doc.status]?.color}`}
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
            <CardTitle className="text-lg text-white">📅 Jadwal Mendatang</CardTitle>
            <Link
              href="/appointments"
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Kelola <ArrowRight className="w-3 h-3" />
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
                  <div key={apt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{apt.service}</p>
                        <p className="text-sm text-slate-400">{apt.client}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTime(apt.scheduledAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full ${statusLabels[apt.status]?.color}`}
                      >
                        {statusLabels[apt.status]?.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">⚡ Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/users"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <Users className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Kelola User</p>
            <p className="text-sm text-slate-400">Manajemen pengguna</p>
          </Link>
          <Link
            href="/admin/reports"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <BarChart3 className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Laporan</p>
            <p className="text-sm text-slate-400">Statistik & analitik</p>
          </Link>
          <Link
            href="/documents"
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
          >
            <FileText className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-white">Dokumen</p>
            <p className="text-sm text-slate-400">Kelola dokumen</p>
          </Link>
          {isSuperAdmin ? (
            <Link
              href="/admin/settings"
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
            >
              <Settings className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Settings</p>
              <p className="text-sm text-slate-400">Pengaturan sistem</p>
            </Link>
          ) : (
            <Link
              href="/messages"
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group"
            >
              <MessageSquare className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Pesan</p>
              <p className="text-sm text-slate-400">Komunikasi</p>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD PAGE
// ============================================================
export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingDocuments: 0,
    completedDocuments: 0,
    upcomingAppointments: 0,
    unreadMessages: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<UpcomingAppointment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentDocuments(data.recentDocuments || []);
          setUpcomingAppointments(data.upcomingAppointments || []);
          setRecentNotifications(data.recentNotifications || []);
          setTodayAppointments(data.todayAppointments || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const userRole = session?.user?.role;
  const userName = session?.user?.name;

  // Route to the correct dashboard per role
  if (userRole === 'CLIENT') {
    return (
      <ClientDashboard
        stats={stats}
        recentDocuments={recentDocuments}
        upcomingAppointments={upcomingAppointments}
        recentNotifications={recentNotifications}
        userName={userName}
      />
    );
  }

  if (userRole === 'STAFF') {
    return (
      <StaffDashboard
        stats={stats}
        recentDocuments={recentDocuments}
        todayAppointments={todayAppointments}
        userName={userName}
      />
    );
  }

  // ADMIN or SUPER_ADMIN
  return (
    <AdminDashboard
      stats={stats}
      recentDocuments={recentDocuments}
      upcomingAppointments={upcomingAppointments}
      userName={userName}
      isSuperAdmin={userRole === 'SUPER_ADMIN'}
    />
  );
}
