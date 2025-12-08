import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    // If documentId provided, get files for that document
    if (documentId) {
      where.documentId = documentId;

      // Check access - client can only see their own documents
      if (session.user.role === 'CLIENT') {
        const document = await prisma.document.findFirst({
          where: {
            id: documentId,
            client: { userId: session.user.id },
          },
        });
        if (!document) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    } else if (session.user.role === 'CLIENT') {
      // Client can only see files from their documents
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
      });
      if (client) {
        where.document = { clientId: client.id };
      }
    }

    const [files, total] = await Promise.all([
      prisma.documentFile.findMany({
        where,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              documentNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.documentFile.count({ where }),
    ]);

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
