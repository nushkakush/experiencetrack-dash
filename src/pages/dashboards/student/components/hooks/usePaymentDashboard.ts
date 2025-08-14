import { useState, useEffect } from 'react';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { PaymentSubmissionData } from '@/types/payments';

// Define the installment type that matches what we get from the database
interface DatabaseInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  amountPaid: number;
  amountPending: number;
  semesterNumber?: number;
}

export interface UsePaymentDashboardProps {
  paymentBreakdown: PaymentBreakdown;
  onPaymentSubmission?: (paymentData: PaymentSubmissionData) => void;
}

export const usePaymentDashboard = ({
  paymentBreakdown,
  onPaymentSubmission
}: UsePaymentDashboardProps) => {
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [selectedInstallment, setSelectedInstallment] = useState<DatabaseInstallment | null>(null);
  const [selectedInstallmentKey, setSelectedInstallmentKey] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  // Automatically expand semesters with pending payments
  useEffect(() => {
    if (paymentBreakdown?.semesters) {
      const semestersWithPendingPayments = new Set<number>();
      
      paymentBreakdown.semesters.forEach(semester => {
        const hasPendingPayment = semester.instalments?.some(installment => {
          // Check if any installment needs payment
          const needsPayment = (installment as any).amountPending > 0;
          const paymentNeededStatuses = ['pending', 'overdue', 'partially_paid_overdue', 'partially_paid_days_left'];
          const hasPaymentNeededStatus = paymentNeededStatuses.includes(installment.status);
          
          return needsPayment && hasPaymentNeededStatus;
        });
        
        if (hasPendingPayment) {
          semestersWithPendingPayments.add(semester.semesterNumber);
        }
      });
      
      setExpandedSemesters(semestersWithPendingPayments);
    }
  }, [paymentBreakdown]);

  // Remove localStorage persistence since we're not using manual clicks anymore
  useEffect(() => {
    // Clear any saved state since we're using automatic expansion
    localStorage.removeItem('selectedInstallmentKey');
  }, []);

  const toggleSemester = (semesterNumber: number) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(semesterNumber)) {
        newSet.delete(semesterNumber);
      } else {
        newSet.add(semesterNumber);
      }
      return newSet;
    });
  };

  // Keep this for backward compatibility but it's no longer needed for payment forms
  const handleInstallmentClick = (installment: DatabaseInstallment, semesterNumber: number, installmentIndex: number) => {
    // This function is no longer needed since payment forms show automatically
    // But keeping it for backward compatibility
    console.log('Installment click - no longer needed for payment forms');
  };

  const handlePaymentSubmit = (paymentData: PaymentSubmissionData) => {
    if (onPaymentSubmission) {
      onPaymentSubmission(paymentData);
    }
    // No need to reset form state since forms show/hide automatically
  };

  return {
    expandedSemesters,
    selectedInstallment,
    selectedInstallmentKey,
    showPaymentForm,
    toggleSemester,
    handleInstallmentClick,
    handlePaymentSubmit
  };
};
