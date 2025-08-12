import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { featureFlagService, FeatureFlagContext } from './FeatureFlagService';

export interface UseFeatureFlagOptions {
  defaultValue?: boolean;
  context?: Partial<FeatureFlagContext>;
}

export function useFeatureFlag(flagId: string, options: UseFeatureFlagOptions = {}) {
  const { profile } = useAuth();
  const [isEnabled, setIsEnabled] = useState(options.defaultValue ?? false);
  const [isLoading, setIsLoading] = useState(true);

  const checkFlag = useCallback(() => {
    try {
      // Set context for feature flag evaluation
      const context: FeatureFlagContext = {
        userId: profile?.user_id,
        userRole: profile?.role,
        cohortId: profile?.cohort_id,
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        ...options.context,
      };

      featureFlagService.setContext(context);
      const enabled = featureFlagService.isEnabled(flagId);
      setIsEnabled(enabled);
    } catch (error) {
      console.error(`Error checking feature flag '${flagId}':`, error);
      setIsEnabled(options.defaultValue ?? false);
    } finally {
      setIsLoading(false);
    }
  }, [flagId, profile, options.context, options.defaultValue]);

  useEffect(() => {
    checkFlag();
  }, [checkFlag]);

  return {
    isEnabled,
    isLoading,
    checkFlag,
  };
}

// Hook for multiple feature flags
export function useFeatureFlags(flagIds: string[], options: UseFeatureFlagOptions = {}) {
  const { profile } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const checkFlags = useCallback(() => {
    try {
      // Set context for feature flag evaluation
      const context: FeatureFlagContext = {
        userId: profile?.user_id,
        userRole: profile?.role,
        cohortId: profile?.cohort_id,
        environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
        ...options.context,
      };

      featureFlagService.setContext(context);
      
      const flagStates: Record<string, boolean> = {};
      flagIds.forEach(flagId => {
        flagStates[flagId] = featureFlagService.isEnabled(flagId);
      });
      
      setFlags(flagStates);
    } catch (error) {
      console.error('Error checking feature flags:', error);
      const defaultStates: Record<string, boolean> = {};
      flagIds.forEach(flagId => {
        defaultStates[flagId] = options.defaultValue ?? false;
      });
      setFlags(defaultStates);
    } finally {
      setIsLoading(false);
    }
  }, [flagIds, profile, options.context, options.defaultValue]);

  useEffect(() => {
    checkFlags();
  }, [checkFlags]);

  return {
    flags,
    isLoading,
    checkFlags,
  };
}

// Hook for feature flag metadata
export function useFeatureFlagMetadata(flagId: string) {
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    try {
      const flagMetadata = featureFlagService.getMetadata(flagId);
      setMetadata(flagMetadata);
    } catch (error) {
      console.error(`Error getting metadata for feature flag '${flagId}':`, error);
      setMetadata(null);
    }
  }, [flagId]);

  return metadata;
}

// Hook for all feature flags
export function useAllFeatureFlags() {
  const [allFlags, setAllFlags] = useState<Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
  }>>([]);

  useEffect(() => {
    try {
      const flags = featureFlagService.getAllFlags();
      setAllFlags(flags);
    } catch (error) {
      console.error('Error getting all feature flags:', error);
      setAllFlags([]);
    }
  }, []);

  return allFlags;
}
