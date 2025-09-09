import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, IndianRupee } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { getTotalDiscountPercentage } from '@/utils/scholarshipUtils';
import {
  ProgressCalculator,
  ProgressCalculationResult,
} from '@/utils/progressCalculation';
import { CommunicationPreferences } from './CommunicationPreferences';

interface FinancialSummaryProps {
  student: StudentPaymentSummary;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

// Use the centralized progress calculation result
type CalculatedFinancialData = ProgressCalculationResult & {
  overdueAmount: number;
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  student,
  feeStructure,
}) => {
  const [totalScholarshipPercentage, setTotalScholarshipPercentage] =
    useState<number>(0);
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

  const calculateFinancialData =
    useCallback(async (): Promise<CalculatedFinancialData> => {
      try {
        // Use the centralized progress calculator
        const progressResult = await ProgressCalculator.getProgress(
          student,
          feeStructure
        );

        console.log('🔍 [FinancialSummary] Progress calculation result:', {
          student_id: student.student_id,
          calculation_method: progressResult.calculationMethod,
          total_amount: progressResult.totalAmount,
          paid_amount: progressResult.paidAmount,
          progress_percentage: progressResult.progressPercentage,
        });

        return {
          ...progressResult,
          overdueAmount: 0, // TODO: Calculate based on due dates
        };
      } catch (error) {
        console.error('Error calculating financial data:', error);

        // Fallback to database calculation
        const fallback = ProgressCalculator.calculateWithDatabase(student);
        return {
          ...fallback,
          overdueAmount: 0,
        };
      }
    }, [student, feeStructure]);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        // Fetch total scholarship percentage (base + additional)
        if (student.scholarship_id) {
          const totalPercentage = await getTotalDiscountPercentage(
            student.student_id,
            student.scholarship_id
          );
          setTotalScholarshipPercentage(totalPercentage);
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
  }, [calculateFinancialData]);

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
      <div className='space-y-4'>
        <div className='animate-pulse space-y-3'>
          <div className='h-4 bg-muted rounded'></div>
          <div className='h-4 bg-muted rounded'></div>
          <div className='h-4 bg-muted rounded'></div>
          <div className='h-4 bg-muted rounded'></div>
        </div>
      </div>
    );
  }

  // Empty state when no payment plan is selected
  if (!hasPaymentPlan) {
    return (
      <>
        <div className='text-center space-y-6'>
          <div className='space-y-4'>
            <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center'>
              <CreditCard className='h-8 w-8 text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold text-foreground'>
                No Payment Plan Selected
              </h3>
              <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
                This student hasn't chosen a payment plan yet. Once a plan is
                selected, you'll see detailed financial information here.
              </p>
            </div>
          </div>

          {/* Payment Plan Options Preview */}
          <div className='grid grid-cols-1 gap-3 max-w-xs mx-auto'>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <IndianRupee className='h-5 w-5 text-green-600' />
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
      <div className='space-y-4'>
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>Total Amount:</span>
            <span className='font-medium text-foreground'>
              {formatCurrency(financialData.totalAmount)}
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
          {student.scholarship_name && totalScholarshipPercentage > 0 && (
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Scholarship:
              </span>
              <span className='font-medium text-blue-400'>
                {student.scholarship_name} ({totalScholarshipPercentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
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
        </div>
      </div>
      <Separator className='bg-border' />

      {/* Communication Preferences */}
      <div className='mt-4'>
        <CommunicationPreferences studentId={student.student_id} />
      </div>
    </>
  );
};
