'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { showAIProgress, closeAIProgress, showAISuccess, showAIError } from '@/lib/swal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  ArrowLeft,
  Save,
  Download,
  Loader2,
  Sparkles,
  FileSearch,
  Wand2,
  RefreshCw,
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Table as TableIcon,
  Type,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  GitCompareArrows,
  BookOpen,
  Languages,
  Mail,
  Settings2,
  Monitor,
  Smartphone,
  Minus,
  Plus as PlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================
// PAPER SIZE DEFINITIONS
// ============================================================
const PAPER_SIZES: Record<string, { label: string; width: number; height: number }> = {
  A4: { label: 'A4 (210 × 297mm)', width: 210, height: 297 },
  LEGAL: { label: 'Legal (216 × 356mm)', width: 216, height: 356 },
  LETTER: { label: 'Letter (216 × 279mm)', width: 216, height: 279 },
  F4: { label: 'F4/Folio (215 × 330mm)', width: 215, height: 330 },
};

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24];

interface PageSettings {
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
}

interface DocumentInfo {
  id: string;
  title: string;
  documentType: string;
  clientName: string;
  clientAddress: string;
  content: string;
}

// Page break overlay component — renders opaque overlays at each page boundary
// Each overlay covers: bottom margin (white) + dark gap + top margin (white)
// This hides the text in margin zones, creating a visual page separation
function PageBreakOverlays({
  pageHeight,
  contentHeight,
  marginTop,
  marginBottom,
  marginRight,
  gapSize,
}: {
  pageHeight: number;
  contentHeight: number;
  marginTop: number;
  marginBottom: number;
  marginRight: number;
  gapSize: number;
}) {
  const [pageCount, setPageCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const updatePageCount = () => {
      const heightPx = container.scrollHeight;
      // Convert pageHeight from mm to px (96dpi: 1mm ≈ 3.7795px)
      const pageHeightPx = pageHeight * 3.7795;
      const count = Math.max(1, Math.ceil(heightPx / pageHeightPx));
      setPageCount(count);
    };

    updatePageCount();

    // Watch for content changes
    const observer = new ResizeObserver(updatePageCount);
    observer.observe(container);

    // Also observe mutations (text typing)
    const mutObserver = new MutationObserver(updatePageCount);
    mutObserver.observe(container, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      mutObserver.disconnect();
    };
  }, [pageHeight]);

  const mmToPx = 3.7795; // 96 DPI
  const pageHeightPx = pageHeight * mmToPx;
  const marginBottomPx = marginBottom * mmToPx;
  const marginTopPx = marginTop * mmToPx;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Page break overlays — one for each page boundary */}
      {Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => {
        // Position: at the end of page (i+1)
        const breakTopPx = (i + 1) * pageHeightPx - marginBottomPx;

        return (
          <div
            key={`break-${i}`}
            className="page-break-overlay"
            style={{
              position: 'absolute',
              top: `${breakTopPx}px`,
              left: 0,
              right: 0,
            }}
          >
            {/* Bottom margin zone of page N — opaque white covers text */}
            <div className="margin-bottom-zone" />
            {/* Dark gap between pages */}
            <div className="page-gap" />
            {/* Top margin zone of page N+1 — opaque white covers text */}
            <div className="margin-top-zone" />
          </div>
        );
      })}

      {/* Page number labels */}
      {Array.from({ length: pageCount }, (_, i) => {
        // Position number near bottom of each page, inside the bottom margin area
        const pageBottomPx = (i + 1) * pageHeightPx;
        // Account for gaps from previous breaks
        // Each break adds (gapSize) px of extra space
        const numberTopPx = pageBottomPx - marginBottomPx * 0.5;

        return (
          <div
            key={`num-${i}`}
            className="page-number-label"
            style={{
              top: `${numberTopPx}px`,
              right: `${marginRight * 0.6 * mmToPx}px`,
            }}
          >
            - {i + 1} -
          </div>
        );
      })}
    </div>
  );
}


