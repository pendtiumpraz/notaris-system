import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const documentTypes = await prisma.documentType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, estimatedDurationDays, requiredDocuments } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const documentType = await prisma.documentType.create({
      data: {
        name,
        description,
        estimatedDurationDays: estimatedDurationDays || 7,
        requiredDocuments: requiredDocuments || [],
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_DOCUMENT_TYPE',
        resourceType: 'DocumentType',
        resourceId: documentType.id,
        newValues: { name },
      },
    });

    return NextResponse.json({ documentType }, { status: 201 });
  } catch (error) {
    console.error('Error creating document type:', error);
    return NextResponse.json({ error: 'Failed to create document type' }, { status: 500 });
  }
}
