/**
 * Lazy Route Components for Code Splitting
 * Implements route-based code splitting to reduce initial bundle size
 */

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for lazy routes
const RouteLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Error boundary for lazy routes
class LazyRouteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy route loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load page</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for lazy route wrapping
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage?: string
) => {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyRouteErrorBoundary>
      <Suspense fallback={<RouteLoader message={loadingMessage} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyRouteErrorBoundary>
  ));
};

// Lazy-loaded page components
export const LazyDashboardRouter = React.lazy(() => 
  import('@/pages/DashboardRouter').then(module => ({ default: module.default }))
);

export const LazyCohortDetailsPage = React.lazy(() => 
  import('@/pages/CohortDetailsPage').then(module => ({ default: module.default }))
);

export const LazyCohortsPage = React.lazy(() => 
  import('@/pages/CohortsPage').then(module => ({ default: module.default }))
);

export const LazyFeePaymentDashboard = React.lazy(() => 
  import('@/pages/FeePaymentDashboard').then(module => ({ default: module.default }))
);

export const LazyUserManagementPage = React.lazy(() => 
  import('@/pages/user-management/UserManagementPage').then(module => ({ default: module.default }))
);

export const LazyStudentPaymentDetails = React.lazy(() => 
  import('@/pages/StudentPaymentDetails/StudentPaymentDetails').then(module => ({ default: module.default }))
);

export const LazyCohortAttendancePage = React.lazy(() => 
  import('@/pages/CohortAttendancePage').then(module => ({ default: module.default }))
);

export const LazyPublicLeaderboard = React.lazy(() => 
  import('@/pages/PublicLeaderboard').then(module => ({ default: module.default }))
);

// Student dashboard lazy components
export const LazyStudentDashboard = React.lazy(() => 
  import('@/pages/dashboards/student/StudentDashboard').then(module => ({ default: module.default }))
);

export const LazyFeeCollectorDashboard = React.lazy(() => 
  import('@/pages/dashboards/FeeCollectorDashboard').then(module => ({ default: module.default }))
);

export const LazyPartnershipsHeadDashboard = React.lazy(() => 
  import('@/pages/dashboards/PartnershipsHeadDashboard').then(module => ({ default: module.default }))
);

export const LazySuperAdminDashboard = React.lazy(() => 
  import('@/pages/dashboards/SuperAdminDashboard').then(module => ({ default: module.default }))
);

// Feature-specific lazy components
export const LazyBulkFeeManagementExample = React.lazy(() => 
  import('@/pages/BulkFeeManagementExample').then(module => ({ default: module.default }))
);

export const LazyTestLoggingPage = React.lazy(() => 
  import('@/pages/TestLoggingPage').then(module => ({ default: module.default }))
);

export const LazyProfilePage = React.lazy(() => 
  import('@/pages/ProfilePage').then(module => ({ default: module.default }))
);

// Auth pages
export const LazyLoginPage = React.lazy(() => 
  import('@/pages/auth/Login').then(module => ({ default: module.default }))
);

export const LazyResetPasswordPage = React.lazy(() => 
  import('@/pages/auth/ResetPassword').then(module => ({ default: module.default }))
);

export const LazyInvitationPage = React.lazy(() => 
  import('@/pages/InvitationPage').then(module => ({ default: module.default }))
);

export const LazyUserInvitationPage = React.lazy(() => 
  import('@/pages/UserInvitationPage').then(module => ({ default: module.default }))
);

// Lazy wrapper component for route-level code splitting
export const LazyRoute: React.FC<{
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  props?: any;
}> = ({ component: Component, fallback, props = {} }) => (
  <LazyRouteErrorBoundary fallback={fallback}>
    <Suspense fallback={fallback || <RouteLoader />}>
      <Component {...props} />
    </Suspense>
  </LazyRouteErrorBoundary>
);

// Preloading utilities
export const preloadRoute = (routeImport: () => Promise<any>) => {
  // Preload on hover or focus for better UX
  const link = document.createElement('link');
  link.rel = 'prefetch';
  routeImport().catch(() => {}); // Silently fail if preload fails
};

// Route preloading hook
export const useRoutePreloading = () => {
  const preloadOnHover = React.useCallback((routeImport: () => Promise<any>) => {
    return {
      onMouseEnter: () => preloadRoute(routeImport),
      onFocus: () => preloadRoute(routeImport),
    };
  }, []);

  return { preloadOnHover };
};
