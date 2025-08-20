import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { getScholarshipPercentageForDisplay } from '@/utils/scholarshipUtils';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { supabase } from '@/integrations/supabase/client';
import { FeeStructureService } from '@/services/feeStructure.service';

interface FinancialSummaryProps {
  student: StudentPaymentSummary;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: any;
    sem_wise_dates?: any;
    instalment_wise_dates?: any;
  };
}

interface CalculatedFinancialData {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  verifiedPayments: number;
  totalInstallments: number;
  paidInstallments: number;
  progressPercentage: number;
  admissionFee: number;
  admissionFeePaid: boolean;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  student,
  feeStructure,
}) => {
  const [scholarshipPercentage, setScholarshipPercentage] = useState<number>(0);
  const [financialData, setFinancialData] = useState<CalculatedFinancialData>({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    verifiedPayments: 0,
    totalInstallments: 0,
    paidInstallments: 0,
    progressPercentage: 0,
    admissionFee: 0,
    admissionFeePaid: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        // Fetch scholarship percentage
        if (student.scholarship_id) {
          const percentage = await getScholarshipPercentageForDisplay(
            student.scholarship_id
          );
          setScholarshipPercentage(percentage);
        }

        // Calculate financial data
        const calculatedData = await calculateFinancialData();
        setFinancialData(calculatedData);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        // Show a toast for better visibility in UI
        // Using non-blocking toast to keep UX smooth
        // If toast API is available globally, this will display an error message
        try {
          (await import('sonner')).toast?.error?.(
            'Failed to load financial summary.'
          );
        } catch (_) {
          void 0; // deliberate no-op to satisfy no-empty rule
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [student]);

  const calculateFinancialData = async (): Promise<CalculatedFinancialData> => {

    
    // Early validation - don't call payment engine if required data is missing
    const validPaymentPlans = ['one_shot', 'sem_wise', 'instalment_wise'];
    
    if (
      !student.student_id ||
      student.student_id === 'undefined' ||
      !student.student?.cohort_id ||
      student.student?.cohort_id === 'undefined' ||
      !student.payment_plan ||
      student.payment_plan === 'not_selected' ||
      student.payment_plan === 'undefined' ||
      !validPaymentPlans.includes(student.payment_plan)
    ) {
      console.log('🔍 [FinancialSummary] Skipping payment engine call - missing required data:', {
        student_id: student.student_id,
        cohort_id: student.student?.cohort_id,
        payment_plan: student.payment_plan,
        hasStudent: !!student.student,
        isValidPaymentPlan: validPaymentPlans.includes(student.payment_plan)
      });
      
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        verifiedPayments: 0,
        totalInstallments: 0,
        paidInstallments: 0,
        progressPercentage: 0,
        admissionFee: 0,
        admissionFeePaid: false,
      };
    }

    try {
      // Debug: Log the exact parameters being sent to payment engine
      const paymentParams = {
        studentId: String(student.student_id),
        cohortId: String(student.student?.cohort_id),
        paymentPlan: student.payment_plan as
          | 'one_shot'
          | 'sem_wise'
          | 'instalment_wise',
        scholarshipId: student.scholarship_id || undefined,
      };
      

      
      // First, try to get the student's custom fee structure
      const customFeeStructure = await FeeStructureService.getFeeStructure(
        String(student.student?.cohort_id),
        String(student.student_id)
      );
      
      // Use custom structure if it exists, otherwise use the provided cohort structure
      const feeStructureToUse = customFeeStructure || feeStructure;
      

      
      // Fetch canonical breakdown and fee structure from Edge Function
      // Use the correct fee structure (custom if exists, cohort otherwise)
      const { breakdown: feeReview, feeStructure: responseFeeStructure } = await getFullPaymentView({
        ...paymentParams,
        feeStructureData: {
          total_program_fee: feeStructureToUse.total_program_fee,
          admission_fee: feeStructureToUse.admission_fee,
          number_of_semesters: feeStructureToUse.number_of_semesters,
          instalments_per_semester: feeStructureToUse.instalments_per_semester,
          one_shot_discount_percentage: feeStructureToUse.one_shot_discount_percentage,
          one_shot_dates: feeStructureToUse.one_shot_dates,
          sem_wise_dates: feeStructureToUse.sem_wise_dates,
          instalment_wise_dates: feeStructureToUse.instalment_wise_dates,
        }
      });

      if (!responseFeeStructure) {
        throw new Error('Fee structure not found in edge function response');
      }

      // Calculate total amount (program fee + admission fee)
      const totalAmount = feeReview?.overallSummary?.totalAmountPayable || 0;
      const admissionFee =
        feeReview?.admissionFee?.totalPayable || responseFeeStructure.admission_fee;

      // Fetch verified payment transactions
      let verifiedPayments = 0;
      let totalInstallments = 0;
      let paidInstallments = 0;
      let admissionFeePaid = false;

      if (student.student_payment_id) {
        const txResponse = await paymentTransactionService.getByPaymentId(
          student.student_payment_id
        );

        const txs =
          txResponse?.success && Array.isArray(txResponse.data)
            ? txResponse.data
            : [];

        if (txs.length > 0) {
          // Count both approved and verification pending payments (to match Payment Schedule logic)
          const relevantTransactions = txs.filter(
            t =>
              t?.verification_status === 'approved' ||
              t?.verification_status === 'verification_pending'
          );
          verifiedPayments = relevantTransactions.reduce(
            (sum, t) => sum + Number(t?.amount || 0),
            0
          );
        }
      }

      // For the Financial Summary modal ONLY:
      // Treat admission fee as already paid since students have registered
      // This logic only affects this specific modal display and no other calculations
      admissionFeePaid = true;

      // Calculate paid amount including admission fee (since students are registered)
      // This is specific to this Financial Summary view only
      const paidAmount = verifiedPayments + admissionFee;

      const pendingAmount = Math.max(0, totalAmount - paidAmount);
      const progressPercentage =
        totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      // Calculate installments based on payment plan
      if (student.payment_plan === 'one_shot') {
        totalInstallments = 1;
        paidInstallments = verifiedPayments > 0 ? 1 : 0;
      } else if (student.payment_plan === 'sem_wise') {
        totalInstallments = feeStructure.number_of_semesters;
        // Calculate paid installments based on verified payments
        const installmentAmount =
          (totalAmount - feeStructure.admission_fee) / totalInstallments;
        paidInstallments = Math.floor(verifiedPayments / installmentAmount);
      } else if (student.payment_plan === 'instalment_wise') {
        totalInstallments =
          feeStructure.number_of_semesters *
          feeStructure.instalments_per_semester;
        // Calculate paid installments based on verified payments
        const installmentAmount =
          (totalAmount - feeStructure.admission_fee) / totalInstallments;
        paidInstallments = Math.floor(verifiedPayments / installmentAmount);
      }

      return {
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount: 0, // TODO: Calculate based on due dates
        verifiedPayments,
        totalInstallments,
        paidInstallments,
        progressPercentage,
        admissionFee,
        admissionFeePaid,
      };
    } catch (error) {
      console.error('Error calculating financial data:', error);
      
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        verifiedPayments: 0,
        totalInstallments: 0,
        paidInstallments: 0,
        progressPercentage: 0,
        admissionFee: 0,
        admissionFeePaid: false,
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentPlanDisplay = () => {
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return 'Not Selected';
    }

    switch (student.payment_plan) {
      case 'one_shot':
        return 'One-Shot Payment';
      case 'sem_wise':
        return 'Semester-wise Payment';
      case 'instalment_wise':
        return 'Installment-wise Payment';
      default:
        return student.payment_plan;
    }
  };

  // Check if payment plan is selected
  const hasPaymentPlan =
    student.payment_plan && student.payment_plan !== 'not_selected';

  if (loading) {
    return (
      <div className='space-y-3'>
        <div className='animate-pulse'>
          <div className='h-4 bg-muted rounded mb-2'></div>
          <div className='h-4 bg-muted rounded mb-2'></div>
          <div className='h-4 bg-muted rounded mb-2'></div>
          <div className='h-4 bg-muted rounded mb-2'></div>
        </div>
      </div>
    );
  }

  // Empty state when no payment plan is selected
  if (!hasPaymentPlan) {
    return (
      <>
        <div className='text-center py-8'>
          <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
            <CreditCard className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold text-foreground mb-2'>
            No Payment Plan Selected
          </h3>
          <p className='text-sm text-muted-foreground mb-4 max-w-sm mx-auto'>
            This student hasn't chosen a payment plan yet. Once a plan is
            selected, you'll see detailed financial information here.
          </p>

          {/* Payment Plan Options Preview */}
          <div className='grid grid-cols-1 gap-3 max-w-xs mx-auto'>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <DollarSign className='h-5 w-5 text-green-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>One-Shot Payment</p>
                <p className='text-xs text-muted-foreground'>
                  Pay everything upfront
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <Calendar className='h-5 w-5 text-blue-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>Semester-wise</p>
                <p className='text-xs text-muted-foreground'>Pay by semester</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <CreditCard className='h-5 w-5 text-purple-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>Installment-wise</p>
                <p className='text-xs text-muted-foreground'>
                  Pay in installments
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator className='bg-border' />
      </>
    );
  }

  return (
    <>
      <div>
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Total Amount:</span>
            <span className='font-medium text-foreground'>
              {formatCurrency(financialData.totalAmount)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              Admission Fee:
            </span>
            <span className='font-medium text-foreground'>
              {formatCurrency(financialData.admissionFee || 0)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Paid Amount:</span>
            <span className='font-medium text-green-400'>
              {formatCurrency(financialData.paidAmount)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              Pending Amount:
            </span>
            <span className='font-medium text-orange-400'>
              {formatCurrency(financialData.pendingAmount)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Payment Plan:</span>
            <span className='font-medium text-blue-400'>
              {getPaymentPlanDisplay()}
            </span>
          </div>
          {student.scholarship_name && scholarshipPercentage > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Scholarship:
              </span>
              <span className='font-medium text-blue-400'>
                {student.scholarship_name} ({scholarshipPercentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className='mt-4'>
          <div className='flex justify-between text-sm mb-2'>
            <span className='text-foreground'>
              {formatCurrency(financialData.paidAmount)} /{' '}
              {formatCurrency(financialData.totalAmount)}
            </span>
            <span className='text-foreground'>
              {financialData.progressPercentage}%
            </span>
          </div>
          <Progress
            value={financialData.progressPercentage}
            className='h-2 bg-muted'
          />
          <div className='text-xs text-muted-foreground mt-1'>
            {financialData.paidInstallments} of{' '}
            {financialData.totalInstallments} installments paid
          </div>
        </div>
      </div>
      <Separator className='bg-border' />
    </>
  );
};
