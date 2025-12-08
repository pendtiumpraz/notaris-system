import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    // If staffId is provided and user is admin, get that staff's availability
    // Otherwise get current user's availability (if they are staff)
    let targetStaffId: string | null = staffId;

    if (!targetStaffId && session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      targetStaffId = staff?.id ?? null;
    }

    if (!targetStaffId) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    const availability = await prisma.staffAvailability.findMany({
      where: { staffId: targetStaffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isAvailable = true, staffId: providedStaffId } = body;

    // Get staff ID
    let staffId = providedStaffId;
    if (!staffId && session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const availability = await prisma.staffAvailability.create({
      data: {
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error('Error creating availability:', error);
    return NextResponse.json({ error: 'Failed to create availability' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { availabilities, staffId: providedStaffId } = body;

    // Get staff ID
    let staffId = providedStaffId;
    if (!staffId && session.user.role === 'STAFF') {
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      staffId = staff?.id;
    }

    if (!staffId) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Delete existing and create new
    await prisma.staffAvailability.deleteMany({
      where: { staffId },
    });

    if (availabilities && availabilities.length > 0) {
      await prisma.staffAvailability.createMany({
        data: availabilities.map((a: any) => ({
          staffId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isAvailable: a.isAvailable ?? true,
        })),
      });
    }

    const newAvailability = await prisma.staffAvailability.findMany({
      where: { staffId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ availability: newAvailability });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
