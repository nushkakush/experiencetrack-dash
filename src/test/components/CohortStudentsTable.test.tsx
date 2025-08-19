/**
 * Component tests for CohortStudentsTable
 * Tests component rendering, interactions, and behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import CohortStudentsTable from '@/components/cohorts/CohortStudentsTable';
import { createTestStudent } from '@/test/utils/test-utils';

// Mock the cohort students service
vi.mock('@/services/cohortStudents.service', () => ({
  cohortStudentsService: {
    delete: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CohortStudentsTable', () => {
  const mockStudents = [
    createTestStudent({
      id: 'student-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      invite_status: 'accepted',
      invited_at: '2024-01-01T10:00:00Z',
    }),
    createTestStudent({
      id: 'student-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      invite_status: 'pending',
      invited_at: null,
    }),
  ];

  const mockOnStudentDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with students', () => {
      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Invite Status')).toBeInTheDocument();
      expect(screen.getByText('Invited At')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Check student data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('accepted')).toBeInTheDocument();

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567891')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('should render empty state when no students', () => {
      renderWithProviders(
        <CohortStudentsTable
          students={[]}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      expect(screen.getByText('No students yet')).toBeInTheDocument();
      expect(screen.getByText(/Use "Add student" or "Bulk Import"/)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      renderWithProviders(
        <CohortStudentsTable
          students={[]}
          onStudentDeleted={mockOnStudentDeleted}
          loading={true}
          cohortName="Test Cohort"
        />
      );

      // Should show skeleton loaders
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display invite status badges correctly', () => {
      const studentsWithDifferentStatuses = [
        createTestStudent({ invite_status: 'accepted' }),
        createTestStudent({ invite_status: 'sent' }),
        createTestStudent({ invite_status: 'pending' }),
        createTestStudent({ invite_status: 'failed' }),
      ];

      renderWithProviders(
        <CohortStudentsTable
          students={studentsWithDifferentStatuses}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      expect(screen.getByText('accepted')).toHaveClass('bg-green-100', 'text-green-800');
      expect(screen.getByText('sent')).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(screen.getByText('pending')).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(screen.getByText('failed')).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should format invited date correctly', () => {
      const studentWithDate = createTestStudent({
        invited_at: '2024-01-15T14:30:00Z',
      });

      renderWithProviders(
        <CohortStudentsTable
          students={[studentWithDate]}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      // Should show formatted date
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('should show dash for missing data', () => {
      const studentWithMissingData = createTestStudent({
        first_name: null,
        last_name: null,
        phone: null,
        invited_at: null,
      });

      renderWithProviders(
        <CohortStudentsTable
          students={[studentWithMissingData]}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      // Should show dashes for missing data
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should show delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(screen.getByText('Remove Student')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should delete student when confirmed', async () => {
      const user = userEvent.setup();
      const { cohortStudentsService } = await import('@/services/cohortStudents.service');
      const { toast } = await import('sonner');

      (cohortStudentsService.delete as any).mockResolvedValue({
        success: true,
        data: null,
        error: null,
      });

      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /remove student/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(cohortStudentsService.delete).toHaveBeenCalledWith('student-1');
        expect(toast.success).toHaveBeenCalledWith('Student removed from cohort successfully');
        expect(mockOnStudentDeleted).toHaveBeenCalled();
      });
    });

    it('should handle delete error gracefully', async () => {
      const user = userEvent.setup();
      const { cohortStudentsService } = await import('@/services/cohortStudents.service');
      const { toast } = await import('sonner');

      (cohortStudentsService.delete as any).mockResolvedValue({
        success: false,
        data: null,
        error: 'Failed to delete student',
      });

      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /remove student/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(cohortStudentsService.delete).toHaveBeenCalledWith('student-1');
        expect(toast.error).toHaveBeenCalledWith('Failed to remove student from cohort');
        expect(mockOnStudentDeleted).not.toHaveBeenCalled();
      });
    });

    it('should disable delete button while deleting', async () => {
      const user = userEvent.setup();
      const { cohortStudentsService } = await import('@/services/cohortStudents.service');

      // Mock a slow delete operation
      (cohortStudentsService.delete as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /remove student/i });
      await user.click(confirmButton);

      // Button should be disabled and show loading text
      expect(screen.getByText('Removing...')).toBeInTheDocument();
      expect(screen.getByText('Removing...')).toBeDisabled();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      expect(screen.getByText('Remove Student')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByText('Remove Student')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      // Table should have proper role
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Headers should be properly associated
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(6); // Name, Email, Phone, Invite Status, Invited At, Actions

      // Rows should be properly structured
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header row + data rows
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <CohortStudentsTable
          students={mockStudents}
          onStudentDeleted={mockOnStudentDeleted}
          cohortName="Test Cohort"
        />
      );

      // Should be able to tab to delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons[0]).toHaveAttribute('tabIndex', '0');
    });
  });
});
