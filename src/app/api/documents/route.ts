import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDocumentNumber } from '@/lib/utils';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Filter by role
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (client) {
        where.clientId = client.id;
      }
    } else if (session.user.role === 'STAFF') {
      const staff = await prisma.staff.findFirst({
        where: { userId: session.user.id },
      });
      if (staff) {
        where.staffId = staff.id;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          client: { include: { user: { select: { name: true } } } },
          staff: { include: { user: { select: { name: true } } } },
          documentType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    let clientId = data.clientId;

    // If user is CLIENT, use their client ID
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!client) {
        return NextResponse.json({ error: 'Client profile not found' }, { status: 400 });
      }
      clientId = client.id;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const docType = await prisma.documentType.findUnique({
      where: { id: data.documentTypeId },
    });

    const document = await prisma.document.create({
      data: {
        documentNumber: generateDocumentNumber(docType?.name || 'DOC'),
        title: data.title,
        description: data.description || null,
        status: data.status || 'DRAFT',
        priority: data.priority || 'NORMAL',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        clientId,
        documentTypeId: data.documentTypeId,
        staffId: data.staffId || null,
      },
      include: {
        client: { include: { user: { select: { name: true } } } },
        documentType: { select: { name: true } },
      },
    });

    // Create timeline entry
    await prisma.documentTimeline.create({
      data: {
        documentId: document.id,
        changedBy: session.user.id,
        status: document.status,
        notes: 'Dokumen dibuat',
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
