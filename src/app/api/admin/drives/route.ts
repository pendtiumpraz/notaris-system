import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drives = await prisma.googleDrive.findMany({
      orderBy: [{ isActive: 'desc' }, { connectedAt: 'desc' }],
    });

    return NextResponse.json(
      drives.map((d) => ({
        ...d,
        storageUsed: d.storageUsed.toString(),
        storageLimit: d.storageLimit.toString(),
        accessToken: undefined,
        refreshToken: undefined,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch drives:', error);
    return NextResponse.json({ error: 'Failed to fetch drives' }, { status: 500 });
  }
}
