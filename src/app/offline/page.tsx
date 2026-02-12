'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center max-w-md">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Tidak Ada Koneksi Internet</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Sepertinya Anda sedang offline. Periksa koneksi internet Anda dan coba lagi. Halaman akan
          otomatis dimuat ulang saat koneksi tersedia.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium border border-slate-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Connection status indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Menunggu koneksi...
        </div>
      </div>
    </div>
  );
}
