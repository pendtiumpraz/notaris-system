import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Record a payment for an invoice
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invoiceId } = await params;

  try {
    const body = await request.json();
    const { amount, method, reference, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah pembayaran harus lebih dari 0' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method: method || 'BANK_TRANSFER',
        reference: reference || null,
        notes: notes || null,
        receivedById: session.user.id,
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount + amount;
    const newStatus = newPaidAmount >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Failed to record payment:', error);
    return NextResponse.json({ error: 'Gagal mencatat pembayaran' }, { status: 500 });
  }
}
