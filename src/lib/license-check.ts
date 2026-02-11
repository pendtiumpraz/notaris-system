/**
 * License Check Utility
 *
 * Centralized license status checking for the client portal.
 * Used by auth, middleware, sidebar, and feature flags to enforce licensing.
 *
 * Rules:
 * - No license → only SUPER_ADMIN can login
 * - No license → SUPER_ADMIN sidebar: only License + User Management
 * - With license → all roles can login, features per package
 */

import { prisma } from './prisma';

export interface LicenseStatus {
  hasActiveLicense: boolean;
  packageType: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
}

// Cache license status for 60 seconds to avoid hitting DB on every request
let cachedStatus: LicenseStatus | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Check if there is an active, non-expired license in the database.
 * Results are cached for 60 seconds.
 */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  const now = Date.now();

  // Return cached status if still fresh
  if (cachedStatus && now - cachedAt < CACHE_TTL_MS) {
    return cachedStatus;
  }

  try {
    const license = await prisma.license.findFirst({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
      select: {
        packageType: true,
        expiresAt: true,
        isActive: true,
      },
    });

    const isExpired = license?.expiresAt ? new Date(license.expiresAt) < new Date() : false;

    const status: LicenseStatus = {
      hasActiveLicense: !!license && license.isActive && !isExpired,
      packageType: license?.packageType ?? null,
      expiresAt: license?.expiresAt ?? null,
      isExpired,
    };

    // Cache the result
    cachedStatus = status;
    cachedAt = now;

    return status;
  } catch (error) {
    console.error('Failed to check license status:', error);
    // On error, default to no license (strict mode)
    return {
      hasActiveLicense: false,
      packageType: null,
      expiresAt: null,
      isExpired: false,
    };
  }
}

/**
 * Invalidate the license cache (call after activation/deactivation)
 */
export function invalidateLicenseCache(): void {
  cachedStatus = null;
  cachedAt = 0;
}

/**
 * Check if a given role is allowed to login based on license status.
 * Only SUPER_ADMIN can login without a license.
 */
export async function isRoleAllowedToLogin(role: string): Promise<boolean> {
  if (role === 'SUPER_ADMIN') return true;

  const status = await getLicenseStatus();
  return status.hasActiveLicense;
}
