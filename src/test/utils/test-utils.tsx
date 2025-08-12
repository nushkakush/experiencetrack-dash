/**
 * Test utilities for React components
 * Provides custom render functions with all necessary providers
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { vi } from 'vitest';

// Test-specific types
interface TestUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface TestSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface TestProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface TestAuthState {
  user?: TestUser;
  session?: TestSession;
  profile?: TestProfile;
  loading?: boolean;
}

interface TestApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
}

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: global.testUtils.mockSupabase,
}));

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
  authState?: TestAuthState;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
}

function TestWrapper({ 
  children, 
  queryClient = createTestQueryClient(),
  authState = {},
}: { 
  children: React.ReactNode;
  queryClient?: QueryClient;
  authState?: TestAuthState;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { route = '/', queryClient, authState, ...renderOptions } = options;

  // Set up route if provided
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper queryClient={queryClient} authState={authState}>
      {children}
    </TestWrapper>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from testing library
export * from '@testing-library/react';

// Custom matchers for common assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass(className);
};

// Utility functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};

export const mockApiResponse = <T = unknown>(data: T, success = true): TestApiResponse<T> => ({
  data,
  error: success ? null : 'Test error',
  success,
});

export const createMockApiError = (message = 'Test error', code = 'TEST_ERROR') => ({
  message,
  code,
  status: 400,
});

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'student',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createTestCohort = (overrides = {}) => ({
  id: 'test-cohort-id',
  cohort_id: 'TEST-2024-01',
  name: 'Test Cohort',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  duration_months: 12,
  description: 'Test cohort description',
  sessions_per_day: 1,
  students_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createTestStudent = (overrides = {}) => ({
  id: 'test-student-id',
  cohort_id: 'test-cohort-id',
  email: 'student@example.com',
  first_name: 'Test',
  last_name: 'Student',
  phone: '+1234567890',
  invite_status: 'pending' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock service responses
export const mockServiceResponses = {
  cohorts: {
    list: (data = []) => mockApiResponse(data),
    getById: (data = null) => mockApiResponse(data),
    create: (data = null) => mockApiResponse(data),
    update: (data = null) => mockApiResponse(data),
    delete: () => mockApiResponse(null),
  },
  students: {
    list: (data = []) => mockApiResponse(data),
    getById: (data = null) => mockApiResponse(data),
    create: (data = null) => mockApiResponse(data),
    update: (data = null) => mockApiResponse(data),
    delete: () => mockApiResponse(null),
  },
};
