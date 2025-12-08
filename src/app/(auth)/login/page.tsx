'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Scale, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl });
  };

  return (
    <>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto logo-animate">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Client Portal Notaris</CardTitle>
            <CardDescription className="text-slate-400">
              Masuk untuk mengakses layanan notaris
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab Switcher */}
          <div className="relative bg-slate-800 rounded-lg p-1 flex">
            <div
              className="tab-indicator absolute inset-y-1 bg-emerald-600 rounded-md"
              style={{
                width: '50%',
                transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
            <button
              onClick={() => setActiveTab('login')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'login' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'register' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Atau</span>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {activeTab === 'login' && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Lupa password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full btn-shine bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeTab === 'login' ? (
                'Masuk'
              ) : (
                'Daftar'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {activeTab === 'login' ? (
              <>
                Belum punya akun?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Daftar sekarang
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Masuk
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
