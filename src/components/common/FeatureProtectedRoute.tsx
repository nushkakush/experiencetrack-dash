import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { UserRole } from '@/types/auth';
import { FeatureKey } from '@/types/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Home } from 'lucide-react';

interface FeatureProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredFeatures?: FeatureKey[];
  requireAllFeatures?: boolean;
  redirectTo?: string;
  showAccessDenied?: boolean;
  accessDeniedMessage?: string;
  accessDeniedDescription?: string;
}

/**
 * Enhanced ProtectedRoute that supports both role-based and feature-based access control
 * 
 * @example
 * // Role-based protection
 * <FeatureProtectedRoute allowedRoles={['super_admin', 'program_manager']}>
 *   <AdminPanel />
 * </FeatureProtectedRoute>
 * 
 * @example
 * // Feature-based protection
 * <FeatureProtectedRoute requiredFeatures={['cohorts.create', 'cohorts.edit']}>
 *   <CohortManager />
 * </FeatureProtectedRoute>
 * 
 * @example
 * // Combined protection
 * <FeatureProtectedRoute 
 *   allowedRoles={['super_admin']}
 *   requiredFeatures={['system.settings']}
 *   requireAllFeatures={true}
 * >
 *   <SystemSettings />
 * </FeatureProtectedRoute>
 */
export const FeatureProtectedRoute: React.FC<FeatureProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredFeatures = [],
  requireAllFeatures = true,
  redirectTo = '/dashboard',
  showAccessDenied = true,
  accessDeniedMessage = 'Access Denied',
  accessDeniedDescription = "You don't have permission to access this page.",
}) => {
  const { user, profile, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useFeaturePermissions();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if profile is loaded
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  const hasRoleAccess = !allowedRoles || allowedRoles.includes(profile.role);

  // Check feature-based access
  const hasFeatureAccess = requiredFeatures.length === 0 || 
    (requireAllFeatures 
      ? hasAllPermissions(requiredFeatures)
      : hasAnyPermission(requiredFeatures)
    );

  // Determine if access is granted
  const hasAccess = hasRoleAccess && hasFeatureAccess;

  // If access is denied and we should show access denied page
  if (!hasAccess && showAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">{accessDeniedMessage}</CardTitle>
            <CardDescription>{accessDeniedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show specific access issues */}
            <div className="space-y-2">
              {!hasRoleAccess && allowedRoles && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Required roles: {allowedRoles.join(', ')}</span>
                </div>
              )}
              
              {!hasFeatureAccess && requiredFeatures.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <span>Required features: {requiredFeatures.join(', ')}</span>
                    {requireAllFeatures && (
                      <div className="text-xs text-muted-foreground mt-1">
                        All features are required
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current user info */}
            <div className="rounded-lg bg-muted p-3">
              <div className="text-sm">
                <div className="font-medium">Current User</div>
                <div className="text-muted-foreground">
                  {profile.first_name} {profile.last_name} ({profile.role})
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.location.href = redirectTo}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If access is denied and we should redirect
  if (!hasAccess && !showAccessDenied) {
    return <Navigate to={redirectTo} replace />;
  }

  // Access granted
  return <>{children}</>;
};

// Convenience components for common protection patterns
export const AdminProtectedRoute: React.FC<{
  children: React.ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, showAccessDenied = true }) => (
  <FeatureProtectedRoute 
    allowedRoles={['super_admin', 'program_manager']}
    showAccessDenied={showAccessDenied}
    accessDeniedMessage="Admin Access Required"
    accessDeniedDescription="This page requires administrative privileges."
  >
    {children}
  </FeatureProtectedRoute>
);

export const SuperAdminProtectedRoute: React.FC<{
  children: React.ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, showAccessDenied = true }) => (
  <FeatureProtectedRoute 
    allowedRoles={['super_admin']}
    showAccessDenied={showAccessDenied}
    accessDeniedMessage="Super Admin Access Required"
    accessDeniedDescription="This page requires super administrator privileges."
  >
    {children}
  </FeatureProtectedRoute>
);

export const CohortManagementProtectedRoute: React.FC<{
  children: React.ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, showAccessDenied = true }) => (
  <FeatureProtectedRoute 
    requiredFeatures={['cohorts.view']}
    showAccessDenied={showAccessDenied}
    accessDeniedMessage="Cohort Access Required"
    accessDeniedDescription="You need permission to view cohorts to access this page."
  >
    {children}
  </FeatureProtectedRoute>
);

export const FeeManagementProtectedRoute: React.FC<{
  children: React.ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, showAccessDenied = true }) => (
  <FeatureProtectedRoute 
    requiredFeatures={['fees.view']}
    showAccessDenied={showAccessDenied}
    accessDeniedMessage="Fee Management Access Required"
    accessDeniedDescription="You need permission to view fees to access this page."
  >
    {children}
  </FeatureProtectedRoute>
);

export const AttendanceManagementProtectedRoute: React.FC<{
  children: React.ReactNode;
  showAccessDenied?: boolean;
}> = ({ children, showAccessDenied = true }) => (
  <FeatureProtectedRoute 
    requiredFeatures={['attendance.view']}
    showAccessDenied={showAccessDenied}
    accessDeniedMessage="Attendance Access Required"
    accessDeniedDescription="You need permission to view attendance to access this page."
  >
    {children}
  </FeatureProtectedRoute>
);
