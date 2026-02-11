'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, Loader2, Save, Plus, Trash2, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Minggu' },
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
];

export default function StaffAvailabilityPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/availability');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.availability || []);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const addSlot = (dayOfWeek: number) => {
    setSlots((prev) => [
      ...prev,
      { dayOfWeek, startTime: '09:00', endTime: '17:00', isAvailable: true },
    ]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/staff/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilities: slots.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data.availability || []);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setSaving(false);
    }
  };

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: slots
      .map((s, originalIndex) => ({ ...s, originalIndex }))
      .filter((s) => s.dayOfWeek === day.value),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ketersediaan Jadwal</h1>
          <p className="text-slate-400">Atur jadwal ketersediaan Anda untuk menerima janji temu</p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {slotsByDay.map((day) => (
          <Card key={day.value} className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-emerald-400" />
                  {day.label}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(day.value)}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Tambah Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.slots.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Tidak tersedia — klik &quot;Tambah Slot&quot; untuk menambahkan jam kerja
                </p>
              ) : (
                day.slots.map((slot) => (
                  <div
                    key={slot.originalIndex}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                      className="h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-white text-sm"
                    />
                    <span className="text-slate-500">—</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                      className="h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-white text-sm"
                    />
                    <label className="flex items-center gap-2 ml-auto cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={(e) =>
                          updateSlot(slot.originalIndex, 'isAvailable', e.target.checked)
                        }
                        className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span
                        className={`text-sm ${slot.isAvailable ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {slot.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSlot(slot.originalIndex)}
                      className="text-slate-400 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
