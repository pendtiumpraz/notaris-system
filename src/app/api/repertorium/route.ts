import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List repertorium entries with filters
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());
    const bulan = searchParams.get('bulan') ? parseInt(searchParams.get('bulan')!) : undefined;
    const isPPAT = searchParams.get('isPPAT');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { tahun };
    if (bulan) where.bulan = bulan;
    if (isPPAT !== null && isPPAT !== undefined && isPPAT !== '') {
      where.isPPAT = isPPAT === 'true';
    }
    if (search) {
      where.OR = [
        { sifatAkta: { contains: search, mode: 'insensitive' } },
        { namaPenghadap: { hasSome: [search] } },
        { keterangan: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.repertorium.findMany({
        where,
        include: {
          document: {
            select: { id: true, title: true, documentNumber: true, status: true },
          },
          createdBy: { select: { name: true } },
        },
        orderBy: { nomorUrut: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.repertorium.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.repertorium.aggregate({
      where: { tahun },
      _count: true,
      _max: { nomorUrut: true },
    });

    const monthlyStats = await prisma.repertorium.groupBy({
      by: ['bulan'],
      where: { tahun },
      _count: true,
    });

    return NextResponse.json({
      data: entries,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: {
        totalAkta: stats._count,
        lastNomor: stats._max.nomorUrut || 0,
        perBulan: monthlyStats.map((m) => ({ bulan: m.bulan, count: m._count })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch repertorium:', error);
    return NextResponse.json({ error: 'Gagal memuat repertorium' }, { status: 500 });
  }
}

// POST - Create new repertorium entry
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { sifatAkta, namaPenghadap, keterangan, documentId, isPPAT, tanggal } = data;

    if (!sifatAkta || !namaPenghadap || namaPenghadap.length === 0) {
      return NextResponse.json(
        { error: 'Sifat akta dan nama penghadap wajib diisi' },
        { status: 400 }
      );
    }

    const aktaTanggal = tanggal ? new Date(tanggal) : new Date();
    const tahun = aktaTanggal.getFullYear();
    const bulan = aktaTanggal.getMonth() + 1;

    // Get next nomor urut for this year
    const lastEntry = await prisma.repertorium.findFirst({
      where: { tahun },
      orderBy: { nomorUrut: 'desc' },
    });
    const nomorUrut = (lastEntry?.nomorUrut || 0) + 1;

    // Get next nomor bulanan for this month
    const lastMonthEntry = await prisma.repertorium.findFirst({
      where: { tahun, bulan },
      orderBy: { nomorBulanan: 'desc' },
    });
    const nomorBulanan = (lastMonthEntry?.nomorBulanan || 0) + 1;

    const entry = await prisma.repertorium.create({
      data: {
        nomorUrut,
        nomorBulanan,
        tanggal: aktaTanggal,
        sifatAkta,
        namaPenghadap,
        keterangan: keterangan || null,
        documentId: documentId || null,
        createdById: session.user.id,
        tahun,
        bulan,
        isPPAT: isPPAT || false,
      },
      include: {
        document: {
          select: { id: true, title: true, documentNumber: true },
        },
        createdBy: { select: { name: true } },
      },
    });

    // Auto-generate Klapper entries for each penghadap
    const klapperData = namaPenghadap.map((nama: string) => ({
      namaPenghadap: nama,
      sifatAkta,
      nomorAkta: nomorUrut,
      tanggalAkta: aktaTanggal,
      hurufAwal: nama.charAt(0).toUpperCase(),
      repertoriumId: entry.id,
      bulan,
      tahun,
    }));

    await prisma.klapper.createMany({ data: klapperData });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Failed to create repertorium:', error);
    return NextResponse.json({ error: 'Gagal membuat entri repertorium' }, { status: 500 });
  }
}
