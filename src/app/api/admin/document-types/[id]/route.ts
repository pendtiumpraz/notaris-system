import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const documentType = await prisma.documentType.findUnique({
      where: { id },
    });

    if (!documentType) {
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ documentType });
  } catch (error) {
    console.error('Error fetching document type:', error);
    return NextResponse.json({ error: 'Failed to fetch document type' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, estimatedDurationDays, requiredDocuments, isActive } = body;

    const documentType = await prisma.documentType.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(estimatedDurationDays && { estimatedDurationDays }),
        ...(requiredDocuments && { requiredDocuments }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_DOCUMENT_TYPE',
        resourceType: 'DocumentType',
        resourceId: id,
        newValues: { name },
      },
    });

    return NextResponse.json({ documentType });
  } catch (error) {
    console.error('Error updating document type:', error);
    return NextResponse.json({ error: 'Failed to update document type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if document type is in use
    const documentsCount = await prisma.document.count({
      where: { documentTypeId: id, deletedAt: null },
    });

    if (documentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete document type that is in use' },
        { status: 400 }
      );
    }

    // Soft delete - set isActive to false
    await prisma.documentType.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_DOCUMENT_TYPE',
        resourceType: 'DocumentType',
        resourceId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document type:', error);
    return NextResponse.json({ error: 'Failed to delete document type' }, { status: 500 });
  }
}
