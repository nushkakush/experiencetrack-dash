/**
 * Unit tests for useCohorts hook
 * Tests hook behavior and data fetching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCohorts } from '@/hooks/useCohorts';
import { createTestCohort } from '@/test/utils/test-utils';

// Mock the cohorts service
vi.mock('@/services/cohorts.service', () => ({
  cohortsService: {
    listAllWithCounts: vi.fn(),
  },
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCohorts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and return cohorts successfully', async () => {
    const mockCohorts = [
      createTestCohort({ id: 'cohort-1', name: 'Test Cohort 1', students_count: 5 }),
      createTestCohort({ id: 'cohort-2', name: 'Test Cohort 2', students_count: 3 }),
    ];

    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockResolvedValue({
      success: true,
      data: mockCohorts,
      error: null,
    });

    const { result } = renderHook(() => useCohorts(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.cohorts).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cohorts).toEqual(mockCohorts);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(cohortsService.listAllWithCounts).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockResolvedValue({
      success: false,
      data: null,
      error: 'Failed to fetch cohorts',
    });

    const { result } = renderHook(() => useCohorts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.cohorts).toBeUndefined();
  });

  it('should handle network errors', async () => {
    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useCohorts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.cohorts).toBeUndefined();
  });

  it('should return empty array when no cohorts exist', async () => {
    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useCohorts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cohorts).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('should provide refetch function', async () => {
    const mockCohorts = [
      createTestCohort({ id: 'cohort-1', name: 'Test Cohort' }),
    ];

    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockResolvedValue({
      success: true,
      data: mockCohorts,
      error: null,
    });

    const { result } = renderHook(() => useCohorts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
    
    // Test refetch
    const refetchPromise = result.current.refetch();
    expect(cohortsService.listAllWithCounts).toHaveBeenCalledTimes(2);
    
    await refetchPromise;
  });

  it('should cache data and not refetch unnecessarily', async () => {
    const mockCohorts = [
      createTestCohort({ id: 'cohort-1', name: 'Test Cohort' }),
    ];

    const { cohortsService } = await import('@/services/cohorts.service');
    (cohortsService.listAllWithCounts as any).mockResolvedValue({
      success: true,
      data: mockCohorts,
      error: null,
    });

    // Render hook twice
    const { result: result1 } = renderHook(() => useCohorts(), { wrapper });
    const { result: result2 } = renderHook(() => useCohorts(), { wrapper });

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Should only call the service once due to caching
    expect(cohortsService.listAllWithCounts).toHaveBeenCalledTimes(1);
  });
});
