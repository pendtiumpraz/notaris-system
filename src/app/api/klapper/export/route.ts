import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateKlapperPDF } from '@/lib/pdf-generator';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());
    const bulan = searchParams.get('bulan') ? parseInt(searchParams.get('bulan')!) : undefined;

    const where: Record<string, unknown> = { tahun };
    if (bulan) where.bulan = bulan;

    const entries = await prisma.klapper.findMany({
      where,
      orderBy: [{ hurufAwal: 'asc' }, { namaPenghadap: 'asc' }],
    });

    const pdfBuffer = generateKlapperPDF(entries, tahun, bulan);

    const filename = bulan
      ? `klapper_${tahun}_${String(bulan).padStart(2, '0')}.pdf`
      : `klapper_${tahun}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export klapper:', error);
    return NextResponse.json({ error: 'Gagal export klapper' }, { status: 500 });
  }
}
