import { FeatureKey, FeatureMetadata } from '@/types/features';

export const FEE_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'fees.view': {
    key: 'fees.view',
    name: 'View Fees',
    description: 'View fee information',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.collect': {
    key: 'fees.collect',
    name: 'Collect Fees',
    description: 'Process fee payments',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.waive': {
    key: 'fees.waive',
    name: 'Waive Fees',
    description: 'Waive student fees',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.refund': {
    key: 'fees.refund',
    name: 'Refund Fees',
    description: 'Process fee refunds',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.reports': {
    key: 'fees.reports',
    name: 'Fee Reports',
    description: 'Generate fee collection reports',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.setup_structure': {
    key: 'fees.setup_structure',
    name: 'Setup Fee Structure',
    description: 'Configure fee structures for cohorts',
    category: 'fees',
    requiresAuthentication: true,
  },
  'fees.manage_scholarships': {
    key: 'fees.manage_scholarships',
    name: 'Manage Scholarships',
    description: 'Configure and manage scholarships',
    category: 'fees',
    requiresAuthentication: true,
  },
} as const;

export const FEE_FEATURE_KEYS = Object.keys(FEE_FEATURES) as FeatureKey[];
