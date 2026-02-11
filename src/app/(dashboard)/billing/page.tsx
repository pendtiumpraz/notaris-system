'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { showDeleteConfirm } from '@/lib/swal';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  receivedBy?: { name: string } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  client: { id: string; user: { name: string; email: string } };
  document: { title: string; documentNumber: string } | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdBy: { name: string };
}

interface Client {
  id: string;
  user: { name: string; email: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-slate-500/20 text-slate-400',
    icon: <Clock className="w-4 h-4" />,
  },
  SENT: {
    label: 'Terkirim',
    color: 'bg-blue-500/20 text-blue-400',
    icon: <Send className="w-4 h-4" />,
  },
  PAID: {
    label: 'Lunas',
    color: 'bg-emerald-500/20 text-emerald-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  PARTIALLY_PAID: {
    label: 'Sebagian',
    color: 'bg-amber-500/20 text-amber-400',
    icon: <DollarSign className="w-4 h-4" />,
  },
  OVERDUE: {
    label: 'Jatuh Tempo',
    color: 'bg-red-500/20 text-red-400',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    label: 'Dibatalkan',
    color: 'bg-red-500/20 text-red-400',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Tunai',
  BANK_TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
  CREDIT_CARD: 'Kartu Kredit',
  OTHER: 'Lainnya',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [sheetMode, setSheetMode] = useState<'closed' | 'create' | 'view' | 'edit' | 'payment'>(
    'closed'
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formClientId, setFormClientId] = useState('');
  const [formItems, setFormItems] = useState<
    { description: string; quantity: number; unitPrice: number }[]
  >([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [formTax, setFormTax] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formNotes, setFormNotes] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  // Payment form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const isAdmin =
    session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const fetchClients = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/admin/users?role=CLIENT');
      if (res.ok) {
        const data = await res.json();
        setClients(
          data.users
            ?.map((u: any) => ({
              id: u.client?.id,
              user: { name: u.name, email: u.email },
            }))
            .filter((c: Client) => c.id) || []
        );
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client.user.name.toLowerCase().includes(q) ||
      (inv.document?.title?.toLowerCase().includes(q) ?? false)
    );
  });

  const openCreate = () => {
    setFormClientId('');
    setFormItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setFormTax(0);
    setFormDiscount(0);
    setFormNotes('');
    setFormDueDate('');
    setSheetMode('create');
  };

