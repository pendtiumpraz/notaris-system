import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateLaporanBulananPDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());
    const bulan = parseInt(searchParams.get('bulan') || (new Date().getMonth() + 1).toString());

    const [repertoriumEntries, repertoriumCount, aktaByJenis, klapperCount] = await Promise.all([
      prisma.repertorium.findMany({
        where: { tahun, bulan },
        orderBy: { nomorUrut: 'asc' },
      }),
      prisma.repertorium.count({ where: { tahun, bulan } }),
      prisma.repertorium.groupBy({
        by: ['sifatAkta'],
        where: { tahun, bulan },
        _count: true,
        orderBy: { _count: { sifatAkta: 'desc' } },
      }),
      prisma.klapper.count({ where: { tahun, bulan } }),
    ]);

    const pdfBuffer = generateLaporanBulananPDF(
      { repertoriumEntries, repertoriumCount, aktaByJenis, klapperCount },
      tahun,
      bulan
    );

    const filename = `laporan_bulanan_${tahun}_${String(bulan).padStart(2, '0')}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate monthly report:', error);
    return NextResponse.json({ error: 'Gagal generate laporan bulanan' }, { status: 500 });
  }
}
