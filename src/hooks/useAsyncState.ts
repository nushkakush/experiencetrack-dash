/**
 * Custom hook for managing async state with proper error handling
 * Enterprise-level state management for API calls
 */

import { useState, useCallback } from 'react';
import { AsyncState, AsyncStatus, AppError } from '@/types/common';
import { ERROR_MESSAGES } from '@/config/constants';
import { toast } from 'sonner';
import { 
  UseAsyncStateOptions, 
  AsyncFunction, 
  UseAsyncStateReturn 
} from '@/types/common/AsyncStateTypes';

// Using imported UseAsyncStateOptions interface from AsyncStateTypes

export function useAsyncState<T = unknown>(options: UseAsyncStateOptions<T> = {}): UseAsyncStateReturn<T> {
  const {
    initialData = null,
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Operation completed successfully',
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    status: 'idle',
    error: null,
  });

  const execute = useCallback(
    async (asyncFunction: AsyncFunction<T>) => {
      setState(prev => ({
        ...prev,
        status: 'loading',
        error: null,
      }));

      try {
        const data = await asyncFunction();
        
        setState({
          data,
          status: 'success',
          error: null,
        });

        if (showSuccessToast) {
          toast.success(successMessage);
        }

        return data;
      } catch (error) {
        const errorMessage = error instanceof AppError 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : ERROR_MESSAGES.GENERIC_ERROR;

        setState(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        throw error;
      }
    },
    [showErrorToast, showSuccessToast, successMessage]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      status: 'idle',
      error: null,
    });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      status: 'success',
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      status: 'error',
    }));
  }, []);

  const setStatus = useCallback((status: AsyncStatus) => {
    setState(prev => ({
      ...prev,
      status,
    }));
  }, []);

  return {
    state,
    execute,
    reset,
    setData,
    setError,
    setStatus,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    isIdle: state.status === 'idle',
  };
}