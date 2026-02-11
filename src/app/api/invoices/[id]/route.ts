import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get single invoice
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { include: { user: { select: { name: true, email: true, phone: true } } } },
        document: { select: { title: true, documentNumber: true } },
        items: { orderBy: { order: 'asc' } },
        payments: {
          orderBy: { paidAt: 'desc' },
          include: { receivedBy: { select: { name: true } } },
        },
        createdBy: { select: { name: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    // Check access: clients can only see their own
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
      if (!client || client.id !== invoice.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json({ error: 'Gagal memuat tagihan' }, { status: 500 });
  }
}

// PATCH - Update invoice (Admin/Staff)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, items, taxPercent, discount, notes, dueDate } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'SENT' && !body.sentAt) updateData.sentAt = new Date();
      if (status === 'PAID') updateData.paidAt = new Date();
    }
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Recalculate if items changed
    if (items) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await prisma.invoiceItem.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: items.map((item: any, index: number) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          amount: (item.quantity || 1) * item.unitPrice,
          order: index,
        })),
      });

      const tax = taxPercent ?? 0;
      const disc = discount ?? 0;

      const subtotal = items.reduce(
        (sum: number, item: any) => sum + (item.quantity || 1) * item.unitPrice,
        0
      );
      const taxAmount = subtotal * (tax / 100);
      updateData.subtotal = subtotal;
      updateData.taxPercent = tax;
      updateData.taxAmount = taxAmount;
      updateData.discount = disc;
      updateData.totalAmount = subtotal + taxAmount - disc;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { include: { user: { select: { name: true } } } },
        items: { orderBy: { order: 'asc' } },
        payments: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Gagal memperbarui tagihan' }, { status: 500 });
  }
}

// DELETE - Delete invoice (Admin only)
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
    // Delete payments first (items cascade from schema)
    await prisma.payment.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Gagal menghapus tagihan' }, { status: 500 });
  }
}
