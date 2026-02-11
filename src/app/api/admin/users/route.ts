import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role: role as any }),
      // ADMIN should not see SUPER_ADMIN users
      ...(session.user.role === 'ADMIN' && {
        role: role ? (role === 'SUPER_ADMIN' ? '__NONE__' : role) : { not: 'SUPER_ADMIN' },
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          staff: {
            select: {
              employeeId: true,
              position: true,
            },
          },
          client: {
            select: {
              id: true,
              clientNumber: true,
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, role, phone, position, employeeId, companyName, address } = body;

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if ADMIN is trying to create SUPER_ADMIN
    if (session.user.role === 'ADMIN' && role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot create SUPER_ADMIN' }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        emailVerifiedAt: new Date(),
      },
    });

    // Create Staff profile if role is STAFF
    if (role === 'STAFF') {
      await prisma.staff.create({
        data: {
          userId: user.id,
          employeeId: employeeId || `EMP${Date.now()}`,
          position: position || 'Staff',
        },
      });
    }

    // Create Client profile if role is CLIENT
    if (role === 'CLIENT') {
      await prisma.client.create({
        data: {
          userId: user.id,
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
        action: 'CREATE_USER',
        resourceType: 'User',
        resourceId: user.id,
        newValues: { email, name, role },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
