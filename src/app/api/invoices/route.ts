import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List invoices (role-based)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Clients only see their own invoices
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
      });
      if (!client) {
        return NextResponse.json({ invoices: [], total: 0 });
      }
      where.clientId = client.id;
    }

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { include: { user: { select: { name: true, email: true } } } },
          document: { select: { title: true, documentNumber: true } },
          items: { orderBy: { order: 'asc' } },
          payments: { orderBy: { paidAt: 'desc' } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Gagal memuat tagihan' }, { status: 500 });
  }
}

// POST - Create new invoice (Admin/Staff only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, documentId, items, taxPercent, discount, notes, dueDate } = body;

    if (!clientId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Client dan minimal 1 item harus diisi' }, { status: 400 });
    }

    // Generate invoice number: INV-YYYY-NNNN
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNumber: 'desc' },
    });
    const nextNum = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[2]) + 1 : 1;
    const invoiceNumber = `INV-${year}-${String(nextNum).padStart(4, '0')}`;

    // Calculate amounts
    const tax = taxPercent || 0;
    const disc = discount || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = subtotal * (tax / 100);
    const totalAmount = subtotal + taxAmount - disc;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        documentId: documentId || null,
        createdById: session.user.id,
        subtotal,
        taxPercent: tax,
        taxAmount,
        discount: disc,
        totalAmount,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            amount: (item.quantity || 1) * item.unitPrice,
            order: index,
          })),
        },
      },
      include: {
        client: { include: { user: { select: { name: true } } } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan' }, { status: 500 });
  }
}
