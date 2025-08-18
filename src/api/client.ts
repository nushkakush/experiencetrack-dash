import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';

// Types for request configuration
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: RequestBody;
  retryOnFailure?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export type RequestBody = Record<string, unknown> | null | undefined;

class ApiClient {
  private defaultRetryDelay = 500;
  private defaultMaxRetries = 3;
  private defaultTimeout = 5000;

  async request<T = unknown>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const {
      retryOnFailure = true,
      maxRetries = this.defaultMaxRetries,
      retryDelayMs = this.defaultRetryDelay,
      timeoutMs = this.defaultTimeout,
    } = config;

    let attempt = 0;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await this.makeSupabaseRequest<T>(endpoint, config);
        clearTimeout(timeoutId);

        if (
          !response.success &&
          retryOnFailure &&
          attempt < maxRetries &&
          !this.isClientError(response.error)
        ) {
          attempt++;
          await this.delay(retryDelayMs * attempt);
          continue;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (
          retryOnFailure &&
          attempt < maxRetries &&
          !this.isClientError(error)
        ) {
          attempt++;
          await this.delay(retryDelayMs * attempt);
          continue;
        }

        return {
          data: null,
          error: error instanceof Error ? error.message : 'Request failed',
          success: false,
        };
      }
    }

    return {
      data: null,
      error: 'Max retries exceeded',
      success: false,
    };
  }

  private async makeSupabaseRequest<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const { method, body } = config;
    const tableName = endpoint.replace('/rest/v1/', '');

    try {
      const query = supabase.from(tableName);

      switch (method) {
        case 'GET': {
          const { data, error } = await query.select('*');
          if (error) throw error;
          return { data, error: null, success: true } as ApiResponse<T>;
        }
        case 'POST': {
          const { data: insertData, error: insertError } = await query
            .insert(body)
            .select();
          if (insertError) throw insertError;
          return { data: insertData as T, error: null, success: true };
        }
        case 'PUT':
        case 'PATCH': {
          const { data: updateData, error: updateError } = await query
            .update(body)
            .select();
          if (updateError) throw updateError;
          return { data: updateData as T, error: null, success: true };
        }
        case 'DELETE': {
          const { error: deleteError } = await query.delete();
          if (deleteError) throw deleteError;
          return { data: null as T, error: null, success: true };
        }
        default: {
          throw new Error(`Unsupported method: ${method}`);
        }
      }
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false,
      };
    }
  }

  private isClientError(error: unknown): boolean {
    const status = (error as { status?: number } | null | undefined)?.status;
    if (typeof status === 'number') {
      return status >= 400 && status < 500;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = unknown>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(
    endpoint: string,
    body?: RequestBody,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(
    endpoint: string,
    body?: RequestBody,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: RequestBody,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = unknown>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
