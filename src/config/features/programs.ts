import type { FeatureKey, FeatureMetadata } from '@/types/features';

// Define only the programs-specific features
export const PROGRAM_FEATURES = {
  'programs.manage': {
    key: 'programs.manage' as FeatureKey,
    name: 'Program Management',
    description: 'Manage day-to-day program activities and skill development',
    category: 'programs' as const,
    requiresAuthentication: true,
    deprecated: false,
    experimental: false,
  },
} as const;

export const PROGRAM_FEATURE_KEYS = Object.keys(
  PROGRAM_FEATURES
) as FeatureKey[];
