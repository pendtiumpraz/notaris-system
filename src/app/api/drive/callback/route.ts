import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/drive/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/admin/drives?error=auth_failed', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/admin/drives?error=invalid_request', request.url));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/admin/drives?error=not_configured', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Token exchange failed');
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userRes.json();

    // Get storage quota
    const aboutRes = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    let storageUsed = BigInt(0);
    let storageLimit = BigInt(16106127360); // 15GB default

    if (aboutRes.ok) {
      const aboutData = await aboutRes.json();
      if (aboutData.storageQuota) {
        storageUsed = BigInt(aboutData.storageQuota.usage || 0);
        storageLimit = BigInt(aboutData.storageQuota.limit || 16106127360);
      }
    }

    // Check if drive already exists
    const existingDrive = await prisma.googleDrive.findUnique({
      where: { email: userInfo.email },
    });

    if (existingDrive) {
      // Update existing drive
      await prisma.googleDrive.update({
        where: { email: userInfo.email },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingDrive.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          accountName: userInfo.name,
          storageUsed,
          storageLimit,
          isConnected: true,
        },
      });
    } else {
      // Deactivate other drives if this is the first one
      const driveCount = await prisma.googleDrive.count();
      const isFirstDrive = driveCount === 0;

      // Create new drive
      await prisma.googleDrive.create({
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          email: userInfo.email,
          accountName: userInfo.name,
          storageUsed,
          storageLimit,
          isActive: isFirstDrive,
          isConnected: true,
          connectedBy: state,
        },
      });
    }

    return NextResponse.redirect(new URL('/admin/drives?success=connected', request.url));
  } catch (error) {
    console.error('Google Drive callback error:', error);
    return NextResponse.redirect(new URL('/admin/drives?error=connection_failed', request.url));
  }
}
