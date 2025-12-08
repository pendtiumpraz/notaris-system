import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const drive = await prisma.googleDrive.findUnique({ where: { id } });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // In production, you would refresh the token and get storage info from Google API
    // For now, we'll just update the connection status
    await prisma.googleDrive.update({
      where: { id },
      data: { isConnected: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to refresh drive:', error);
    return NextResponse.json({ error: 'Failed to refresh drive' }, { status: 500 });
  }
}
