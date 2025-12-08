import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const documentTypes = await prisma.documentType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(documentTypes);
  } catch (error) {
    console.error('Failed to fetch document types:', error);
    return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 });
  }
}
