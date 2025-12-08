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

    const member = await prisma.teamMember.create({
      data: {
        name: data.name,
        position: data.position,
        bio: data.bio || null,
        photo: data.photo || null,
        email: data.email || null,
        phone: data.phone || null,
        order: data.order || 0,
        isActive: data.isActive !== false,
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
