import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get checklists for a document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

  try {
    const checklists = await prisma.documentChecklist.findMany({
      where: { documentId },
      include: { verifier: { select: { name: true } } },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ checklists });
  } catch (error) {
    console.error('Failed to fetch checklists:', error);
    return NextResponse.json({ error: 'Gagal memuat checklist' }, { status: 500 });
  }
}

// POST - Add checklist items to a document (Admin/Staff)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await params;

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items checklist harus diisi' }, { status: 400 });
    }

    const checklists = await prisma.documentChecklist.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: items.map((item: any, index: number) => ({
        documentId,
        label: item.label,
        isRequired: item.isRequired !== false,
        order: index,
        notes: item.notes || null,
      })),
    });

    return NextResponse.json({ success: true, count: checklists.count });
  } catch (error) {
    console.error('Failed to create checklists:', error);
    return NextResponse.json({ error: 'Gagal membuat checklist' }, { status: 500 });
  }
}

// PATCH - Update checklist item (toggle completion, verify)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { checklistId, isCompleted, verified } = body;

    if (!checklistId) {
      return NextResponse.json({ error: 'checklistId harus diisi' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};

    // Client can toggle completion
    if (isCompleted !== undefined) {
      data.isCompleted = isCompleted;
      data.completedAt = isCompleted ? new Date() : null;
    }

    // Staff/Admin can verify
    if (verified !== undefined && ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      data.verifiedBy = verified ? session.user.id : null;
      data.verifiedAt = verified ? new Date() : null;
    }

    const checklist = await prisma.documentChecklist.update({
      where: { id: checklistId },
      data,
      include: { verifier: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    console.error('Failed to update checklist:', error);
    return NextResponse.json({ error: 'Gagal memperbarui checklist' }, { status: 500 });
  }
}
