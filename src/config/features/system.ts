import { FeatureKey, FeatureMetadata } from '@/types/features';

export const SYSTEM_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'system.settings': {
    key: 'system.settings',
    name: 'System Settings',
    description: 'Access system configuration',
    category: 'system',
    requiresAuthentication: true,
  },
  'system.analytics': {
    key: 'system.analytics',
    name: 'System Analytics',
    description: 'View system-wide analytics',
    category: 'system',
    requiresAuthentication: true,
  },
  'system.reports': {
    key: 'system.reports',
    name: 'System Reports',
    description: 'Generate system reports',
    category: 'system',
    requiresAuthentication: true,
  },
  'system.logs': {
    key: 'system.logs',
    name: 'System Logs',
    description: 'Access system logs',
    category: 'system',
    requiresAuthentication: true,
  },
  'system.merito_integration': {
    key: 'system.merito_integration',
    name: 'Merito CRM Integration',
    description: 'Sync enquiries and applications to Merito CRM',
    category: 'system',
    requiresAuthentication: true,
  },
} as const;

export const SYSTEM_FEATURE_KEYS = Object.keys(SYSTEM_FEATURES) as FeatureKey[];
