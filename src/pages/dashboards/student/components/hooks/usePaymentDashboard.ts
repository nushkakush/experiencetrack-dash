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

  // Persist form state across re-renders
  useEffect(() => {
    const savedKey = localStorage.getItem('selectedInstallmentKey');
    if (savedKey) {
      setSelectedInstallmentKey(savedKey);
      setShowPaymentForm(true);
    }
  }, []);

  // Save form state to localStorage
  useEffect(() => {
    if (selectedInstallmentKey) {
      localStorage.setItem('selectedInstallmentKey', selectedInstallmentKey);
    } else {
      localStorage.removeItem('selectedInstallmentKey');
    }
  }, [selectedInstallmentKey]);

  // Find semester with immediate payment due and expand only that one
  useEffect(() => {
    if (paymentBreakdown?.semesters) {
      const today = new Date();
      let semesterWithImmediateDue: number | null = null;
      
      // Find the semester with the earliest pending/overdue payment
      for (const semester of paymentBreakdown.semesters) {
        const hasImmediateDue = semester.instalments?.some(installment => {
          const dueDate = new Date(installment.paymentDate);
          const isPending = installment.status === 'pending' || installment.status === 'overdue';
          const isDueSoon = dueDate <= today || dueDate.getTime() - today.getTime() <= 30 * 24 * 60 * 60 * 1000; // Within 30 days
          return isPending && isDueSoon;
        });
        
        if (hasImmediateDue) {
          semesterWithImmediateDue = semester.semesterNumber;
          break;
        }
      }
      
      // If no immediate due found, expand the first semester
      if (semesterWithImmediateDue === null && paymentBreakdown.semesters.length > 0) {
        semesterWithImmediateDue = paymentBreakdown.semesters[0].semesterNumber;
      }
      
      // Set only the semester with immediate payment due as expanded
      if (semesterWithImmediateDue !== null) {
        setExpandedSemesters(new Set([semesterWithImmediateDue]));
      }
    }
  }, [paymentBreakdown]);

  const toggleSemester = (semesterNumber: number) => {
    setExpandedSemesters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(semesterNumber)) {
        newSet.delete(semesterNumber);
      } else {
        newSet.add(semesterNumber);
      }
      return newSet;
    });
  };

  const handleInstallmentClick = (installment: DatabaseInstallment, semesterNumber: number, installmentIndex: number) => {
    const key = `${semesterNumber}-${installmentIndex}`;
    
    // If clicking the same installment, toggle the form
    if (selectedInstallmentKey === key) {
      setShowPaymentForm(!showPaymentForm);
      if (!showPaymentForm) {
        setSelectedInstallment(null);
        setSelectedInstallmentKey('');
        localStorage.removeItem('selectedInstallmentKey');
      }
    } else {
      // If clicking a different installment, open the form for that installment
      setSelectedInstallment(installment);
      setSelectedInstallmentKey(key);
      setShowPaymentForm(true);
    }
  };

  const handlePaymentSubmit = (paymentData: PaymentSubmissionData) => {
    if (onPaymentSubmission) {
      onPaymentSubmission(paymentData);
    }
    // Reset form after submission
    setShowPaymentForm(false);
    setSelectedInstallment(null);
    setSelectedInstallmentKey('');
    localStorage.removeItem('selectedInstallmentKey');
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
