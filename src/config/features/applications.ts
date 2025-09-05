import { FeatureKey, FeatureMetadata } from '@/types/features';

// Application management features
export const APPLICATION_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'applications.view': {
    key: 'applications.view',
    name: 'View Applications',
    description: 'View application submissions and details',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.create': {
    key: 'applications.create',
    name: 'Create Applications',
    description: 'Create new application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.edit': {
    key: 'applications.edit',
    name: 'Edit Applications',
    description: 'Edit existing application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.delete': {
    key: 'applications.delete',
    name: 'Delete Applications',
    description: 'Delete application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.manage': {
    key: 'applications.manage',
    name: 'Manage Applications',
    description: 'Full management access to applications',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.review': {
    key: 'applications.review',
    name: 'Review Applications',
    description: 'Review application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.approve': {
    key: 'applications.approve',
    name: 'Approve Applications',
    description: 'Approve application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.reject': {
    key: 'applications.reject',
    name: 'Reject Applications',
    description: 'Reject application submissions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.setup_configuration': {
    key: 'applications.setup_configuration',
    name: 'Setup Application Configuration',
    description: 'Configure application forms and fees for cohorts',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.manage_forms': {
    key: 'applications.manage_forms',
    name: 'Manage Application Forms',
    description: 'Create and edit application form questions',
    category: 'applications',
    requiresAuthentication: true,
  },
  'applications.review_applications': {
    key: 'applications.review_applications',
    name: 'Review Applications',
    description: 'Review and approve/reject student applications',
    category: 'applications',
    requiresAuthentication: true,
  },
};
