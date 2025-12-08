import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: session.user.id },
        },
      },
      include: {
        document: {
          select: { id: true, title: true, documentNumber: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        subject: data.subject || null,
        documentId: data.documentId || null,
        participants: {
          create: [
            { userId: session.user.id },
            // If targeting specific users, add them here
            ...(data.participantIds || []).map((id: string) => ({ userId: id })),
          ],
        },
      },
      include: {
        document: {
          select: { id: true, title: true, documentNumber: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    // Add admin/staff to conversation if user is client
    if (session.user.role === 'CLIENT') {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['SUPER_ADMIN', 'ADMIN'] },
          deletedAt: null,
        },
        take: 1,
      });

      if (admins.length > 0) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            userId: admins[0].id,
          },
        });
      }
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
