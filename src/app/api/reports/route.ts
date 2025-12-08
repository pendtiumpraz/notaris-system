import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'overview';

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    if (type === 'overview') {
      // Get overview statistics
      const [
        totalUsers,
        totalClients,
        totalStaff,
        totalDocuments,
        totalAppointments,
        documentsByStatus,
        appointmentsByStatus,
        recentDocuments,
        recentAppointments,
      ] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
        prisma.user.count({ where: { role: 'STAFF', deletedAt: null } }),
        prisma.document.count({
          where: { deletedAt: null, ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
        }),
        prisma.appointment.count({
          where: { ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
        }),
        prisma.document.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { deletedAt: null },
        }),
        prisma.appointment.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.document.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            client: {
              include: {
                user: { select: { name: true } },
              },
            },
            documentType: true,
          },
        }),
        prisma.appointment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            client: {
              include: {
                user: { select: { name: true } },
              },
            },
            service: true,
          },
        }),
      ]);

      return NextResponse.json({
        type: 'overview',
        data: {
          users: { total: totalUsers, clients: totalClients, staff: totalStaff },
          documents: {
            total: totalDocuments,
            byStatus: documentsByStatus.reduce(
              (acc, item) => ({ ...acc, [item.status]: item._count.status }),
              {}
            ),
          },
          appointments: {
            total: totalAppointments,
            byStatus: appointmentsByStatus.reduce(
              (acc, item) => ({ ...acc, [item.status]: item._count.status }),
              {}
            ),
          },
          recent: {
            documents: recentDocuments,
            appointments: recentAppointments,
          },
        },
      });
    }

    if (type === 'documents') {
      // Document statistics
      const [byType, byMonth, byPriority] = await Promise.all([
        prisma.document.groupBy({
          by: ['documentTypeId'],
          _count: { id: true },
          where: { deletedAt: null, ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
        }),
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "created_at") as month,
            COUNT(*) as count
          FROM "documents"
          WHERE "deleted_at" IS NULL
          GROUP BY DATE_TRUNC('month', "created_at")
          ORDER BY month DESC
          LIMIT 12
        `,
        prisma.document.groupBy({
          by: ['priority'],
          _count: { id: true },
          where: { deletedAt: null },
        }),
      ]);

      // Get document type names
      const documentTypes = await prisma.documentType.findMany({
        select: { id: true, name: true },
      });
      const typeMap = documentTypes.reduce(
        (acc, t) => ({ ...acc, [t.id]: t.name }),
        {} as Record<string, string>
      );

      return NextResponse.json({
        type: 'documents',
        data: {
          byType: byType.map((item) => ({
            type: typeMap[item.documentTypeId || ''] || 'Unknown',
            count: item._count.id,
          })),
          byMonth,
          byPriority: byPriority.reduce(
            (acc, item) => ({ ...acc, [item.priority]: item._count.id }),
            {}
          ),
        },
      });
    }

    if (type === 'appointments') {
      const [byService, byMonth, byStatus] = await Promise.all([
        prisma.appointment.groupBy({
          by: ['serviceId'],
          _count: { id: true },
          where: { ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
        }),
        prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', "scheduled_at") as month,
            COUNT(*) as count
          FROM "appointments"
          GROUP BY DATE_TRUNC('month', "scheduled_at")
          ORDER BY month DESC
          LIMIT 12
        `,
        prisma.appointment.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      // Get service names
      const services = await prisma.service.findMany({
        select: { id: true, name: true },
      });
      const serviceMap = services.reduce(
        (acc, s) => ({ ...acc, [s.id]: s.name }),
        {} as Record<string, string>
      );

      return NextResponse.json({
        type: 'appointments',
        data: {
          byService: byService.map((item) => ({
            service: serviceMap[item.serviceId || ''] || 'Unknown',
            count: item._count.id,
          })),
          byMonth,
          byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count.id }), {}),
        },
      });
    }

    if (type === 'staff') {
      const staffPerformance = await prisma.staff.findMany({
        where: { user: { deletedAt: null } },
        include: {
          user: { select: { name: true, email: true } },
          _count: {
            select: {
              documents: { where: { deletedAt: null } },
              appointments: true,
            },
          },
        },
      });

      return NextResponse.json({
        type: 'staff',
        data: {
          performance: staffPerformance.map((s) => ({
            name: s.user.name,
            email: s.user.email,
            documentsHandled: s._count.documents,
            appointmentsHandled: s._count.appointments,
          })),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
