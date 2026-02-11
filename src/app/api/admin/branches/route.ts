import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { staff: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama cabang wajib diisi' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
