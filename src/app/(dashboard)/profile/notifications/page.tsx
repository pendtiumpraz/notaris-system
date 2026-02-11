'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Moon,
  Loader2,
  Save,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Settings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/profile/notification-settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan Notifikasi</h1>
        <p className="text-slate-400">Kelola preferensi notifikasi Anda</p>
      </div>

      {/* Notification Channels */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Kanal Notifikasi
          </CardTitle>
          <CardDescription className="text-slate-400">
            Pilih bagaimana Anda ingin menerima notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <Label className="text-white font-medium">Email</Label>
                <p className="text-sm text-slate-400">Terima notifikasi via email</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('emailEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailEnabled ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <Label className="text-white font-medium">Push Notification</Label>
                <p className="text-sm text-slate-400">Terima notifikasi di browser</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('pushEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pushEnabled ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <Label className="text-white font-medium">SMS</Label>
                <p className="text-sm text-slate-400">Terima notifikasi via SMS</p>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('smsEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smsEnabled ? 'bg-emerald-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.smsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Moon className="w-5 h-5 text-emerald-400" />
            Jam Hening
          </CardTitle>
          <CardDescription className="text-slate-400">
            Nonaktifkan notifikasi pada jam tertentu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">Mulai</Label>
              <input
                type="time"
                value={settings.quietHoursStart || ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, quietHoursStart: e.target.value || null }))
                }
                className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
              />
            </div>
            <span className="text-slate-500 mt-5">—</span>
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">Selesai</Label>
              <input
                type="time"
                value={settings.quietHoursEnd || ''}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, quietHoursEnd: e.target.value || null }))
                }
                className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
              />
            </div>
            {(settings.quietHoursStart || settings.quietHoursEnd) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    quietHoursStart: null,
                    quietHoursEnd: null,
                  }))
                }
                className="text-slate-400 mt-5"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Pengaturan
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Tersimpan
          </span>
        )}
      </div>
    </div>
  );
}
