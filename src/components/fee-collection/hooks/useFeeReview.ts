import React, { useState, useMemo } from 'react';
import { PaymentPlan, FeeStructure, Scholarship } from '@/types/fee';
import { generateFeeStructureReview, calculateGST, extractGSTFromTotal, extractBaseAmountFromTotal } from '@/utils/feeCalculations';
import { logger } from '@/lib/logging/Logger';

interface UseFeeReviewProps {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];
  cohortStartDate: string;
}

export const useFeeReview = ({ feeStructure, scholarships, cohortStartDate }: UseFeeReviewProps) => {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>('one_shot');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('no_scholarship');
  const [editablePaymentDates, setEditablePaymentDates] = useState<Record<string, string>>({});

  // Generate fee structure review based on current selections
  const feeReview = useMemo(() => {
    try {
      logger.debug('Step3Review - Generating fee review with:', {
        selectedScholarshipId,
        scholarships: scholarships.map(s => ({ 
          id: s.id, 
          name: s.name, 
          amount_percentage: s.amount_percentage, 
          start_percentage: s.start_percentage, 
          end_percentage: s.end_percentage 
        })),
        testScore: 85,
        selectedScholarship: selectedScholarshipId === 'no_scholarship' ? undefined : scholarships.find(s => s.id === selectedScholarshipId)
      });

      return generateFeeStructureReview(
        feeStructure,
        scholarships,
        selectedPaymentPlan,
        85, // Default test score for preview
        cohortStartDate,
        selectedScholarshipId === 'no_scholarship' ? undefined : selectedScholarshipId
      );
    } catch (error) {
      logger.error('Error generating fee review:', error);
      // Return a default structure to prevent crashes
      return {
        admissionFee: {
          baseAmount: extractBaseAmountFromTotal(feeStructure.admission_fee),
          scholarshipAmount: 0,
          discountAmount: 0,
          gstAmount: extractGSTFromTotal(feeStructure.admission_fee),
          totalPayable: feeStructure.admission_fee
        },
        semesters: [],
        oneShotPayment: null,
        overallSummary: {
          totalProgramFee: feeStructure.total_program_fee - feeStructure.admission_fee,
          admissionFee: feeStructure.admission_fee,
          totalGST: calculateGST(feeStructure.total_program_fee - feeStructure.admission_fee) + extractGSTFromTotal(feeStructure.admission_fee),
          totalDiscount: 0,
          totalAmountPayable: feeStructure.total_program_fee + calculateGST(feeStructure.total_program_fee - feeStructure.admission_fee) + extractGSTFromTotal(feeStructure.admission_fee)
        }
      };
    }
  }, [feeStructure, scholarships, selectedPaymentPlan, selectedScholarshipId, cohortStartDate]);

  const handlePaymentDateChange = (key: string, value: string) => {
    setEditablePaymentDates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleScholarshipSelect = (scholarshipId: string) => {
    setSelectedScholarshipId(scholarshipId);
  };

  const handlePaymentPlanChange = (plan: PaymentPlan) => {
    setSelectedPaymentPlan(plan);
  };

  return {
    selectedPaymentPlan,
    selectedScholarshipId,
    editablePaymentDates,
    feeReview,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange
  };
};
