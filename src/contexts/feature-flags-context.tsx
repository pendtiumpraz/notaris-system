'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { FeatureFlags, ManageableRole } from '@/lib/feature-flags';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  hasActiveLicense: boolean;
  isFeatureEnabled: (featureKey: string, role: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FEATURE_FLAGS,
  isLoading: true,
  hasActiveLicense: false,
  isFeatureEnabled: () => true,
  refreshFlags: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveLicense, setHasActiveLicense] = useState(false);

  const fetchFlags = useCallback(async () => {
    try {
      // Fetch both feature flags and license status in parallel
      const [flagsRes, licenseRes] = await Promise.all([
        fetch('/api/admin/feature-flags'),
        fetch('/api/license-status'),
      ]);

      if (flagsRes.ok) {
        const data: FeatureFlags = await flagsRes.json();
        setFlags(data);
      }

      if (licenseRes.ok) {
        const licenseData = await licenseRes.json();
        setHasActiveLicense(licenseData.hasActiveLicense);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback(
    (featureKey: string, role: string) => {
      // SUPER_ADMIN always has access to everything
      if (role === 'SUPER_ADMIN') return true;

      // No license → no features for other roles
      if (!hasActiveLicense) return false;

      // Special keys always visible when licensed
      if (featureKey === '__always__') return true;

      const roleKey = role as ManageableRole;
      const roleFeatures = flags.enabledFeatures[roleKey];

      // If role not found in flags, default to enabled
      if (!roleFeatures) return true;

      return roleFeatures.includes(featureKey);
    },
    [flags.enabledFeatures, hasActiveLicense]
  );

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isLoading,
        hasActiveLicense,
        isFeatureEnabled,
        refreshFlags: fetchFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
