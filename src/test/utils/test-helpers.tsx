/**
 * Enhanced Testing Utilities
 * Provides comprehensive testing helpers for the enterprise architecture
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { vi } from 'vitest';
import { Cohort } from '@/types/cohort';

// Mock implementations for testing
export const mockApiClient = {
  query: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  auth: {
    getSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

export const mockLogger = {
  getInstance: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
};

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient,
  routerProps = {},
}) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const client = queryClient || defaultQueryClient;

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter {...routerProps}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

// Enhanced render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  routerProps?: MemoryRouterProps;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, routerProps, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProviders queryClient={queryClient} routerProps={routerProps}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data factories
export const createMockCohort = (overrides = {}) => ({
  id: 'cohort-1',
  name: 'Test Cohort',
  description: 'A test cohort',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  status: 'active',
  max_students: 30,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockStudent = (overrides = {}) => ({
  id: 'student-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPayment = (overrides = {}) => ({
  id: 'payment-1',
  student_id: 'student-1',
  cohort_id: 'cohort-1',
  amount: 1000,
  payment_date: '2024-01-01T00:00:00Z',
  payment_method: 'bank_transfer',
  status: 'completed',
  transaction_id: 'txn-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCohortStudent = (overrides = {}) => ({
  id: 'cohort-student-1',
  student: createMockStudent(),
  cohort: createMockCohort(),
  status: 'active',
  assignment_date: '2024-01-01T00:00:00Z',
  current_amount_due: 5000,
  total_program_fee: 50000,
  ...overrides,
});

// API response helpers
export const createApiResponse = <T,>(
  data: T,
  success = true,
  error: string | null = null
) => ({
  data: success ? data : null,
  error,
  success,
});

export const createSuccessResponse = <T,>(data: T) =>
  createApiResponse(data, true, null);
export const createErrorResponse = (error: string) =>
  createApiResponse(null, false, error);

// Async testing utilities
export const waitForApiCall = async (mockFn: unknown, timeout = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (mockFn.mock.calls.length > 0) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('API call was not made within timeout');
};

// Form testing helpers
export const fillFormField = async (
  getByLabelText: unknown,
  userEvent: unknown,
  label: string,
  value: string
) => {
  const field = getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
};

export const submitForm = async (
  getByRole: unknown,
  userEvent: unknown,
  buttonText = 'Submit'
) => {
  const submitButton = getByRole('button', { name: buttonText });
  await userEvent.click(submitButton);
};

// Component testing utilities
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectLoadingState = (getByText: unknown) => {
  expect(getByText(/loading/i)).toBeInTheDocument();
};

export const expectErrorState = (getByText: unknown, errorMessage?: string) => {
  if (errorMessage) {
    expect(getByText(errorMessage)).toBeInTheDocument();
  } else {
    expect(getByText(/error|failed/i)).toBeInTheDocument();
  }
};

// Performance testing utilities
export const measureRenderTime = (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const expectAccessibleForm = (container: HTMLElement) => {
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    // Check for labels
    const hasLabel =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      container.querySelector('label[for="' + input.id + '"]');
    expect(hasLabel).toBeTruthy();
  });
};

// Mock service implementations
export const createMockCohortService = () => ({
  getCohorts: vi.fn(),
  getCohortById: vi.fn(),
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  getCohortStudents: vi.fn(),
  addStudentToCohort: vi.fn(),
  removeStudentFromCohort: vi.fn(),
  getCohortStats: vi.fn(),
});

export const createMockPaymentService = () => ({
  getPayments: vi.fn(),
  getPaymentById: vi.fn(),
  createPayment: vi.fn(),
  updatePaymentStatus: vi.fn(),
  verifyPayment: vi.fn(),
  getStudentPaymentPlan: vi.fn(),
  getPaymentSchedule: vi.fn(),
  getCohortPaymentStats: vi.fn(),
  submitPayment: vi.fn(),
  getPendingVerifications: vi.fn(),
  approvePayment: vi.fn(),
  rejectPayment: vi.fn(),
});

// Global test setup
export const setupTests = () => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

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
};

// Export everything for easy importing
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { vi } from 'vitest';

export const createTestCohort = (overrides: Partial<Cohort> = {}): Cohort => ({
  id: `cohort-${Date.now()}`,
  cohort_id: `test-cohort-${Date.now()}`,
  name: 'Test Cohort',
  start_date: '2025-01-01',
  duration_months: 6,
  end_date: '2025-07-01',
  description: 'A test cohort',
  sessions_per_day: 1,
  max_students: 30,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});
