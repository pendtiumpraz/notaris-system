import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const galleries = await prisma.galleryImage.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(galleries);
  } catch (error) {
    console.error('Error fetching gallery:', error);
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
    const { title, imageUrl, category, order } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL gambar wajib diisi' }, { status: 400 });
    }

    const gallery = await prisma.galleryImage.create({
      data: {
        title: title || null,
        imageUrl,
        category: category || null,
        order: order ?? 0,
      },
    });

    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
