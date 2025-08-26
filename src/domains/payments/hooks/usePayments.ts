/**
 * Payment Domain Hooks
 * Centralized hooks for payment-related functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/useApiQuery';
import {
  paymentService,
  PaymentFilters,
  Payment,
  PaymentStats,
} from '../services/PaymentService';

export interface UsePaymentsOptions {
  cohortId?: string;
  studentId?: string;
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { cohortId, studentId, enabled = true, autoRefresh = false } = options;

  const [filters, setFilters] = useState<PaymentFilters>({
    cohortId,
    studentId,
    limit: 50,
    offset: 0,
  });

  // Fetch payments
  const {
    data: payments = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.getPayments(filters),
    enabled: enabled,
    staleTime: autoRefresh ? 30 * 1000 : 5 * 60 * 1000, // 30s if auto-refresh, 5min otherwise
  });

  // Payment statistics
  const { data: stats, isLoading: statsLoading } = useApiQuery({
    queryKey: ['paymentStats', cohortId],
    queryFn: () =>
      cohortId
        ? paymentService.getCohortPaymentStats(cohortId)
        : Promise.resolve({
            data: null,
            success: false,
            error: 'No cohort ID',
          }),
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Submit payment mutation
  const submitPaymentMutation = useApiMutation({
    mutationFn: paymentService.submitPayment.bind(paymentService),
    successMessage: 'Payment submitted successfully',
    invalidateQueries: [['payments'], ['paymentStats']],
  });

  // Update payment status mutation
  const updateStatusMutation = useApiMutation({
    mutationFn: ({
      paymentId,
      status,
      transactionId,
    }: {
      paymentId: string;
      status: Payment['status'];
      transactionId?: string;
    }) => paymentService.updatePaymentStatus(paymentId, status, transactionId),
    successMessage: 'Payment status updated',
    invalidateQueries: [['payments'], ['paymentStats']],
  });

  // Approve payment mutation
  const approvePaymentMutation = useApiMutation({
    mutationFn: paymentService.approvePayment.bind(paymentService),
    successMessage: 'Payment approved',
    invalidateQueries: [['payments'], ['paymentStats']],
  });

  // Reject payment mutation
  const rejectPaymentMutation = useApiMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason?: string;
    }) => paymentService.rejectPayment(paymentId, reason),
    successMessage: 'Payment rejected',
    invalidateQueries: [['payments'], ['paymentStats']],
  });

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    const filtered = [...payments];

    // Additional client-side filtering can be added here

    return filtered;
  }, [payments]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Pagination helpers
  const nextPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 50),
    }));
  }, []);

  // Actions
  const submitPayment = useCallback(
    (paymentData: Parameters<typeof paymentService.submitPayment>[0]) => {
      return submitPaymentMutation.mutateAsync(paymentData);
    },
    [submitPaymentMutation]
  );

  const updatePaymentStatus = useCallback(
    (paymentId: string, status: Payment['status'], transactionId?: string) => {
      return updateStatusMutation.mutateAsync({
        paymentId,
        status,
        transactionId,
      });
    },
    [updateStatusMutation]
  );

  const approvePayment = useCallback(
    (paymentId: string) => {
      return approvePaymentMutation.mutateAsync(paymentId);
    },
    [approvePaymentMutation]
  );

  const rejectPayment = useCallback(
    (paymentId: string, reason?: string) => {
      return rejectPaymentMutation.mutateAsync({ paymentId, reason });
    },
    [rejectPaymentMutation]
  );

  return {
    // Data
    payments: filteredPayments,
    stats: stats as PaymentStats | undefined,

    // Loading states
    isLoading,
    statsLoading,
    isSubmittingPayment: submitPaymentMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isApprovingPayment: approvePaymentMutation.isPending,
    isRejectingPayment: rejectPaymentMutation.isPending,

    // Error states
    error,

    // Filters and pagination
    filters,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    currentPage: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,

    // Actions
    submitPayment,
    updatePaymentStatus,
    approvePayment,
    rejectPayment,
    refetch,
  };
}

/**
 * Hook for payment verification workflow
 */
export function usePaymentVerifications(cohortId?: string) {
  const {
    data: pendingPayments = [],
    isLoading,
    refetch,
  } = useApiQuery({
    queryKey: ['pendingVerifications', cohortId],
    queryFn: () => paymentService.getPendingVerifications(cohortId),
    staleTime: 1 * 60 * 1000, // 1 minute - verification needs fresh data
  });

  const approveMutation = useApiMutation({
    mutationFn: paymentService.approvePayment.bind(paymentService),
    successMessage: 'Payment approved',
    invalidateQueries: [
      ['pendingVerifications'],
      ['payments'],
      ['paymentStats'],
    ],
  });

  const rejectMutation = useApiMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string;
      reason?: string;
    }) => paymentService.rejectPayment(paymentId, reason),
    successMessage: 'Payment rejected',
    invalidateQueries: [
      ['pendingVerifications'],
      ['payments'],
      ['paymentStats'],
    ],
  });

  return {
    pendingPayments,
    isLoading,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    refetch,
  };
}

/**
 * Hook for student payment plan
 */
export function useStudentPaymentPlan(studentId: string) {
  const {
    data: paymentPlan,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ['paymentPlan', studentId],
    queryFn: () => paymentService.getStudentPaymentPlan(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: schedule = [], isLoading: scheduleLoading } = useApiQuery({
    queryKey: ['paymentSchedule', paymentPlan?.id],
    queryFn: () =>
      paymentPlan?.id
        ? paymentService.getPaymentSchedule(paymentPlan.id)
        : Promise.resolve({ data: [], success: true, error: null }),
    enabled: !!paymentPlan?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    paymentPlan,
    schedule,
    isLoading,
    scheduleLoading,
    error,
  };
}
