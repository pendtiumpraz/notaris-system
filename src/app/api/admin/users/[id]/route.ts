import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        staff: true,
        client: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, password, position, employeeId, companyName, address, phone } = body;

    // Prevent self-demotion
    if (id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
    }

    // Check if ADMIN is trying to change to/from SUPER_ADMIN
    if (session.user.role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Cannot modify SUPER_ADMIN' }, { status: 403 });
      }
    }

    // Check email uniqueness if changing
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update Staff profile
    if (role === 'STAFF' || position || employeeId) {
      await prisma.staff.upsert({
        where: { userId: id },
        update: { position, employeeId },
        create: {
          userId: id,
          employeeId: employeeId || `EMP${Date.now()}`,
          position: position || 'Staff',
        },
      });
    }

    // Update Client profile
    if (role === 'CLIENT' || companyName || address) {
      await prisma.client.upsert({
        where: { userId: id },
        update: { companyName, address },
        create: {
          userId: id,
          clientNumber: `CLT${Date.now()}`,
          companyName,
          address,
        },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_USER',
        resourceType: 'User',
        resourceId: id,
        newValues: { name, email, role },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if trying to delete SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', deletedAt: null },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last SUPER_ADMIN' }, { status: 403 });
      }
    }

    // ADMIN cannot delete SUPER_ADMIN
    if (session.user.role === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete SUPER_ADMIN' }, { status: 403 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_USER',
        resourceType: 'User',
        resourceId: id,
        oldValues: { email: targetUser.email, name: targetUser.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
