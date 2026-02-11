import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getClientIp } from '@/lib/audit-log';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        documentType: true,
        files: {
          where: { deletedAt: null },
          include: { uploader: { select: { name: true } } },
        },
        timeline: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Role-based access check
    if (session.user.role === 'CLIENT') {
      // Client can only see their own documents
      if (document.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      // Staff can see assigned documents
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      if (document.staffId !== staff?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // ADMIN and SUPER_ADMIN can see all documents

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const existingDoc = await prisma.document.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Role-based access check
    if (session.user.role === 'CLIENT') {
      // Client can only update their own documents and cannot change status
      if (existingDoc.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Client cannot change status directly
      if (data.status && data.status !== existingDoc.status) {
        return NextResponse.json(
          { error: 'Clients cannot change document status' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Staff can only update assigned documents
      const staff = await prisma.staff.findUnique({
        where: { userId: session.user.id },
      });
      if (existingDoc.staffId !== staff?.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // ADMIN and SUPER_ADMIN can update all documents

    const updateData: Record<string, unknown> = {};

    // ADMIN/SUPER_ADMIN can update everything
    if (['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
      if (data.staffId) updateData.staffId = data.staffId;
    } else if (session.user.role === 'STAFF') {
      // Staff can update status and notes
      if (data.status) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
    } else if (session.user.role === 'CLIENT') {
      // Client can only update description and notes
      if (data.description !== undefined) updateData.description = data.description;
      if (data.notes !== undefined) updateData.notes = data.notes;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        client: { include: { user: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
        documentType: { select: { id: true, name: true } },
      },
    });

    // Create timeline entry if status changed
    if (data.status && data.status !== existingDoc.status) {
      await prisma.documentTimeline.create({
        data: {
          documentId: id,
          changedBy: session.user.id,
          status: data.status,
          notes: data.statusNotes || `Status diubah ke ${data.status}`,
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: data.status && data.status !== existingDoc.status ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'DOCUMENT',
      entityId: id,
      details: { changes: updateData, previousStatus: existingDoc.status },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: id,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
