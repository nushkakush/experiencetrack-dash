import { FeatureKey, FeatureMetadata } from '@/types/features';

export const EQUIPMENT_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'equipment.view': {
    key: 'equipment.view',
    name: 'View Equipment',
    description: 'View equipment inventory and details',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.create': {
    key: 'equipment.create',
    name: 'Create Equipment',
    description: 'Add new equipment items to inventory',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.edit': {
    key: 'equipment.edit',
    name: 'Edit Equipment',
    description: 'Modify equipment details and information',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.delete': {
    key: 'equipment.delete',
    name: 'Delete Equipment',
    description: 'Remove equipment items from inventory',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.borrow': {
    key: 'equipment.borrow',
    name: 'Borrow Equipment',
    description: 'Borrow equipment items',
    category: 'equipment',
    requiresAuthentication: false, // Public form
  },
  'equipment.return': {
    key: 'equipment.return',
    name: 'Return Equipment',
    description: 'Process equipment returns',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.manage_blacklist': {
    key: 'equipment.manage_blacklist',
    name: 'Manage Blacklist',
    description: 'Manage student blacklist for equipment borrowing',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.reports': {
    key: 'equipment.reports',
    name: 'Equipment Reports',
    description: 'Generate equipment reports and analytics',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.inventory': {
    key: 'equipment.inventory',
    name: 'Equipment Inventory',
    description: 'Access equipment inventory management',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.borrowing_history': {
    key: 'equipment.borrowing_history',
    name: 'Borrowing History',
    description: 'View equipment borrowing history and records',
    category: 'equipment',
    requiresAuthentication: true,
  },
  'equipment.manage': {
    key: 'equipment.manage',
    name: 'Manage Equipment',
    description: 'Full equipment management capabilities',
    category: 'equipment',
    requiresAuthentication: true,
  },
};
