/**
 * Unit tests for CohortsService
 * Tests service methods in isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cohortsService } from '@/services/cohorts.service';
import { createTestCohort, createTestStudent } from '@/test/utils/test-utils';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('CohortsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAll', () => {
    it('should return list of cohorts', async () => {
      const mockCohorts = [
        createTestCohort({ id: 'cohort-1', name: 'Test Cohort 1' }),
        createTestCohort({ id: 'cohort-2', name: 'Test Cohort 2' }),
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCohorts,
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.listAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCohorts);
      expect(mockFrom).toHaveBeenCalledWith('cohorts');
    });

    it('should handle errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.listAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getById', () => {
    it('should return cohort by ID', async () => {
      const mockCohort = createTestCohort({ id: 'cohort-1', name: 'Test Cohort' });

      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCohort,
            error: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.getById('cohort-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCohort);
    });

    it('should handle non-existent cohort', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.getById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('listAllWithCounts', () => {
    it('should return cohorts with student counts', async () => {
      const mockCohortsWithCounts = [
        {
          ...createTestCohort({ id: 'cohort-1', name: 'Test Cohort 1' }),
          students: [{ count: 5 }],
        },
        {
          ...createTestCohort({ id: 'cohort-2', name: 'Test Cohort 2' }),
          students: [{ count: 3 }],
        },
      ];

      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockCohortsWithCounts,
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.listAllWithCounts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCohortsWithCounts);
    });
  });

  describe('isCohortIdUnique', () => {
    it('should return true for unique cohort ID', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.isCohortIdUnique('UNIQUE-ID');

      expect(result).toBe(true);
    });

    it('should return false for existing cohort ID', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'existing-cohort' },
            error: null,
          }),
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.isCohortIdUnique('EXISTING-ID');

      expect(result).toBe(false);
    });
  });

  describe('countStudents', () => {
    it('should return correct student count', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.countStudents('cohort-1');

      expect(result).toBe(5);
    });

    it('should return 0 on error', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockFrom = supabase.from as any;
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error' },
        }),
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await cohortsService.countStudents('cohort-1');

      expect(result).toBe(0);
    });
  });
});
