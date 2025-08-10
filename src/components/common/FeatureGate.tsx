import React from 'react';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { FeatureKey } from '@/types/features';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  features?: FeatureKey[];
  showDeprecatedWarning?: boolean;
  showExperimentalWarning?: boolean;
}

/**
 * FeatureGate component for conditionally rendering content based on feature permissions
 * 
 * @example
 * // Single feature check
 * <FeatureGate feature="cohorts.create">
 *   <Button>Create Cohort</Button>
 * </FeatureGate>
 * 
 * @example
 * // Multiple features with fallback
 * <FeatureGate 
 *   features={['cohorts.edit', 'cohorts.delete']} 
 *   requireAll={false}
 *   fallback={<p>No editing permissions</p>}
 * >
 *   <Button>Edit Cohort</Button>
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
  requireAll = true,
  features,
  showDeprecatedWarning = false,
  showExperimentalWarning = false,
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    isFeatureDeprecated,
    isFeatureExperimental,
    getFeatureMetadata
  } = useFeaturePermissions();

  // Determine which features to check
  const featuresToCheck = features || [feature];
  
  // Check permissions based on requireAll flag
  const hasAccess = requireAll 
    ? hasAllPermissions(featuresToCheck)
    : hasAnyPermission(featuresToCheck);

  // Check for deprecated/experimental features
  const deprecatedFeatures = featuresToCheck.filter(f => isFeatureDeprecated(f));
  const experimentalFeatures = featuresToCheck.filter(f => isFeatureExperimental(f));

  // Show warnings if enabled
  const showWarnings = showDeprecatedWarning || showExperimentalWarning;
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return (
    <>
      {showWarnings && (
        <>
          {showDeprecatedWarning && deprecatedFeatures.length > 0 && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This feature uses deprecated functionality: {deprecatedFeatures.join(', ')}
              </p>
            </div>
          )}
          
          {showExperimentalWarning && experimentalFeatures.length > 0 && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                🔬 This feature is experimental: {experimentalFeatures.join(', ')}
              </p>
            </div>
          )}
        </>
      )}
      
      {children}
    </>
  );
};

// Specialized FeatureGate components for common use cases
export const CohortFeatureGate: React.FC<{
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage_students' | 'bulk_upload';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`cohorts.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const AttendanceFeatureGate: React.FC<{
  action: 'view' | 'mark' | 'edit' | 'delete' | 'export' | 'leaderboard' | 'statistics';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`attendance.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const FeeFeatureGate: React.FC<{
  action: 'view' | 'collect' | 'waive' | 'refund' | 'reports' | 'setup_structure' | 'manage_scholarships';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`fees.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const UserFeatureGate: React.FC<{
  action: 'view' | 'create' | 'edit' | 'delete' | 'assign_roles';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`users.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const SystemFeatureGate: React.FC<{
  action: 'settings' | 'analytics' | 'reports' | 'logs';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`system.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const PartnershipFeatureGate: React.FC<{
  action: 'view' | 'create' | 'edit' | 'delete' | 'analytics';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`partnerships.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const PlacementFeatureGate: React.FC<{
  action: 'view' | 'create' | 'edit' | 'delete' | 'analytics';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`placements.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const HolidayFeatureGate: React.FC<{
  action: 'view' | 'create' | 'edit' | 'delete' | 'global_manage';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`holidays.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const StudentFeatureGate: React.FC<{
  action: 'progress' | 'assignments' | 'programs' | 'attendance_view';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback }) => (
  <FeatureGate feature={`student.${action}`} fallback={fallback}>
    {children}
  </FeatureGate>
);
