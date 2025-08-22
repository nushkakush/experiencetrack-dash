/**
 * Shared API Query Hook
 * Provides consistent data fetching patterns across the application
 */

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';
import { toast } from 'sonner';

export interface UseApiQueryOptions<T> {
  /** Query key for caching */
  queryKey: QueryKey;
  /** Function that returns the API call */
  queryFn: () => Promise<ApiResponse<T>>;
  /** Whether the query should run automatically */
  enabled?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Retry configuration */
  retry?: boolean | number;
  /** Whether to show error toasts */
  showErrorToast?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

export interface UseApiMutationOptions<TData, TVariables> {
  /** Function that performs the mutation */
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>;
  /** Called on successful mutation */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Called on mutation error */
  onError?: (error: string, variables: TVariables) => void;
  /** Success message to show in toast */
  successMessage?: string;
  /** Error message to show in toast */
  errorMessage?: string;
  /** Whether to show success/error toasts */
  showToasts?: boolean;
  /** Query keys to invalidate on success */
  invalidateQueries?: QueryKey[];
}

/**
 * Hook for API queries with consistent error handling and caching
 */
export function useApiQuery<T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
  retry = 3,
  showErrorToast = true,
  errorMessage = 'Failed to fetch data',
}: UseApiQueryOptions<T>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await queryFn();
      
      if (!response.success) {
        Logger.getInstance().error('API query failed', {
          queryKey,
          error: response.error,
        });
        
        if (showErrorToast) {
          toast.error(response.error || errorMessage);
        }
        
        throw new Error(response.error || errorMessage);
      }
      
      return response.data;
    },
    enabled,
    staleTime,
    cacheTime,
    retry,
  });
}

/**
 * Hook for API mutations with consistent error handling and optimistic updates
 */
export function useApiMutation<TData, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage = 'Operation failed',
  showToasts = true,
  invalidateQueries = [],
}: UseApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      
      if (!response.success) {
        throw new Error(response.error || errorMessage);
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      if (showToasts && successMessage) {
        toast.success(successMessage);
      }
      
      onSuccess?.(data!, variables);
    },
    onError: (error: Error, variables) => {
      Logger.getInstance().error('API mutation failed', {
        error: error.message,
        variables,
      });
      
      if (showToasts) {
        toast.error(error.message || errorMessage);
      }
      
      onError?.(error.message, variables);
    },
  });
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  
  return {
    optimisticUpdate: (updater: (oldData: T) => T) => {
      queryClient.setQueryData(queryKey, updater);
    },
    rollback: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  return {
    prefetch: <T>(queryKey: QueryKey, queryFn: () => Promise<ApiResponse<T>>) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await queryFn();
          if (!response.success) {
            throw new Error(response.error || 'Prefetch failed');
          }
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  };
}
