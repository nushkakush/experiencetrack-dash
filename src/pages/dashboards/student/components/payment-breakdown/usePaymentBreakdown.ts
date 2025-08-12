import { useState, useEffect } from 'react';

interface Semester {
  semesterNumber: number;
  instalments: Array<{
    paymentDate: string;
    baseAmount: number;
    gstAmount: number;
    scholarshipAmount: number;
    amountPayable: number;
  }>;
  total: {
    baseAmount: number;
    gstAmount: number;
    scholarshipAmount: number;
    totalPayable: number;
  };
}

interface PaymentBreakdown {
  semesters: Semester[];
  admissionFee: {
    baseAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
  overallSummary: {
    totalProgramFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
}

interface UsePaymentBreakdownProps {
  paymentBreakdown: PaymentBreakdown;
}

export const usePaymentBreakdown = ({ paymentBreakdown }: UsePaymentBreakdownProps) => {
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [expandedInstallments, setExpandedInstallments] = useState<Set<string>>(new Set());

  // Expand all semesters by default for better UX
  useEffect(() => {
    if (paymentBreakdown?.semesters) {
      const allSemesterNumbers = paymentBreakdown.semesters.map((semester: Semester) => semester.semesterNumber);
      setExpandedSemesters(new Set(allSemesterNumbers));
    }
  }, [paymentBreakdown]);

  const toggleSemester = (semesterNumber: number) => {
    const newExpanded = new Set(expandedSemesters);
    if (newExpanded.has(semesterNumber)) {
      newExpanded.delete(semesterNumber);
    } else {
      newExpanded.add(semesterNumber);
    }
    setExpandedSemesters(newExpanded);
  };

  const toggleInstallment = (installmentKey: string) => {
    const newExpanded = new Set(expandedInstallments);
    if (newExpanded.has(installmentKey)) {
      newExpanded.delete(installmentKey);
    } else {
      newExpanded.add(installmentKey);
    }
    setExpandedInstallments(newExpanded);
  };

  const isSemesterExpanded = (semesterNumber: number) => {
    return expandedSemesters.has(semesterNumber);
  };

  const isInstallmentExpanded = (installmentKey: string) => {
    return expandedInstallments.has(installmentKey);
  };

  return {
    expandedSemesters,
    expandedInstallments,
    toggleSemester,
    toggleInstallment,
    isSemesterExpanded,
    isInstallmentExpanded
  };
};
