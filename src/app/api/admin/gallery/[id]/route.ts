import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { title, imageUrl, category, order, isActive } = body;

    const gallery = await prisma.galleryImage.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error updating gallery image:', error);
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

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Gallery image deleted' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
