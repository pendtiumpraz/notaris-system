import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get available users to start a conversation with
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const userRole = session.user.role;

    const whereCondition: any = {
      id: { not: userId },
      deletedAt: null,
    };

    // Define which roles each user can chat with
    if (userRole === 'CLIENT') {
      // Client can chat with Staff and Admin
      whereCondition.role = { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] };
    } else if (userRole === 'STAFF') {
      // Staff can chat with Admin and Client
      whereCondition.role = { in: ['CLIENT', 'ADMIN', 'SUPER_ADMIN'] };
    } else if (userRole === 'ADMIN') {
      // Admin can chat with everyone except other admins (optional: remove this to allow admin-admin chat)
      whereCondition.role = { in: ['CLIENT', 'STAFF', 'SUPER_ADMIN'] };
    }
    // SUPER_ADMIN can chat with everyone (no additional filter)

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        staff: {
          select: { position: true },
        },
        client: {
          select: { companyName: true },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    // Group users by role for easier display
    const groupedUsers = {
      admins: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'),
      staff: users.filter((u) => u.role === 'STAFF'),
      clients: users.filter((u) => u.role === 'CLIENT'),
    };

    return NextResponse.json({
      users,
      grouped: groupedUsers,
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
