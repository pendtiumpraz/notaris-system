'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { FeatureFlags, ManageableRole } from '@/lib/feature-flags';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/feature-flags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  isFeatureEnabled: (featureKey: string, role: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FEATURE_FLAGS,
  isLoading: true,
  isFeatureEnabled: () => true,
  refreshFlags: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const data: FeatureFlags = await res.json();
        setFlags(data);
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

      const roleKey = role as ManageableRole;
      const roleFeatures = flags.enabledFeatures[roleKey];

      // If role not found in flags, default to enabled
      if (!roleFeatures) return true;

      return roleFeatures.includes(featureKey);
    },
    [flags.enabledFeatures]
  );

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isLoading,
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
