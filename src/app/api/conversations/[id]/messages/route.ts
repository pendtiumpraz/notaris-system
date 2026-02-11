import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        deletedAt: null,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Determine if this is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let content: string;
    let files: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = (formData.get('content') as string) || '📎 Lampiran';
      files = formData.getAll('attachments') as File[];
    } else {
      const data = await request.json();
      content = data.content;
    }

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Handle file attachments
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
      await mkdir(uploadDir, { recursive: true });

      const attachmentData = [];
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        attachmentData.push({
          messageId: message.id,
          fileName: file.name,
          filePath: `/uploads/messages/${uniqueName}`,
          fileSize: BigInt(file.size),
          mimeType: file.type || 'application/octet-stream',
        });
      }

      await prisma.messageAttachment.createMany({ data: attachmentData });
    }

    // Fetch the full message with attachments
    const fullMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        attachments: {
          select: { id: true, fileName: true, filePath: true, fileSize: true, mimeType: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Create notifications for other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: id,
        userId: { not: session.user.id },
      },
    });

    await prisma.notification.createMany({
      data: otherParticipants.map((p) => ({
        userId: p.userId,
        type: 'NEW_MESSAGE',
        title: 'Pesan Baru',
        body: `${session.user.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: { conversationId: id, messageId: message.id },
      })),
    });

    return NextResponse.json(fullMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
