import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const tahun = now.getFullYear();
    const bulan = now.getMonth() + 1;
    const startOfMonth = new Date(tahun, bulan - 1, 1);
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59);

    // Parallel queries for performance
    const [
      aktaBulanIni,
      totalAktaTahun,
      documentsByStatus,
      revenueData,
      unpaidInvoices,
      recentDocuments,
      repertoriumPerBulan,
      aktaByJenis,
    ] = await Promise.all([
      // 1. Akta bulan ini (from repertorium)
      prisma.repertorium.count({
        where: { tahun, bulan },
      }),

      // 2. Total akta tahun ini
      prisma.repertorium.count({
        where: { tahun },
      }),

      // 3. Documents by status
      prisma.document.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),

      // 4. Revenue this month
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
        },
        _sum: { paidAmount: true, totalAmount: true },
        _count: true,
      }),

      // 5. Unpaid invoices
      prisma.invoice.aggregate({
        where: {
          status: { in: ['SENT', 'DRAFT'] },
        },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),

      // 6. Recent documents (upcoming deadlines)
      prisma.document.findMany({
        where: {
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { gte: now },
        },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          client: { include: { user: { select: { name: true } } } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      // 7. Repertorium per bulan (chart data, 12 bulan)
      prisma.repertorium.groupBy({
        by: ['bulan'],
        where: { tahun },
        _count: true,
        orderBy: { bulan: 'asc' },
      }),

      // 8. Akta by jenis (pie chart)
      prisma.repertorium.groupBy({
        by: ['sifatAkta'],
        where: { tahun },
        _count: true,
        orderBy: { _count: { sifatAkta: 'desc' } },
      }),
    ]);

    // Build monthly chart data (fill in empty months)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const found = repertoriumPerBulan.find((r) => r.bulan === i + 1);
      return { bulan: i + 1, count: found?._count || 0 };
    });

    // Build status counts
    const statusCounts: Record<string, number> = {};
    documentsByStatus.forEach((d) => {
      statusCounts[d.status] = d._count;
    });

    const outstanding =
      (unpaidInvoices._sum.totalAmount || 0) - (unpaidInvoices._sum.paidAmount || 0);

    return NextResponse.json({
      summary: {
        aktaBulanIni,
        totalAktaTahun,
        revenueBulanIni: revenueData._sum.paidAmount || 0,
        totalRevenueBulanIni: revenueData._sum.totalAmount || 0,
        invoiceBulanIni: revenueData._count,
        outstandingAmount: outstanding,
        unpaidCount: unpaidInvoices._count,
        documentsByStatus: statusCounts,
      },
      charts: {
        aktaPerBulan: monthlyData,
        aktaByJenis: aktaByJenis.map((a) => ({
          jenis: a.sifatAkta,
          count: a._count,
        })),
      },
      upcomingDeadlines: recentDocuments,
      tahun,
      bulan,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 });
  }
}
