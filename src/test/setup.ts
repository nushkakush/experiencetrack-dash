/**
 * Test setup file for Vitest
 * Configures testing environment, global mocks, and utilities
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress specific console errors/warnings in tests
  console.error = vi.fn((...args) => {
    // Allow React warnings about missing keys, etc.
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalConsoleError(...args);
  });

  console.warn = vi.fn((...args) => {
    // Suppress React warnings about deprecated methods
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return;
    }
    originalConsoleWarn(...args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Global test utilities
global.testUtils = {
  // Mock Supabase client
  mockSupabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
  },
  
  // Mock React Query
  mockQueryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  },
  
  // Test data factories
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'student',
    first_name: 'Test',
    last_name: 'User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  
  createMockCohort: (overrides = {}) => ({
    id: 'test-cohort-id',
    cohort_id: 'TEST-2024-01',
    name: 'Test Cohort',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    duration_months: 12,
    description: 'Test cohort description',
    sessions_per_day: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  
  createMockStudent: (overrides = {}) => ({
    id: 'test-student-id',
    cohort_id: 'test-cohort-id',
    email: 'student@example.com',
    first_name: 'Test',
    last_name: 'Student',
    phone: '+1234567890',
    invite_status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
};

// Extend expect matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string | number | string[]): R;
      toBeChecked(): R;
      toHaveFocus(): R;
    }
  }
  
  var testUtils: {
    mockSupabase: {
      auth: {
        getSession: () => Promise<{ data: { session: any }; error: any }>;
        onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
        signOut: () => Promise<{ error: any }>;
      };
      from: () => {
        select: () => any;
        insert: () => any;
        update: () => any;
        delete: () => any;
        eq: () => any;
        single: () => Promise<{ data: any; error: any }>;
        maybeSingle: () => Promise<{ data: any; error: any }>;
        order: () => any;
        range: () => any;
      };
    };
    mockQueryClient: {
      invalidateQueries: () => void;
      setQueryData: () => void;
      getQueryData: () => any;
    };
    createMockUser: (overrides?: Record<string, any>) => {
      id: string;
      email: string;
      role: string;
      first_name: string;
      last_name: string;
      created_at: string;
      updated_at: string;
      [key: string]: any;
    };
    createMockCohort: (overrides?: Record<string, any>) => {
      id: string;
      cohort_id: string;
      name: string;
      start_date: string;
      end_date: string;
      duration_months: number;
      description: string;
      sessions_per_day: number;
      created_at: string;
      updated_at: string;
      [key: string]: any;
    };
    createMockStudent: (overrides?: Record<string, any>) => {
      id: string;
      cohort_id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      invite_status: string;
      created_at: string;
      updated_at: string;
      [key: string]: any;
    };
  };
}
