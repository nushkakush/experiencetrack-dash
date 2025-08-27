/**
 * Equipment query keys for React Query
 * Centralized query key management for equipment-related queries
 */

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: any) => [...equipmentKeys.lists(), filters] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  categories: () => [...equipmentKeys.all, 'categories'] as const,
  locations: () => [...equipmentKeys.all, 'locations'] as const,
  stats: () => [...equipmentKeys.all, 'stats'] as const,
  recentBorrowings: () => [...equipmentKeys.all, 'recentBorrowings'] as const,
  borrowings: () => [...equipmentKeys.all, 'borrowings'] as const,
  overdueBorrowings: () => [...equipmentKeys.all, 'overdueBorrowings'] as const,
  damageReports: () => [...equipmentKeys.all, 'damageReports'] as const,
  blacklistedStudents: () =>
    [...equipmentKeys.all, 'blacklistedStudents'] as const,
} as const;
