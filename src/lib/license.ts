/**
 * License System for Client Portal
 *
 * Validates license keys against a remote license server.
 * License is bound to a specific domain to prevent piracy.
 *
 * Flow:
 * 1. Super Admin inputs license key in admin panel
 * 2. Client portal sends activation request to license server
 * 3. License server checks: key valid? already bound? → binds to this domain
 * 4. Client portal saves activated license to local DB
 * 5. Feature flags auto-apply based on license package
 * 6. Periodic verification ensures license is still valid
 */

import crypto from 'crypto';

// License server URL — configured via env
export const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || 'https://license.notaris-system.com';

export interface LicenseActivationRequest {
  licenseKey: string;
  domain: string;
  serverHash: string;
}

export interface LicenseActivationResponse {
  success: boolean;
  error?: string;
  license?: {
    key: string;
    packageType: 'complete' | 'no_ai' | 'limited_ai';
    holderName: string;
    officeName: string | null;
    domain: string;
    expiresAt: string | null; // ISO date or null for lifetime
    activatedAt: string;
    features?: Record<string, string[]>; // Optional custom feature overrides per role
  };
}

export interface LicenseVerifyResponse {
  valid: boolean;
  error?: string;
  packageType?: string;
  expiresAt?: string | null;
}

/**
 * Generate a server hash based on machine-specific identifiers.
 * Uses the APP_URL and a server-side secret to create a unique fingerprint.
 * This prevents the same license key from working on a different server.
 */
export function generateServerHash(): string {
  const domain = getAppDomain();
  const secret = process.env.LICENSE_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';
  return crypto.createHash('sha256').update(`${domain}:${secret}`).digest('hex').substring(0, 32);
}

/**
 * Get the app domain from the environment
 */
export function getAppDomain(): string {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || '';
  try {
    const url = new URL(appUrl);
    return url.hostname;
  } catch {
    return appUrl || 'localhost';
  }
}

/**
 * Activate a license key against the license server
 */
export async function activateLicense(licenseKey: string): Promise<LicenseActivationResponse> {
  const domain = getAppDomain();
  const serverHash = generateServerHash();

  try {
    const res = await fetch(`${LICENSE_SERVER_URL}/api/licenses/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        domain,
        serverHash,
      } satisfies LicenseActivationRequest),
    });

    const data: LicenseActivationResponse = await res.json();
    return data;
  } catch (error) {
    console.error('License activation failed:', error);
    return {
      success: false,
      error: 'Gagal menghubungi license server. Periksa koneksi internet.',
    };
  }
}

/**
 * Verify an existing license is still valid
 */
export async function verifyLicense(licenseKey: string): Promise<LicenseVerifyResponse> {
  const domain = getAppDomain();
  const serverHash = generateServerHash();

  try {
    const res = await fetch(`${LICENSE_SERVER_URL}/api/licenses/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        domain,
        serverHash,
      }),
    });

    const data: LicenseVerifyResponse = await res.json();
    return data;
  } catch (error) {
    console.error('License verification failed:', error);
    // If verification fails due to network, we still allow usage (grace period)
    return { valid: true, error: 'Tidak dapat menghubungi license server (offline mode)' };
  }
}

/**
 * Generate a license key (for the license server to use)
 * Format: NTRS-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return `NTRS-${segments.join('-')}`;
}