export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role || '';
  const isStaffOrAdmin = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(userRole);

  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string>('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [reviseInstruction, setReviseInstruction] = useState('');
  const [generateContext, setGenerateContext] = useState('');
  const [compareOriginal, setCompareOriginal] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState('');
  const [letterType, setLetterType] = useState('Surat Pemberitahuan');
  const [letterContext, setLetterContext] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    marginTop: 25,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 20,
    fontSize: 12,
  });

  // Computed paper dimensions
  const paperDef = PAPER_SIZES[pageSettings.paperSize] || PAPER_SIZES.A4;
  const pageWidth = pageSettings.orientation === 'portrait' ? paperDef.width : paperDef.height;
  const pageHeight = pageSettings.orientation === 'portrait' ? paperDef.height : paperDef.width;
  const contentHeight = pageHeight - pageSettings.marginTop - pageSettings.marginBottom;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Mulai menulis dokumen atau gunakan AI untuk generate...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[800px] p-0',
      },
    },
    editable: isStaffOrAdmin,
  });

  // Fetch document content
  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${id}/content`);
      if (res.ok) {
        const data: DocumentInfo = await res.json();
        setDocInfo(data);
        if (data.content && editor) {
          editor.commands.setContent(data.content);
        }
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  }, [id, editor]);

  useEffect(() => {
    if (editor) {
      fetchContent();
    }
  }, [editor, fetchContent]);

  // Save content
  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/documents/${id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!docInfo || !editor) return;

    const html2pdf = (await import('html2pdf.js')).default;

    // Create a temporary container appended to document.body for html2canvas
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${pageWidth}mm;
      background: white;
      z-index: -9999;
      pointer-events: none;
      overflow: hidden;
    `;
    tempContainer.innerHTML = `
      <style>
        .pdf-export-content {
          color: #1a1a1a;
          font-family: 'Times New Roman', 'Georgia', serif;
          font-size: ${pageSettings.fontSize}pt;
          line-height: 2;
        }
        .pdf-export-content h1 { font-size: ${Math.round(pageSettings.fontSize * 1.33)}pt; font-weight: bold; text-align: center; margin-bottom: 4pt; text-transform: uppercase; letter-spacing: 2px; color: #000; }
        .pdf-export-content h2 { font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 16pt 0 8pt; color: #000; }
        .pdf-export-content h3 { font-size: ${pageSettings.fontSize}pt; font-weight: bold; margin: 8pt 0 4pt; color: #000; }
        .pdf-export-content p { margin-bottom: 4pt; text-align: justify; color: #1a1a1a; }
        .pdf-export-content ul, .pdf-export-content ol { margin-left: 20pt; margin-bottom: 6pt; }
        .pdf-export-content li { margin-bottom: 3pt; }
        .pdf-export-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        .pdf-export-content th, .pdf-export-content td { border: 1px solid #333; padding: 6pt 8pt; font-size: ${pageSettings.fontSize - 1}pt; text-align: left; }
        .pdf-export-content th { background: #f5f5f5; font-weight: bold; }
        .pdf-export-content hr { border: none; border-top: 1px solid #333; margin: 12pt 0; }
        .pdf-export-content blockquote { border-left: 3px solid #333; padding-left: 12pt; margin-left: 0; font-style: italic; }
        .pdf-export-content .notarial-doc { font-family: 'Times New Roman', 'Georgia', serif; font-size: ${pageSettings.fontSize}pt; line-height: 2; color: #000; }
        .pdf-export-content .doc-title { text-align: center; font-size: ${Math.round(pageSettings.fontSize * 1.33)}pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4pt; }
        .pdf-export-content .doc-subtitle { text-align: center; font-size: ${pageSettings.fontSize}pt; margin-bottom: 2pt; }
        .pdf-export-content .doc-number { text-align: center; font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt; font-weight: bold; margin-bottom: 16pt; }
        .pdf-export-content .doc-separator { border: none; border-top: 2px solid #000; margin: 12pt 0; }
        .pdf-export-content .doc-separator-thin { border: none; border-top: 1px solid #000; margin: 8pt 0; }
        .pdf-export-content .section-title { font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 16pt 0 8pt 0; }
        .pdf-export-content .pasal-title { font-weight: bold; text-align: center; margin: 16pt 0 8pt 0; }
        .pdf-export-content .pasal-judul { font-weight: bold; text-align: center; margin-bottom: 8pt; text-transform: uppercase; }
        .pdf-export-content .indent { text-indent: 40pt; text-align: justify; margin-bottom: 4pt; }
        .pdf-export-content .no-indent { text-align: justify; margin-bottom: 4pt; }
        .pdf-export-content .komparisi-block { margin: 8pt 0; }
        .pdf-export-content .komparisi-label { font-weight: bold; text-transform: uppercase; margin-bottom: 4pt; }
        .pdf-export-content .komparisi-data { margin-left: 20pt; margin-bottom: 2pt; font-family: 'Courier New', monospace; font-size: ${pageSettings.fontSize - 1}pt; }
        .pdf-export-content .ttd-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 40pt; gap: 20pt; }
        .pdf-export-content .ttd-box { text-align: center; min-width: 150pt; }
        .pdf-export-content .ttd-label { font-size: ${pageSettings.fontSize - 1}pt; margin-bottom: 60pt; }
        .pdf-export-content .ttd-line { border-bottom: 1px solid #000; margin-bottom: 4pt; }
        .pdf-export-content .ttd-name { font-weight: bold; font-size: ${pageSettings.fontSize - 1}pt; }
        .pdf-export-content .premisse-item { padding-left: 20pt; text-align: justify; margin-bottom: 4pt; position: relative; }
        .pdf-export-content .premisse-item::before { content: "- "; position: absolute; left: 0; }
        .pdf-export-content .ayat-list { list-style-type: lower-alpha; margin-left: 40pt; margin-bottom: 8pt; }
        .pdf-export-content .ayat-list li { margin-bottom: 4pt; text-align: justify; }
      </style>
      <div class="pdf-export-content">${editor.getHTML()}</div>
    `;

    document.body.appendChild(tempContainer);

    // Brief delay to let browser layout the element
    await new Promise((resolve) => setTimeout(resolve, 100));

    const jsPdfFormat =
      pageSettings.paperSize === 'A4'
        ? 'a4'
        : pageSettings.paperSize === 'LEGAL'
          ? 'legal'
          : pageSettings.paperSize === 'LETTER'
            ? 'letter'
            : ([paperDef.width, paperDef.height] as unknown as string);

    const opt = {
      margin: [
        pageSettings.marginTop,
        pageSettings.marginRight,
        pageSettings.marginBottom,
        pageSettings.marginLeft,
      ],
      filename: `${docInfo.title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: {
        unit: 'mm',
        format: jsPdfFormat,
        orientation: pageSettings.orientation as 'portrait' | 'landscape',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await html2pdf().set(opt).from(tempContainer).save();
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  };

  // AI Actions
  const callAI = async (action: string, extraData?: Record<string, string>) => {
    if (!docInfo) return;
    setAiLoading(true);
    setAiAction(action);
    setAiResult('');

    const label = getActionLabel(action);
    showAIProgress(label);

    try {
      const res = await fetch('/api/documents/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          documentType: docInfo.documentType,
          title: docInfo.title,
          content: editor?.getHTML() || '',
          clientName: docInfo.clientName,
          clientAddress: docInfo.clientAddress,
          documentId: id,
          ...extraData,
        }),
      });

      const data = await res.json();
      closeAIProgress();

      if (data.success) {
        if (action === 'analyze' || action === 'summarize') {
          setAiResult(data.analysis || '');
          setShowAIPanel(true);
          await showAISuccess(
            label,
            `${label} selesai dalam ${((data.durationMs || 0) / 1000).toFixed(1)} detik`
          );
          toast.success(`${label} berhasil`);
        } else {
          // For generate, correct, revise, translate, letter — update editor content
          if (data.content && editor) {
            let cleanContent = data.content;
            cleanContent = cleanContent.replace(/```html\n?/g, '').replace(/```\n?/g, '');
            editor.commands.setContent(cleanContent);

            const structuredInfo = data.isStructured
              ? ' (Dokumen terstruktur berhasil di-render)'
              : '';
            setAiResult(
              `✅ ${label} berhasil!${structuredInfo} Konten telah diperbarui dan disimpan.`
            );
            setShowAIPanel(true);

            // Auto-save after AI content update
            try {
              const saveRes = await fetch(`/api/documents/${id}/content`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: cleanContent }),
              });
              if (saveRes.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            } catch {
              console.error('Auto-save after AI failed');
            }

            await showAISuccess(
              label,
              `Konten diperbarui & disimpan dalam ${((data.durationMs || 0) / 1000).toFixed(1)} detik`
            );
            toast.success(`${label} berhasil — konten diperbarui & disimpan otomatis`);
          }
        }
      } else {
        setAiResult(`❌ Error: ${data.error}`);
        setShowAIPanel(true);
        await showAIError(label, data.error);
        toast.error(`${label} gagal`);
      }
    } catch (error) {
      closeAIProgress();
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setAiResult(`❌ Gagal: ${msg}`);
      setShowAIPanel(true);
      await showAIError(label, msg);
      toast.error(`${label} gagal: ${msg}`);
    } finally {
      setAiLoading(false);
      setAiAction('');
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'generate':
        return 'Generate Draft';
      case 'analyze':
        return 'Analisis';
      case 'correct':
        return 'Koreksi';
      case 'revise':
        return 'Revisi';
      case 'summarize':
        return 'Ringkasan';
      case 'translate':
        return 'Terjemahan';
      case 'letter':
        return 'Buat Surat';
      default:
        return action;
    }
  };

  // Compare documents
  const handleCompare = async () => {
    if (!compareOriginal.trim() || !editor || !docInfo) return;
    setCompareLoading(true);
    setCompareResult('');
    showAIProgress('Bandingkan Dokumen');
    try {
      const res = await fetch('/api/documents/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: compareOriginal,
          revisedContent: editor.getHTML(),
          documentTitle: docInfo.title,
          documentType: docInfo.documentType,
        }),
      });
      const data = await res.json();
      closeAIProgress();
      if (data.comparison) {
        setCompareResult(data.comparison);
        await showAISuccess('Perbandingan Dokumen', 'Analisis perbandingan selesai');
        toast.success('Perbandingan dokumen selesai');
      } else {
        setCompareResult(`❌ Error: ${data.error || 'Unknown error'}`);
        await showAIError('Perbandingan', data.error);
      }
    } catch (error) {
      closeAIProgress();
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setCompareResult(`❌ Gagal: ${msg}`);
      await showAIError('Perbandingan', msg);
    } finally {
      setCompareLoading(false);
    }
  };

  if (loading || !editor) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href={`/documents/${id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{docInfo?.title || 'Editor Dokumen'}</h1>
            <p className="text-sm text-slate-400">
              {docInfo?.documentType} — {PAPER_SIZES[pageSettings.paperSize]?.label}{' '}
              {pageSettings.orientation === 'portrait' ? 'Potrait' : 'Landscape'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Tersimpan
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Gagal menyimpan
            </span>
          )}
          {isStaffOrAdmin && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className={`border-slate-700 text-slate-300 hover:text-white ${showSettings ? 'bg-slate-800 text-white' : ''}`}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Page Setup
          </Button>
        </div>
      </div>

      {/* Page Settings Panel */}
      {showSettings && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Paper Size */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ukuran Kertas</label>
              <select
                value={pageSettings.paperSize}
                onChange={(e) => setPageSettings({ ...pageSettings, paperSize: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Orientasi</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageSettings({ ...pageSettings, orientation: 'portrait' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${pageSettings.orientation === 'portrait'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Potrait
                </button>
                <button
                  onClick={() => setPageSettings({ ...pageSettings, orientation: 'landscape' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${pageSettings.orientation === 'landscape'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Landscape
                </button>
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Margin (mm)</label>
              <div className="flex gap-2">
                {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map(
                  (key) => (
                    <div key={key} className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-0.5">
                        {key === 'marginTop'
                          ? 'Atas'
                          : key === 'marginBottom'
                            ? 'Bawah'
                            : key === 'marginLeft'
                              ? 'Kiri'
                              : 'Kanan'}
                      </span>
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg">
                        <button
                          onClick={() =>
                            setPageSettings({
                              ...pageSettings,
                              [key]: Math.max(5, pageSettings[key] - 5),
                            })
                          }
                          className="px-1.5 py-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-white w-6 text-center">
                          {pageSettings[key]}
                        </span>
                        <button
                          onClick={() =>
                            setPageSettings({
                              ...pageSettings,
                              [key]: Math.min(50, pageSettings[key] + 5),
                            })
                          }
                          className="px-1.5 py-1 text-slate-400 hover:text-white"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ukuran Font</label>
              <select
                value={pageSettings.fontSize}
                onChange={(e) =>
                  setPageSettings({ ...pageSettings, fontSize: Number(e.target.value) })
                }
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
            </div>

            {/* Preview Info */}
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500">
                Halaman: {pageWidth}mm × {pageHeight}mm
              </p>
              <p className="text-xs text-slate-500">
                Area cetak: {pageWidth - pageSettings.marginLeft - pageSettings.marginRight}mm ×{' '}
                {contentHeight}mm
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {isStaffOrAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              icon={<Bold className="w-4 h-4" />}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              icon={<Italic className="w-4 h-4" />}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              icon={<UnderlineIcon className="w-4 h-4" />}
              title="Underline"
            />
          </div>

          {/* Headings */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().setParagraph().run()}
              active={editor.isActive('paragraph')}
              icon={<Type className="w-4 h-4" />}
              title="Paragraph"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              icon={<Heading1 className="w-4 h-4" />}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              icon={<Heading2 className="w-4 h-4" />}
              title="Heading 2"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              icon={<Heading3 className="w-4 h-4" />}
              title="Heading 3"
            />
          </div>

          {/* Lists */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              icon={<List className="w-4 h-4" />}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              icon={<ListOrdered className="w-4 h-4" />}
              title="Numbered List"
            />
          </div>

          {/* Alignment */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft className="w-4 h-4" />}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter className="w-4 h-4" />}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight className="w-4 h-4" />}
              title="Align Right"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              active={editor.isActive({ textAlign: 'justify' })}
              icon={<AlignJustify className="w-4 h-4" />}
              title="Justify"
            />
          </div>

          {/* Table */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              icon={<TableIcon className="w-4 h-4" />}
              title="Insert Table"
            />
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-0.5 border-r border-slate-700 pr-2 mr-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              icon={<Undo className="w-4 h-4" />}
              title="Undo"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              icon={<Redo className="w-4 h-4" />}
              title="Redo"
            />
          </div>

          {/* AI Actions */}
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => callAI('generate', { additionalContext: generateContext })}
              disabled={aiLoading}
              className="border-purple-600/50 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 text-xs"
              title="Generate draft dokumen dari AI"
            >
              {aiLoading && aiAction === 'generate' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1" />
              )}
              Generate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callAI('analyze')}
              disabled={aiLoading}
              className="border-blue-600/50 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 text-xs"
              title="Analisis kelengkapan dokumen"
            >
              {aiLoading && aiAction === 'analyze' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileSearch className="w-3.5 h-3.5 mr-1" />
              )}
              Analyze
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callAI('correct')}
              disabled={aiLoading}
              className="border-emerald-600/50 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 text-xs"
              title="Koreksi typo, grammar, dan format"
            >
              {aiLoading && aiAction === 'correct' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 mr-1" />
              )}
              Correct
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAIPanel(!showAIPanel)}
              disabled={aiLoading}
              className="border-orange-600/50 text-orange-400 hover:text-orange-300 hover:bg-orange-900/30 text-xs"
              title="Revisi dokumen dengan instruksi"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Revise
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAIPanel(true)}
              disabled={compareLoading}
              className="border-teal-600/50 text-teal-400 hover:text-teal-300 hover:bg-teal-900/30 text-xs"
              title="Bandingkan 2 versi dokumen"
            >
              <GitCompareArrows className="w-3.5 h-3.5 mr-1" />
              Compare
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callAI('summarize')}
              disabled={aiLoading}
              className="border-cyan-600/50 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 text-xs"
              title="Ringkasan dokumen"
            >
              {aiLoading && aiAction === 'summarize' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 mr-1" />
              )}
              Summary
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callAI('translate')}
              disabled={aiLoading}
              className="border-indigo-600/50 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 text-xs"
              title="Terjemahkan ke Bahasa Inggris"
            >
              {aiLoading && aiAction === 'translate' ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Languages className="w-3.5 h-3.5 mr-1" />
              )}
              Translate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAIPanel(true)}
              disabled={aiLoading}
              className="border-pink-600/50 text-pink-400 hover:text-pink-300 hover:bg-pink-900/30 text-xs"
              title="Buat surat resmi notaris"
            >
              <Mail className="w-3.5 h-3.5 mr-1" />
              Surat
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Paper Editor */}
        <div
          className="flex-1 flex justify-center overflow-auto"
          style={{ backgroundColor: '#64748b' }}
        >
          <div className="py-8 px-4">
            <div
              className="document-pages-container"
              style={{
                width: `${pageWidth}mm`,
                position: 'relative',
              }}
            >
              <style>{`
                /* ===== Document Pages Layout ===== */

                .document-pages-container .document-page-content {
                  position: relative;
                  width: 100%;
                  min-height: ${pageHeight}mm;
                  /* Left/right margins as padding */
                  padding-left: ${pageSettings.marginLeft}mm;
                  padding-right: ${pageSettings.marginRight}mm;
                  /* First page top margin */
                  padding-top: ${pageSettings.marginTop}mm;
                  /* Last page bottom margin */
                  padding-bottom: ${pageSettings.marginBottom}mm;
                  box-sizing: border-box;
                  background-color: white;
                  /* Page shadow */
                  box-shadow:
                    0 1px 3px rgba(0,0,0,0.12),
                    0 4px 6px rgba(0,0,0,0.08),
                    0 12px 28px rgba(0,0,0,0.15);
                }

                /* ===== Page break overlay ===== 
                 * At each page boundary, we draw an OPAQUE overlay that covers:
                 * - Bottom margin zone of page N (white, covers text)
                 * - Dark gap separator (gray background visible)
                 * - Top margin zone of page N+1 (white, covers text)
                 * This visually "hides" text in margin zones.
                 */
                .page-break-overlay {
                  position: absolute;
                  left: 0;
                  right: 0;
                  z-index: 20;
                  pointer-events: none;
                  display: flex;
                  flex-direction: column;
                }
                .page-break-overlay .margin-bottom-zone {
                  height: ${pageSettings.marginBottom}mm;
                  background: white;
                  position: relative;
                }
                .page-break-overlay .margin-bottom-zone::after {
                  content: '';
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 1px;
                  background: rgba(0,0,0,0.08);
                }
                .page-break-overlay .page-gap {
                  height: 40px;
                  background: #64748b;
                  box-shadow: inset 0 3px 6px rgba(0,0,0,0.15), inset 0 -3px 6px rgba(0,0,0,0.15);
                }
                .page-break-overlay .margin-top-zone {
                  height: ${pageSettings.marginTop}mm;
                  background: white;
                  position: relative;
                }
                .page-break-overlay .margin-top-zone::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 1px;
                  background: rgba(0,0,0,0.08);
                }

                /* Page number label */
                .page-number-label {
                  position: absolute;
                  color: #94a3b8;
                  font-family: 'Times New Roman', serif;
                  font-size: 9pt;
                  pointer-events: none;
                  z-index: 25;
                  user-select: none;
                }

                /* Editor Styles */
                .ProseMirror {
                  color: #1a1a1a;
                  font-family: 'Times New Roman', 'Georgia', serif;
                  font-size: ${pageSettings.fontSize}pt;
                  line-height: 2;
                  position: relative;
                  z-index: 1;
                }
                .ProseMirror h1 {
                  font-size: ${Math.round(pageSettings.fontSize * 1.33)}pt;
                  font-weight: bold;
                  text-align: center;
                  margin-bottom: 4pt;
                  color: #000;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                }
                .ProseMirror h2 {
                  font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt;
                  font-weight: bold;
                  text-align: center;
                  text-transform: uppercase;
                  margin-top: 16pt;
                  margin-bottom: 8pt;
                  color: #000;
                }
                .ProseMirror h3 {
                  font-size: ${pageSettings.fontSize}pt;
                  font-weight: bold;
                  margin-top: 8pt;
                  margin-bottom: 4pt;
                  color: #000;
                }
                .ProseMirror p {
                  margin-bottom: 4pt;
                  text-align: justify;
                  color: #1a1a1a;
                }
                .ProseMirror ul, .ProseMirror ol {
                  margin-left: 20pt;
                  margin-bottom: 6pt;
                }
                .ProseMirror li {
                  margin-bottom: 3pt;
                }
                .ProseMirror table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 12pt 0;
                }
                .ProseMirror th, .ProseMirror td {
                  border: 1px solid #333;
                  padding: 6pt 8pt;
                  text-align: left;
                  font-size: ${pageSettings.fontSize - 1}pt;
                }
                .ProseMirror th {
                  background: #f5f5f5;
                  font-weight: bold;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                  color: #adb5bd;
                  content: attr(data-placeholder);
                  float: left;
                  height: 0;
                  pointer-events: none;
                }
                .ProseMirror:focus {
                  outline: none;
                }
                .ProseMirror hr {
                  border: none;
                  border-top: 1px solid #333;
                  margin: 12pt 0;
                }
                .ProseMirror blockquote {
                  border-left: 3px solid #333;
                  padding-left: 12pt;
                  margin-left: 0;
                  font-style: italic;
                }

                /* Notarial Document Renderer Styles */
                .ProseMirror .notarial-doc { font-family: 'Times New Roman', 'Georgia', serif; font-size: ${pageSettings.fontSize}pt; line-height: 2; color: #000; }
                .ProseMirror .doc-title { text-align: center; font-size: ${Math.round(pageSettings.fontSize * 1.33)}pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4pt; }
                .ProseMirror .doc-subtitle { text-align: center; font-size: ${pageSettings.fontSize}pt; margin-bottom: 2pt; }
                .ProseMirror .doc-number { text-align: center; font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt; font-weight: bold; margin-bottom: 16pt; }
                .ProseMirror .doc-separator { border: none; border-top: 2px solid #000; margin: 12pt 0; }
                .ProseMirror .doc-separator-thin { border: none; border-top: 1px solid #000; margin: 8pt 0; }
                .ProseMirror .section-title { font-size: ${Math.round(pageSettings.fontSize * 1.08)}pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 16pt 0 8pt 0; }
                .ProseMirror .pasal-title { font-weight: bold; text-align: center; margin: 16pt 0 8pt 0; font-size: ${pageSettings.fontSize}pt; }
                .ProseMirror .pasal-judul { font-weight: bold; text-align: center; margin-bottom: 8pt; font-size: ${pageSettings.fontSize}pt; text-transform: uppercase; }
                .ProseMirror .indent { text-indent: 40pt; text-align: justify; margin-bottom: 4pt; }
                .ProseMirror .no-indent { text-align: justify; margin-bottom: 4pt; }
                .ProseMirror .komparisi-block { margin: 8pt 0; padding-left: 0; }
                .ProseMirror .komparisi-label { font-weight: bold; text-transform: uppercase; margin-bottom: 4pt; }
                .ProseMirror .komparisi-data { margin-left: 20pt; margin-bottom: 2pt; font-family: 'Courier New', monospace; font-size: ${pageSettings.fontSize - 1}pt; }
                .ProseMirror .ttd-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 40pt; gap: 20pt; }
                .ProseMirror .ttd-box { text-align: center; min-width: 150pt; }
                .ProseMirror .ttd-label { font-size: ${pageSettings.fontSize - 1}pt; margin-bottom: 60pt; }
                .ProseMirror .ttd-line { border-bottom: 1px solid #000; margin-bottom: 4pt; }
                .ProseMirror .ttd-name { font-weight: bold; font-size: ${pageSettings.fontSize - 1}pt; }
                .ProseMirror .premisse-item { padding-left: 20pt; text-align: justify; margin-bottom: 4pt; position: relative; }
                .ProseMirror .premisse-item::before { content: "- "; position: absolute; left: 0; }
                .ProseMirror .ayat-list { list-style-type: lower-alpha; margin-left: 40pt; margin-bottom: 8pt; }
                .ProseMirror .ayat-list li { margin-bottom: 4pt; text-align: justify; }

                /* Print / PDF styles */
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                  .document-pages-container { background: none !important; }
                  .document-page-content {
                    background-image: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    min-height: auto !important;
                  }
                  .page-break-overlay,
                  .page-number-label {
                    display: none !important;
                  }
                  @page {
                    size: ${pageWidth}mm ${pageHeight}mm;
                    margin: ${pageSettings.marginTop}mm ${pageSettings.marginRight}mm ${pageSettings.marginBottom}mm ${pageSettings.marginLeft}mm;
                  }
                }
              `}</style>
              <div className="document-page-content">
                <EditorContent editor={editor} />
                {/* Page break overlays + page numbers */}
                <PageBreakOverlays
                  pageHeight={pageHeight}
                  contentHeight={contentHeight}
                  marginTop={pageSettings.marginTop}
                  marginBottom={pageSettings.marginBottom}
                  marginRight={pageSettings.marginRight}
                  gapSize={40}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Side Panel */}
        {showAIPanel && (
          <div className="w-[380px] shrink-0 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Assistant
                </h3>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Generate Context */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Konteks Generate (opsional)
                  </label>
                  <textarea
                    value={generateContext}
                    onChange={(e) => setGenerateContext(e.target.value)}
                    placeholder="Deskripsikan detail dokumen yang ingin dibuat..."
                    className="w-full h-20 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 resize-none placeholder:text-slate-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => callAI('generate', { additionalContext: generateContext })}
                    disabled={aiLoading}
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    {aiLoading && aiAction === 'generate' ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                    )}
                    Generate Draft
                  </Button>
                </div>

                <hr className="border-slate-800" />

                {/* Revise Instruction */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Instruksi Revisi</label>
                  <textarea
                    value={reviseInstruction}
                    onChange={(e) => setReviseInstruction(e.target.value)}
                    placeholder="Contoh: Tambahkan pasal tentang force majeure..."
                    className="w-full h-20 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 resize-none placeholder:text-slate-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => callAI('revise', { instruction: reviseInstruction })}
                    disabled={aiLoading || !reviseInstruction.trim()}
                    className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-xs"
                  >
                    {aiLoading && aiAction === 'revise' ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    )}
                    Revisi Dokumen
                  </Button>
                </div>

                <hr className="border-slate-800" />

                {/* Compare Section */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Bandingkan Dokumen</label>
                  <textarea
                    value={compareOriginal}
                    onChange={(e) => setCompareOriginal(e.target.value)}
                    placeholder="Paste versi lama dokumen untuk dibandingkan..."
                    className="w-full h-20 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 resize-none placeholder:text-slate-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleCompare}
                    disabled={compareLoading || !compareOriginal.trim()}
                    className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-xs"
                  >
                    {compareLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <GitCompareArrows className="w-3.5 h-3.5 mr-1" />
                    )}
                    Bandingkan
                  </Button>
                  {compareResult && (
                    <div
                      className="text-sm text-slate-300 p-3 mt-2 rounded-lg bg-slate-800/50 border border-teal-700/30 max-h-[300px] overflow-y-auto prose prose-sm prose-invert"
                      dangerouslySetInnerHTML={{ __html: compareResult }}
                    />
                  )}
                </div>

                <hr className="border-slate-800" />

                {/* Letter Generator */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Buat Surat Resmi</label>
                  <select
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 mb-2"
                  >
                    <option value="Surat Pemberitahuan">Surat Pemberitahuan</option>
                    <option value="Surat Undangan">Surat Undangan RUPS/Rapat</option>
                    <option value="Surat Kuasa">Surat Kuasa</option>
                    <option value="Surat Keterangan">Surat Keterangan</option>
                    <option value="Surat Somasi">Surat Somasi/Peringatan</option>
                    <option value="Surat Pernyataan">Surat Pernyataan</option>
                    <option value="Cover Letter">Cover Letter Dokumen</option>
                  </select>
                  <textarea
                    value={letterContext}
                    onChange={(e) => setLetterContext(e.target.value)}
                    placeholder="Detail surat: tujuan, perihal, pihak terkait..."
                    className="w-full h-16 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 resize-none placeholder:text-slate-500"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      callAI('letter', { letterType, additionalContext: letterContext })
                    }
                    disabled={aiLoading}
                    className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-xs"
                  >
                    {aiLoading && aiAction === 'letter' ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 mr-1" />
                    )}
                    Buat Surat
                  </Button>
                </div>
              </div>

              {/* AI Response */}
              {(aiResult || aiLoading) && (
                <>
                  <hr className="border-slate-800 mb-3" />
                  <div>
                    <h4 className="text-xs text-slate-400 mb-2">Hasil AI</h4>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI sedang memproses {getActionLabel(aiAction)}...</span>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-slate-300 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 max-h-[400px] overflow-y-auto prose prose-sm prose-invert"
                        dangerouslySetInnerHTML={{ __html: aiResult }}
                      />
                    )}
                  </div>
                  {!aiLoading && aiResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiResult('')}
                      className="w-full mt-2 text-slate-400 hover:text-white text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  active,
  disabled,
  icon,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${active
        ? 'bg-emerald-600/30 text-emerald-400'
        : disabled
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      {icon}
    </button>
  );
}
