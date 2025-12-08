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

    const service = await prisma.serviceInfo.create({
      data: {
        title: data.title,
        description: data.description,
        icon: data.icon || null,
        features: data.features || null,
        price: data.price || null,
        order: data.order || 0,
        isActive: data.isActive !== false,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Failed to create service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
