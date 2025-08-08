/**
 * Custom hook for managing async state with proper error handling
 * Enterprise-level state management for API calls
 */

import { useState, useCallback } from 'react';
import { AsyncState, AsyncStatus, AppError } from '@/types/common';
import { ERROR_MESSAGES } from '@/config/constants';
import { toast } from 'sonner';

interface UseAsyncStateOptions {
  initialData?: any;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useAsyncState<T = any>(options: UseAsyncStateOptions = {}) {
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
    async (asyncFunction: () => Promise<T>) => {
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

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    isIdle: state.status === 'idle',
    execute,
    reset,
    setData,
    setError,
  };
}