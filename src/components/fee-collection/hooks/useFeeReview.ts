import React, { useState, useMemo } from 'react';
import { PaymentPlan, FeeStructure, Scholarship } from '@/types/fee';
//

interface UseFeeReviewProps {
  feeStructure: FeeStructure;
  scholarships: Scholarship[];
  cohortStartDate: string;
}

export const useFeeReview = ({ feeStructure, scholarships, cohortStartDate }: UseFeeReviewProps) => {
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>('one_shot');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('no_scholarship');
  const [editablePaymentDates, setEditablePaymentDates] = useState<Record<string, string>>({});
  const [engineReview, setEngineReview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const feeReview = useMemo(() => engineReview, [engineReview]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const breakdown = await generateLocalPreviewBreakdown(
          feeStructure,
          selectedPaymentPlan,
          selectedScholarshipId,
          scholarships,
          cohortStartDate,
        );
        if (!cancelled) setEngineReview(breakdown as any);
      } catch (err) {
        console.error('fee preview calculation failed', err);
        (async () => { try { (await import('sonner')).toast?.error?.('Failed to load fee preview.'); } catch (_) {} })();
        if (!cancelled) setEngineReview(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [feeStructure, selectedPaymentPlan, selectedScholarshipId, scholarships, cohortStartDate]);

  const handlePaymentDateChange = (key: string, value: string) => {
    setEditablePaymentDates(prev => ({ ...prev, [key]: value }));
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
    loading,
    handlePaymentDateChange,
    handleScholarshipSelect,
    handlePaymentPlanChange
  };
};

// ----- Local preview calculator (pure, client-side) -----
const GST_RATE = 18;
const calculateGST = (baseAmount: number): number => {
  return Math.round(baseAmount * (GST_RATE / 100) * 100) / 100;
};
const extractGSTFromTotal = (totalAmount: number): number => {
  const baseAmount = totalAmount / (1 + GST_RATE / 100);
  const gstAmount = totalAmount - baseAmount;
  return Math.round(gstAmount * 100) / 100;
};
const extractBaseAmountFromTotal = (totalAmount: number): number => {
  return Math.round((totalAmount / (1 + GST_RATE / 100)) * 100) / 100;
};
const calculateOneShotDiscount = (baseAmount: number, discountPercentage: number): number => {
  return Math.round(baseAmount * (discountPercentage / 100) * 100) / 100;
};
const getInstalmentDistribution = (instalmentsPerSemester: number): number[] => {
  switch (instalmentsPerSemester) {
    case 2:
      return [60, 40];
    case 3:
      return [40, 40, 20];
    case 4:
      return [30, 30, 30, 10];
    default: {
      const percentage = 100 / Math.max(1, instalmentsPerSemester);
      return Array(instalmentsPerSemester).fill(percentage);
    }
  }
};
const distributeScholarshipBackwards = (installmentAmounts: number[], totalScholarshipAmount: number): number[] => {
  const scholarshipDistribution = new Array(installmentAmounts.length).fill(0);
  let remainingScholarship = totalScholarshipAmount;
  for (let i = installmentAmounts.length - 1; i >= 0 && remainingScholarship > 0; i--) {
    const installmentAmount = installmentAmounts[i];
    const scholarshipForThisInstallment = Math.min(remainingScholarship, installmentAmount);
    scholarshipDistribution[i] = scholarshipForThisInstallment;
    remainingScholarship -= scholarshipForThisInstallment;
  }
  return scholarshipDistribution;
};
const generateSemesterPaymentDates = (semesterNumber: number, instalmentsPerSemester: number, cohortStartDate: string): string[] => {
  const startDate = new Date(cohortStartDate);
  let semesterStartDate: Date;
  if (semesterNumber === 1) {
    semesterStartDate = new Date(startDate);
  } else {
    semesterStartDate = new Date(startDate);
    semesterStartDate.setMonth(startDate.getMonth() + (semesterNumber - 1) * 6);
  }
  const paymentDates: string[] = [];
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const paymentDate = new Date(semesterStartDate);
    paymentDate.setMonth(semesterStartDate.getMonth() + i * 2); // 2 months apart
    paymentDates.push(paymentDate.toISOString().split('T')[0]);
  }
  return paymentDates;
};

type LocalInstallmentView = {
  paymentDate: string;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  installmentNumber?: number;
};

type LocalSemesterView = {
  semesterNumber: number;
  instalments: LocalInstallmentView[];
  total: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
};

type LocalBreakdown = {
  admissionFee: {
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
  };
  semesters: LocalSemesterView[];
  oneShotPayment?: LocalInstallmentView;
  overallSummary: {
    totalProgramFee: number;
    admissionFee: number;
    totalGST: number;
    totalDiscount: number;
    totalScholarship: number;
    totalAmountPayable: number;
  };
};

const calculateOneShotPaymentLocal = (
  totalProgramFee: number,
  admissionFee: number,
  discountPercentage: number,
  scholarshipAmount: number,
  cohortStartDate: string,
): LocalInstallmentView => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const baseAmount = remainingBaseFee;
  const oneShotDiscount = calculateOneShotDiscount(totalProgramFee, discountPercentage);
  const amountAfterDiscount = baseAmount - oneShotDiscount;
  const amountAfterScholarship = amountAfterDiscount - scholarshipAmount;
  const baseFeeGST = calculateGST(amountAfterScholarship);
  const finalAmount = amountAfterScholarship + baseFeeGST;
  return {
    paymentDate: cohortStartDate,
    baseAmount,
    gstAmount: baseFeeGST,
    scholarshipAmount,
    discountAmount: oneShotDiscount,
    amountPayable: Math.max(0, finalAmount),
  };
};

