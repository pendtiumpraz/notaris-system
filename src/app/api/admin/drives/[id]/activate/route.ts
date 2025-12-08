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

    // Deactivate all drives
    await prisma.googleDrive.updateMany({
      data: { isActive: false },
    });

    // Activate the selected drive
    await prisma.googleDrive.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to activate drive:', error);
    return NextResponse.json({ error: 'Failed to activate drive' }, { status: 500 });
  }
}
