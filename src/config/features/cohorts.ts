import { FeatureKey, FeatureMetadata } from '@/types/features';

export const COHORT_FEATURES: Record<FeatureKey, FeatureMetadata> = {
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
    description: 'Modify existing cohort information',
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
  'cohorts.manage_students': {
    key: 'cohorts.manage_students',
    name: 'Manage Students',
    description: 'Add, remove, and manage students in cohorts',
    category: 'cohorts',
    requiresAuthentication: true,
  },
  'cohorts.bulk_upload': {
    key: 'cohorts.bulk_upload',
    name: 'Bulk Upload Students',
    description: 'Upload multiple students via CSV',
    category: 'cohorts',
    requiresAuthentication: true,
  },
} as const;

export const COHORT_FEATURE_KEYS = Object.keys(COHORT_FEATURES) as FeatureKey[];
