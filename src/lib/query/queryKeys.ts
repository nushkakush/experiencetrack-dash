/**
 * Query key factory for consistent and type-safe query keys
 * This ensures proper cache invalidation and prevents key collisions
 */

export const queryKeys = {
  // Auth related queries
  auth: {
    profile: ['auth', 'profile'] as const,
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },

  // Cohort related queries
  cohorts: {
    all: ['cohorts'] as const,
    lists: () => [...queryKeys.cohorts.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.cohorts.lists(), { filters }] as const,
    details: () => [...queryKeys.cohorts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cohorts.details(), id] as const,
    students: (cohortId: string) => [...queryKeys.cohorts.detail(cohortId), 'students'] as const,
    student: (cohortId: string, studentId: string) => [...queryKeys.cohorts.students(cohortId), studentId] as const,
  },

  // Attendance related queries
  attendance: {
    all: ['attendance'] as const,
    records: (cohortId: string) => [...queryKeys.attendance.all, 'records', cohortId] as const,
    record: (cohortId: string, date: string, session: number) => 
      [...queryKeys.attendance.records(cohortId), date, session] as const,
    statistics: (cohortId: string) => [...queryKeys.attendance.all, 'statistics', cohortId] as const,
    leaderboard: (cohortId: string) => [...queryKeys.attendance.all, 'leaderboard', cohortId] as const,
  },

  // Payment related queries
  payments: {
    all: ['payments'] as const,
    student: (studentId: string) => [...queryKeys.payments.all, 'student', studentId] as const,
    cohort: (cohortId: string) => [...queryKeys.payments.all, 'cohort', cohortId] as const,
    transactions: (paymentId: string) => [...queryKeys.payments.all, 'transactions', paymentId] as const,
    summary: (cohortId: string) => [...queryKeys.payments.all, 'summary', cohortId] as const,
  },

  // Fee structure related queries
  fees: {
    all: ['fees'] as const,
    structure: (cohortId: string) => [...queryKeys.fees.all, 'structure', cohortId] as const,
    scholarships: (cohortId: string) => [...queryKeys.fees.all, 'scholarships', cohortId] as const,
    calculations: (cohortId: string, paymentPlan: string) => 
      [...queryKeys.fees.all, 'calculations', cohortId, paymentPlan] as const,
  },

  // Holiday related queries
  holidays: {
    all: ['holidays'] as const,
    global: () => [...queryKeys.holidays.all, 'global'] as const,
    cohort: (cohortId: string) => [...queryKeys.holidays.all, 'cohort', cohortId] as const,
  },

  // Profile related queries
  profiles: {
    all: ['profiles'] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, 'detail', userId] as const,
    avatar: (userId: string) => [...queryKeys.profiles.all, 'avatar', userId] as const,
  },

  // Feature permissions
  permissions: {
    all: ['permissions'] as const,
    user: (userId: string) => [...queryKeys.permissions.all, 'user', userId] as const,
    features: () => [...queryKeys.permissions.all, 'features'] as const,
  },
} as const;

// Type for query keys
export type QueryKeys = typeof queryKeys;

// Helper function to create query keys with parameters
export const createQueryKey = <T extends readonly unknown[]>(key: T): T => key;

// Helper function to invalidate related queries
export const invalidateQueries = {
  cohorts: () => [queryKeys.cohorts.all],
  cohort: (id: string) => [queryKeys.cohorts.all, queryKeys.cohorts.detail(id)],
  attendance: (cohortId: string) => [queryKeys.attendance.all, queryKeys.attendance.records(cohortId)],
  payments: (cohortId: string) => [queryKeys.payments.all, queryKeys.payments.cohort(cohortId)],
  fees: (cohortId: string) => [queryKeys.fees.all, queryKeys.fees.structure(cohortId)],
  holidays: (cohortId?: string) => cohortId 
    ? [queryKeys.holidays.all, queryKeys.holidays.cohort(cohortId)]
    : [queryKeys.holidays.all],
} as const;
