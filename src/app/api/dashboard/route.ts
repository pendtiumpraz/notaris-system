import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const userRole = session.user.role;

    // Base stats object
    const stats: Record<string, number> = {};

    // Get user-specific data based on role
    if (userRole === 'CLIENT') {
      // Get client's documents and appointments
      const client = await prisma.client.findUnique({
        where: { userId },
      });

      if (client) {
        const [totalDocs, pendingDocs, completedDocs, upcomingAppointments, unreadMessages] =
          await Promise.all([
            prisma.document.count({
              where: { clientId: client.id, deletedAt: null },
            }),
            prisma.document.count({
              where: {
                clientId: client.id,
                deletedAt: null,
                status: { in: ['DRAFT', 'SUBMITTED', 'IN_REVIEW'] },
              },
            }),
            prisma.document.count({
              where: { clientId: client.id, deletedAt: null, status: 'COMPLETED' },
            }),
            prisma.appointment.count({
              where: {
                clientId: client.id,
                scheduledAt: { gte: new Date() },
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            }),
            prisma.conversationParticipant.count({
              where: {
                userId,
                lastReadAt: null,
                conversation: {
                  messages: { some: {} },
                },
              },
            }),
          ]);

        stats.totalDocuments = totalDocs;
        stats.pendingDocuments = pendingDocs;
        stats.completedDocuments = completedDocs;
        stats.upcomingAppointments = upcomingAppointments;
        stats.unreadMessages = unreadMessages;
      }
    } else if (userRole === 'STAFF') {
      // Get staff's assigned documents and appointments
      const staff = await prisma.staff.findUnique({
        where: { userId },
      });

      if (staff) {
        const [assignedDocs, pendingDocs, completedDocs, upcomingAppointments, unreadMessages] =
          await Promise.all([
            prisma.document.count({
              where: { staffId: staff.id, deletedAt: null },
            }),
            prisma.document.count({
              where: {
                staffId: staff.id,
                deletedAt: null,
                status: { in: ['SUBMITTED', 'IN_REVIEW', 'WAITING_SIGNATURE'] },
              },
            }),
            prisma.document.count({
              where: { staffId: staff.id, deletedAt: null, status: 'COMPLETED' },
            }),
            prisma.appointment.count({
              where: {
                staffId: staff.id,
                scheduledAt: { gte: new Date() },
                status: { in: ['PENDING', 'CONFIRMED'] },
              },
            }),
            prisma.conversationParticipant.count({
              where: {
                userId,
                lastReadAt: null,
                conversation: {
                  messages: { some: {} },
                },
              },
            }),
          ]);

        stats.totalDocuments = assignedDocs;
        stats.pendingDocuments = pendingDocs;
        stats.completedDocuments = completedDocs;
        stats.upcomingAppointments = upcomingAppointments;
        stats.unreadMessages = unreadMessages;
      }
    } else {
      // ADMIN or SUPER_ADMIN - get all data
      const [
        totalDocs,
        pendingDocs,
        completedDocs,
        totalClients,
        totalStaff,
        upcomingAppointments,
        unreadMessages,
      ] = await Promise.all([
        prisma.document.count({ where: { deletedAt: null } }),
        prisma.document.count({
          where: {
            deletedAt: null,
            status: { in: ['SUBMITTED', 'IN_REVIEW', 'WAITING_SIGNATURE'] },
          },
        }),
        prisma.document.count({ where: { deletedAt: null, status: 'COMPLETED' } }),
        prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
        prisma.user.count({ where: { role: 'STAFF', deletedAt: null } }),
        prisma.appointment.count({
          where: {
            scheduledAt: { gte: new Date() },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        }),
        prisma.conversationParticipant.count({
          where: {
            userId,
            lastReadAt: null,
            conversation: {
              messages: { some: {} },
            },
          },
        }),
      ]);

      stats.totalDocuments = totalDocs;
      stats.pendingDocuments = pendingDocs;
      stats.completedDocuments = completedDocs;
      stats.totalClients = totalClients;
      stats.totalStaff = totalStaff;
      stats.upcomingAppointments = upcomingAppointments;
      stats.unreadMessages = unreadMessages;
    }

    // Get recent documents based on role
    const recentDocumentsWhere: any = { deletedAt: null };

    if (userRole === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId } });
      if (client) {
        recentDocumentsWhere.clientId = client.id;
      }
    } else if (userRole === 'STAFF') {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) {
        recentDocumentsWhere.staffId = staff.id;
      }
    }

    const recentDocuments = await prisma.document.findMany({
      where: recentDocumentsWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          include: {
            user: { select: { name: true } },
          },
        },
        documentType: { select: { name: true } },
      },
    });

    // Get upcoming appointments
    const appointmentsWhere: any = {
      scheduledAt: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    };

    if (userRole === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId } });
      if (client) {
        appointmentsWhere.clientId = client.id;
      }
    } else if (userRole === 'STAFF') {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) {
        appointmentsWhere.staffId = staff.id;
      }
    }

    const upcomingAppointmentsList = await prisma.appointment.findMany({
      where: appointmentsWhere,
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        client: {
          include: {
            user: { select: { name: true } },
          },
        },
        service: { select: { name: true } },
      },
    });

    return NextResponse.json({
      stats,
      recentDocuments: recentDocuments.map((doc) => ({
        id: doc.id,
        title: doc.title,
        documentNumber: doc.documentNumber,
        status: doc.status,
        client: doc.client?.user?.name || '-',
        type: doc.documentType?.name || '-',
        createdAt: doc.createdAt,
      })),
      upcomingAppointments: upcomingAppointmentsList.map((apt) => ({
        id: apt.id,
        service: apt.service?.name || '-',
        client: apt.client?.user?.name || '-',
        scheduledAt: apt.scheduledAt,
        status: apt.status,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
