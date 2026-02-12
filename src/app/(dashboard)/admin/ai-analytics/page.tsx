'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquare,
  Coins,
  TrendingUp,
  Users,
  Loader2,
  Calendar,
  BarChart3,
  DollarSign,
  Zap,
} from 'lucide-react';

interface AnalyticsData {
  totals: {
    sessions: number;
    messages: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    costUSD: string;
    costIDR: string;
  };
  period: {
    days: number;
    sessions: number;
    messages: number;
    totalTokens: number;
    costUSD: string;
  };
  byRole: Array<{
    role: string;
    sessions: number;
    messages: number;
    tokens: number;
  }>;
  dailyUsage: Array<{
    day: string;
    sessions: number;
    messages: number;
    tokens: number;
  }>;
  recentSessions: Array<{
    id: string;
    title: string;
    userRole: string;
    totalMessages: number;
    totalTokens: number;
    provider: string;
    model: string;
    createdAt: string;
    user: { name: string; email: string } | null;
  }>;
  model: string;
}

export default function AIAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-analytics?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <p className="text-slate-400">Gagal memuat data analytics</p>
      </div>
    );
  }

  const maxTokens = Math.max(...(data.dailyUsage.map((d) => d.tokens) || [1]));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-7 h-7 text-emerald-400" />
              AI Analytics
            </h1>
            <p className="text-slate-400 mt-1">Monitoring penggunaan chatbot AI & token</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
            <option value={90}>90 hari</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-xl border border-emerald-600/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
              <MessageSquare className="w-4 h-4" />
              Total Sesi
            </div>
            <p className="text-3xl font-bold">{data.totals.sessions}</p>
            <p className="text-xs text-slate-500 mt-1">
              {data.period.sessions} dalam {days} hari terakhir
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 rounded-xl border border-blue-600/20 p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
              <Zap className="w-4 h-4" />
              Total Token
            </div>
            <p className="text-3xl font-bold">{data.totals.totalTokens.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">
              Input: {data.totals.inputTokens.toLocaleString()} | Output:{' '}
              {data.totals.outputTokens.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 rounded-xl border border-amber-600/20 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
              <DollarSign className="w-4 h-4" />
              Estimasi Biaya
            </div>
            <p className="text-3xl font-bold">{data.totals.costUSD}</p>
            <p className="text-xs text-slate-500 mt-1">{data.totals.costIDR}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 rounded-xl border border-purple-600/20 p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
              <TrendingUp className="w-4 h-4" />
              Total Pesan
            </div>
            <p className="text-3xl font-bold">{data.totals.messages}</p>
            <p className="text-xs text-slate-500 mt-1">Model: {data.model}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Daily Usage Chart */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold">Penggunaan Harian</h3>
            </div>
            {data.dailyUsage.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">Belum ada data</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {data.dailyUsage.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${d.day}: ${d.tokens} tokens, ${d.sessions} sesi`}
                  >
                    <div
                      className="w-full bg-emerald-600/60 rounded-t hover:bg-emerald-500/70 transition-colors cursor-pointer"
                      style={{ height: `${Math.max((d.tokens / maxTokens) * 100, 4)}%` }}
                    />
                    <span className="text-[8px] text-slate-600 rotate-0">
                      {new Date(d.day).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Breakdown */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold">Per Role</h3>
            </div>
            {data.byRole.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {data.byRole.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.role === 'GUEST'
                            ? 'bg-gray-400'
                            : r.role === 'CLIENT'
                              ? 'bg-blue-400'
                              : r.role === 'STAFF'
                                ? 'bg-green-400'
                                : r.role === 'ADMIN'
                                  ? 'bg-amber-400'
                                  : 'bg-purple-400'
                        }`}
                      />
                      <span className="text-slate-300">{r.role}</span>
                    </div>
                    <div className="text-right text-slate-500 text-xs">
                      <span>{r.sessions} sesi</span> ·{' '}
                      <span>{r.tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="mt-6 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold">Sesi Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-800">
                  <th className="text-left pb-2 font-medium">Judul</th>
                  <th className="text-left pb-2 font-medium">User</th>
                  <th className="text-left pb-2 font-medium">Role</th>
                  <th className="text-right pb-2 font-medium">Pesan</th>
                  <th className="text-right pb-2 font-medium">Token</th>
                  <th className="text-right pb-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-2 text-slate-300 max-w-[200px] truncate">
                      {s.title || 'Tanpa judul'}
                    </td>
                    <td className="py-2 text-slate-400">{s.user?.name || 'Guest'}</td>
                    <td className="py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          s.userRole === 'GUEST'
                            ? 'bg-gray-600/30 text-gray-300'
                            : s.userRole === 'CLIENT'
                              ? 'bg-blue-600/30 text-blue-300'
                              : s.userRole === 'STAFF'
                                ? 'bg-green-600/30 text-green-300'
                                : s.userRole === 'ADMIN'
                                  ? 'bg-amber-600/30 text-amber-300'
                                  : 'bg-purple-600/30 text-purple-300'
                        }`}
                      >
                        {s.userRole || 'GUEST'}
                      </span>
                    </td>
                    <td className="py-2 text-right text-slate-400">{s.totalMessages}</td>
                    <td className="py-2 text-right text-slate-400">
                      {s.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-slate-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
