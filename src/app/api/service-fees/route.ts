import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List service fees
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const fees = await prisma.serviceFee.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ fees });
  } catch (error) {
    console.error('Failed to fetch service fees:', error);
    return NextResponse.json({ error: 'Gagal memuat tarif' }, { status: 500 });
  }
}

// POST - Create service fee
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, baseFee, description } = body;

    if (!name || !baseFee) {
      return NextResponse.json({ error: 'Nama dan tarif dasar wajib diisi' }, { status: 400 });
    }

    const fee = await prisma.serviceFee.create({
      data: {
        name,
        category: category || 'notaris',
        baseFee: parseFloat(baseFee),
        description: description || null,
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Failed to create service fee:', error);
    return NextResponse.json({ error: 'Gagal membuat tarif' }, { status: 500 });
  }
}
