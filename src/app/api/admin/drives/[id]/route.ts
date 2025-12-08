import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const drive = await prisma.googleDrive.findUnique({ where: { id } });

    if (drive?.isActive) {
      return NextResponse.json(
        { error: 'Cannot disconnect active drive. Set another drive as active first.' },
        { status: 400 }
      );
    }

    await prisma.googleDrive.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect drive:', error);
    return NextResponse.json({ error: 'Failed to disconnect drive' }, { status: 500 });
  }
}
