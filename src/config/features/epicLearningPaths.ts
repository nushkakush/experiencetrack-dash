export const EPIC_LEARNING_PATHS_FEATURES = {
  'epic-learning-paths.view': {
    key: 'epic-learning-paths.view',
    name: 'View Epic Learning Paths',
    description: 'View and browse epic learning paths',
    category: 'Epic Learning Paths',
  },
  'epic-learning-paths.create': {
    key: 'epic-learning-paths.create',
    name: 'Create Epic Learning Paths',
    description: 'Create new epic learning paths',
    category: 'Epic Learning Paths',
  },
  'epic-learning-paths.edit': {
    key: 'epic-learning-paths.edit',
    name: 'Edit Epic Learning Paths',
    description: 'Edit existing epic learning paths',
    category: 'Epic Learning Paths',
  },
  'epic-learning-paths.delete': {
    key: 'epic-learning-paths.delete',
    name: 'Delete Epic Learning Paths',
    description: 'Delete epic learning paths',
    category: 'Epic Learning Paths',
  },
  'epic-learning-paths.manage': {
    key: 'epic-learning-paths.manage',
    name: 'Manage Epic Learning Paths',
    description: 'Full management access to epic learning paths',
    category: 'Epic Learning Paths',
  },
} as const;

export type EpicLearningPathsFeature = keyof typeof EPIC_LEARNING_PATHS_FEATURES;
