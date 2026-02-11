'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Scale, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Terjadi kesalahan');
      }
    } catch {
      toast.error('Gagal mengirim request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Scale className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-white">Lupa Password</CardTitle>
          <CardDescription className="text-slate-400">
            {isSubmitted
              ? 'Cek email Anda untuk instruksi reset password'
              : 'Masukkan email untuk reset password'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-300">
              Jika email <span className="text-emerald-400">{email}</span> terdaftar, Anda akan
              menerima link untuk reset password.
            </p>
            <Button asChild variant="outline" className="border-slate-700">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Link Reset'}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-emerald-400 hover:text-emerald-300">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
