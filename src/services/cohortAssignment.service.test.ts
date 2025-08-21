import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CohortAssignmentService } from './cohortAssignment.service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-assignment-id',
                user_id: 'test-user-id',
                cohort_id: 'test-cohort-id',
                assigned_by: 'test-admin-id',
                assigned_at: '2024-01-01T00:00:00Z',
                is_active: true,
                notes: 'Test assignment',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-assignment-id',
                  user_id: 'test-user-id',
                  cohort_id: 'test-cohort-id',
                  assigned_by: 'test-admin-id',
                  assigned_at: '2024-01-01T00:00:00Z',
                  is_active: true,
                  notes: 'Updated assignment',
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
                error: null,
              })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
        in: vi.fn(() => ({
          data: [],
          error: null,
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('CohortAssignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignCohortToUser', () => {
    it('should assign a cohort to a user successfully', async () => {
      const input = {
        user_id: 'test-user-id',
        cohort_id: 'test-cohort-id',
        notes: 'Test assignment',
      };
      const assignedByUserId = 'test-admin-id';

      const result = await CohortAssignmentService.assignCohortToUser(input, assignedByUserId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data?.user_id).toBe('test-user-id');
      expect(result.data?.cohort_id).toBe('test-cohort-id');
      expect(result.data?.assigned_by).toBe('test-admin-id');
    });
  });

  describe('removeCohortFromUser', () => {
    it('should remove a cohort assignment from a user successfully', async () => {
      const userId = 'test-user-id';
      const cohortId = 'test-cohort-id';

      const result = await CohortAssignmentService.removeCohortFromUser(userId, cohortId);

      expect(result.data).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('getUserAssignments', () => {
    it('should get all assignments for a user', async () => {
      const userId = 'test-user-id';

      const result = await CohortAssignmentService.getUserAssignments(userId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getCohortAssignments', () => {
    it('should get all assignments for a cohort', async () => {
      const cohortId = 'test-cohort-id';

      const result = await CohortAssignmentService.getCohortAssignments(cohortId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getAssignedCohortsForUser', () => {
    it('should get assigned cohorts for a user', async () => {
      const userId = 'test-user-id';

      const result = await CohortAssignmentService.getAssignedCohortsForUser(userId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getUsersForCohort', () => {
    it('should get users assigned to a cohort', async () => {
      const cohortId = 'test-cohort-id';

      const result = await CohortAssignmentService.getUsersForCohort(cohortId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('bulkAssignCohorts', () => {
    it('should bulk assign cohorts to users', async () => {
      const input = {
        user_ids: ['user1', 'user2'],
        cohort_ids: ['cohort1', 'cohort2'],
        notes: 'Bulk assignment',
      };
      const assignedByUserId = 'test-admin-id';

      const result = await CohortAssignmentService.bulkAssignCohorts(input, assignedByUserId);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(typeof result.data).toBe('number');
    });
  });

  describe('bulkRemoveCohorts', () => {
    it('should bulk remove cohort assignments', async () => {
      const input = {
        user_ids: ['user1', 'user2'],
        cohort_ids: ['cohort1', 'cohort2'],
      };

      const result = await CohortAssignmentService.bulkRemoveCohorts(input);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(typeof result.data).toBe('number');
    });
  });

  describe('getAssignmentStats', () => {
    it('should get assignment statistics', async () => {
      const result = await CohortAssignmentService.getAssignmentStats();

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('total_assignments');
      expect(result.data).toHaveProperty('active_assignments');
      expect(result.data).toHaveProperty('inactive_assignments');
      expect(result.data).toHaveProperty('users_with_assignments');
      expect(result.data).toHaveProperty('cohorts_with_assignments');
    });
  });

  describe('searchAssignments', () => {
    it('should search assignments with filters', async () => {
      const filters = {
        user_id: 'test-user-id',
        is_active: true,
      };

      const result = await CohortAssignmentService.searchAssignments(filters);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
