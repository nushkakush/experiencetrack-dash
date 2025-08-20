import { useState, useEffect, useMemo } from 'react';
import { PaymentPlan } from '@/types/fee';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';
import { CohortStudent } from '@/types/cohort';
import { logger } from '@/lib/logging/Logger';

interface UsePaymentPlanStateProps {
  studentData: CohortStudent | null;
  studentPayments: StudentPaymentRow[] | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface UsePaymentPlanStateReturn {
  // Current payment plan state
  selectedPaymentPlan: PaymentPlan;
  hasSelectedPlan: boolean;
  isPlanSelectionComplete: boolean;
  
  // State management
  setSelectedPaymentPlan: (plan: PaymentPlan) => void;
  updatePaymentPlan: (plan: PaymentPlan) => Promise<void>;
  
  // Loading states
  isUpdatingPlan: boolean;
  
  // Error states
  error: string | null;
  clearError: () => void;
  
  // Debug/testing functions
  clearLocalStorage: () => void;
}

export const usePaymentPlanState = ({
  studentData,
  studentPayments,
  loading,
  refetch,
}: UsePaymentPlanStateProps): UsePaymentPlanStateReturn => {
  const [localSelectedPlan, setLocalSelectedPlan] = useState<PaymentPlan>('not_selected');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a unique key for localStorage based on student and cohort
  const localStorageKey = useMemo(() => {
    if (!studentData?.id || !studentData?.cohort_id) return null;
    return `paymentPlan_${studentData.id}_${studentData.cohort_id}`;
  }, [studentData?.id, studentData?.cohort_id]);

  // Determine the current payment plan from multiple sources
  const currentPaymentPlan = useMemo((): PaymentPlan => {
    try {
      // Priority 1: Server data (most authoritative)
      if (studentPayments && studentPayments.length > 0) {
        const serverPlan = studentPayments[0]?.payment_plan;
        if (serverPlan && serverPlan !== 'not_selected') {
          logger.debug('Using server payment plan:', { plan: serverPlan });
          return serverPlan as PaymentPlan;
        }
      }

      // If we have loaded student payments but there are none, or if we have payments but no plan is selected,
      // then we should show 'not_selected' regardless of localStorage
      if (studentPayments !== null) {
        logger.debug('No payment plan in database, showing not_selected');
        // Clear localStorage since server data takes precedence
        if (localStorageKey && typeof window !== 'undefined') {
          localStorage.removeItem(localStorageKey);
        }
        return 'not_selected';
      }

      // Priority 2: Local state (for immediate UI updates during plan selection)
      if (localSelectedPlan !== 'not_selected') {
        logger.debug('Using local payment plan:', { plan: localSelectedPlan });
        return localSelectedPlan;
      }

      // Priority 3: localStorage (only if we haven't loaded server data yet)
      if (localStorageKey && typeof window !== 'undefined') {
        const storedPlan = localStorage.getItem(localStorageKey);
        if (storedPlan && storedPlan !== 'not_selected') {
          logger.debug('Using stored payment plan:', { plan: storedPlan });
          return storedPlan as PaymentPlan;
        }
      }

      // Default: no plan selected
      return 'not_selected';
    } catch (error) {
      logger.error('Error determining payment plan:', { error });
      return 'not_selected';
    }
  }, [studentPayments, localSelectedPlan, localStorageKey]);

  // Update local state when server data changes
  useEffect(() => {
    if (studentPayments && studentPayments.length > 0) {
      const serverPlan = studentPayments[0]?.payment_plan;
      if (serverPlan && serverPlan !== 'not_selected') {
        setLocalSelectedPlan(serverPlan as PaymentPlan);
        // Update localStorage to match server
        if (localStorageKey && typeof window !== 'undefined') {
          localStorage.setItem(localStorageKey, serverPlan);
        }
      } else {
        // Server indicates no plan selected, clear local state and localStorage
        setLocalSelectedPlan('not_selected');
        if (localStorageKey && typeof window !== 'undefined') {
          localStorage.removeItem(localStorageKey);
        }
      }
    } else if (studentPayments !== null) {
      // No student payments in database, clear local state and localStorage
      setLocalSelectedPlan('not_selected');
      if (localStorageKey && typeof window !== 'undefined') {
        localStorage.removeItem(localStorageKey);
      }
    }
  }, [studentPayments, localStorageKey]);

  // Determine if a plan has been selected
  const hasSelectedPlan = useMemo(() => {
    return currentPaymentPlan !== 'not_selected';
  }, [currentPaymentPlan]);

  // Determine if plan selection is complete (plan selected and data loaded)
  const isPlanSelectionComplete = useMemo(() => {
    const result = hasSelectedPlan && !loading && studentPayments !== null;
    console.log('🔄 [usePaymentPlanState] isPlanSelectionComplete calculation:', {
      hasSelectedPlan,
      loading,
      studentPaymentsIsNull: studentPayments === null,
      studentPaymentsLength: studentPayments?.length || 0,
      result,
    });
    return result;
  }, [hasSelectedPlan, loading, studentPayments]);

  // Update payment plan in database and local state
  const updatePaymentPlan = async (plan: PaymentPlan) => {
    if (!studentData?.id || !studentData?.cohort_id) {
      setError('Student data not available');
      return;
    }

    setIsUpdatingPlan(true);
    setError(null);

    try {
      logger.info('Updating payment plan:', {
        studentId: studentData.id,
        cohortId: studentData.cohort_id,
        plan,
      });

      // Import the service dynamically to avoid circular dependencies
      const { studentPaymentsService } = await import('@/services/studentPayments.service');
      
      const result = await studentPaymentsService.updateStudentPaymentPlan(
        studentData.id,
        studentData.cohort_id,
        plan
      );

      if (result.success) {
        // Update local state immediately for responsive UI
        setLocalSelectedPlan(plan);
        
        // Update localStorage
        if (localStorageKey && typeof window !== 'undefined') {
          localStorage.setItem(localStorageKey, plan);
        }

        // Refresh server data to ensure consistency
        await refetch();

        logger.info('Payment plan updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update payment plan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment plan';
      setError(errorMessage);
      logger.error('Error updating payment plan:', { error: err, plan });
      throw err;
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Set selected plan (for immediate UI updates)
  const setSelectedPaymentPlan = (plan: PaymentPlan) => {
    setLocalSelectedPlan(plan);
    if (localStorageKey && typeof window !== 'undefined') {
      localStorage.setItem(localStorageKey, plan);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Clear localStorage for testing/debugging purposes
  const clearLocalStorage = () => {
    if (localStorageKey && typeof window !== 'undefined') {
      localStorage.removeItem(localStorageKey);
      setLocalSelectedPlan('not_selected');
      logger.info('Cleared localStorage for payment plan');
    }
  };

  return {
    selectedPaymentPlan: currentPaymentPlan,
    hasSelectedPlan,
    isPlanSelectionComplete,
    setSelectedPaymentPlan,
    updatePaymentPlan,
    isUpdatingPlan,
    error,
    clearError,
    clearLocalStorage, // Export this for debugging
  };
};
