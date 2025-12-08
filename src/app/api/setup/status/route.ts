import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        deletedAt: null,
      },
    });

    return NextResponse.json({ hasAdmin: adminCount > 0 });
  } catch (error) {
    console.error('Setup status check failed:', error);
    return NextResponse.json({ error: 'Failed to check setup status' }, { status: 500 });
  }
}
