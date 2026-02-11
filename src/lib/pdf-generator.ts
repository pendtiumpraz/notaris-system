/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  footer?: string;
}

function createBasePDF(options: PDFOptions): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, 15, { align: 'center' });

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, pageWidth / 2, 22, { align: 'center' });
  }

  // Footer on each page
  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128);
      doc.text(
        options.footer ||
          `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }
  };

  // Store the footer function to be called later
  (doc as any)._addFooter = addFooter;

  return doc;
}

function finalizePDF(doc: jsPDF): ArrayBuffer {
  // Call the stored footer function
  if ((doc as any)._addFooter) {
    (doc as any)._addFooter();
  }
  return doc.output('arraybuffer');
}

export function generateRepertoriumPDF(entries: any[], tahun: number, bulan?: number): ArrayBuffer {
  const period = bulan ? `Bulan ${BULAN_NAMES[bulan]} ${tahun}` : `Tahun ${tahun}`;

  const doc = createBasePDF({
    title: 'BUKU REPERTORIUM',
    subtitle: `${period} — Sesuai Pasal 58 UU No. 2 Tahun 2014`,
    orientation: 'landscape',
  });

  const headers = [['No.', 'No. Bln', 'Tanggal', 'Sifat Akta', 'Nama Penghadap', 'Keterangan']];

  const rows =
    entries.length > 0
      ? entries.map((e: any) => [
          e.nomorUrut,
          e.nomorBulanan,
          new Date(e.tanggal).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          e.sifatAkta + (e.isPPAT ? ' (PPAT)' : ''),
          Array.isArray(e.namaPenghadap) ? e.namaPenghadap.join(', ') : e.namaPenghadap,
          e.keterangan || '-',
        ])
      : [['', '', '', 'N I H I L', '', '']];

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
      4: { cellWidth: 80 },
      5: { cellWidth: 'auto' },
    },
  });

  return finalizePDF(doc);
}

export function generateKlapperPDF(entries: any[], tahun: number, bulan?: number): ArrayBuffer {
  const period = bulan ? `Bulan ${BULAN_NAMES[bulan]} ${tahun}` : `Tahun ${tahun}`;

  const doc = createBasePDF({
    title: 'BUKU KLAPPER',
    subtitle: `Indeks Alfabetis Penghadap — ${period}`,
    orientation: 'portrait',
  });

  const headers = [['Huruf', 'Nama Penghadap', 'Sifat Akta', 'No. Akta', 'Tanggal']];

  const rows =
    entries.length > 0
      ? entries.map((e: any) => [
          e.hurufAwal,
          e.namaPenghadap,
          e.sifatAkta,
          e.nomorAkta,
          new Date(e.tanggalAkta).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        ])
      : [['', '', 'N I H I L', '', '']];

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 50 },
      3: { halign: 'center', cellWidth: 20 },
      4: { cellWidth: 30 },
    },
  });

  return finalizePDF(doc);
}

export function generateLaporanBulananPDF(
  data: {
    repertoriumEntries: any[];
    repertoriumCount: number;
    aktaByJenis: { sifatAkta: string; _count: number }[];
    klapperCount: number;
  },
  tahun: number,
  bulan: number
): ArrayBuffer {
  const doc = createBasePDF({
    title: 'LAPORAN BULANAN NOTARIS',
    subtitle: `Bulan ${BULAN_NAMES[bulan]} ${tahun} — Untuk Majelis Pengawas Daerah`,
    orientation: 'portrait',
  });

  let y = 32;

  // 1. Summary section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('I. Rekapitulasi Akta', 14, y);
  y += 8;

  const summaryHeaders = [['No.', 'Jenis Akta', 'Jumlah']];
  const summaryRows =
    data.aktaByJenis.length > 0
      ? data.aktaByJenis.map((item: any, idx: number) => [idx + 1, item.sifatAkta, item._count])
      : [['', 'Tidak ada akta (NIHIL)', '0']];

  // Add total row
  summaryRows.push(['', 'TOTAL', data.repertoriumCount.toString()]);

  autoTable(doc, {
    head: summaryHeaders,
    body: summaryRows,
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 25 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // 2. Klapper summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('II. Rekapitulasi Klapper', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total penghadap tercatat di Klapper: ${data.klapperCount} orang`, 14, y);
  y += 12;

  // 3. Signature section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const pageWidth = doc.internal.pageSize.getWidth();
  const signX = pageWidth - 80;
  doc.text(
    `..................., ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    signX,
    y
  );
  y += 6;
  doc.text('Notaris,', signX, y);
  y += 25;
  doc.text('_________________________', signX, y);
  y += 5;
  doc.text('Nama:', signX, y);

  return finalizePDF(doc);
}

export function generateInvoicePDF(invoice: any): ArrayBuffer {
  const doc = createBasePDF({
    title: 'INVOICE',
    subtitle: `No. ${invoice.invoiceNumber}`,
    orientation: 'portrait',
  });

  let y = 30;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Invoice details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(invoice.client?.user?.name || invoice.client?.companyName || '-', 14, y);
  y += 5;
  if (invoice.client?.companyName) {
    doc.text(invoice.client.companyName, 14, y);
    y += 5;
  }

  // Right: Invoice info
  let ry = 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal:', pageWidth - 80, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date(invoice.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    pageWidth - 50,
    ry
  );
  ry += 5;
  if (invoice.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Jatuh Tempo:', pageWidth - 80, ry);
    doc.setFont('helvetica', 'normal');
    doc.text(
      new Date(invoice.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      pageWidth - 50,
      ry
    );
    ry += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', pageWidth - 80, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.status, pageWidth - 50, ry);

  y = Math.max(y, ry) + 10;

  // Items table
  const itemHeaders = [['No.', 'Deskripsi', 'Qty', 'Harga Satuan', 'Jumlah']];
  const itemRows = (invoice.items || []).map((item: any, idx: number) => [
    idx + 1,
    item.description,
    item.quantity,
    `Rp ${Number(item.unitPrice).toLocaleString('id-ID')}`,
    `Rp ${Number(item.amount).toLocaleString('id-ID')}`,
  ]);

  autoTable(doc, {
    head: itemHeaders,
    body: itemRows,
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', pageWidth - 80, y);
  doc.text(`Rp ${Number(invoice.totalAmount).toLocaleString('id-ID')}`, pageWidth - 14, y, {
    align: 'right',
  });

  if (invoice.paidAmount > 0) {
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Dibayar:', pageWidth - 80, y);
    doc.text(`Rp ${Number(invoice.paidAmount).toLocaleString('id-ID')}`, pageWidth - 14, y, {
      align: 'right',
    });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Sisa:', pageWidth - 80, y);
    doc.text(
      `Rp ${Number(invoice.totalAmount - invoice.paidAmount).toLocaleString('id-ID')}`,
      pageWidth - 14,
      y,
      { align: 'right' }
    );
  }

  // Notes
  if (invoice.notes) {
    y += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan:', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(invoice.notes, 14, y, { maxWidth: pageWidth - 28 });
  }

  return finalizePDF(doc);
}
