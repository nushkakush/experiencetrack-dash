import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { featureFlagService } from './FeatureFlagService';
import type { FeatureFlagContext } from './FeatureFlagService';

interface FeatureFlagContextType {
  isEnabled: (flagId: string) => boolean;
  getMetadata: (flagId: string) => Record<string, unknown> | null;
  getAllFlags: () => Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number;
  }>;
  context: FeatureFlagContext;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialContext?: Partial<FeatureFlagContext>;
}

export function FeatureFlagProvider({
  children,
  initialContext = {},
}: FeatureFlagProviderProps) {
  const { profile } = useAuth();

  // Create context directly without state management
  const contextValue: FeatureFlagContext = useMemo(
    () => ({
      userId: profile?.user_id,
      userRole: profile?.role,
      userEmail: profile?.email,
      environment: process.env.NODE_ENV as
        | 'development'
        | 'staging'
        | 'production',
    }),
    [profile?.user_id, profile?.role, profile?.email]
  );

  // Update the service context when context changes
  useEffect(() => {
    featureFlagService.setContext(contextValue);
  }, [contextValue]);

  const isEnabled = (flagId: string): boolean => {
    return featureFlagService.isEnabled(flagId);
  };

  const getMetadata = (flagId: string): Record<string, unknown> | null => {
    return featureFlagService.getMetadata(flagId);
  };

  const getAllFlags = () => {
    return featureFlagService.getAllFlags();
  };

  const value: FeatureFlagContextType = useMemo(
    () => ({
      isEnabled,
      getMetadata,
      getAllFlags,
      context: contextValue,
    }),
    [contextValue]
  );

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlagContext(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error(
      'useFeatureFlagContext must be used within a FeatureFlagProvider'
    );
  }
  return context;
}

// Higher-order component for feature flag conditional rendering
interface WithFeatureFlagProps {
  flagId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function WithFeatureFlag({
  flagId,
  fallback = null,
  children,
}: WithFeatureFlagProps) {
  const { isEnabled } = useFeatureFlagContext();

  if (!isEnabled(flagId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Component for feature flag debugging (development only)
export function FeatureFlagDebugger() {
  const { getAllFlags, context } = useFeatureFlagContext();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const flags = getAllFlags();

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className='bg-blue-500 text-white px-3 py-2 rounded-md text-sm'
      >
        Feature Flags ({flags.filter(f => f.enabled).length}/{flags.length})
      </button>

      {isVisible && (
        <div className='absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-4 shadow-lg max-w-md'>
          <h3 className='font-semibold mb-2 dark:text-gray-100'>
            Feature Flags
          </h3>
          <div className='space-y-2 text-sm'>
            {flags.map(flag => (
              <div key={flag.id} className='flex items-center justify-between'>
                <span className='font-medium dark:text-gray-100'>
                  {flag.name}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    flag.enabled
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {flag.enabled ? 'Enabled' : 'Disabled'} (
                  {flag.rolloutPercentage}%)
                </span>
              </div>
            ))}
          </div>

          <div className='mt-4 pt-2 border-t border-gray-200 dark:border-gray-600'>
            <h4 className='font-semibold mb-1 dark:text-gray-100'>Context</h4>
            <div className='text-xs space-y-1'>
              <div className='dark:text-gray-300'>
                User ID: {context.userId || 'None'}
              </div>
              <div className='dark:text-gray-300'>
                Role: {context.userRole || 'None'}
              </div>
              <div className='dark:text-gray-300'>
                Cohort: {context.cohortId || 'None'}
              </div>
              <div className='dark:text-gray-300'>
                Environment: {context.environment}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
