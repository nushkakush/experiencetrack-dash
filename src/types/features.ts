import { UserRole } from './auth';

// Define all available features in the application
export type FeatureKey =
  // Attendance features
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.edit'
  | 'attendance.delete'
  | 'attendance.export'
  | 'attendance.leaderboard'
  | 'attendance.statistics'
  | 'attendance.manage'

  // Cohort features
  | 'cohorts.view'
  | 'cohorts.create'
  | 'cohorts.edit'
  | 'cohorts.delete'
  | 'cohorts.manage'
  | 'cohorts.manage_students'
  | 'cohorts.edit_students'
  | 'cohorts.assign_scholarships'
  | 'cohorts.bulk_upload'
  | 'cohorts.set_active_epic'

  // Fee features
  | 'fees.view'
  | 'fees.collect'
  | 'fees.waive'
  | 'fees.refund'
  | 'fees.reports'
  | 'fees.setup_structure'
  | 'fees.manage_scholarships'
  | 'fees.bulk_management'
  | 'fees.manage'

  // User features
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.assign_roles'
  | 'users.manage'

  // System features
  | 'system.settings'
  | 'system.analytics'
  | 'system.reports'
  | 'system.logs'
  | 'system.admin'

  // Partnership features
  | 'partnerships.view'
  | 'partnerships.create'
  | 'partnerships.edit'
  | 'partnerships.delete'
  | 'partnerships.analytics'
  | 'partnerships.manage'

  // Placement features
  | 'placements.view'
  | 'placements.create'
  | 'placements.edit'
  | 'placements.delete'
  | 'placements.analytics'
  | 'placements.manage'

  // Holiday features
  | 'holidays.view'
  | 'holidays.create'
  | 'holidays.edit'
  | 'holidays.delete'
  | 'holidays.global_manage'
  | 'holidays.manage'

  // Equipment features
  | 'equipment.view'
  | 'equipment.create'
  | 'equipment.edit'
  | 'equipment.delete'
  | 'equipment.borrow'
  | 'equipment.return'
  | 'equipment.manage_blacklist'
  | 'equipment.reports'
  | 'equipment.inventory'
  | 'equipment.borrowing_history'
  | 'equipment.manage'

  // Student features
  | 'student.progress'
  | 'student.assignments'
  | 'student.programs'
  | 'student.attendance_view'
  | 'student.avatar_upload'
  | 'students.view'
  | 'students.manage'
  | 'student-payment-dashboard'

  // Program management features
  | 'programs.manage'

  // Application features
  | 'applications.view'
  | 'applications.create'
  | 'applications.edit'
  | 'applications.delete'
  | 'applications.manage'
  | 'applications.review'
  | 'applications.approve'
  | 'applications.reject'
  | 'applications.setup_configuration'
  | 'applications.manage_forms'
  | 'applications.review_applications';

// Feature metadata for better organization and documentation
export interface FeatureMetadata {
  key: FeatureKey;
  name: string;
  description: string;
  category:
    | 'cohorts'
    | 'attendance'
    | 'fees'
    | 'users'
    | 'system'
    | 'partnerships'
    | 'placements'
    | 'holidays'
    | 'equipment'
    | 'student'
    | 'programs'
    | 'applications';
  requiresAuthentication: boolean;
  deprecated?: boolean;
  experimental?: boolean;
}

// Permission configuration for each role
export interface RolePermissions {
  role: UserRole;
  features: FeatureKey[];
  inheritedFrom?: UserRole[]; // For role inheritance
}

// Feature permission check result
export interface PermissionCheck {
  hasPermission: boolean;
  feature: FeatureKey;
  role: UserRole;
  reason?: string;
}

// Feature group for easier management
export interface FeatureGroup {
  name: string;
  description: string;
  features: FeatureKey[];
  category: FeatureMetadata['category'];
}
