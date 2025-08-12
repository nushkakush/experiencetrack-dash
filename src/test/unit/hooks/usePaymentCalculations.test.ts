import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePaymentCalculations } from '@/pages/dashboards/student/hooks/usePaymentCalculations';

// Mock the dependencies
vi.mock('@/pages/dashboards/student/hooks/useStudentData', () => ({
  useStudentData: vi.fn()
}));

vi.mock('@/pages/dashboards/student/hooks/usePaymentPlanManagement', () => ({
  usePaymentPlanManagement: vi.fn()
}));

describe('usePaymentCalculations', () => {
  const mockStudentData = (globalThis as any).testUtils.createMockStudent();
  const mockCohortData = (globalThis as any).testUtils.createMockCohort();

  const mockStudentPayments = [
    {
      id: 'payment-1',
      student_id: mockStudentData.id,
      payment_plan: 'sem_wise',
      amount_payable: 100000,
      amount_paid: 0,
      status: 'pending',
      payment_type: 'admission_fee'
    }
  ];

  const mockFeeStructure = {
    total_program_fee: '1000000',
    admission_fee: '100000',
    semesters: 3,
    instalments_per_semester: 3,
    one_shot_discount: 5
  };

  const mockScholarships = [
    {
      id: 'scholarship-1',
      student_id: mockStudentData.id,
      amount: 10,
      type: 'percentage' as const,
      description: 'Merit scholarship'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return payment breakdown with correct structure', async () => {
    // Mock useStudentData
    const { useStudentData } = await import('@/pages/dashboards/student/hooks/useStudentData');
    (useStudentData as any).mockReturnValue({
      studentPayments: mockStudentPayments,
      feeStructure: mockFeeStructure,
      scholarships: mockScholarships,
      loading: false,
      error: null
    });

    // Mock usePaymentPlanManagement
    const { usePaymentPlanManagement } = await import('@/pages/dashboards/student/hooks/usePaymentPlanManagement');
    (usePaymentPlanManagement as any).mockReturnValue({
      handlePaymentPlanSelection: vi.fn(),
      getPaymentMethods: vi.fn(() => [])
    });

    const { result } = renderHook(() => usePaymentCalculations({ studentData: mockStudentData }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify the structure of the returned data
    expect(result.current).toHaveProperty('paymentBreakdown');
    expect(result.current).toHaveProperty('selectedPaymentPlan');
    expect(result.current).toHaveProperty('handlePaymentPlanSelection');
    expect(result.current).toHaveProperty('getPaymentMethods');
    expect(result.current).toHaveProperty('studentPayments');
    expect(result.current).toHaveProperty('scholarships');

    // Verify payment breakdown structure
    expect(result.current.paymentBreakdown).toHaveProperty('admissionFee');
    expect(result.current.paymentBreakdown).toHaveProperty('semesters');
    expect(result.current.paymentBreakdown).toHaveProperty('overallSummary');

    // Verify selected payment plan
    expect(result.current.selectedPaymentPlan).toBe('sem_wise');
  });

  it('should handle loading state correctly', async () => {
    // Mock useStudentData with loading state
    const { useStudentData } = await import('@/pages/dashboards/student/hooks/useStudentData');
    (useStudentData as any).mockReturnValue({
      studentPayments: [],
      feeStructure: null,
      scholarships: [],
      loading: true,
      error: null
    });

    // Mock usePaymentPlanManagement
    const { usePaymentPlanManagement } = await import('@/pages/dashboards/student/hooks/usePaymentPlanManagement');
    (usePaymentPlanManagement as any).mockReturnValue({
      handlePaymentPlanSelection: vi.fn(),
      getPaymentMethods: vi.fn(() => [])
    });

    const { result } = renderHook(() => usePaymentCalculations({ studentData: mockStudentData }));

    expect(result.current.loading).toBe(true);
  });

  it('should handle error state correctly', async () => {
    // Mock useStudentData with error state
    const { useStudentData } = await import('@/pages/dashboards/student/hooks/useStudentData');
    (useStudentData as any).mockReturnValue({
      studentPayments: [],
      feeStructure: null,
      scholarships: [],
      loading: false,
      error: new Error('Failed to load data')
    });

    // Mock usePaymentPlanManagement
    const { usePaymentPlanManagement } = await import('@/pages/dashboards/student/hooks/usePaymentPlanManagement');
    (usePaymentPlanManagement as any).mockReturnValue({
      handlePaymentPlanSelection: vi.fn(),
      getPaymentMethods: vi.fn(() => [])
    });

    const { result } = renderHook(() => usePaymentCalculations({ studentData: mockStudentData }));

    expect(result.current.loading).toBe(false);
    // Note: error is not exposed in the return value, but the hook should handle it gracefully
  });

  it('should handle no payment plan selected', async () => {
    // Mock useStudentData with no payment plan
    const { useStudentData } = await import('@/pages/dashboards/student/hooks/useStudentData');
    (useStudentData as any).mockReturnValue({
      studentPayments: [],
      feeStructure: mockFeeStructure,
      scholarships: [],
      loading: false,
      error: null
    });

    // Mock usePaymentPlanManagement
    const { usePaymentPlanManagement } = await import('@/pages/dashboards/student/hooks/usePaymentPlanManagement');
    (usePaymentPlanManagement as any).mockReturnValue({
      handlePaymentPlanSelection: vi.fn(),
      getPaymentMethods: vi.fn(() => [])
    });

    const { result } = renderHook(() => usePaymentCalculations({ studentData: mockStudentData }));

    await waitFor(() => {
      expect(result.current.selectedPaymentPlan).toBe('not_selected');
    });
  });
});
