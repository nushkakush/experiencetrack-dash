import {
  FeatureKey,
  FeatureMetadata,
  RolePermissions,
  FeatureGroup,
} from '@/types/features';
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
import { EQUIPMENT_FEATURES } from './equipment';
import { PROGRAM_FEATURES } from './programs';
import { EPIC_FEATURES } from './epics';
import { EPIC_LEARNING_PATHS_FEATURES } from './epicLearningPaths';
import { EXPERIENCE_FEATURES } from './experiences';
import { APPLICATION_FEATURES } from './applications';

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
  ...EQUIPMENT_FEATURES,
  ...PROGRAM_FEATURES,
  ...EPIC_FEATURES,
  ...EPIC_LEARNING_PATHS_FEATURES,
  ...EXPERIENCE_FEATURES,
  ...APPLICATION_FEATURES,
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
      'student-payment-dashboard', // Enable fee payment dashboard for students
    ],
  },
  {
    role: 'program_manager',
    features: [
      // Cohort Management (view only - no edit/delete access)
      'cohorts.view',
      'cohorts.set_active_epic', // Allow setting active epic for attendance management

      // Attendance Management (full access)
      'attendance.view',
      'attendance.mark',
      'attendance.edit',
      'attendance.export',
      'attendance.leaderboard',
      'attendance.statistics',

      // Program Management (full access)
      'programs.manage',

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

      // Fee Management (full access except setup - only super_admin can setup)
      'fees.view',
      'fees.collect',
      'fees.waive',
      'fees.refund',
      'fees.reports',
      'fees.manage_scholarships',
      'fees.bulk_management',

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
    role: 'equipment_manager',
    features: [
      // Cohort Management (view only - no edit/delete access)
      'cohorts.view',
      'cohorts.set_active_epic', // Allow setting active epic for equipment management

      // Equipment Management (full access)
      'equipment.view',
      'equipment.create',
      'equipment.edit',
      'equipment.delete',
      'equipment.borrow',
      'equipment.return',
      'equipment.manage_blacklist',
      'equipment.reports',
      'equipment.inventory',
      'equipment.borrowing_history',
      'equipment.manage',

      // Student Features (for viewing)
      'student.progress',
      'student.assignments',
      'student.programs',
      'student.avatar_upload', // Can view avatars but not upload
    ],
  },
  {
    role: 'mentor_manager',
    features: [
      // Cohort Management (view only)
      'cohorts.view',

      // Student Features (for viewing)
      'student.progress',
      'student.assignments',
      'student.programs',
      'student.avatar_upload', // Can view avatars but not upload

      // System (limited)
      'system.analytics',
      'system.reports',
    ],
  },
  {
    role: 'experience_designer',
    features: [
      // Epic Management (full access)
      'epics.view',
      'epics.create',
      'epics.edit',
      'epics.delete',
      'epics.manage',

      // Epic Learning Paths Management (full access)
      'epic-learning-paths.view',
      'epic-learning-paths.create',
      'epic-learning-paths.edit',
      'epic-learning-paths.delete',
      'epic-learning-paths.manage',

      // Experience Management (full access)
      'experiences.view',
      'experiences.create',
      'experiences.edit',
      'experiences.delete',
      'experiences.manage',

      // Basic system access
      'system.analytics',
      'system.reports',
    ],
  },
  {
    role: 'applications_manager',
    features: [
      // Cohort Management (view only)
      'cohorts.view',

      // Applications Management (no setup permission)
      'applications.manage',
      'applications.view',
      'applications.create',
      'applications.edit',
      'applications.delete',
      'applications.manage_forms',
      'applications.review_applications',
    ],
  },
  {
    role: 'application_reviewer',
    features: [
      // Cohort Management (view only)
      'cohorts.view',

      // Applications Review
      'applications.view',
      'applications.review',
      'applications.approve',
      'applications.reject',
    ],
  },
  {
    role: 'litmus_test_reviewer',
    features: [
      // Cohort Management (view only)
      'cohorts.view',

      // LITMUS Test Review
      'litmus_tests.view',
      'litmus_tests.review',
      'litmus_tests.manage',
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
  {
    name: 'Equipment Management',
    description: 'Manage equipment inventory and borrowing',
    category: 'equipment',
    features: Object.keys(EQUIPMENT_FEATURES) as FeatureKey[],
  },
  {
    name: 'Program Management',
    description: 'Manage day-to-day program activities and skill development',
    category: 'programs',
    features: Object.keys(PROGRAM_FEATURES) as FeatureKey[],
  },
  {
    name: 'Epic Management',
    description: 'Manage learning epics and educational content',
    category: 'epics',
    features: Object.keys(EPIC_FEATURES) as FeatureKey[],
  },
  {
    name: 'Epic Learning Paths',
    description:
      'Create and manage structured learning paths with multiple epics',
    category: 'epic-learning-paths',
    features: Object.keys(EPIC_LEARNING_PATHS_FEATURES) as FeatureKey[],
  },
  {
    name: 'Experience Management',
    description:
      'Design and manage comprehensive learning experiences with assessment',
    category: 'experiences',
    features: Object.keys(EXPERIENCE_FEATURES) as FeatureKey[],
  },
  {
    name: 'Application Management',
    description: 'Manage student applications and admissions process',
    category: 'applications',
    features: Object.keys(APPLICATION_FEATURES) as FeatureKey[],
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
  EQUIPMENT_FEATURES,
  EPIC_FEATURES,
  EPIC_LEARNING_PATHS_FEATURES,
  EXPERIENCE_FEATURES,
  APPLICATION_FEATURES,
};
