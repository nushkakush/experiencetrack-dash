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

interface FinancialSummaryProps {
  student: StudentPaymentSummary;
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
        // eslint-disable-next-line no-console
        try { (await import('sonner')).toast?.error?.('Failed to load financial summary.'); } catch (_) {}
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [student]);

  const calculateFinancialData = async (): Promise<CalculatedFinancialData> => {
    if (
      !student.student_id ||
      !student.payment_plan ||
      student.payment_plan === 'not_selected'
    ) {
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
      // Fetch canonical breakdown and fee structure from Edge Function
      const { breakdown: feeReview, feeStructure } = await getFullPaymentView({
        studentId: String(student.student_id),
        cohortId: String(student.student?.cohort_id),
        paymentPlan: student.payment_plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
        scholarshipId: student.scholarship_id || undefined,
      });

      if (!feeStructure) {
        throw new Error('Fee structure not found in edge function response');
      }

      // Calculate total amount (program fee + admission fee)
      const totalAmount = feeReview?.overallSummary?.totalAmountPayable || 0;
      const admissionFee = feeReview?.admissionFee?.totalPayable || feeStructure.admission_fee;

      // Fetch verified payment transactions
      let verifiedPayments = 0;
      let totalInstallments = 0;
      let paidInstallments = 0;
      let admissionFeePaid = false;

      if (student.student_payment_id) {
        const transactions = await paymentTransactionService.getByPaymentId(
          student.student_payment_id
        );

        if (transactions && Array.isArray(transactions)) {
          // Only count verified payments
          const approvedTransactions = transactions.filter(
            t => t.verification_status === 'approved'
          );
          verifiedPayments = approvedTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          );
        }
      }

      // Check if admission fee is paid
      // First check if token_fee_paid is explicitly set in student data
      if (student.token_fee_paid) {
        admissionFeePaid = true;
      } else if (student.student_payment_id) {
        // Check the payment record for total_amount_paid
        const { data: paymentRecord } = await supabase
          .from('student_payments')
          .select('total_amount_paid, payment_status')
          .eq('id', student.student_payment_id)
          .maybeSingle();

        if (paymentRecord) {
          // If the payment record shows admission fee is already included in total_amount_paid
          // or if verified payments cover the admission fee
          admissionFeePaid =
            paymentRecord.total_amount_paid >= admissionFee ||
            verifiedPayments >= admissionFee;
        } else {
          // Fallback: check if verified payments cover admission fee
          admissionFeePaid = verifiedPayments >= admissionFee;
        }
      } else {
        // Fallback: check if verified payments cover admission fee
        admissionFeePaid = verifiedPayments >= admissionFee;
      }

      // Calculate paid amount (include admission fee if it's been paid)
      let paidAmount = verifiedPayments;

      // If admission fee is considered paid (either through transactions or system logic), include it
      if (admissionFeePaid && verifiedPayments < admissionFee) {
        // If admission fee is marked as paid but not enough transactions,
        // assume admission fee is paid and add the difference
        paidAmount = Math.max(paidAmount, admissionFee);
      }

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
