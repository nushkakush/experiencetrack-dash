import { FeatureKey, FeatureMetadata, RolePermissions, FeatureGroup } from '@/types/features';
import { UserRole } from '@/types/auth';

// Import all domain-specific features
import { COHORT_FEATURES } from './cohorts';
import { ATTENDANCE_FEATURES } from './attendance';
import { FEE_FEATURES } from './fees';
import { USER_FEATURES } from './users';
import { SYSTEM_FEATURES } from './system';
import { PARTNERSHIP_FEATURES } from './partnerships';
import { PLACEMENT_FEATURES } from './placements';
import { HOLIDAY_FEATURES } from './holidays';
import { STUDENT_FEATURES } from './student';

// Combine all features into a single metadata object
export const FEATURE_METADATA: Record<FeatureKey, FeatureMetadata> = {
  ...COHORT_FEATURES,
  ...ATTENDANCE_FEATURES,
  ...FEE_FEATURES,
  ...USER_FEATURES,
  ...SYSTEM_FEATURES,
  ...PARTNERSHIP_FEATURES,
  ...PLACEMENT_FEATURES,
  ...HOLIDAY_FEATURES,
  ...STUDENT_FEATURES,
};

// Role-based permissions configuration
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'student',
    features: [
      'student.progress',
      'student.assignments',
      'student.programs',
      'student.attendance_view',
      'student.avatar_upload', // Can view avatars but not upload
    ],
  },
  {
    role: 'program_manager',
    features: [
      // Cohort Management (view only)
      'cohorts.view',
      
      // Attendance Management
      'attendance.view',
      'attendance.mark',
      'attendance.edit',
      'attendance.export',
      'attendance.leaderboard',
      'attendance.statistics',
      
      // Holidays
      'holidays.view',
      'holidays.create',
      'holidays.edit',
      'holidays.delete',
      
      // Student Features (for viewing)
      'student.progress',
      'student.assignments',
      'student.programs',
      'student.avatar_upload', // Can view avatars but not upload
    ],
  },
  {
    role: 'fee_collector',
    features: [
      // Cohort Management (view only)
      'cohorts.view',
      
      // Fee Management (cannot setup - only super_admin can setup)
      'fees.view',
      'fees.collect',
      'fees.waive',
      'fees.refund',
      'fees.reports',
      'fees.manage_scholarships',
      
      // User Management (view only for fee purposes)
      'users.view',
      
      // Student Features (for viewing)
      'student.avatar_upload', // Can view avatars but not upload
    ],
  },
  {
    role: 'partnerships_head',
    features: [
      // Partnerships
      'partnerships.view',
      'partnerships.create',
      'partnerships.edit',
      'partnerships.delete',
      'partnerships.analytics',
      
      // System (limited)
      'system.analytics',
      'system.reports',
    ],
  },
  {
    role: 'placement_coordinator',
    features: [
      // Placements
      'placements.view',
      'placements.create',
      'placements.edit',
      'placements.delete',
      'placements.analytics',
      
      // System (limited)
      'system.analytics',
      'system.reports',
    ],
  },
  {
    role: 'super_admin',
    features: Object.keys(FEATURE_METADATA) as FeatureKey[], // All features
  },
];

// Feature groups for better organization
export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    name: 'Cohort Management',
    description: 'Manage cohorts and student enrollment',
    category: 'cohorts',
    features: Object.keys(COHORT_FEATURES) as FeatureKey[],
  },
  {
    name: 'Attendance Management',
    description: 'Track and manage student attendance',
    category: 'attendance',
    features: Object.keys(ATTENDANCE_FEATURES) as FeatureKey[],
  },
  {
    name: 'Fee Management',
    description: 'Handle fee collection and management',
    category: 'fees',
    features: Object.keys(FEE_FEATURES) as FeatureKey[],
  },
  {
    name: 'User Management',
    description: 'Manage user accounts and roles',
    category: 'users',
    features: Object.keys(USER_FEATURES) as FeatureKey[],
  },
  {
    name: 'System Administration',
    description: 'System-wide settings and analytics',
    category: 'system',
    features: Object.keys(SYSTEM_FEATURES) as FeatureKey[],
  },
  {
    name: 'Partnerships',
    description: 'Manage business partnerships',
    category: 'partnerships',
    features: Object.keys(PARTNERSHIP_FEATURES) as FeatureKey[],
  },
  {
    name: 'Placements',
    description: 'Manage student placements',
    category: 'placements',
    features: Object.keys(PLACEMENT_FEATURES) as FeatureKey[],
  },
  {
    name: 'Holidays',
    description: 'Manage holidays and breaks',
    category: 'holidays',
    features: Object.keys(HOLIDAY_FEATURES) as FeatureKey[],
  },
  {
    name: 'Student Features',
    description: 'Student-specific functionality',
    category: 'student',
    features: Object.keys(STUDENT_FEATURES) as FeatureKey[],
  },
];

// Export individual domain features for specific use cases
export {
  COHORT_FEATURES,
  ATTENDANCE_FEATURES,
  FEE_FEATURES,
  USER_FEATURES,
  SYSTEM_FEATURES,
  PARTNERSHIP_FEATURES,
  PLACEMENT_FEATURES,
  HOLIDAY_FEATURES,
  STUDENT_FEATURES,
};
