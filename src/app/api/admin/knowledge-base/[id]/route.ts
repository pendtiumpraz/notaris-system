import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chunkContent } from '@/lib/knowledge-chunker';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const item = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          select: { id: true, chunkIndex: true, content: true, allowedRoles: true },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Knowledge base get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, content, allowedRoles, isActive } = body;

    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update KB item
    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
        ...(allowedRoles !== undefined && { allowedRoles }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Re-chunk if content changed
    if (content !== undefined && content !== existing.content) {
      await prisma.knowledgeChunk.deleteMany({ where: { knowledgeBaseId: id } });

      const chunks = chunkContent(content);
      for (let i = 0; i < chunks.length; i++) {
        await prisma.knowledgeChunk.create({
          data: {
            knowledgeBaseId: id,
            chunkIndex: i,
            content: chunks[i].content,
            allowedRoles: updated.allowedRoles,
            metadata: { title: updated.title, category: updated.category, ...chunks[i].metadata },
          },
        });
      }
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Knowledge base update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.knowledgeBase.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Knowledge base delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
