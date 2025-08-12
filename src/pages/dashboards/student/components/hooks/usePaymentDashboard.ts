import { useState, useEffect } from 'react';

interface Installment {
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  amountPayable: number;
}

interface Semester {
  semesterNumber: number;
  instalments: Installment[];
}

interface PaymentBreakdown {
  semesters: Semester[];
}

interface PaymentData {
  paymentMethod: string;
  amount: number;
  details: Record<string, any>;
  files: Record<string, File>;
}

export interface UsePaymentDashboardProps {
  paymentBreakdown: PaymentBreakdown;
  onPaymentSubmission?: (paymentData: PaymentData) => void;
}

export const usePaymentDashboard = ({
  paymentBreakdown,
  onPaymentSubmission
}: UsePaymentDashboardProps) => {
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
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

  // Expand all semesters by default for better UX
  useEffect(() => {
    if (paymentBreakdown?.semesters) {
      const allSemesterNumbers = paymentBreakdown.semesters.map((semester: Semester) => semester.semesterNumber);
      setExpandedSemesters(new Set(allSemesterNumbers));
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

  const handleInstallmentClick = (installment: Installment, semesterNumber: number, installmentIndex: number) => {
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

  const handlePaymentSubmit = (paymentData: PaymentData) => {
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