const calculateSemesterPaymentLocal = (
  semesterNumber: number,
  totalProgramFee: number,
  admissionFee: number,
  numberOfSemesters: number,
  instalmentsPerSemester: number,
  cohortStartDate: string,
  scholarshipAmount: number,
): LocalInstallmentView[] => {
  const admissionFeeBase = extractBaseAmountFromTotal(admissionFee);
  const remainingBaseFee = totalProgramFee - admissionFeeBase;
  const semesterFee = remainingBaseFee / numberOfSemesters;
  const installmentPercentages = getInstalmentDistribution(instalmentsPerSemester);
  const installmentAmounts = installmentPercentages.map((percentage) => Math.round(semesterFee * (percentage / 100) * 100) / 100);
  const isLastSemester = semesterNumber === numberOfSemesters;
  const semesterScholarship = isLastSemester ? scholarshipAmount : 0;
  const scholarshipDistribution = isLastSemester ? distributeScholarshipBackwards(installmentAmounts, semesterScholarship) : new Array(installmentAmounts.length).fill(0);
  const discountPerInstallment = 0; // one-shot discount does not apply in sem/instalment wise
  const paymentDates = generateSemesterPaymentDates(semesterNumber, instalmentsPerSemester, cohortStartDate);
  const installments: LocalInstallmentView[] = [];
  for (let i = 0; i < instalmentsPerSemester; i++) {
    const installmentAmount = installmentAmounts[i];
    const installmentScholarship = scholarshipDistribution[i];
    const installmentDiscount = discountPerInstallment;
    const installmentAfterDiscount = installmentAmount - installmentDiscount;
    const installmentAfterScholarship = installmentAfterDiscount - installmentScholarship;
    const installmentGST = calculateGST(installmentAfterScholarship);
    const finalAmount = installmentAfterScholarship + installmentGST;
    installments.push({
      paymentDate: paymentDates[i],
      baseAmount: installmentAmount,
      gstAmount: installmentGST,
      scholarshipAmount: installmentScholarship,
      discountAmount: installmentDiscount,
      amountPayable: Math.max(0, finalAmount),
      installmentNumber: i + 1,
    });
  }
  return installments;
};

