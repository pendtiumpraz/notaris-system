import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const testimonial = await prisma.testimonial.create({
      data: {
        clientName: data.clientName,
        clientTitle: data.clientTitle || null,
        content: data.content,
        rating: data.rating || 5,
        isActive: data.isActive !== false,
        isFeatured: data.isFeatured === true,
        order: data.order || 0,
      },
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
