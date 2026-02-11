import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLicense } from '@/lib/license';

/**
 * License verification endpoint
 * Can be called periodically (e.g., via cron) to verify license is still valid.
 * Also called on app startup.
 */
export async function POST() {
  try {
    const license = await prisma.license.findFirst({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
    });

    if (!license) {
      return NextResponse.json({ valid: false, error: 'No active license' });
    }

    // Check expiry locally first
    if (license.expiresAt && new Date() > license.expiresAt) {
      await prisma.license.update({
        where: { id: license.id },
        data: { isActive: false },
      });
      return NextResponse.json({ valid: false, error: 'License expired' });
    }

    // Verify against license server
    const result = await verifyLicense(license.licenseKey);

    // Update last verified timestamp
    await prisma.license.update({
      where: { id: license.id },
      data: {
        lastVerified: new Date(),
        isActive: result.valid,
      },
    });

    return NextResponse.json({
      valid: result.valid,
      packageType: license.packageType,
      expiresAt: license.expiresAt,
      lastVerified: new Date(),
      error: result.error,
    });
  } catch (error) {
    console.error('License verification error:', error);
    return NextResponse.json({ valid: true, error: 'Verification skipped (error)' });
  }
}
