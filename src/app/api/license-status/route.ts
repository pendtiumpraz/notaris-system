import { NextResponse } from 'next/server';
import { getLicenseStatus } from '@/lib/license-check';

// Public API: returns whether a license is active (no sensitive details)
export async function GET() {
  try {
    const status = await getLicenseStatus();
    return NextResponse.json({
      hasActiveLicense: status.hasActiveLicense,
      packageType: status.packageType,
      isExpired: status.isExpired,
    });
  } catch (error) {
    console.error('License status check error:', error);
    return NextResponse.json(
      { hasActiveLicense: false, packageType: null, isExpired: false },
      { status: 500 }
    );
  }
}
