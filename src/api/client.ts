import { supabase } from '@/integrations/supabase/client';
import { ApiResponse, AppError } from '@/types/common';
import { 
  ApiClientConfig,
  RequestConfig,
  RequestBody,
  HttpMethod,
  HttpStatusCode,
  ApiError,
  NetworkError,
  ValidationError
} from '@/types/api/ApiClientTypes';



class ApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retries,
    } = config;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest<T>(endpoint, {
          method,
          headers,
          body,
          timeout,
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 4xx errors (client errors)
        if (this.isClientError(error)) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    return {
      data: null,
      error: lastError?.message || 'Request failed',
      success: false,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const { method, headers, body, timeout } = config;

    // Use Supabase client for database operations
    if (endpoint.startsWith('/rest/v1/')) {
      return this.makeSupabaseRequest<T>(endpoint, config);
    }

    // Use fetch for other API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async makeSupabaseRequest<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const { method, body } = config;
    const tableName = endpoint.replace('/rest/v1/', '');

    try {
      let query = supabase.from(tableName);

      switch (method) {
        case 'GET':
          const { data, error } = await query.select('*');
          if (error) throw error;
          return { data, error: null, success: true };

        case 'POST':
          const { data: insertData, error: insertError } = await query.insert(body).select();
          if (insertError) throw insertError;
          return { data: insertData, error: null, success: true };

        case 'PUT':
        case 'PATCH':
          const { data: updateData, error: updateError } = await query.update(body).select();
          if (updateError) throw updateError;
          return { data: updateData, error: null, success: true };

        case 'DELETE':
          const { error: deleteError } = await query.delete();
          if (deleteError) throw deleteError;
          return { data: null, error: null, success: true };

        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Request failed',
        success: false,
      };
    }
  }

  private isClientError(error: unknown): boolean {
    if (error?.status) {
      return error.status >= 400 && error.status < 500;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: RequestBody, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create and export default instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
