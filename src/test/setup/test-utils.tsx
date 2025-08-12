import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { FeatureFlagProvider } from '@/lib/feature-flags/FeatureFlagProvider';
import { Toaster } from '@/components/ui/sonner';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Mock feature flag service
jest.mock('@/lib/feature-flags/FeatureFlagService', () => ({
  featureFlagService: {
    isEnabled: jest.fn(() => true),
    getMetadata: jest.fn(() => null),
    getAllFlags: jest.fn(() => []),
    setContext: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function AllTheProviders({ children, initialEntries = ['/'], queryClient }: { 
  children: React.ReactNode;
  initialEntries?: string[];
  queryClient?: QueryClient;
}) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <FeatureFlagProvider>
            {children}
            <Toaster />
          </FeatureFlagProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const mockPayment = {
  id: 'payment-1',
  student_id: 'student-1',
  cohort_id: 'cohort-1',
  payment_type: 'admission_fee' as const,
  payment_plan: 'one_shot' as const,
  base_amount: 50000,
  scholarship_amount: 0,
  discount_amount: 0,
  gst_amount: 9000,
  amount_payable: 59000,
  amount_paid: 0,
  due_date: '2024-01-15',
  status: 'pending' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockStudent = {
  id: 'student-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  user_id: 'user-1',
  cohort_id: 'cohort-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockCohort = {
  id: 'cohort-1',
  name: 'Test Cohort 2024',
  course_name: 'Full Stack Development',
  start_date: '2024-01-15',
  end_date: '2024-12-15',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockUser = {
  id: 'user-1',
  email: 'john.doe@example.com',
  role: 'student' as const,
  created_at: '2024-01-01T00:00:00Z',
};

// Mock API responses
export const mockApiResponse = {
  success: true,
  data: null,
  error: null,
};

export const mockApiError = {
  success: false,
  data: null,
  error: 'Test error message',
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockQueryClient = (overrides?: Partial<QueryClient>) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    ...overrides,
  });
};

// Mock service responses
export const mockServiceResponses = {
  payment: {
    success: { success: true, data: mockPayment, error: null },
    error: { success: false, data: null, error: 'Payment service error' },
  },
  student: {
    success: { success: true, data: mockStudent, error: null },
    error: { success: false, data: null, error: 'Student service error' },
  },
  cohort: {
    success: { success: true, data: mockCohort, error: null },
    error: { success: false, data: null, error: 'Cohort service error' },
  },
};

// Test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset sessionStorage
  sessionStorage.clear();
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});
