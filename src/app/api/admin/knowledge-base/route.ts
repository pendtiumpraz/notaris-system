import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chunkContent } from '@/lib/knowledge-chunker';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chunks: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Knowledge base list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { title, description, category, content, allowedRoles, sourceType, sourceUrl } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Create KB item
    const kb = await prisma.knowledgeBase.create({
      data: {
        title,
        description,
        category,
        content,
        allowedRoles: allowedRoles || ['GUEST', 'CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN'],
        sourceType: sourceType || 'manual',
        sourceUrl,
        createdById: userId,
      },
    });

    // Auto-chunk
    const chunks = chunkContent(content);
    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          knowledgeBaseId: kb.id,
          chunkIndex: i,
          content: chunks[i].content,
          allowedRoles: kb.allowedRoles,
          metadata: { title: kb.title, category: kb.category, ...chunks[i].metadata },
        },
      });
    }

    return NextResponse.json({
      item: kb,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error('Knowledge base create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
