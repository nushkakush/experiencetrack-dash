// Async State Types - Comprehensive type definitions for async state management

import { AsyncState, AsyncStatus } from '@/types/common';

// Async State Options Interface
export interface UseAsyncStateOptions<T = unknown> {
  initialData?: T;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

// Async Function Type
export type AsyncFunction<T = unknown> = () => Promise<T>;

// Async State Hook Return Interface
export interface UseAsyncStateReturn<T = unknown> {
  state: AsyncState<T>;
  execute: (asyncFunction: AsyncFunction<T>) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string) => void;
  setStatus: (status: AsyncStatus) => void;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

// Async State Actions Interface
export interface AsyncStateActions<T = unknown> {
  execute: (asyncFunction: AsyncFunction<T>) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string) => void;
  setStatus: (status: AsyncStatus) => void;
}

// Async State Computed Properties Interface
export interface AsyncStateComputed {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

// Async State Update Types
export type AsyncStateUpdate<T = unknown> = Partial<AsyncState<T>>;
export type AsyncStateOptionsUpdate<T = unknown> = Partial<
  UseAsyncStateOptions<T>
>;

// Generic Async State Hook Interface
export type UseAsyncState<T = unknown> = UseAsyncStateReturn<T>;

// Async State with Loading Interface
export interface AsyncStateWithLoading<T = unknown> extends AsyncState<T> {
  isLoading: boolean;
}

// Async State with Error Interface
export interface AsyncStateWithError<T = unknown> extends AsyncState<T> {
  hasError: boolean;
  errorMessage: string;
}

// Async State with Success Interface
export interface AsyncStateWithSuccess<T = unknown> extends AsyncState<T> {
  isSuccess: boolean;
  successMessage?: string;
}

// Complete Async State Interface
export interface CompleteAsyncState<T = unknown>
  extends AsyncState<T>,
    AsyncStateWithLoading<T>,
    AsyncStateWithError<T>,
    AsyncStateWithSuccess<T> {}

// Async State Configuration Interface
export interface AsyncStateConfig {
  defaultErrorMessage: string;
  defaultSuccessMessage: string;
  showToastsByDefault: boolean;
  retryAttempts: number;
  retryDelay: number;
}

// Async State Error Types
export interface AsyncStateError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}

// Async State Success Types
export interface AsyncStateSuccess<T = unknown> {
  data: T;
  message?: string;
  timestamp: Date;
}

// Async State Loading Types
export interface AsyncStateLoading {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

// Utility Types
export type AsyncStateData<T = unknown> = T | null;
export type AsyncStateStatus = AsyncStatus;
export type AsyncStateErrorMessage = string | null;
