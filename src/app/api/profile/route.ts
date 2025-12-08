import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        staff: {
          select: {
            employeeId: true,
            position: true,
          },
        },
        client: {
          select: {
            clientNumber: true,
            companyName: true,
            address: true,
            idNumber: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatarUrl, address, companyName, idNumber, position } = body;

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    // Update Staff profile if applicable
    if (session.user.role === 'STAFF') {
      await prisma.staff.upsert({
        where: { userId: session.user.id },
        update: { position },
        create: {
          userId: session.user.id,
          employeeId: `EMP${Date.now()}`,
          position: position || 'Staff',
        },
      });
    }

    // Update Client profile if applicable
    if (session.user.role === 'CLIENT') {
      await prisma.client.upsert({
        where: { userId: session.user.id },
        update: { address, companyName, idNumber },
        create: {
          userId: session.user.id,
          clientNumber: `CLT${Date.now()}`,
          address,
          companyName,
          idNumber,
        },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_PROFILE',
        resourceType: 'User',
        resourceId: session.user.id,
        newValues: { name },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
