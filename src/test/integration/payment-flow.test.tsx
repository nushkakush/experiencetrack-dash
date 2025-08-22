/**
 * Integration Test: Payment Flow
 * Tests the complete payment submission and verification flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  createMockStudent,
  createMockPayment,
  createSuccessResponse,
  createErrorResponse,
  waitForApiCall,
  fillFormField,
  submitForm,
  createMockPaymentService,
} from '../utils/test-helpers';
import { PaymentScheduleTable } from '@/domains/payments/components/PaymentSchedule';

// Mock the payment service
const mockPaymentService = createMockPaymentService();
vi.mock('@/domains/payments/services/PaymentService', () => ({
  paymentService: mockPaymentService,
}));

describe('Payment Flow Integration Tests', () => {
  const mockStudent = createMockStudent();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock responses
    mockPaymentService.getStudentPaymentPlan.mockResolvedValue(
      createSuccessResponse({
        id: 'plan-1',
        student_id: mockStudent.id,
        plan_type: 'semester_wise',
        total_amount: 50000,
        paid_amount: 20000,
        remaining_amount: 30000,
        status: 'active',
      })
    );

    mockPaymentService.getPaymentSchedule.mockResolvedValue(
      createSuccessResponse([
        {
          id: 'schedule-1',
          payment_plan_id: 'plan-1',
          installment_number: 1,
          amount: 10000,
          due_date: '2024-03-01',
          status: 'paid',
          payment_id: 'payment-1',
        },
        {
          id: 'schedule-2',
          payment_plan_id: 'plan-1',
          installment_number: 2,
          amount: 10000,
          due_date: '2024-06-01',
          status: 'pending',
        },
        {
          id: 'schedule-3',
          payment_plan_id: 'plan-1',
          installment_number: 3,
          amount: 10000,
          due_date: '2024-09-01',
          status: 'pending',
        },
      ])
    );
  });

  it('should display payment schedule correctly', async () => {
    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    // Wait for data to load
    await screen.findByText('Payment Schedule');

    // Check summary cards
    expect(screen.getByText('₹30,000')).toBeInTheDocument(); // Total
    expect(screen.getByText('₹10,000')).toBeInTheDocument(); // Paid
    expect(screen.getByText('₹20,000')).toBeInTheDocument(); // Pending

    // Check schedule items
    expect(screen.getByText('Installment - Installment 1')).toBeInTheDocument();
    expect(screen.getByText('Installment - Installment 2')).toBeInTheDocument();
    expect(screen.getByText('Installment - Installment 3')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText('Pending')).toHaveLength(2);
  });

  it('should filter payments by status', async () => {
    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    await screen.findByText('Payment Schedule');

    // Open status filter
    const statusFilter = screen.getByDisplayValue('All Status (3)');
    await user.click(statusFilter);

    // Select "Paid" option
    await user.click(screen.getByText('Paid (1)'));

    // Should only show paid items
    expect(screen.getByText('Installment - Installment 1')).toBeInTheDocument();
    expect(screen.queryByText('Installment - Installment 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Installment - Installment 3')).not.toBeInTheDocument();
  });

  it('should handle payment recording flow', async () => {
    const mockRecordPayment = vi.fn();
    
    renderWithProviders(
      <PaymentScheduleTable 
        student={mockStudent} 
        onRecordPayment={mockRecordPayment}
      />
    );

    await screen.findByText('Payment Schedule');

    // Click on record payment for pending item
    const moreButtons = screen.getAllByRole('button', { name: /open menu/i });
    await user.click(moreButtons[1]); // Second item (pending)

    const recordPaymentButton = screen.getByText('Record Payment');
    await user.click(recordPaymentButton);

    expect(mockRecordPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'schedule-2',
        status: 'pending',
        amount: 10000,
      })
    );
  });

  it('should handle export functionality', async () => {
    const mockExport = vi.fn();
    
    renderWithProviders(
      <PaymentScheduleTable 
        student={mockStudent} 
        onExportSchedule={mockExport}
      />
    );

    await screen.findByText('Payment Schedule');

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    expect(mockExport).toHaveBeenCalled();
  });

  it('should show overdue status for past due payments', async () => {
    // Mock past due payment
    mockPaymentService.getPaymentSchedule.mockResolvedValue(
      createSuccessResponse([
        {
          id: 'schedule-overdue',
          payment_plan_id: 'plan-1',
          installment_number: 1,
          amount: 10000,
          due_date: '2020-01-01', // Past date
          status: 'pending',
        },
      ])
    );

    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    await screen.findByText('Payment Schedule');

    // Should show overdue status
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    
    // Row should have red background class
    const overdueRow = screen.getByText('Overdue').closest('tr');
    expect(overdueRow).toHaveClass('bg-red-50');
  });

  it('should handle service errors gracefully', async () => {
    mockPaymentService.getStudentPaymentPlan.mockRejectedValue(
      new Error('Network error')
    );

    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    // Should show error state
    await screen.findByText('No payment schedule found for this student');
  });

  it('should display loading state', () => {
    // Don't mock the service calls to test loading state
    vi.clearAllMocks();
    mockPaymentService.getStudentPaymentPlan.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    expect(screen.getByText('Loading payment schedule...')).toBeInTheDocument();
  });

  it('should calculate correct summary statistics', async () => {
    // Mock schedule with mixed statuses
    mockPaymentService.getPaymentSchedule.mockResolvedValue(
      createSuccessResponse([
        {
          id: 'schedule-1',
          amount: 15000,
          due_date: '2024-01-01',
          status: 'paid',
        },
        {
          id: 'schedule-2',
          amount: 10000,
          due_date: '2024-06-01',
          status: 'pending',
        },
        {
          id: 'schedule-3',
          amount: 5000,
          due_date: '2020-01-01', // Overdue
          status: 'pending',
        },
      ])
    );

    renderWithProviders(
      <PaymentScheduleTable student={mockStudent} />
    );

    await screen.findByText('Payment Schedule');

    // Check calculated summaries
    expect(screen.getByText('₹30,000')).toBeInTheDocument(); // Total (15000 + 10000 + 5000)
    expect(screen.getByText('₹15,000')).toBeInTheDocument(); // Paid
    expect(screen.getByText('₹10,000')).toBeInTheDocument(); // Pending (future)
    expect(screen.getByText('₹5,000')).toBeInTheDocument();  // Overdue
  });
});
