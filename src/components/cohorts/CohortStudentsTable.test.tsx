import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CohortStudentsTable from './CohortStudentsTable';
import { CohortStudent } from '@/types/cohort';
import { Scholarship } from '@/types/fee';

// Mock the hooks and services
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { user_id: 'test-user-id' }
  })
}));

vi.mock('@/hooks/useFeaturePermissions', () => ({
  useFeaturePermissions: () => ({
    hasPermission: () => true
  })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the services
vi.mock('@/services/cohortStudents.service', () => ({
  cohortStudentsService: {
    sendCustomInvitation: vi.fn(),
    sendInvitationEmail: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('@/services/studentScholarships.service', () => ({
  studentScholarshipsService: {
    getByStudent: vi.fn()
  }
}));

vi.mock('@/services/studentPaymentPlan.service', () => ({
  studentPaymentPlanService: {
    getByStudent: vi.fn()
  }
}));

vi.mock('@/services/feeStructure.service', () => ({
  FeeStructureService: {
    getCompleteFeeStructure: vi.fn(),
    getFeeStructure: vi.fn()
  }
}));

const mockStudents: CohortStudent[] = [
  {
    id: '1',
    cohort_id: 'cohort-1',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    invite_status: 'accepted',
    invited_at: '2024-01-01T00:00:00Z',
    accepted_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    avatar_url: null
  },
  {
    id: '2',
    cohort_id: 'cohort-1',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '+1234567891',
    invite_status: 'pending',
    invited_at: null,
    accepted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    avatar_url: null
  },
  {
    id: '3',
    cohort_id: 'cohort-1',
    email: 'bob.wilson@example.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    phone: '+1234567892',
    invite_status: 'sent',
    invited_at: '2024-01-01T00:00:00Z',
    accepted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    avatar_url: null
  }
];

const mockScholarships: Scholarship[] = [
  {
    id: '1',
    cohort_id: 'cohort-1',
    name: 'Merit Scholarship',
    amount_percentage: 25,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('CohortStudentsTable', () => {
  const defaultProps = {
    students: mockStudents,
    scholarships: mockScholarships,
    onStudentDeleted: vi.fn(),
    onStudentUpdated: vi.fn(),
    loading: false,
    cohortName: 'Test Cohort'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all students by default', () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('filters students by search query', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });
  });

  it('filters students by status', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    // Select status filter
    const statusSelect = screen.getByText('Filter by status');
    fireEvent.click(statusSelect);
    
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });
  });

  it('shows correct student count', () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    expect(screen.getByText('Students (3 of 3)')).toBeInTheDocument();
  });

  it('shows filtered count when search is active', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      expect(screen.getByText('Students (1 of 3)')).toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    // Add a search query
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    // Verify only John is shown
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
    
    // Click clear button
    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);
    
    // Verify all students are shown again
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  it('shows no results message when no students match filters', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No Students Match Your Filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms or filters to find the students you\'re looking for.')).toBeInTheDocument();
    });
  });

  it('shows filter badge when filters are active', async () => {
    render(<CohortStudentsTable {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search students by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    await waitFor(() => {
      const filterButton = screen.getByText('Filters');
      expect(filterButton).toBeInTheDocument();
      // The badge should show "1" for one active filter
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
