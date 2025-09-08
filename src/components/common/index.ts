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
  ProgramFeatureGate,
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
export { AccessDenied } from './AccessDenied';

// SEO components
export { SEO } from './SEO';
export { PageSEO } from './seo-config';

// Bulk upload components
export * from './bulk-upload';

// Statistics components
export * from './statistics';
