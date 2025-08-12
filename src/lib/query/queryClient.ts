import { QueryClient } from '@tanstack/react-query';
import { APP_CONFIG } from '@/config/constants';

/**
 * Enterprise-grade React Query client configuration
 * Provides optimal caching, background refetching, and error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time (how long to keep data in cache)
      gcTime: APP_CONFIG.CACHE.DEFAULT_CACHE_TIME,
      
      // Stale time (how long data is considered fresh)
      staleTime: APP_CONFIG.CACHE.DEFAULT_STALE_TIME,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && 'status' in error && typeof (error as any).status === 'number') {
          return (error as any).status >= 500 && failureCount < 3;
        }
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetching
      refetchOnWindowFocus: false, // Disable to prevent unnecessary refetches
      refetchOnReconnect: true,    // Refetch when network reconnects
      refetchOnMount: true,        // Refetch when component mounts
      
      // Network mode
      networkMode: 'online',
      
      // Suspense mode for better loading states
      suspense: false,
      
      // Throw on error (let error boundaries handle it)
      throwOnError: false,
      
      // Optimistic updates
      placeholderData: undefined,
      
      // Query function timeout
      queryFn: async (context) => {
        const { signal } = context;
        
        // Add timeout to query functions
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 30000);
        });
        
        // Your actual query function would go here
        // For now, we'll just return a placeholder
        return Promise.resolve(null);
      },
    },
    
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
      
      // Network mode for mutations
      networkMode: 'online',
      
      // Throw on error for mutations
      throwOnError: false,
      
      // Optimistic updates for mutations
      onMutate: undefined,
      onSuccess: undefined,
      onError: undefined,
      onSettled: undefined,
    },
  },
});

/**
 * Query client utilities for common operations
 */
export const queryClientUtils = {
  /**
   * Prefetch data for better UX
   */
  prefetch: async <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: { staleTime?: number }
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime || APP_CONFIG.CACHE.DEFAULT_STALE_TIME,
    });
  },

  /**
   * Set data in cache without fetching
   */
  setData: <T>(
    queryKey: readonly unknown[],
    data: T,
    options?: { staleTime?: number }
  ) => {
    queryClient.setQueryData(queryKey, data);
  },

  /**
   * Get data from cache
   */
  getData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData(queryKey);
  },

  /**
   * Invalidate and refetch queries
   */
  invalidate: async (queryKey: readonly unknown[]) => {
    await queryClient.invalidateQueries({ queryKey });
  },

  /**
   * Remove queries from cache
   */
  remove: (queryKey: readonly unknown[]) => {
    queryClient.removeQueries({ queryKey });
  },

  /**
   * Reset entire cache
   */
  reset: () => {
    queryClient.clear();
  },

  /**
   * Get query state
   */
  getQueryState: (queryKey: readonly unknown[]) => {
    return queryClient.getQueryState(queryKey);
  },

  /**
   * Check if query is fetching
   */
  isFetching: (queryKey?: readonly unknown[]) => {
    return queryClient.isFetching(queryKey);
  },

  /**
   * Check if query is stale
   */
  isStale: (queryKey: readonly unknown[]) => {
    const state = queryClient.getQueryState(queryKey);
    return state?.isStale ?? true;
  },
};

/**
 * Custom hooks for common query patterns
 */
export const useQueryUtils = () => {
  return {
    // Invalidate related queries
    invalidateCohorts: () => queryClient.invalidateQueries({ queryKey: ['cohorts'] }),
    invalidateAttendance: (cohortId: string) => 
      queryClient.invalidateQueries({ queryKey: ['attendance', 'records', cohortId] }),
    invalidatePayments: (cohortId: string) => 
      queryClient.invalidateQueries({ queryKey: ['payments', 'cohort', cohortId] }),
    
    // Prefetch common data
    prefetchCohort: (cohortId: string) => {
      // This would prefetch cohort data when needed
    },
    
    // Optimistic updates
    optimisticUpdate: <T>(
      queryKey: readonly unknown[],
      updater: (oldData: T | undefined) => T
    ) => {
      queryClient.setQueryData(queryKey, updater);
    },
  };
};
