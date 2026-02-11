import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, email, isActive } = body;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only super admin' }, { status: 403 });
    }

    const { id } = await params;

    // Check if branch has staff
    const staffCount = await prisma.staff.count({ where: { branchId: id } });
    if (staffCount > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus cabang yang memiliki ${staffCount} staff` },
        { status: 400 }
      );
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ message: 'Branch deleted' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