async function generateLocalPreviewBreakdown(
  feeStructure: FeeStructure,
  paymentPlan: PaymentPlan,
  selectedScholarshipId: string,
  scholarships: Scholarship[],
  cohortStartDate: string,
): Promise<LocalBreakdown> {
  // Resolve scholarship amount
  let scholarshipAmount = 0;
  const scholarship = scholarships?.find((s) => s.id === selectedScholarshipId);
  if (selectedScholarshipId && selectedScholarshipId !== 'no_scholarship' && scholarship && typeof scholarship.amount_percentage === 'number') {
    scholarshipAmount = Math.round(feeStructure.total_program_fee * (scholarship.amount_percentage / 100) * 100) / 100;
  }

  // Admission fee block
  const admissionFeeBase = extractBaseAmountFromTotal(feeStructure.admission_fee);
  const admissionFeeGST = extractGSTFromTotal(feeStructure.admission_fee);

  const semesters: LocalSemesterView[] = [];
  let oneShotPayment: LocalInstallmentView | undefined = undefined;

  if (paymentPlan === 'sem_wise' || paymentPlan === 'instalment_wise') {
    const installmentsPerSemester = paymentPlan === 'sem_wise' ? 1 : feeStructure.instalments_per_semester;
    for (let sem = 1; sem <= feeStructure.number_of_semesters; sem++) {
      const semesterInstallments = calculateSemesterPaymentLocal(
        sem,
        feeStructure.total_program_fee,
        feeStructure.admission_fee,
        feeStructure.number_of_semesters,
        installmentsPerSemester,
        cohortStartDate,
        scholarshipAmount,
      );
      const semesterTotal = {
        scholarshipAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.scholarshipAmount || 0), 0),
        baseAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.baseAmount || 0), 0),
        gstAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.gstAmount || 0), 0),
        discountAmount: semesterInstallments.reduce((sum, inst) => sum + (inst.discountAmount || 0), 0),
        totalPayable: semesterInstallments.reduce((sum, inst) => sum + (inst.amountPayable || 0), 0),
      };
      semesters.push({ semesterNumber: sem, instalments: semesterInstallments, total: semesterTotal });
    }
  }

  if (paymentPlan === 'one_shot') {
    oneShotPayment = calculateOneShotPaymentLocal(
      feeStructure.total_program_fee,
      feeStructure.admission_fee,
      feeStructure.one_shot_discount_percentage,
      scholarshipAmount,
      cohortStartDate,
    );
  }

  const totalSemesterAmount = semesters.reduce((sum, s) => sum + (s.total?.totalPayable || 0), 0);
  const totalSemesterGST = semesters.reduce((sum, s) => sum + (s.total?.gstAmount || 0), 0);
  const totalSemesterScholarship = semesters.reduce((sum, s) => sum + (s.total?.scholarshipAmount || 0), 0);
  const totalSemesterDiscount = semesters.reduce((sum, s) => sum + (s.total?.discountAmount || 0), 0);
  const totalAmountPayable = feeStructure.admission_fee + totalSemesterAmount + (oneShotPayment?.amountPayable || 0);

  const breakdown: LocalBreakdown = {
    admissionFee: {
      baseAmount: admissionFeeBase,
      scholarshipAmount: 0,
      discountAmount: 0,
      gstAmount: admissionFeeGST,
      totalPayable: feeStructure.admission_fee,
    },
    semesters,
    oneShotPayment,
    overallSummary: {
      totalProgramFee: feeStructure.total_program_fee,
      admissionFee: feeStructure.admission_fee,
      totalGST: totalSemesterGST + admissionFeeGST + (oneShotPayment?.gstAmount || 0),
      totalDiscount: totalSemesterDiscount + (oneShotPayment?.discountAmount || 0),
      totalScholarship: totalSemesterScholarship + (oneShotPayment?.scholarshipAmount || 0),
      totalAmountPayable: Math.max(0, totalAmountPayable),
    },
  };
  return breakdown;
}
