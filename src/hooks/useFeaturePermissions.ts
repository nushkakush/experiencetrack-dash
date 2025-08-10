import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/types/auth';
import { FeatureKey, PermissionCheck } from '@/types/features';
import { ROLE_PERMISSIONS, FEATURE_METADATA } from '@/config/featurePermissions';

interface UseFeaturePermissionsReturn {
  // Core permission checking
  hasPermission: (feature: FeatureKey) => boolean;
  hasAnyPermission: (features: FeatureKey[]) => boolean;
  hasAllPermissions: (features: FeatureKey[]) => boolean;
  
  // Batch permission checking
  checkPermissions: (features: FeatureKey[]) => PermissionCheck[];
  
  // Role-based helpers
  canManageCohorts: boolean;
  canManageAttendance: boolean;
  canManageFees: boolean;
  canManageUsers: boolean;
  canAccessSystem: boolean;
  canManagePartnerships: boolean;
  canManagePlacements: boolean;
  canManageHolidays: boolean;
  
  // Feature-specific helpers
  canViewCohorts: boolean;
  canCreateCohorts: boolean;
  canEditCohorts: boolean;
  canDeleteCohorts: boolean;
  canBulkUploadStudents: boolean;
  
  canViewAttendance: boolean;
  canMarkAttendance: boolean;
  canEditAttendance: boolean;
  canExportAttendance: boolean;
  canViewLeaderboard: boolean;
  canViewStatistics: boolean;
  
  canViewFees: boolean;
  canCollectFees: boolean;
  canWaiveFees: boolean;
  canRefundFees: boolean;
  canGenerateFeeReports: boolean;
  canSetupFeeStructure: boolean;
  canManageScholarships: boolean;
  
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canAssignRoles: boolean;
  
  canAccessSettings: boolean;
  canViewAnalytics: boolean;
  canGenerateSystemReports: boolean;
  canViewLogs: boolean;
  
  canViewPartnerships: boolean;
  canCreatePartnerships: boolean;
  canEditPartnerships: boolean;
  canDeletePartnerships: boolean;
  canViewPartnershipAnalytics: boolean;
  
  canViewPlacements: boolean;
  canCreatePlacements: boolean;
  canEditPlacements: boolean;
  canDeletePlacements: boolean;
  canViewPlacementAnalytics: boolean;
  
  canViewHolidays: boolean;
  canCreateHolidays: boolean;
  canEditHolidays: boolean;
  canDeleteHolidays: boolean;
  canManageGlobalHolidays: boolean;
  
  // Student-specific permissions
  canViewProgress: boolean;
  canViewAssignments: boolean;
  canViewPrograms: boolean;
  canViewOwnAttendance: boolean;
  
  // Utility functions
  getRolePermissions: () => FeatureKey[];
  getFeatureMetadata: (feature: FeatureKey) => typeof FEATURE_METADATA[FeatureKey] | null;
  isFeatureDeprecated: (feature: FeatureKey) => boolean;
  isFeatureExperimental: (feature: FeatureKey) => boolean;
}

/**
 * Custom hook for managing feature permissions based on user roles
 * Provides a comprehensive set of permission checking utilities
 */
