import { UserRole } from './auth';

// Define all available features in the application
export type FeatureKey = 
  // Cohort Management
  | 'cohorts.view'
  | 'cohorts.create'
  | 'cohorts.edit'
  | 'cohorts.delete'
  | 'cohorts.manage_students'
  | 'cohorts.edit_students'
  | 'cohorts.bulk_upload'
  
  // Attendance Management
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.edit'
  | 'attendance.delete'
  | 'attendance.export'
  | 'attendance.leaderboard'
  | 'attendance.statistics'
  
  // Fee Management
  | 'fees.view'
  | 'fees.collect'
  | 'fees.waive'
  | 'fees.refund'
  | 'fees.reports'
  | 'fees.setup_structure'
  | 'fees.manage_scholarships'
  
  // User Management
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.assign_roles'
  
  // System Administration
  | 'system.settings'
  | 'system.analytics'
  | 'system.reports'
  | 'system.logs'
  
  // Partnerships
  | 'partnerships.view'
  | 'partnerships.create'
  | 'partnerships.edit'
  | 'partnerships.delete'
  | 'partnerships.analytics'
  
  // Placements
  | 'placements.view'
  | 'placements.create'
  | 'placements.edit'
  | 'placements.delete'
  | 'placements.analytics'
  
  // Holidays
  | 'holidays.view'
  | 'holidays.create'
  | 'holidays.edit'
  | 'holidays.delete'
  | 'holidays.global_manage'
  
  // Student Features
  | 'student.progress'
  | 'student.assignments'
  | 'student.programs'
  | 'student.attendance_view';

// Feature metadata for better organization and documentation
export interface FeatureMetadata {
  key: FeatureKey;
  name: string;
  description: string;
  category: 'cohorts' | 'attendance' | 'fees' | 'users' | 'system' | 'partnerships' | 'placements' | 'holidays' | 'student';
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
