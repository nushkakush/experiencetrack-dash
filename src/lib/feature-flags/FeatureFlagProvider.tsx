import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { featureFlagService, FeatureFlagContext } from './FeatureFlagService';

interface FeatureFlagContextType {
  isEnabled: (flagId: string) => boolean;
  getMetadata: (flagId: string) => Record<string, any> | null;
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

export function FeatureFlagProvider({ children, initialContext = {} }: FeatureFlagProviderProps) {
  const { profile } = useAuth();
  const [context, setContext] = useState<FeatureFlagContext>({
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    ...initialContext,
  });

  useEffect(() => {
    // Update context when profile changes
    const newContext: FeatureFlagContext = {
      userId: profile?.user_id,
      userRole: profile?.role,
      cohortId: profile?.cohort_id,
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
      ...initialContext,
    };

    setContext(newContext);
    featureFlagService.setContext(newContext);
  }, [profile, initialContext]);

  const isEnabled = (flagId: string): boolean => {
    return featureFlagService.isEnabled(flagId);
  };

  const getMetadata = (flagId: string): Record<string, any> | null => {
    return featureFlagService.getMetadata(flagId);
  };

  const getAllFlags = () => {
    return featureFlagService.getAllFlags();
  };

  const value: FeatureFlagContextType = {
    isEnabled,
    getMetadata,
    getAllFlags,
    context,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlagContext(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within a FeatureFlagProvider');
  }
  return context;
}

// Higher-order component for feature flag conditional rendering
interface WithFeatureFlagProps {
  flagId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function WithFeatureFlag({ flagId, fallback = null, children }: WithFeatureFlagProps) {
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
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm"
      >
        Feature Flags ({flags.filter(f => f.enabled).length}/{flags.length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-md p-4 shadow-lg max-w-md">
          <h3 className="font-semibold mb-2">Feature Flags</h3>
          <div className="space-y-2 text-sm">
            {flags.map(flag => (
              <div key={flag.id} className="flex items-center justify-between">
                <span className="font-medium">{flag.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  flag.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {flag.enabled ? 'Enabled' : 'Disabled'} ({flag.rolloutPercentage}%)
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-2 border-t border-gray-200">
            <h4 className="font-semibold mb-1">Context</h4>
            <div className="text-xs space-y-1">
              <div>User ID: {context.userId || 'None'}</div>
              <div>Role: {context.userRole || 'None'}</div>
              <div>Cohort: {context.cohortId || 'None'}</div>
              <div>Environment: {context.environment}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
