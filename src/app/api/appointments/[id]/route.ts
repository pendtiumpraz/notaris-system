import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        service: true,
        document: { select: { id: true, title: true, documentNumber: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Role-based access check
    if (session.user.role === 'CLIENT') {
      if (appointment.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      if (appointment.staffId !== staff?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // ADMIN and SUPER_ADMIN can see all appointments

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to fetch appointment:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Role-based access check
    if (session.user.role === 'CLIENT') {
      if (existingAppointment.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Client can only reschedule (change date) or add notes, not change status
      if (data.status && data.status !== existingAppointment.status) {
        return NextResponse.json(
          { error: 'Clients cannot change appointment status' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      if (existingAppointment.staffId !== staff?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};

    // ADMIN/SUPER_ADMIN can update everything
    if (['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
      if (data.durationMinutes) updateData.durationMinutes = data.durationMinutes;
      if (data.status) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.staffId) updateData.staffId = data.staffId;
    } else if (session.user.role === 'STAFF') {
      // Staff can update status and notes
      if (data.status) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
    } else if (session.user.role === 'CLIENT') {
      // Client can only reschedule and add notes
      if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
      if (data.notes !== undefined) updateData.notes = data.notes;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: { include: { user: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        service: { select: { name: true } },
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Role-based access check
    if (session.user.role === 'CLIENT') {
      if (appointment.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      if (appointment.staffId !== staff?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // ADMIN and SUPER_ADMIN can cancel all appointments

    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
