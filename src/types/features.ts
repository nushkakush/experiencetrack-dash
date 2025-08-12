import { UserRole } from './auth';

// Define all available features in the application
export type FeatureKey =
  | 'attendance.view'
  | 'attendance.manage'
  | 'cohorts.view'
  | 'cohorts.create'
  | 'cohorts.edit'
  | 'cohorts.delete'
  | 'cohorts.manage'
  | 'cohorts.manage_students'
  | 'cohorts.edit_students'
  | 'cohorts.assign_scholarships'
  | 'cohorts.bulk_upload'
  | 'fees.view'
  | 'fees.manage'
  | 'holidays.view'
  | 'holidays.manage'
  | 'partnerships.view'
  | 'partnerships.manage'
  | 'placements.view'
  | 'placements.manage'
  | 'students.view'
  | 'students.manage'
  | 'system.admin'
  | 'users.view'
  | 'users.manage';

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
