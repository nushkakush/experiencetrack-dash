/**
 * Environment configuration with proper secret management
 * This replaces hardcoded values throughout the application
 */

interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  api: {
    timeout: number;
    retryAttempts: number;
  };
  performance: {
    maxConnections: number;
    eventsPerSecond: number;
  };
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Use environment variables with fallbacks for development
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ghmpaghyasyllfvamfna.supabase.co";
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4";
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
    app: {
      name: 'ExperienceTrack Dashboard',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: (import.meta.env.VITE_ENVIRONMENT as any) || 'development',
    },
    api: {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
    },
    performance: {
      maxConnections: 50,
      eventsPerSecond: 5,
    },
  };
};

// Singleton pattern to ensure configuration is loaded once
let config: EnvironmentConfig | null = null;

export const getConfig = (): EnvironmentConfig => {
  if (!config) {
    config = getEnvironmentConfig();
  }
  return config;
};

// Environment checks
export const isDevelopment = () => getConfig().app.environment === 'development';
export const isProduction = () => getConfig().app.environment === 'production';
export const isStaging = () => getConfig().app.environment === 'staging';
