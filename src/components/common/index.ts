// Existing common components
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export {
  LoadingSpinner,
  PageLoader,
  InlineLoader,
  ButtonLoader,
} from './LoadingSpinner';

// Feature permission components
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
export { FeaturePermissionDebug } from './FeaturePermissionDebug';

// SEO components
export { SEO, PageSEO } from './SEO';

// Bulk upload components
export * from './bulk-upload';

// Statistics components
export * from './statistics';
