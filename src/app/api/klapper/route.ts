import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List klapper entries with filters
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());
    const bulan = searchParams.get('bulan') ? parseInt(searchParams.get('bulan')!) : undefined;
    const huruf = searchParams.get('huruf') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: Record<string, unknown> = { tahun };
    if (bulan) where.bulan = bulan;
    if (huruf) where.hurufAwal = huruf.toUpperCase();
    if (search) {
      where.namaPenghadap = { contains: search, mode: 'insensitive' };
    }

    const [entries, total] = await Promise.all([
      prisma.klapper.findMany({
        where,
        include: {
          repertorium: {
            select: { id: true, nomorUrut: true, sifatAkta: true, tanggal: true },
          },
        },
        orderBy: [{ hurufAwal: 'asc' }, { namaPenghadap: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.klapper.count({ where }),
    ]);

    // Get alphabet distribution
    const alphabetStats = await prisma.klapper.groupBy({
      by: ['hurufAwal'],
      where: { tahun, ...(bulan ? { bulan } : {}) },
      _count: true,
      orderBy: { hurufAwal: 'asc' },
    });

    return NextResponse.json({
      data: entries,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      alphabetStats: alphabetStats.map((a) => ({
        huruf: a.hurufAwal,
        count: a._count,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch klapper:', error);
    return NextResponse.json({ error: 'Gagal memuat klapper' }, { status: 500 });
  }
}
