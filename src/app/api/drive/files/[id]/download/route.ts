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

  // Check if token needs refresh
  if (drive.tokenExpiry && new Date(drive.tokenExpiry) < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.googleDrive.update({
      where: { id: driveId },
      data: {
        accessToken: credentials.access_token!,
        ...(credentials.expiry_date && { tokenExpiry: new Date(credentials.expiry_date) }),
      },
    });
    oauth2Client.setCredentials(credentials);
  }

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

    if (!file.driveId || !file.driveFileId) {
      return NextResponse.json({ error: 'File not available for download' }, { status: 400 });
    }

    // Get file from Google Drive
    const driveClient = await getGoogleDriveClient(file.driveId);

    const response = await driveClient.files.get(
      {
        fileId: file.driveFileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    // Convert the readable stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.data as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the file with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
