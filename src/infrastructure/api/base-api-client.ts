/**
 * Base API Client - Abstraction layer for all API calls
 * This replaces direct Supabase calls scattered throughout the application
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getConfig } from '@/infrastructure/config/environment';
import { Logger } from '@/lib/logging/Logger';

export type DatabaseRow = Database['public']['Tables'][keyof Database['public']['Tables']]['Row'];
export type DatabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type DatabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

/**
 * Connection Manager for Supabase realtime channels
 */
class ConnectionManager {
  private static instance: ConnectionManager;
  private activeChannels = new Map<string, RealtimeChannel>();
  private connectionCount = 0;
  private readonly maxConnections: number;

  private constructor() {
    this.maxConnections = getConfig().performance.maxConnections;
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  createChannel(channelName: string, client: SupabaseClient): RealtimeChannel {
    if (this.connectionCount >= this.maxConnections) {
      Logger.getInstance().warn('Approaching maximum connections, cleaning up old channels');
      this.cleanupOldChannels();
    }

    const existingChannel = this.activeChannels.get(channelName);
    if (existingChannel && existingChannel.state !== 'closed') {
      return existingChannel;
    }

    const channel = client.channel(channelName);
    this.activeChannels.set(channelName, channel);
    this.connectionCount++;
    
    return channel;
  }

  removeChannel(channelName: string): void {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      try {
        if (channel.state !== 'closed') {
          channel.unsubscribe();
        }
      } catch (error) {
        Logger.getInstance().warn(`Error unsubscribing from channel ${channelName}`, { error });
      } finally {
        this.activeChannels.delete(channelName);
        this.connectionCount = Math.max(0, this.connectionCount - 1);
      }
    }
  }

  private cleanupOldChannels(): void {
    const channelsToRemove = Array.from(this.activeChannels.keys()).slice(0, 10);
    channelsToRemove.forEach(channelName => this.removeChannel(channelName));
  }

  getConnectionCount(): number {
    return this.connectionCount;
  }
}

/**
 * Base API Client with error handling, retries, and connection management
 */
export class BaseApiClient {
  private client: SupabaseClient<Database>;
  private connectionManager: ConnectionManager;
  private readonly config = getConfig();

  constructor() {
    this.client = this.createClient();
    this.connectionManager = ConnectionManager.getInstance();
  }

  private createClient(): SupabaseClient<Database> {
    return createClient<Database>(
      this.config.supabase.url,
      this.config.supabase.anonKey,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: false,
        },
        realtime: {
          params: {
            eventsPerSecond: this.config.performance.eventsPerSecond,
          },
        },
        global: {
          headers: {
            'X-Client-Info': this.config.app.name,
          },
        },
      }
    );
  }

  /**
   * Generic query method with error handling and retries
   */
  async query<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    options: QueryOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.config.api.timeout, retries = this.config.api.retryAttempts } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
        
        const result = await Promise.race([operation(), timeoutPromise]);
        
        if (result.error) {
          lastError = result.error;
          
          // Don't retry for certain error types
          if (this.isNonRetryableError(result.error)) {
            break;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < retries) {
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        
        return {
          data: result.data,
          error: result.error?.message || null,
          success: !result.error,
        };
      } catch (error) {
        lastError = error;
        Logger.getInstance().error(`API call attempt ${attempt + 1} failed`, { error });
        
        if (attempt < retries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    Logger.getInstance().error('API call failed after all retries', { error: lastError });
    return {
      data: null,
      error: lastError?.message || 'Request failed',
      success: false,
    };
  }

  /**
   * Select query with type safety
   */
  select<T extends keyof Database['public']['Tables']>(
    table: T,
    columns = '*'
  ) {
    return this.client.from(table).select(columns);
  }

  /**
   * Insert query with type safety
   */
  async insert<T extends keyof Database['public']['Tables']>(
    table: T,
    data: DatabaseInsert<T> | DatabaseInsert<T>[],
    options: QueryOptions = {}
  ): Promise<ApiResponse<DatabaseRow[]>> {
    return this.query(
      () => this.client.from(table).insert(data).select(),
      options
    );
  }

  /**
   * Update query with type safety
   */
  async update<T extends keyof Database['public']['Tables']>(
    table: T,
    data: DatabaseUpdate<T>,
    filter: (query: any) => any,
    options: QueryOptions = {}
  ): Promise<ApiResponse<DatabaseRow[]>> {
    return this.query(
      () => filter(this.client.from(table).update(data)).select(),
      options
    );
  }

  /**
   * Delete query with type safety
   */
  async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    filter: (query: any) => any,
    options: QueryOptions = {}
  ): Promise<ApiResponse<DatabaseRow[]>> {
    return this.query(
      () => filter(this.client.from(table).delete()).select(),
      options
    );
  }

  /**
   * Create realtime channel with connection management
   */
  createChannel(channelName: string): RealtimeChannel {
    return this.connectionManager.createChannel(channelName, this.client);
  }

  /**
   * Remove realtime channel
   */
  removeChannel(channelName: string): void {
    this.connectionManager.removeChannel(channelName);
  }

  /**
   * Get auth client
   */
  get auth() {
    return this.client.auth;
  }

  /**
   * Get storage client
   */
  get storage() {
    return this.client.storage;
  }

  /**
   * Get raw client for complex operations
   */
  get raw() {
    return this.client;
  }

  private isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = ['PGRST116', 'PGRST301', '42P01', '23505']; // Auth errors, not found, etc.
    return nonRetryableCodes.some(code => error?.code === code);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let apiClientInstance: BaseApiClient | null = null;

export const getApiClient = (): BaseApiClient => {
  if (!apiClientInstance) {
    apiClientInstance = new BaseApiClient();
  }
  return apiClientInstance;
};

// Export for backward compatibility
export const apiClient = getApiClient();
