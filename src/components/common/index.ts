// Existing common components
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export {
  LoadingSpinner,
  PageLoader,
  InlineLoader,
  ButtonLoader,
} from './LoadingSpinner';
export {
  FeatureGate,
  CohortFeatureGate,
  AttendanceFeatureGate,
  FeeFeatureGate,
  UserFeatureGate,
  SystemFeatureGate,
  PartnershipFeatureGate,
  PlacementFeatureGate,
  HolidayFeatureGate,
  StudentFeatureGate,
} from './FeatureGate';
export {
  FeatureProtectedRoute,
  AdminProtectedRoute,
  SuperAdminProtectedRoute,
  CohortManagementProtectedRoute,
  FeeManagementProtectedRoute,
  AttendanceManagementProtectedRoute,
} from './FeatureProtectedRoute';
export { DashboardAccessControl } from './DashboardAccessControl';
export { FeaturePermissionDebug } from './FeaturePermissionDebug';

// SEO components
export { SEO, PageSEO } from './SEO';

// Bulk upload components
export * from './bulk-upload';

// Statistics components
export * from './statistics';
