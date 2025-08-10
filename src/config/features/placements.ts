import { FeatureKey, FeatureMetadata } from '@/types/features';

export const PLACEMENT_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'placements.view': {
    key: 'placements.view',
    name: 'View Placements',
    description: 'View placement information',
    category: 'placements',
    requiresAuthentication: true,
  },
  'placements.create': {
    key: 'placements.create',
    name: 'Create Placements',
    description: 'Create new placements',
    category: 'placements',
    requiresAuthentication: true,
  },
  'placements.edit': {
    key: 'placements.edit',
    name: 'Edit Placements',
    description: 'Modify placement information',
    category: 'placements',
    requiresAuthentication: true,
  },
  'placements.delete': {
    key: 'placements.delete',
    name: 'Delete Placements',
    description: 'Delete placements',
    category: 'placements',
    requiresAuthentication: true,
  },
  'placements.analytics': {
    key: 'placements.analytics',
    name: 'Placement Analytics',
    description: 'View placement analytics',
    category: 'placements',
    requiresAuthentication: true,
  },
} as const;

export const PLACEMENT_FEATURE_KEYS = Object.keys(PLACEMENT_FEATURES) as FeatureKey[];
