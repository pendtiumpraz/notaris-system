'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scale, Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Terjadi kesalahan');
      }
    } catch {
      setError('Gagal mengirim request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="text-center py-8 space-y-4">
          <p className="text-red-400">
            Token tidak ditemukan. Silakan minta link reset password baru.
          </p>
          <Button asChild variant="outline" className="border-slate-700">
            <Link href="/forgot-password">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Lupa Password
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Scale className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-slate-400">
            {isSuccess ? 'Password berhasil direset' : 'Masukkan password baru Anda'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-300">
              Password Anda telah berhasil direset. Silakan login dengan password baru.
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Login Sekarang</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password Baru
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
