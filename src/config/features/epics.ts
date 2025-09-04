import { FeatureMetadata } from '@/types/features';

export type EpicFeatureKey =
  | 'epics.view'
  | 'epics.create'
  | 'epics.edit'
  | 'epics.delete'
  | 'epics.manage';

export const EPIC_FEATURES: Record<EpicFeatureKey, FeatureMetadata> = {
  'epics.view': {
    key: 'epics.view',
    name: 'View Epics',
    description: 'View and browse learning epics',
    category: 'epics',
    type: 'read',
    dependencies: [],
    roles: [
      'experience_designer',
      'super_admin',
      'program_manager',
      'mentor_manager',
    ],
  },
  'epics.create': {
    key: 'epics.create',
    name: 'Create Epics',
    description: 'Create new learning epics',
    category: 'epics',
    type: 'write',
    dependencies: ['epics.view'],
    roles: ['experience_designer', 'super_admin', 'program_manager'],
  },
  'epics.edit': {
    key: 'epics.edit',
    name: 'Edit Epics',
    description: 'Edit existing learning epics',
    category: 'epics',
    type: 'write',
    dependencies: ['epics.view'],
    roles: ['experience_designer', 'super_admin', 'program_manager'],
  },
  'epics.delete': {
    key: 'epics.delete',
    name: 'Delete Epics',
    description: 'Delete learning epics',
    category: 'epics',
    type: 'delete',
    dependencies: ['epics.view'],
    roles: ['experience_designer', 'super_admin', 'program_manager'],
  },
  'epics.manage': {
    key: 'epics.manage',
    name: 'Manage Epics',
    description: 'Full epic management including create, edit, delete',
    category: 'epics',
    type: 'admin',
    dependencies: ['epics.view', 'epics.create', 'epics.edit', 'epics.delete'],
    roles: ['experience_designer', 'super_admin', 'program_manager'],
  },
};
