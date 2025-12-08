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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;

    if (!file || !documentId) {
      return NextResponse.json({ error: 'File and documentId are required' }, { status: 400 });
    }

    // Get active Google Drive
    const activeDrive = await prisma.googleDrive.findFirst({
      where: { isActive: true },
    });

    if (!activeDrive) {
      return NextResponse.json({ error: 'No active Google Drive configured' }, { status: 400 });
    }

    // Check access to document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Client can only upload to their own documents
    if (session.user.role === 'CLIENT' && document.client?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Upload to Google Drive
    const driveClient = await getGoogleDriveClient(activeDrive.id);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type;

    // Create folder structure: /NotarisPortal/Documents/{documentId}/
    let folderId = activeDrive.rootFolderId;

    // Check or create document folder
    const folderName = `Document_${documentId.substring(0, 8)}`;
    const folderQuery = `name='${folderName}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const folderSearch = await driveClient.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id!;
    } else if (folderId) {
      const folder = await driveClient.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folderId],
        },
        fields: 'id',
      });
      folderId = folder.data.id!;
    }

    // Upload file
    const { Readable } = await import('stream');
    const stream = Readable.from(fileBuffer);

    const uploadedFile = await driveClient.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, name, mimeType, size, webViewLink, webContentLink',
    });

    // Save file record to database
    const documentFile = await prisma.documentFile.create({
      data: {
        documentId,
        driveId: activeDrive.id,
        driveFileId: uploadedFile.data.id!,
        driveLink: uploadedFile.data.webViewLink || undefined,
        uploadedBy: session.user.id,
        fileName,
        originalName: fileName,
        fileSize: BigInt(uploadedFile.data.size || '0'),
        mimeType,
      },
    });

    // Update drive storage usage
    const newStorageUsed = activeDrive.storageUsed + BigInt(uploadedFile.data.size || '0');
    await prisma.googleDrive.update({
      where: { id: activeDrive.id },
      data: { storageUsed: newStorageUsed },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD_FILE',
        resourceType: 'DocumentFile',
        resourceId: documentFile.id,
        newValues: { fileName, documentId },
      },
    });

    return NextResponse.json(
      {
        file: {
          id: documentFile.id,
          fileName: documentFile.fileName,
          fileSize: Number(documentFile.fileSize),
          mimeType: documentFile.mimeType,
          driveLink: documentFile.driveLink,
          createdAt: documentFile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
