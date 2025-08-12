// API Client Types - Comprehensive type definitions for API client functionality

import { ApiResponse, AppError } from '@/types/common';

// API Client Configuration Types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Request Configuration Types
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: RequestBody;
  timeout?: number;
  retries?: number;
}

// Request Body Types
export type RequestBody = 
  | string
  | number
  | boolean
  | null
  | undefined
  | RequestBody[]
  | { [key: string]: RequestBody };

// HTTP Method Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// HTTP Status Code Types
export type HttpStatusCode = 
  | 200 | 201 | 202 | 204
  | 300 | 301 | 302 | 304 | 307 | 308
  | 400 | 401 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451
  | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;

// API Response Types
export interface ApiResponseData<T> {
  data: T;
  error: null;
  success: true;
}

export interface ApiResponseError {
  data: null;
  error: string;
  success: false;
}

export type TypedApiResponse<T> = ApiResponseData<T> | ApiResponseError;

// Error Types
export interface ApiError extends Error {
  status?: HttpStatusCode;
  code?: string;
  details?: Record<string, unknown>;
}

export interface NetworkError extends Error {
  type: 'network' | 'timeout' | 'abort';
  retryable: boolean;
}

export interface ValidationError extends Error {
  field: string;
  value: unknown;
  rule: string;
}

// Request Context Types
export interface RequestContext {
  endpoint: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: RequestBody;
  timeout: number;
  retries: number;
  attempt: number;
  startTime: number;
}

// Response Context Types
export interface ResponseContext {
  status: HttpStatusCode;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
  attempt: number;
}

// Retry Configuration Types
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: HttpStatusCode[];
  retryableErrors: string[];
}

// Timeout Configuration Types
export interface TimeoutConfig {
  requestTimeout: number;
  responseTimeout: number;
  connectionTimeout: number;
}

// Authentication Types
export interface AuthConfig {
  token?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  bearerToken?: string;
}

// Interceptor Types
export interface RequestInterceptor {
  (config: RequestConfig, context: RequestContext): RequestConfig | Promise<RequestConfig>;
}

export interface ResponseInterceptor {
  (response: ApiResponse<unknown>, context: ResponseContext): ApiResponse<unknown> | Promise<ApiResponse<unknown>>;
}

export interface ErrorInterceptor {
  (error: ApiError, context: RequestContext): ApiError | Promise<ApiError>;
}

// API Client Method Types
export interface ApiClientMethods {
  request: <T = unknown>(endpoint: string, config?: RequestConfig) => Promise<ApiResponse<T>>;
  get: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method'>) => Promise<ApiResponse<T>>;
  post: <T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  put: <T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  patch: <T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>) => Promise<ApiResponse<T>>;
  delete: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method'>) => Promise<ApiResponse<T>>;
}

// Supabase Request Types
export interface SupabaseRequestConfig extends RequestConfig {
  table?: string;
  select?: string;
  filters?: Record<string, unknown>;
  order?: string;
  limit?: number;
  offset?: number;
}

// Fetch Request Types
export interface FetchRequestConfig extends RequestConfig {
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
}

// Request Headers Types
export interface RequestHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept'?: string;
  'User-Agent'?: string;
  'X-Requested-With'?: string;
  [key: string]: string | undefined;
}

// Response Headers Types
export interface ResponseHeaders {
  'content-type'?: string;
  'content-length'?: string;
  'cache-control'?: string;
  'etag'?: string;
  'last-modified'?: string;
  [key: string]: string | undefined;
}

// Utility Types
export type ApiClientConfigUpdate = Partial<ApiClientConfig>;
export type RequestConfigUpdate = Partial<RequestConfig>;
export type RetryConfigUpdate = Partial<RetryConfig>;
export type TimeoutConfigUpdate = Partial<TimeoutConfig>;
export type AuthConfigUpdate = Partial<AuthConfig>;

// API Client Event Types
export interface ApiClientEvents {
  request: (context: RequestContext) => void;
  response: (context: ResponseContext) => void;
  error: (error: ApiError, context: RequestContext) => void;
  retry: (attempt: number, error: ApiError, context: RequestContext) => void;
}

// API Client State Types
export interface ApiClientState {
  isConnected: boolean;
  lastRequestTime: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}
