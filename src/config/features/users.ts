import { FeatureKey, FeatureMetadata } from '@/types/features';

export const USER_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'users.view': {
    key: 'users.view',
    name: 'View Users',
    description: 'View user profiles and information',
    category: 'users',
    requiresAuthentication: true,
  },
  'users.create': {
    key: 'users.create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'users',
    requiresAuthentication: true,
  },
  'users.edit': {
    key: 'users.edit',
    name: 'Edit Users',
    description: 'Modify user information',
    category: 'users',
    requiresAuthentication: true,
  },
  'users.delete': {
    key: 'users.delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    category: 'users',
    requiresAuthentication: true,
  },
  'users.assign_roles': {
    key: 'users.assign_roles',
    name: 'Assign Roles',
    description: 'Assign roles to users',
    category: 'users',
    requiresAuthentication: true,
  },
} as const;

export const USER_FEATURE_KEYS = Object.keys(USER_FEATURES) as FeatureKey[];
