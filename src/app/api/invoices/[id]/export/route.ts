import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/pdf-generator';

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
        client: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        items: { orderBy: { order: 'asc' } },
        document: { select: { title: true, documentNumber: true } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    // Check access: admin/staff can see all, clients only their own
    if (session.user.role === 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
      });
      if (!client || client.id !== invoice.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const pdfBuffer = generateInvoicePDF(invoice);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to export invoice:', error);
    return NextResponse.json({ error: 'Gagal export invoice' }, { status: 500 });
  }
}
