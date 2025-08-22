// This file maintains backward compatibility while using the new configuration system
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from './types';
import { getConfig } from '@/infrastructure/config/environment';

// Get configuration from the new environment system
const config = getConfig();

// Ensure singleton pattern for Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

const createSupabaseClient = () => {
  if (!supabaseInstance) {
    // In development, check if there's already a client in localStorage to prevent multiple instances
    if (process.env.NODE_ENV === 'development') {
      const existingClient = (window as any).__SUPABASE_CLIENT__;
      if (existingClient) {
        console.warn('Supabase client already exists, reusing existing instance');
        return existingClient;
      }
    }

    supabaseInstance = createClient<Database>(config.supabase.url, config.supabase.anonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: false, // Disable auto refresh to prevent reloads
      },
      realtime: {
        params: {
          eventsPerSecond: config.performance.eventsPerSecond,
        },
      },
      global: {
        headers: {
          'X-Client-Info': config.app.name,
        },
      },
    });

    // Store reference in development to prevent multiple instances
    if (process.env.NODE_ENV === 'development') {
      (window as any).__SUPABASE_CLIENT__ = supabaseInstance;
    }
  }
  return supabaseInstance;
};

// Create Supabase client with connection management
export const supabase = createSupabaseClient();

// Connection management utility
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private activeChannels = new Map<string, RealtimeChannel>(); // Store channel objects with proper typing
  private connectionCount = 0;
  private maxConnections = config.performance.maxConnections;

  private constructor() {}

  static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  createChannel(channelName: string): RealtimeChannel {
    // Check if we're approaching connection limits
    if (this.connectionCount >= this.maxConnections) {
      console.warn('Approaching maximum Supabase connections, cleaning up old channels');
      this.cleanupOldChannels();
    }

    // Check if channel already exists and is active
    const existingChannel = this.activeChannels.get(channelName);
    if (existingChannel && existingChannel.state !== 'closed') {
      console.warn(`Channel ${channelName} already exists and is active, returning existing channel`);
      return existingChannel;
    }

    // Remove any existing closed channel
    if (existingChannel) {
      this.activeChannels.delete(channelName);
      this.connectionCount = Math.max(0, this.connectionCount - 1);
    }

    const channel = supabase.channel(channelName);
    this.activeChannels.set(channelName, channel);
    this.connectionCount++;
    
    return channel;
  }

  removeChannel(channelName: string) {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      try {
        // Check if the channel is still subscribed before trying to unsubscribe
        if (typeof channel.unsubscribe === 'function' && channel.state !== 'closed') {
          channel.unsubscribe();
        }
      } catch (error) {
        console.warn(`Error unsubscribing from channel ${channelName}:`, error);
      } finally {
        // Always remove from our tracking, even if unsubscribe fails
        this.activeChannels.delete(channelName);
        this.connectionCount = Math.max(0, this.connectionCount - 1);
      }
    }
  }

  private cleanupOldChannels() {
    // Remove oldest channels if we're at the limit
    const channelsToRemove = Array.from(this.activeChannels.keys()).slice(0, 10);
    channelsToRemove.forEach(channelName => this.removeChannel(channelName));
  }

  getConnectionCount() {
    return this.connectionCount;
  }

  getActiveChannels() {
    return Array.from(this.activeChannels.keys());
  }

  hasChannel(channelName: string): boolean {
    const channel = this.activeChannels.get(channelName);
    return channel !== undefined && channel.state !== 'closed';
  }
}

export const connectionManager = SupabaseConnectionManager.getInstance();

// Export the original createClient for backward compatibility
export const createBrowserClient = createClient;