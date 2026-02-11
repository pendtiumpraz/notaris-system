'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Loader2,
  Calendar,
  Hash,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

interface RepertoriumEntry {
  id: string;
  nomorUrut: number;
  nomorBulanan: number;
  tanggal: string;
  sifatAkta: string;
  namaPenghadap: string[];
  keterangan: string | null;
  isPPAT: boolean;
  document: { id: string; title: string; documentNumber: string; status: string } | null;
  createdBy: { name: string };
}

interface Stats {
  totalAkta: number;
  lastNomor: number;
  perBulan: { bulan: number; count: number }[];
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

const JENIS_AKTA = [
  'Akta Pendirian PT',
  'Akta Pendirian CV',
  'Akta Pendirian Yayasan',
  'Akta Perubahan Anggaran Dasar',
  'Akta RUPS',
  'Akta Jual Beli',
  'Akta Hibah',
  'Akta Perjanjian',
  'Akta Kuasa',
  'Akta Fidusia',
  'Akta Wasiat',
  'Surat Keterangan Waris',
  'Legalisasi',
  'Waarmerking',
  'Covernote',
  'AJB (PPAT)',
  'APHT (PPAT)',
  'SKMHT (PPAT)',
  'Akta Hibah Tanah (PPAT)',
  'APHB (PPAT)',
  'Lainnya',
];

export default function RepertoriumPage() {
  const [entries, setEntries] = useState<RepertoriumEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState<number | ''>('');
  const [filterPPAT, setFilterPPAT] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('nomorUrut');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formSifatAkta, setFormSifatAkta] = useState('');
  const [formCustomAkta, setFormCustomAkta] = useState('');
  const [formPenghadap, setFormPenghadap] = useState<string[]>(['']);
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formIsPPAT, setFormIsPPAT] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tahun', tahun.toString());
      if (bulan) params.set('bulan', bulan.toString());
      if (filterPPAT) params.set('isPPAT', filterPPAT);
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/repertorium?${params}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data || []);
        setStats(json.stats || null);
        setTotalPages(json.meta?.totalPages || 1);
        setTotal(json.meta?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tahun, bulan, filterPPAT, search, page, sortBy, sortOrder, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormSifatAkta('');
    setFormCustomAkta('');
    setFormPenghadap(['']);
    setFormKeterangan('');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormIsPPAT(false);
    setIsSheetOpen(true);
  };

  const addPenghadap = () => setFormPenghadap([...formPenghadap, '']);
  const removePenghadap = (idx: number) =>
    setFormPenghadap(formPenghadap.filter((_, i) => i !== idx));
  const updatePenghadap = (idx: number, val: string) =>
    setFormPenghadap(formPenghadap.map((p, i) => (i === idx ? val : p)));

  const handleSave = async () => {
    const sifat = formSifatAkta === 'Lainnya' ? formCustomAkta : formSifatAkta;
    const names = formPenghadap.filter((p) => p.trim());

    if (!sifat || names.length === 0) {
      toast.error('Sifat akta dan minimal 1 penghadap wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/repertorium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sifatAkta: sifat,
          namaPenghadap: names,
          keterangan: formKeterangan || null,
          tanggal: formTanggal,
          isPPAT: formIsPPAT,
        }),
      });
      if (res.ok) {
        toast.success('Entri repertorium berhasil ditambahkan');
        setIsSheetOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Gagal menyimpan entri');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-400" />
            Buku Repertorium
          </h1>
          <p className="text-slate-400">
            Daftar akta notaris — Sesuai UU No. 2/2014 tentang Jabatan Notaris
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              params.set('tahun', tahun.toString());
              if (bulan) params.set('bulan', bulan.toString());
              window.open(`/api/repertorium/export?${params}`, '_blank');
            }}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Entri
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Akta {tahun}</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAkta}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Nomor Terakhir</p>
                  <p className="text-2xl font-bold text-white">{stats.lastNomor}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Ditampilkan</p>
                  <p className="text-2xl font-bold text-white">{total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Cari sifat akta atau penghadap..."
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
        <select
          value={filterPPAT}
          onChange={(e) => {
            setFilterPPAT(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
        >
          <option value="">Semua Jenis</option>
          <option value="false">Notaris</option>
          <option value="true">PPAT</option>
        </select>
      </div>

      {/* Sort & Date Range */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Urutkan:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-2 text-sm text-white"
          >
            <option value="nomorUrut">No. Urut</option>
            <option value="tanggal">Tanggal</option>
            <option value="sifatAkta">Sifat Akta</option>
          </select>
          <button
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              setPage(1);
            }}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Dari:</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-9 w-40 bg-slate-800 border-slate-700 text-white text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Sampai:</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-9 w-40 bg-slate-800 border-slate-700 text-white text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset Tanggal
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada entri repertorium</p>
              {bulan === '' ? (
                <p className="text-sm mt-1">Klik &quot;Tambah Entri&quot; untuk memulai</p>
              ) : (
                <p className="text-sm mt-1">
                  NIHIL — Tidak ada akta di bulan {BULAN_NAMES[bulan as number]} {tahun}
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      No. Bln
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Sifat Akta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Nama Penghadap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Ket
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-white font-mono font-bold">
                        {entry.nomorUrut}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{entry.nomorBulanan}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(entry.tanggal)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{entry.sifatAkta}</span>
                          {entry.isPPAT && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 font-medium">
                              PPAT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex flex-wrap gap-1">
                          {entry.namaPenghadap.map((nama, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-slate-800 text-xs"
                            >
                              {nama}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                        {entry.keterangan || '-'}
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

      {/* Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-800 overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-white">Tambah Entri Repertorium</SheetTitle>
            <SheetDescription className="text-slate-400">
              Catat akta baru ke buku repertorium
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Tanggal Akta</Label>
              <Input
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Sifat Akta *</Label>
              <select
                value={formSifatAkta}
                onChange={(e) => {
                  setFormSifatAkta(e.target.value);
                  setFormIsPPAT(e.target.value.includes('PPAT'));
                }}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-white"
              >
                <option value="">Pilih Jenis Akta...</option>
                {JENIS_AKTA.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              {formSifatAkta === 'Lainnya' && (
                <Input
                  placeholder="Tulis jenis akta..."
                  value={formCustomAkta}
                  onChange={(e) => setFormCustomAkta(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white mt-2"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPPAT"
                checked={formIsPPAT}
                onChange={(e) => setFormIsPPAT(e.target.checked)}
                className="rounded border-slate-600"
              />
              <Label htmlFor="isPPAT" className="text-slate-300 cursor-pointer">
                Akta PPAT
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Nama Penghadap *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addPenghadap}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-3 h-3 mr-1" /> Tambah
                </Button>
              </div>
              {formPenghadap.map((nama, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Penghadap ${idx + 1}`}
                    value={nama}
                    onChange={(e) => updatePenghadap(idx, e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {formPenghadap.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePenghadap(idx)}
                      className="text-slate-400 hover:text-red-400 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Keterangan</Label>
              <textarea
                value={formKeterangan}
                onChange={(e) => setFormKeterangan(e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                className="w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>

          <SheetFooter className="pt-6">
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="border-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
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
              Simpan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
