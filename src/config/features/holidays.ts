import { FeatureKey, FeatureMetadata } from '@/types/features';

export const HOLIDAY_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'holidays.view': {
    key: 'holidays.view',
    name: 'View Holidays',
    description: 'View holiday information',
    category: 'holidays',
    requiresAuthentication: true,
  },
  'holidays.create': {
    key: 'holidays.create',
    name: 'Create Holidays',
    description: 'Create new holidays',
    category: 'holidays',
    requiresAuthentication: true,
  },
  'holidays.edit': {
    key: 'holidays.edit',
    name: 'Edit Holidays',
    description: 'Modify holiday information',
    category: 'holidays',
    requiresAuthentication: true,
  },
  'holidays.delete': {
    key: 'holidays.delete',
    name: 'Delete Holidays',
    description: 'Delete holidays',
    category: 'holidays',
    requiresAuthentication: true,
  },
  'holidays.global_manage': {
    key: 'holidays.global_manage',
    name: 'Global Holiday Management',
    description: 'Manage global holidays across all cohorts',
    category: 'holidays',
    requiresAuthentication: true,
  },
} as const;

export const HOLIDAY_FEATURE_KEYS = Object.keys(HOLIDAY_FEATURES) as FeatureKey[];
