import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/documents/[id]/content
 * Fetch document content (stored in metadata.editorContent)
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        metadata: true,
        documentType: { select: { name: true } },
        client: {
          select: {
            user: { select: { name: true } },
            address: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const metadata = doc.metadata as Record<string, unknown> | null;
    const content = (metadata?.editorContent as string) || '';

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType?.name || '',
      clientName: doc.client?.user?.name || '',
      clientAddress: doc.client?.address || '',
      content,
    });
  } catch (error) {
    console.error('Failed to fetch document content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

/**
 * PUT /api/documents/[id]/content
 * Save document content to metadata.editorContent
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { content } = await request.json();

    // Fetch existing metadata
    const doc = await prisma.document.findUnique({
      where: { id },
      select: { metadata: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const existingMetadata = (doc.metadata as Record<string, unknown>) || {};

    await prisma.document.update({
      where: { id },
      data: {
        metadata: {
          ...existingMetadata,
          editorContent: content,
          lastEditedAt: new Date().toISOString(),
          lastEditedBy: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save document content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
