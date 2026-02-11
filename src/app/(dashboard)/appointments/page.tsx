'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { showConfirm } from '@/lib/swal';
import {
  Calendar,
  Plus,
  Clock,
  User,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/utils';

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  client: { user: { name: string } };
  staff: { user: { name: string } } | null;
  service: { name: string };
  document: { title: string; documentNumber: string } | null;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Menunggu',
    color: 'bg-yellow-500/20 text-yellow-400',
    icon: <Clock className="w-4 h-4" />,
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    color: 'bg-blue-500/20 text-blue-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  COMPLETED: {
    label: 'Selesai',
    color: 'bg-emerald-500/20 text-emerald-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-500/20 text-red-400',
    icon: <XCircle className="w-4 h-4" />,
  },
  NO_SHOW: {
    label: 'Tidak Hadir',
    color: 'bg-slate-500/20 text-slate-400',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole || '');
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole || '');
  const isClient = userRole === 'CLIENT';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [fetchAppointments, fetchServices]);

  const openCreateSheet = () => {
    setSheetMode('create');
    setSelectedAppointment(null);
    setIsSheetOpen(true);
  };

  const openViewSheet = (appt: Appointment) => {
    setSheetMode('view');
    setSelectedAppointment(appt);
    setIsSheetOpen(true);
  };

  const openEditSheet = (appt: Appointment) => {
    setSheetMode('edit');
    setSelectedAppointment(appt);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Batalkan Janji?',
      'Yakin ingin membatalkan janji temu ini?',
      'Ya, Batalkan'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    const endpoint =
      sheetMode === 'create' ? '/api/appointments' : `/api/appointments/${selectedAppointment?.id}`;
    const method = sheetMode === 'create' ? 'POST' : 'PUT';

    const service = services.find((s) => s.id === formData.get('serviceId'));

    const data: Record<string, unknown> = {
      serviceId: formData.get('serviceId'),
      scheduledAt: `${formData.get('date')}T${formData.get('time')}:00`,
      durationMinutes: service?.durationMinutes || 30,
      notes: formData.get('notes') || null,
    };

    if (formData.get('status')) {
      data.status = formData.get('status');
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsSheetOpen(false);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce(
    (acc, appt) => {
      const date = new Date(appt.scheduledAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(appt);
      return acc;
    },
    {} as Record<string, Appointment[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Jadwal</h1>
          <p className="text-slate-400">Kelola janji temu dan konsultasi</p>
        </div>
        <Button onClick={openCreateSheet} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          {isClient ? 'Buat Jadwal' : 'Buat Janji Temu'}
        </Button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada janji temu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-400 mb-3">{date}</h3>
              <div className="space-y-3">
                {appts.map((appt) => (
                  <Card key={appt.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className="text-2xl font-bold text-emerald-400">
                              {new Date(appt.scheduledAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-xs text-slate-500">
                              {appt.durationMinutes} menit
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{appt.service.name}</h4>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[appt.status]?.color}`}
                              >
                                {statusConfig[appt.status]?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {appt.client.user.name}
                              </span>
                              {appt.staff && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Staff: {appt.staff.user.name}
                                </span>
                              )}
                            </div>
                            {appt.document && (
                              <p className="text-sm text-slate-500 mt-1">
                                Dokumen: {appt.document.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewSheet(appt)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* Staff/Admin can edit any appointment */}
                          {isStaffOrAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSheet(appt)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Client can only cancel their own pending appointments */}
                          {isClient && appt.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(appt.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Admin can cancel/delete any appointment */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(appt.id)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'create' && 'Buat Janji Temu'}
              {sheetMode === 'edit' && 'Edit Janji Temu'}
              {sheetMode === 'view' && 'Detail Janji Temu'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {sheetMode === 'view' ? 'Informasi lengkap janji temu' : 'Isi form di bawah ini'}
            </SheetDescription>
          </SheetHeader>

          {sheetMode === 'view' && selectedAppointment ? (
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-slate-500 text-xs">Layanan</Label>
                <p className="text-white">{selectedAppointment.service.name}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Waktu</Label>
                <p className="text-white">{formatDateTime(selectedAppointment.scheduledAt)}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Durasi</Label>
                <p className="text-white">{selectedAppointment.durationMinutes} menit</p>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Status</Label>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${statusConfig[selectedAppointment.status]?.color}`}
                >
                  {statusConfig[selectedAppointment.status]?.label}
                </span>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Klien</Label>
                <p className="text-white">{selectedAppointment.client.user.name}</p>
              </div>
              {selectedAppointment.staff && (
                <div>
                  <Label className="text-slate-500 text-xs">Staff</Label>
                  <p className="text-white">{selectedAppointment.staff.user.name}</p>
                </div>
              )}
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-slate-500 text-xs">Catatan</Label>
                  <p className="text-white">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave(new FormData(e.currentTarget));
              }}
              className="space-y-4 mt-6"
            >
              <div className="space-y-2">
                <Label className="text-slate-300">Jenis Layanan</Label>
                <select
                  name="serviceId"
                  required
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                >
                  <option value="">Pilih Layanan</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.durationMinutes} menit)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Tanggal</Label>
                  <Input
                    name="date"
                    type="date"
                    defaultValue={
                      selectedAppointment?.scheduledAt?.split('T')[0] ||
                      new Date().toISOString().split('T')[0]
                    }
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Waktu</Label>
                  <Input
                    name="time"
                    type="time"
                    defaultValue={
                      selectedAppointment?.scheduledAt
                        ? new Date(selectedAppointment.scheduledAt).toTimeString().slice(0, 5)
                        : '09:00'
                    }
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              {isStaffOrAdmin && sheetMode === 'edit' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <select
                    name="status"
                    defaultValue={selectedAppointment?.status || 'PENDING'}
                    className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-slate-300">Catatan</Label>
                <textarea
                  name="notes"
                  defaultValue={selectedAppointment?.notes || ''}
                  className="w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Catatan tambahan..."
                />
              </div>

              <SheetFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSheetOpen(false)}
                  className="border-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
