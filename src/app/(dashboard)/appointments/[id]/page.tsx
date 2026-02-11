'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/swal';
import {
  Calendar,
  ArrowLeft,
  Clock,
  User,
  MapPin,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Appointment {
  id: string;
  title: string;
  scheduledAt: string;
  endAt?: string;
  status: string;
  notes?: string;
  location?: string;
  createdAt: string;
  service?: { id: string; name: string; durationMinutes: number };
  client?: {
    id: string;
    user: { name: string; email: string };
  };
  staff?: {
    id: string;
    user: { name: string };
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  NO_SHOW: { label: 'Tidak Hadir', color: 'bg-slate-500/20 text-slate-400', icon: AlertCircle },
};

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  });

  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session?.user?.role || '');

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${id}`);
      const data = await res.json();
      if (res.ok) {
        setAppointment(data);
        setFormData({
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        router.push('/appointments');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAppointment();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal memperbarui jadwal');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm(
      'Batalkan Jadwal?',
      'Apakah Anda yakin ingin membatalkan jadwal ini?',
      'Ya, Batalkan'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (res.ok) {
        fetchAppointment();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Jadwal tidak ditemukan</p>
        <Link href="/appointments">
          <Button variant="link" className="text-emerald-400">
            Kembali ke daftar jadwal
          </Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[appointment.status]?.icon || Clock;
  const scheduledDate = new Date(appointment.scheduledAt);
  const endDate = appointment.endAt ? new Date(appointment.endAt) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/appointments"
            className="text-sm text-emerald-400 hover:text-emerald-300 mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-white">{appointment.title}</h1>
          <p className="text-slate-400">{appointment.service?.name || 'Jadwal'}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm rounded-full ${statusConfig[appointment.status]?.color}`}
        >
          <StatusIcon className="w-4 h-4 inline mr-1" />
          {statusConfig[appointment.status]?.label}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Detail Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Detail Jadwal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tanggal & Waktu</p>
                <p className="text-lg font-medium text-white">
                  {scheduledDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-emerald-400">
                  {scheduledDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {endDate &&
                    ` - ${endDate.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Layanan</p>
                <p className="text-white">{appointment.service?.name || '-'}</p>
                {appointment.service?.durationMinutes && (
                  <p className="text-sm text-slate-500">
                    Durasi: {appointment.service.durationMinutes} menit
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Klien</p>
                <p className="text-white">{appointment.client?.user?.name || '-'}</p>
                <p className="text-sm text-slate-500">{appointment.client?.user?.email}</p>
              </div>
            </div>

            {appointment.staff && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Staff</p>
                  <p className="text-white">{appointment.staff.user?.name}</p>
                </div>
              </div>
            )}

            {appointment.location && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Lokasi</p>
                  <p className="text-white">{appointment.location}</p>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Catatan</p>
                <p className="text-slate-300 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <div className="space-y-6">
          {/* Update Status (Staff/Admin only) */}
          {isStaffOrAdmin && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    rows={3}
                    placeholder="Tambahkan catatan..."
                  />
                </div>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cancel Button */}
          {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full text-red-400 border-red-400/50 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Batalkan Jadwal
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-400">
                <p>Dibuat: {new Date(appointment.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
