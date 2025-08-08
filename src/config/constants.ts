/**
 * Application constants and configuration
 * Centralized configuration management for enterprise scalability
 */

export const APP_CONFIG = {
  APP_NAME: 'Enterprise Dashboard',
  APP_VERSION: '1.0.0',
  API_BASE_URL: 'https://ghmpaghyasyllfvamfna.supabase.co',
  
  // Performance settings
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    MAX_PAGE_SIZE: 100,
  },
  
  // Cache settings
  CACHE: {
    DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
    DEFAULT_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  },
  
  // UI settings
  UI: {
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 4000,
    ANIMATION_DURATION: 200,
  },
  
  // Security settings
  SECURITY: {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    MAX_LOGIN_ATTEMPTS: 5,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  NOT_FOUND: '*',
} as const;

export const API_ENDPOINTS = {
  PROFILES: 'profiles',
  AUTH: 'auth',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully.',
  SAVED: 'Changes saved successfully.',
  DELETED: 'Item deleted successfully.',
} as const;