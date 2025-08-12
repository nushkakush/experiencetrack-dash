import { FeatureMetadata } from '@/types/features';

type CohortFeatureKey = 
  | 'cohorts.view'
  | 'cohorts.create'
  | 'cohorts.edit'
  | 'cohorts.delete'
  | 'cohorts.manage'
  | 'cohorts.manage_students'
  | 'cohorts.edit_students'
  | 'cohorts.assign_scholarships'
  | 'cohorts.bulk_upload';

export const COHORT_FEATURES: Record<CohortFeatureKey, FeatureMetadata> = {
  'cohorts.view': {
    key: 'cohorts.view',
    name: 'View Cohorts',
    description: 'View cohort information and details',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.create': {
    key: 'cohorts.create',
    name: 'Create Cohorts',
    description: 'Create new cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.edit': {
    key: 'cohorts.edit',
    name: 'Edit Cohorts',
    description: 'Edit existing cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.delete': {
    key: 'cohorts.delete',
    name: 'Delete Cohorts',
    description: 'Delete cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.manage': {
    key: 'cohorts.manage',
    name: 'Manage Cohorts',
    description: 'Create, edit, and delete cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.manage_students': {
    key: 'cohorts.manage_students',
    name: 'Manage Students',
    description: 'Add, remove, and manage students in cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.edit_students': {
    key: 'cohorts.edit_students',
    name: 'Edit Student Data',
    description: 'Edit student information (name, email, phone)',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.assign_scholarships': {
    key: 'cohorts.assign_scholarships',
    name: 'Assign Scholarships',
    description: 'Assign scholarships to individual students',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.bulk_upload': {
    key: 'cohorts.bulk_upload',
    name: 'Bulk Upload Students',
    description: 'Upload multiple students via CSV file',
    category: 'cohorts',
    requiresAuthentication: true,
  },
} as const;

export const COHORT_FEATURE_KEYS = Object.keys(COHORT_FEATURES) as CohortFeatureKey[];
