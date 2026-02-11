import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activateLicense, getAppDomain, generateServerHash } from '@/lib/license';
import { invalidateLicenseCache } from '@/lib/license-check';
import {
  FEATURE_FLAGS_KEY,
  PACKAGE_PRESETS,
  type PackagePreset,
  type FeatureFlags,
} from '@/lib/feature-flags';

// GET - Get current license status
export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const license = await prisma.license.findFirst({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
    });

    return NextResponse.json({
      license: license
        ? {
            id: license.id,
            licenseKey: maskLicenseKey(license.licenseKey),
            packageType: license.packageType,
            domain: license.domain,
            holderName: license.holderName,
            officeName: license.officeName,
            activatedAt: license.activatedAt,
            expiresAt: license.expiresAt,
            lastVerified: license.lastVerified,
            isActive: license.isActive,
          }
        : null,
      currentDomain: getAppDomain(),
    });
  } catch (error) {
    console.error('Failed to fetch license:', error);
    return NextResponse.json({ error: 'Failed to fetch license' }, { status: 500 });
  }
}

// POST - Activate a new license key
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { licenseKey } = await request.json();

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json({ error: 'License key harus diisi' }, { status: 400 });
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    // Check if this key is already activated locally
    const existing = await prisma.license.findUnique({
      where: { licenseKey: cleanKey },
    });

    if (existing?.isActive) {
      return NextResponse.json(
        {
          error: 'License key ini sudah aktif di server ini',
        },
        { status: 400 }
      );
    }

    // Activate against license server
    const result = await activateLicense(cleanKey);

    if (!result.success || !result.license) {
      return NextResponse.json(
        {
          error: result.error || 'Aktivasi gagal',
        },
        { status: 400 }
      );
    }

    // Deactivate any existing license
    await prisma.license.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Save the activated license locally
    const license = await prisma.license.create({
      data: {
        licenseKey: cleanKey,
        packageType: result.license.packageType,
        domain: result.license.domain,
        holderName: result.license.holderName,
        officeName: result.license.officeName,
        expiresAt: result.license.expiresAt ? new Date(result.license.expiresAt) : null,
        serverHash: generateServerHash(),
        isActive: true,
        lastVerified: new Date(),
        metadata: result.license.features ? { customFeatures: result.license.features } : undefined,
      },
    });

    // Auto-apply feature flags based on package type
    await applyPackageToFeatureFlags(
      result.license.packageType as PackagePreset,
      session.user.id,
      result.license.features
    );

    // Invalidate license cache so auth picks up new status immediately
    invalidateLicenseCache();

    return NextResponse.json({
      success: true,
      license: {
        id: license.id,
        licenseKey: maskLicenseKey(license.licenseKey),
        packageType: license.packageType,
        domain: license.domain,
        holderName: license.holderName,
        officeName: license.officeName,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json({ error: 'Gagal mengaktifkan license' }, { status: 500 });
  }
}

// DELETE - Deactivate current license
export async function DELETE() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.license.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Invalidate license cache
    invalidateLicenseCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to deactivate license:', error);
    return NextResponse.json({ error: 'Gagal menonaktifkan license' }, { status: 500 });
  }
}

// Helper: Mask license key for display (NTRS-XXXX-****-****-XXXX)
function maskLicenseKey(key: string): string {
  const parts = key.split('-');
  if (parts.length >= 5) {
    return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
  }
  return key.substring(0, 8) + '****' + key.substring(key.length - 4);
}

// Helper: Apply package preset to feature flags
async function applyPackageToFeatureFlags(
  packageType: PackagePreset,
  userId: string,
  customFeatures?: Record<string, string[]>
) {
  const preset = PACKAGE_PRESETS[packageType];
  if (!preset) return;

  const featureFlags: FeatureFlags = {
    activePackage: packageType,
    enabledFeatures: customFeatures
      ? {
          ADMIN: customFeatures.ADMIN || [],
          STAFF: customFeatures.STAFF || [],
          CLIENT: customFeatures.CLIENT || [],
        }
      : { ...preset.enabledFeatures },
    updatedAt: new Date().toISOString(),
  };

  await prisma.siteSettings.upsert({
    where: { key: FEATURE_FLAGS_KEY },
    update: {
      value: JSON.stringify(featureFlags),
      type: 'json',
      updatedBy: userId,
    },
    create: {
      key: FEATURE_FLAGS_KEY,
      value: JSON.stringify(featureFlags),
      type: 'json',
      description: 'Feature flags from license activation',
      updatedBy: userId,
    },
  });
}
