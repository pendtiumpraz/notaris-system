'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookText,
  Search,
  Loader2,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface KlapperEntry {
  id: string;
  namaPenghadap: string;
  sifatAkta: string;
  nomorAkta: number;
  tanggalAkta: string;
  hurufAwal: string;
  bulan: number;
  tahun: number;
  repertorium: { id: string; nomorUrut: number; sifatAkta: string; tanggal: string };
}

interface AlphabetStat {
  huruf: string;
  count: number;
}

const BULAN_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function KlapperPage() {
  const [entries, setEntries] = useState<KlapperEntry[]>([]);
  const [alphabetStats, setAlphabetStats] = useState<AlphabetStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState<number | ''>('');
  const [activeHuruf, setActiveHuruf] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tahun', tahun.toString());
      if (bulan) params.set('bulan', bulan.toString());
      if (activeHuruf) params.set('huruf', activeHuruf);
      if (search) params.set('search', search);
      params.set('page', page.toString());

      const res = await fetch(`/api/klapper?${params}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data || []);
        setAlphabetStats(json.alphabetStats || []);
        setTotalPages(json.meta?.totalPages || 1);
        setTotal(json.meta?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tahun, bulan, activeHuruf, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const getLetterCount = (letter: string) => {
    const found = alphabetStats.find((a) => a.huruf === letter);
    return found?.count || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookText className="w-7 h-7 text-blue-400" />
            Buku Klapper
          </h1>
          <p className="text-slate-400">
            Indeks alfabetis penghadap akta — Sesuai UU No. 2/2014 tentang Jabatan Notaris
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const params = new URLSearchParams();
            params.set('tahun', tahun.toString());
            if (bulan) params.set('bulan', bulan.toString());
            window.open(`/api/klapper/export?${params}`, '_blank');
          }}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Cari nama penghadap..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTahun(tahun - 1)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-medium min-w-[60px] text-center">{tahun}</span>
          <button
            onClick={() => setTahun(tahun + 1)}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <select
          value={bulan}
          onChange={(e) => {
            setBulan(e.target.value ? parseInt(e.target.value) : '');
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
        >
          <option value="">Semua Bulan</option>
          {BULAN_NAMES.slice(1).map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Alphabet Tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => {
            setActiveHuruf('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeHuruf === ''
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Semua ({total})
        </button>
        {ALPHABET.map((letter) => {
          const count = getLetterCount(letter);
          return (
            <button
              key={letter}
              onClick={() => {
                setActiveHuruf(letter);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeHuruf === letter
                  ? 'bg-blue-600 text-white'
                  : count > 0
                    ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    : 'bg-slate-800/50 text-slate-600 cursor-default'
              }`}
              disabled={count === 0}
            >
              {letter}
              {count > 0 && <span className="ml-1 text-[10px] opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BookText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada entri klapper</p>
              <p className="text-sm mt-1">
                Entri klapper otomatis terisi saat menambahkan repertorium
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase w-12">
                      Huruf
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Nama Penghadap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Sifat Akta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      No. Akta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center">
                          {entry.hurufAwal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{entry.namaPenghadap}</td>
                      <td className="px-4 py-3 text-slate-300">{entry.sifatAkta}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Hash className="w-3 h-3 text-slate-500" />
                          {entry.nomorAkta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(entry.tanggalAkta)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Halaman {page} dari {totalPages} ({total} entri)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="border-slate-700 text-slate-400"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="border-slate-700 text-slate-400"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
