import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List templates
export async function GET() {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await prisma.documentTemplate.findMany({
      where: { isActive: true },
      include: {
        documentType: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Gagal memuat template' }, { status: 500 });
  }
}

// POST - Create template (Admin only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, documentTypeId, content, placeholders, category } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Nama dan konten template harus diisi' }, { status: 400 });
    }

    const template = await prisma.documentTemplate.create({
      data: {
        name,
        description: description || null,
        documentTypeId: documentTypeId || null,
        content,
        placeholders: placeholders || null,
        category: category || null,
        createdById: session.user.id,
      },
      include: {
        documentType: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Failed to create template:', error);
    return NextResponse.json({ error: 'Gagal membuat template' }, { status: 500 });
  }
}
