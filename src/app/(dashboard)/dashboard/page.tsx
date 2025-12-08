'use client';

import { useSession } from 'next-auth/react';
import {
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@prisma/client';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down';
  roles: UserRole[];
}

const statsCards: StatCard[] = [
  {
    title: 'Total Dokumen',
    value: '24',
    icon: <FileText className="w-5 h-5" />,
    change: '+12%',
    changeType: 'up',
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  },
  {
    title: 'Jadwal Mendatang',
    value: '3',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  },
  {
    title: 'Pesan Belum Dibaca',
    value: '5',
    icon: <MessageSquare className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'CLIENT'],
  },
  {
    title: 'Total Klien',
    value: '156',
    icon: <Users className="w-5 h-5" />,
    change: '+8%',
    changeType: 'up',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Dokumen Pending',
    value: '8',
    icon: <Clock className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  },
  {
    title: 'Dokumen Selesai',
    value: '142',
    icon: <CheckCircle className="w-5 h-5" />,
    change: '+24%',
    changeType: 'up',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
];

const recentDocuments = [
  {
    id: '1',
    title: 'Akta Pendirian PT Maju Jaya',
    status: 'IN_REVIEW',
    client: 'John Doe',
    date: '2024-12-08',
  },
  {
    id: '2',
    title: 'Akta Jual Beli Tanah',
    status: 'WAITING_SIGNATURE',
    client: 'Jane Smith',
    date: '2024-12-07',
  },
  {
    id: '3',
    title: 'Surat Kuasa',
    status: 'COMPLETED',
    client: 'Bob Johnson',
    date: '2024-12-06',
  },
  {
    id: '4',
    title: 'Legalisasi Dokumen',
    status: 'SUBMITTED',
    client: 'Alice Brown',
    date: '2024-12-05',
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400' },
  SUBMITTED: { label: 'Diajukan', color: 'bg-blue-500/20 text-blue-400' },
  IN_REVIEW: { label: 'Dalam Review', color: 'bg-yellow-500/20 text-yellow-400' },
  WAITING_SIGNATURE: {
    label: 'Menunggu Tanda Tangan',
    color: 'bg-purple-500/20 text-purple-400',
  },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'CLIENT';

  const filteredStats = statsCards.filter((stat) => stat.roles.includes(userRole as UserRole));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Selamat datang kembali, {session?.user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStats.map((stat, index) => (
          <Card
            key={stat.title}
            className={`animate-fade-up delay-${(index + 1) * 100} bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {stat.icon}
                </div>
                {stat.change && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.changeType === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    <TrendingUp
                      className={`w-4 h-4 ${stat.changeType === 'down' ? 'rotate-180' : ''}`}
                    />
                    {stat.change}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Documents & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">Dokumen Terbaru</CardTitle>
            <a href="/documents" className="text-sm text-emerald-400 hover:text-emerald-300">
              Lihat Semua
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{doc.title}</p>
                      <p className="text-sm text-slate-400">{doc.client}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full ${
                        statusLabels[doc.status]?.color
                      }`}
                    >
                      {statusLabels[doc.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group">
              <FileText className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Buat Dokumen Baru</p>
              <p className="text-sm text-slate-400">Mulai proses dokumen baru</p>
            </button>
            <button className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group">
              <Calendar className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Buat Janji Temu</p>
              <p className="text-sm text-slate-400">Jadwalkan konsultasi</p>
            </button>
            <button className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group">
              <MessageSquare className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Kirim Pesan</p>
              <p className="text-sm text-slate-400">Hubungi tim notaris</p>
            </button>
            <button className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all duration-200 text-left group">
              <AlertCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-white">Bantuan</p>
              <p className="text-sm text-slate-400">FAQ & Panduan</p>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