  const openView = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setSheetMode('view');
  };

  const openEdit = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setFormClientId(inv.client.id);
    setFormItems(
      inv.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }))
    );
    setFormTax(inv.taxPercent);
    setFormDiscount(inv.discount);
    setFormNotes(inv.notes || '');
    setFormDueDate(inv.dueDate ? inv.dueDate.substring(0, 10) : '');
    setSheetMode('edit');
  };

  const openPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.totalAmount - inv.paidAmount);
    setPayMethod('BANK_TRANSFER');
    setPayReference('');
    setPayNotes('');
    setSheetMode('payment');
  };

  const addItem = () => {
    setFormItems([...formItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...formItems];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    setFormItems(updated);
  };

  const subtotal = formItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (formTax / 100);
  const total = subtotal + taxAmount - formDiscount;

  const handleSave = async () => {
    if (!formClientId) {
      toast.warning('Pilih klien terlebih dahulu');
      return;
    }
    if (formItems.some((i) => !i.description || i.unitPrice <= 0)) {
      toast.warning('Isi semua item dengan benar');
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = sheetMode === 'edit' && selectedInvoice;
      const url = isEdit ? `/api/invoices/${selectedInvoice.id}` : '/api/invoices';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        items: formItems,
        taxPercent: formTax,
        discount: formDiscount,
        notes: formNotes,
        dueDate: formDueDate || null,
      };
      if (!isEdit) {
        payload.clientId = formClientId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Tagihan diperbarui' : 'Tagihan berhasil dibuat');
        setSheetMode('closed');
        fetchInvoices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal menyimpan tagihan');
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice || payAmount <= 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payAmount,
          method: payMethod,
          reference: payReference || null,
          notes: payNotes || null,
        }),
      });

      if (res.ok) {
        toast.success('Pembayaran berhasil dicatat');
        setSheetMode('closed');
        fetchInvoices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal mencatat pembayaran');
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (inv: Invoice, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Status diubah ke ${statusConfig[newStatus]?.label || newStatus}`);
        fetchInvoices();
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showDeleteConfirm('Hapus tagihan ini?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Tagihan dihapus');
        fetchInvoices();
      }
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  // Stats
  const totalUnpaid = invoices
    .filter((i) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
    .reduce((s, i) => s + i.totalAmount - i.paidAmount, 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.totalAmount, 0);
  const overdueCount = invoices.filter(
    (i) =>
      i.status === 'OVERDUE' ||
      (i.dueDate && new Date(i.dueDate) < new Date() && !['PAID', 'CANCELLED'].includes(i.status))
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Receipt className="w-7 h-7 text-emerald-400" />
            Tagihan
          </h1>
          <p className="text-slate-400 mt-1">
            {isAdmin ? 'Kelola invoice dan pembayaran klien' : 'Lihat tagihan Anda'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Buat Tagihan
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Belum Dibayar</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalUnpaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Terbayar</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Jatuh Tempo</p>
              <p className="text-xl font-bold text-white">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice, nama klien..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Semua Status</option>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Belum ada tagihan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const st = statusConfig[inv.status] || statusConfig.DRAFT;
            return (
              <Card
                key={inv.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-emerald-400">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}
                        >
                          {st.icon} {st.label}
                        </span>
                      </div>
                      <p className="text-white font-medium">{inv.client.user.name}</p>
                      {inv.document && (
                        <p className="text-sm text-slate-400">Dok: {inv.document.title}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>{formatDate(inv.createdAt)}</span>
                        {inv.dueDate && (
                          <span
                            className={
                              new Date(inv.dueDate) < new Date() &&
                              !['PAID', 'CANCELLED'].includes(inv.status)
                                ? 'text-red-400'
                                : ''
                            }
                          >
                            Jatuh tempo: {formatDate(inv.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      {inv.paidAmount > 0 && inv.paidAmount < inv.totalAmount && (
                        <p className="text-sm text-amber-400">
                          Dibayar: {formatCurrency(inv.paidAmount)}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => openView(inv)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isAdmin && !['PAID', 'CANCELLED'].includes(inv.status) && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openPayment(inv)}>
                              <CreditCard className="w-4 h-4" />
                            </Button>
                            {inv.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(inv, 'SENT')}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {isAdmin && inv.status === 'DRAFT' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Invoice Sheet */}
      <Sheet
        open={sheetMode === 'create' || sheetMode === 'edit'}
        onOpenChange={() => setSheetMode('closed')}
      >
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {sheetMode === 'edit' ? 'Edit Tagihan' : 'Buat Tagihan Baru'}
            </SheetTitle>
            <SheetDescription>
              {sheetMode === 'edit' ? 'Perbarui detail invoice' : 'Buat invoice untuk klien'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Klien *</label>
              <select
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="">Pilih klien...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.user.name} ({c.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Jatuh Tempo</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Item Tagihan *
              </label>
              {formItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Deskripsi"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-center"
                    min={1}
                  />
                  <input
                    type="number"
                    placeholder="Harga"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                    className="w-32 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  {formItems.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-300 px-1"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addItem}
                className="text-sm text-emerald-400 hover:text-emerald-300 mt-1"
              >
                + Tambah Item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pajak (%)</label>
                <input
                  type="number"
                  value={formTax}
                  onChange={(e) => setFormTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Diskon (Rp)</label>
                <input
                  type="number"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  min={0}
                />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {formTax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Pajak ({formTax}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {formDiscount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Diskon</span>
                  <span>-{formatCurrency(formDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-700">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetMode('closed')}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {sheetMode === 'edit' ? 'Simpan Perubahan' : 'Buat Tagihan'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View Invoice Sheet */}
      <Sheet open={sheetMode === 'view'} onOpenChange={() => setSheetMode('closed')}>
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-xl overflow-y-auto">
          {selectedInvoice && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selectedInvoice.invoiceNumber}</SheetTitle>
                <SheetDescription>Detail tagihan</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedInvoice.status]?.color}`}
                  >
                    {statusConfig[selectedInvoice.status]?.icon}{' '}
                    {statusConfig[selectedInvoice.status]?.label}
                  </span>
                  <span className="text-sm text-slate-400">
                    {formatDate(selectedInvoice.createdAt)}
                  </span>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-slate-400">Klien</p>
                  <p className="text-white font-medium">{selectedInvoice.client.user.name}</p>
                  <p className="text-sm text-slate-400">{selectedInvoice.client.user.email}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Item</p>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between bg-slate-800/30 rounded-lg p-3">
                        <div>
                          <p className="text-white text-sm">{item.description}</p>
                          <p className="text-xs text-slate-400">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-white font-medium">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Pajak ({selectedInvoice.taxPercent}%)</span>
                      <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Diskon</span>
                      <span>-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-700">
                    <span>Total</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  {selectedInvoice.paidAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Dibayar</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                  )}
                  {selectedInvoice.totalAmount - selectedInvoice.paidAmount > 0 &&
                    selectedInvoice.status !== 'CANCELLED' && (
                      <div className="flex justify-between text-amber-400 font-medium">
                        <span>Sisa</span>
                        <span>
                          {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                        </span>
                      </div>
                    )}
                </div>

                {selectedInvoice.payments.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Riwayat Pembayaran</p>
                    <div className="space-y-2">
                      {selectedInvoice.payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="bg-slate-800/30 rounded-lg p-3 flex justify-between"
                        >
                          <div>
                            <p className="text-white text-sm">{formatCurrency(pay.amount)}</p>
                            <p className="text-xs text-slate-400">
                              {paymentMethodLabels[pay.method] || pay.method}
                              {pay.reference && ` • Ref: ${pay.reference}`}
                            </p>
                          </div>
                          <p className="text-sm text-slate-400">{formatDate(pay.paidAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Catatan</p>
                    <p className="text-white text-sm">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Payment Sheet */}
      <Sheet open={sheetMode === 'payment'} onOpenChange={() => setSheetMode('closed')}>
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-md">
          {selectedInvoice && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">Catat Pembayaran</SheetTitle>
                <SheetDescription>
                  {selectedInvoice.invoiceNumber} • Sisa:{' '}
                  {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Jumlah (Rp) *
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {Object.entries(paymentMethodLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    No. Referensi / Bukti Transfer
                  </label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Opsional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
                  <textarea
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setSheetMode('closed')}>
                  Batal
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Simpan Pembayaran
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
