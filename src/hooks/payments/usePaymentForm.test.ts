import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePaymentForm } from './usePaymentForm';

// Mock the imported functions
vi.mock('@/features/payments/domain/PaymentModeConfig', () => ({
  getPaymentModeConfig: vi.fn(() => ({ name: 'test', fields: [] })),
  getRequiredFieldsForMode: vi.fn(() => []),
  getRequiredFilesForMode: vi.fn(() => [])
}));

describe('usePaymentForm', () => {
  const mockProps = {
    selectedInstallment: null,
    paymentBreakdown: null,
    selectedPaymentPlan: 'sem_wise',
    onPaymentSubmission: vi.fn(),
    studentData: {
      id: 'test-student-id',
      cohort_id: 'test-cohort-id'
    }
  };

  it('should not cause infinite recursion when getPaymentModeConfig is called', () => {
    const { result } = renderHook(() => usePaymentForm(mockProps));
    
    // This should not cause a stack overflow
    expect(() => {
      result.current.getPaymentModeConfig();
    }).not.toThrow();
  });

  it('should return the expected structure', () => {
    const { result } = renderHook(() => usePaymentForm(mockProps));
    
    expect(result.current).toHaveProperty('selectedPaymentMode');
    expect(result.current).toHaveProperty('amountToPay');
    expect(result.current).toHaveProperty('paymentDetails');
    expect(result.current).toHaveProperty('uploadedFiles');
    expect(result.current).toHaveProperty('errors');
    expect(result.current).toHaveProperty('maxAmount');
    expect(result.current).toHaveProperty('handlePaymentModeChange');
    expect(result.current).toHaveProperty('handleAmountChange');
    expect(result.current).toHaveProperty('handleFieldChange');
    expect(result.current).toHaveProperty('handleFileUpload');
    expect(result.current).toHaveProperty('handleSubmit');
    expect(result.current).toHaveProperty('getPaymentModeConfig');
    expect(result.current).toHaveProperty('formatCurrency');
    expect(result.current).toHaveProperty('validateForm');
  });
});
