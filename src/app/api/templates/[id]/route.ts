import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get single template
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      include: {
        documentType: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json({ error: 'Gagal memuat template' }, { status: 500 });
  }
}

// PATCH - Update template (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, documentTypeId, content, placeholders, category, isActive } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (documentTypeId !== undefined) data.documentTypeId = documentTypeId || null;
    if (content !== undefined) data.content = content;
    if (placeholders !== undefined) data.placeholders = placeholders;
    if (category !== undefined) data.category = category;
    if (isActive !== undefined) data.isActive = isActive;

    const template = await prisma.documentTemplate.update({
      where: { id },
      data,
      include: {
        documentType: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Gagal memperbarui template' }, { status: 500 });
  }
}

// DELETE - Delete template (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.documentTemplate.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json({ error: 'Gagal menghapus template' }, { status: 500 });
  }
}