export const useFeaturePermissions = (): UseFeaturePermissionsReturn => {
  const { profile } = useAuth();
  
  // Get user role, default to student if no profile
  const userRole: UserRole = profile?.role || 'student';
  
  // Memoize role permissions for performance
  const rolePermissions = useMemo(() => {
    const roleConfig = ROLE_PERMISSIONS.find(rp => rp.role === userRole);
    return roleConfig?.features || [];
  }, [userRole]);
  
  // Create a Set for O(1) permission lookups
  const permissionSet = useMemo(() => new Set(rolePermissions), [rolePermissions]);
  
  // Core permission checking functions
  const hasPermission = (feature: FeatureKey): boolean => {
    return permissionSet.has(feature);
  };
  
  const hasAnyPermission = (features: FeatureKey[]): boolean => {
    return features.some(feature => permissionSet.has(feature));
  };
  
  const hasAllPermissions = (features: FeatureKey[]): boolean => {
    return features.every(feature => permissionSet.has(feature));
  };
  
  const checkPermissions = (features: FeatureKey[]): PermissionCheck[] => {
    return features.map(feature => ({
      hasPermission: permissionSet.has(feature),
      feature,
      role: userRole,
      reason: permissionSet.has(feature) ? undefined : `User with role '${userRole}' does not have permission for '${feature}'`
    }));
  };
  
  // Role-based permission helpers
  const canManageCohorts = hasAnyPermission([
    'cohorts.create',
    'cohorts.edit',
    'cohorts.delete',
    'cohorts.manage_students',
    'cohorts.bulk_upload'
  ]);
  
  const canManageAttendance = hasAnyPermission([
    'attendance.mark',
    'attendance.edit',
    'attendance.delete',
    'attendance.export'
  ]);
  
  const canManageFees = hasAnyPermission([
    'fees.collect',
    'fees.waive',
    'fees.refund',
    'fees.setup_structure',
    'fees.manage_scholarships'
  ]);
  
  const canManageUsers = hasAnyPermission([
    'users.create',
    'users.edit',
    'users.delete',
    'users.assign_roles'
  ]);
  
  const canAccessSystem = hasAnyPermission([
    'system.settings',
    'system.analytics',
    'system.reports',
    'system.logs'
  ]);
  
  const canManagePartnerships = hasAnyPermission([
    'partnerships.create',
    'partnerships.edit',
    'partnerships.delete'
  ]);
  
  const canManagePlacements = hasAnyPermission([
    'placements.create',
    'placements.edit',
    'placements.delete'
  ]);
  
  const canManageHolidays = hasAnyPermission([
    'holidays.create',
    'holidays.edit',
    'holidays.delete',
    'holidays.global_manage'
  ]);
  
  // Feature-specific permission helpers
  const canViewCohorts = hasPermission('cohorts.view');
  const canCreateCohorts = hasPermission('cohorts.create');
  const canEditCohorts = hasPermission('cohorts.edit');
  const canDeleteCohorts = hasPermission('cohorts.delete');
  const canBulkUploadStudents = hasPermission('cohorts.bulk_upload');
  
  const canViewAttendance = hasPermission('attendance.view');
  const canMarkAttendance = hasPermission('attendance.mark');
  const canEditAttendance = hasPermission('attendance.edit');
  const canExportAttendance = hasPermission('attendance.export');
  const canViewLeaderboard = hasPermission('attendance.leaderboard');
  const canViewStatistics = hasPermission('attendance.statistics');
  
  const canViewFees = hasPermission('fees.view');
  const canCollectFees = hasPermission('fees.collect');
  const canWaiveFees = hasPermission('fees.waive');
  const canRefundFees = hasPermission('fees.refund');
  const canGenerateFeeReports = hasPermission('fees.reports');
  const canSetupFeeStructure = hasPermission('fees.setup_structure');
  const canManageScholarships = hasPermission('fees.manage_scholarships');
  
  const canViewUsers = hasPermission('users.view');
  const canCreateUsers = hasPermission('users.create');
  const canEditUsers = hasPermission('users.edit');
  const canDeleteUsers = hasPermission('users.delete');
  const canAssignRoles = hasPermission('users.assign_roles');
  
  const canAccessSettings = hasPermission('system.settings');
  const canViewAnalytics = hasPermission('system.analytics');
  const canGenerateSystemReports = hasPermission('system.reports');
  const canViewLogs = hasPermission('system.logs');
  
  const canViewPartnerships = hasPermission('partnerships.view');
  const canCreatePartnerships = hasPermission('partnerships.create');
  const canEditPartnerships = hasPermission('partnerships.edit');
  const canDeletePartnerships = hasPermission('partnerships.delete');
  const canViewPartnershipAnalytics = hasPermission('partnerships.analytics');
  
  const canViewPlacements = hasPermission('placements.view');
  const canCreatePlacements = hasPermission('placements.create');
  const canEditPlacements = hasPermission('placements.edit');
  const canDeletePlacements = hasPermission('placements.delete');
  const canViewPlacementAnalytics = hasPermission('placements.analytics');
  
  const canViewHolidays = hasPermission('holidays.view');
  const canCreateHolidays = hasPermission('holidays.create');
  const canEditHolidays = hasPermission('holidays.edit');
  const canDeleteHolidays = hasPermission('holidays.delete');
  const canManageGlobalHolidays = hasPermission('holidays.global_manage');
  
  const canViewProgress = hasPermission('student.progress');
  const canViewAssignments = hasPermission('student.assignments');
  const canViewPrograms = hasPermission('student.programs');
  const canViewOwnAttendance = hasPermission('student.attendance_view');
  
  // Utility functions
  const getRolePermissions = (): FeatureKey[] => {
    return [...rolePermissions];
  };
  
  const getFeatureMetadata = (feature: FeatureKey) => {
    return FEATURE_METADATA[feature] || null;
  };
  
  const isFeatureDeprecated = (feature: FeatureKey): boolean => {
    return FEATURE_METADATA[feature]?.deprecated || false;
  };
  
  const isFeatureExperimental = (feature: FeatureKey): boolean => {
    return FEATURE_METADATA[feature]?.experimental || false;
  };
  
  return {
    // Core functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissions,
    
    // Role-based helpers
    canManageCohorts,
    canManageAttendance,
    canManageFees,
    canManageUsers,
    canAccessSystem,
    canManagePartnerships,
    canManagePlacements,
    canManageHolidays,
    
    // Feature-specific helpers
    canViewCohorts,
    canCreateCohorts,
    canEditCohorts,
    canDeleteCohorts,
    canBulkUploadStudents,
    
    canViewAttendance,
    canMarkAttendance,
    canEditAttendance,
    canExportAttendance,
    canViewLeaderboard,
    canViewStatistics,
    
    canViewFees,
    canCollectFees,
    canWaiveFees,
    canRefundFees,
    canGenerateFeeReports,
    canSetupFeeStructure,
    canManageScholarships,
    
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canAssignRoles,
    
    canAccessSettings,
    canViewAnalytics,
    canGenerateSystemReports,
    canViewLogs,
    
    canViewPartnerships,
    canCreatePartnerships,
    canEditPartnerships,
    canDeletePartnerships,
    canViewPartnershipAnalytics,
    
    canViewPlacements,
    canCreatePlacements,
    canEditPlacements,
    canDeletePlacements,
    canViewPlacementAnalytics,
    
    canViewHolidays,
    canCreateHolidays,
    canEditHolidays,
    canDeleteHolidays,
    canManageGlobalHolidays,
    
    canViewProgress,
    canViewAssignments,
    canViewPrograms,
    canViewOwnAttendance,
    
    // Utility functions
    getRolePermissions,
    getFeatureMetadata,
    isFeatureDeprecated,
    isFeatureExperimental,
  };
};
