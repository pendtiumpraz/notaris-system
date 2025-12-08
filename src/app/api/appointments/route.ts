import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const where: Record<string, unknown> = {
      cancelledAt: null,
    };

    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (client) {
        where.clientId = client.id;
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findFirst({
        where: { userId: session.user.id },
      });
      if (staff) {
        where.staffId = staff.id;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: { include: { user: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        service: { select: { name: true } },
        document: { select: { title: true, documentNumber: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ data: appointments });
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    let clientId = data.clientId;

    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!client) {
        return NextResponse.json({ error: 'Client profile not found' }, { status: 400 });
      }
      clientId = client.id;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        serviceId: data.serviceId,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes || 30,
        status: 'PENDING',
        notes: data.notes || null,
        documentId: data.documentId || null,
        staffId: data.staffId || null,
      },
      include: {
        client: { include: { user: { select: { name: true } } } },
        service: { select: { name: true } },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
