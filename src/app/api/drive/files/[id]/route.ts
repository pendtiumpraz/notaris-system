import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

async function getGoogleDriveClient(driveId: string) {
  const drive = await prisma.googleDrive.findUnique({
    where: { id: driveId },
  });

  if (!drive) {
    throw new Error('Drive not found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: drive.accessToken,
    refresh_token: drive.refreshToken,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const file = await prisma.documentFile.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            client: true,
          },
        },
        drive: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access for clients
    if (session.user.role === 'CLIENT') {
      if (file.document?.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({
      file: {
        id: file.id,
        fileName: file.fileName,
        originalName: file.originalName,
        fileSize: Number(file.fileSize),
        mimeType: file.mimeType,
        driveLink: file.driveLink,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const file = await prisma.documentFile.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            client: true,
          },
        },
        drive: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access for clients
    if (session.user.role === 'CLIENT') {
      if (file.document?.client?.userId !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Client can only delete their own uploads
      if (file.uploadedBy !== session.user.id) {
        return NextResponse.json({ error: 'Can only delete your own uploads' }, { status: 403 });
      }
    }

    // Delete from Google Drive
    if (file.driveId && file.driveFileId) {
      try {
        const driveClient = await getGoogleDriveClient(file.driveId);
        await driveClient.files.delete({
          fileId: file.driveFileId,
        });
      } catch (driveError) {
        console.error('Error deleting from Google Drive:', driveError);
        // Continue with soft delete even if Google Drive delete fails
      }
    }

    // Soft delete in database
    await prisma.documentFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Update storage usage
    if (file.drive) {
      const newStorageUsed = file.drive.storageUsed - file.fileSize;
      await prisma.googleDrive.update({
        where: { id: file.driveId! },
        data: { storageUsed: newStorageUsed > 0 ? newStorageUsed : BigInt(0) },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_FILE',
        resourceType: 'DocumentFile',
        resourceId: id,
        oldValues: { fileName: file.fileName },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
