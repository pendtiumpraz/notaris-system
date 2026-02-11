'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, FileText, Calendar, Users, TrendingUp, Loader2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportData {
  users?: {
    total: number;
    clients: number;
    staff: number;
  };
  documents?: {
    total: number;
    byStatus: Record<string, number>;
  };
  appointments?: {
    total: number;
    byStatus: Record<string, number>;
  };
  recent?: {
    documents: Array<{
      id: string;
      title: string;
      documentNumber: string;
      status: string;
      createdAt: string;
      client?: { user: { name: string } };
      documentType?: { name: string };
    }>;
    appointments: Array<{
      id: string;
      status: string;
      createdAt: string;
      client?: { user: { name: string } };
      service?: { name: string };
    }>;
  };
}

interface DocumentReport {
  byType: Array<{ type: string; count: number }>;
  byMonth: Array<{ month: string; count: number | bigint }>;
  byPriority: Record<string, number>;
}

interface AppointmentReport {
  byService: Array<{ service: string; count: number }>;
  byMonth: Array<{ month: string; count: number | bigint }>;
  byStatus: Record<string, number>;
}

interface StaffReport {
  performance: Array<{
    name: string;
    email: string;
    documentsHandled: number;
    appointmentsHandled: number;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Diajukan',
  IN_REVIEW: 'Review',
  WAITING_SIGNATURE: 'TTD',
  COMPLETED: 'Selesai',
  CANCELLED: 'Batal',
  PENDING: 'Menunggu',
  CONFIRMED: 'Konfirmasi',
  NO_SHOW: 'Tidak Hadir',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Rendah',
  NORMAL: 'Normal',
  HIGH: 'Tinggi',
  URGENT: 'Urgent',
};

type TabType = 'overview' | 'documents' | 'appointments' | 'staff';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<ReportData | null>(null);
  const [documentData, setDocumentData] = useState<DocumentReport | null>(null);
  const [appointmentData, setAppointmentData] = useState<AppointmentReport | null>(null);
  const [staffData, setStaffData] = useState<StaffReport | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchReport = useCallback(
    async (type: TabType) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ type });
        if (dateRange.start) params.set('startDate', dateRange.start);
        if (dateRange.end) params.set('endDate', dateRange.end);

        const res = await fetch(`/api/reports?${params}`);
        if (res.ok) {
          const result = await res.json();
          switch (type) {
            case 'overview':
              setOverviewData(result.data);
              break;
            case 'documents':
              setDocumentData(result.data);
              break;
            case 'appointments':
              setAppointmentData(result.data);
              break;
            case 'staff':
              setStaffData(result.data);
              break;
          }
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [dateRange]
  );

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Ringkasan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'documents' as TabType, label: 'Dokumen', icon: <FileText className="w-4 h-4" /> },
    { id: 'appointments' as TabType, label: 'Jadwal', icon: <Calendar className="w-4 h-4" /> },
    { id: 'staff' as TabType, label: 'Staff', icon: <Users className="w-4 h-4" /> },
  ];

  const formatStatusData = (data: Record<string, number>) =>
    Object.entries(data).map(([key, value]) => ({
      name: statusLabels[key] || key,
      value: Number(value),
    }));

  const formatPriorityData = (data: Record<string, number>) =>
    Object.entries(data).map(([key, value]) => ({
      name: priorityLabels[key] || key,
      value: Number(value),
    }));

  const formatMonthData = (data: Array<{ month: string; count: number | bigint }>) =>
    data
      .map((item) => ({
        month: new Date(item.month).toLocaleDateString('id-ID', {
          month: 'short',
          year: '2-digit',
        }),
        count: Number(item.count),
      }))
      .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan</h1>
        <p className="text-slate-400">Statistik dan analisis data</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Date Filter */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Dari:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Sampai:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white"
              />
            </div>
            <Button
              size="sm"
              onClick={() => fetchReport(activeTab)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Terapkan
            </Button>
            {(dateRange.start || dateRange.end) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                }}
                className="text-slate-400"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Pengguna</p>
                        <p className="text-2xl font-bold text-white">
                          {overviewData.users?.total || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Dokumen</p>
                        <p className="text-2xl font-bold text-white">
                          {overviewData.documents?.total || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Total Jadwal</p>
                        <p className="text-2xl font-bold text-white">
                          {overviewData.appointments?.total || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Klien</p>
                        <p className="text-2xl font-bold text-white">
                          {overviewData.users?.clients || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Document Status Pie Chart */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Dokumen per Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overviewData.documents?.byStatus &&
                    Object.keys(overviewData.documents.byStatus).length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={formatStatusData(overviewData.documents.byStatus)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {formatStatusData(overviewData.documents.byStatus).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Appointment Status Pie Chart */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Jadwal per Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overviewData.appointments?.byStatus &&
                    Object.keys(overviewData.appointments.byStatus).length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={formatStatusData(overviewData.appointments.byStatus)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {formatStatusData(overviewData.appointments.byStatus).map(
                              (_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && documentData && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* By Type Bar Chart */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Dokumen per Jenis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documentData.byType.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={documentData.byType}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Jumlah" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* By Priority Pie Chart */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Dokumen per Prioritas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documentData.byPriority && Object.keys(documentData.byPriority).length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={formatPriorityData(documentData.byPriority)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {formatPriorityData(documentData.byPriority).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend */}
              {documentData.byMonth && documentData.byMonth.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Tren Dokumen Bulanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatMonthData(documentData.byMonth)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#fff' }}
                          itemStyle={{ color: '#94a3b8' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Jumlah" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && appointmentData && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* By Service */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Jadwal per Layanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointmentData.byService.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={appointmentData.byService}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="service" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Jumlah" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* By Status */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Jadwal per Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointmentData.byStatus &&
                    Object.keys(appointmentData.byStatus).length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={formatStatusData(appointmentData.byStatus)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {formatStatusData(appointmentData.byStatus).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#94a3b8' }}
                          />
                          <Legend
                            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-slate-500">
                        Belum ada data
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend */}
              {appointmentData.byMonth && appointmentData.byMonth.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Tren Jadwal Bulanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatMonthData(appointmentData.byMonth)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#fff' }}
                          itemStyle={{ color: '#94a3b8' }}
                        />
                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Jumlah" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* STAFF TAB */}
          {activeTab === 'staff' && staffData && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Performa Staff</CardTitle>
              </CardHeader>
              <CardContent>
                {staffData.performance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Nama
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                            Email
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">
                            Dokumen
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">
                            Jadwal
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffData.performance.map((staff, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-800 hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-4 text-white font-medium">{staff.name}</td>
                            <td className="py-3 px-4 text-slate-400">{staff.email}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                                {staff.documentsHandled}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
                                {staff.appointmentsHandled}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                                {staff.documentsHandled + staff.appointmentsHandled}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data staff</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
