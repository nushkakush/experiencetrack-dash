import { FeatureKey, FeatureMetadata } from '@/types/features';

export const PARTNERSHIP_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'partnerships.view': {
    key: 'partnerships.view',
    name: 'View Partnerships',
    description: 'View partnership information',
    category: 'partnerships',
    requiresAuthentication: true,
  },
  'partnerships.create': {
    key: 'partnerships.create',
    name: 'Create Partnerships',
    description: 'Create new partnerships',
    category: 'partnerships',
    requiresAuthentication: true,
  },
  'partnerships.edit': {
    key: 'partnerships.edit',
    name: 'Edit Partnerships',
    description: 'Modify partnership information',
    category: 'partnerships',
    requiresAuthentication: true,
  },
  'partnerships.delete': {
    key: 'partnerships.delete',
    name: 'Delete Partnerships',
    description: 'Delete partnerships',
    category: 'partnerships',
    requiresAuthentication: true,
  },
  'partnerships.analytics': {
    key: 'partnerships.analytics',
    name: 'Partnership Analytics',
    description: 'View partnership analytics',
    category: 'partnerships',
    requiresAuthentication: true,
  },
} as const;

export const PARTNERSHIP_FEATURE_KEYS = Object.keys(PARTNERSHIP_FEATURES) as FeatureKey[];
