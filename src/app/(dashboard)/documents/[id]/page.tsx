'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Download,
  Upload,
  Trash2,
  Loader2,
  CheckCircle,
  Circle,
  AlertCircle,
  File,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  documentType?: { id: string; name: string };
  client?: {
    id: string;
    clientNumber: string;
    user: { name: string; email: string };
  };
  assignedStaff?: {
    id: string;
    user: { name: string };
  };
  files?: DriveFile[];
  statusHistory?: StatusHistory[];
}

interface DriveFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  webViewLink?: string;
  createdAt: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes?: string;
  createdAt: string;
  changedBy?: { name: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400', icon: Circle },
  SUBMITTED: { label: 'Diajukan', color: 'bg-blue-500/20 text-blue-400', icon: Circle },
  IN_REVIEW: { label: 'Dalam Review', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  WAITING_SIGNATURE: {
    label: 'Menunggu TTD',
    color: 'bg-purple-500/20 text-purple-400',
    icon: AlertCircle,
  },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400', icon: AlertCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Rendah', color: 'bg-slate-500/20 text-slate-400' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  HIGH: { label: 'Tinggi', color: 'bg-orange-500/20 text-orange-400' },
  URGENT: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
};

const statusOrder = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'WAITING_SIGNATURE', 'COMPLETED'];

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    fetchDocument();
    fetchFiles();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDocument(data);
        setFormData({
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        router.push('/documents');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/drive/files?documentId=${id}`);
      const data = await res.json();
      if (res.ok) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', id);

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengupload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gagal mengupload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Hapus file ini?')) return;

    try {
      const res = await fetch(`/api/drive/files/${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchDocument();
        setEditMode(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal memperbarui dokumen');
      }
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIndex = (status: string) => statusOrder.indexOf(status);
  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session?.user?.role || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Dokumen tidak ditemukan</p>
        <Link href="/documents">
          <Button variant="link" className="text-emerald-400">
            Kembali ke daftar dokumen
          </Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[document.status]?.icon || Circle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/documents"
            className="text-sm text-emerald-400 hover:text-emerald-300 mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-white">{document.title}</h1>
          <p className="text-slate-400">{document.documentNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-sm rounded-full ${statusConfig[document.status]?.color}`}
          >
            {statusConfig[document.status]?.label}
          </span>
          <span
            className={`px-3 py-1 text-sm rounded-full ${priorityConfig[document.priority]?.color}`}
          >
            {priorityConfig[document.priority]?.label}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Timeline Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
                {statusOrder.map((status, index) => {
                  const currentIndex = getStatusIndex(document.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = status === document.status;
                  const config = statusConfig[status];
                  const Icon = isCompleted ? CheckCircle : Circle;

                  return (
                    <div key={status} className="relative pl-10 pb-6 last:pb-0">
                      <div
                        className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'
                        } ${isCurrent ? 'ring-4 ring-emerald-500/30' : ''}`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${isCompleted ? 'text-white' : 'text-slate-500'}`}
                        >
                          {config.label}
                        </p>
                        {isCurrent && document.updatedAt && (
                          <p className="text-sm text-slate-400">
                            {new Date(document.updatedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Dokumen Terlampir</CardTitle>
              <label>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload File
                  </span>
                </Button>
              </label>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.fileName}</p>
                          <p className="text-sm text-slate-400">{formatFileSize(file.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {document.description && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Deskripsi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{document.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Jenis Dokumen</p>
                  <p className="text-white">{document.documentType?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Klien</p>
                  <p className="text-white">{document.client?.user?.name || '-'}</p>
                </div>
              </div>

              {document.assignedStaff && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Staff</p>
                    <p className="text-white">{document.assignedStaff.user?.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Dibuat</p>
                  <p className="text-white">
                    {new Date(document.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>

              {document.dueDate && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Tenggat</p>
                    <p className="text-white">
                      {new Date(document.dueDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Status (Staff/Admin only) */}
          {isStaffOrAdmin && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-slate-800 border-slate-700"
                    rows={3}
                    placeholder="Tambahkan catatan..."
                  />
                </div>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
