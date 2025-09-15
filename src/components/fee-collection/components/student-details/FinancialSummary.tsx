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
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { supabase } from '@/integrations/supabase/client';
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
  paymentEngineBreakdown?: {
    overallSummary?: {
      totalScholarship?: number;
      totalProgramFee?: number;
      totalAmountPayable?: number;
    };
  };
}

// Use the centralized progress calculation result
type CalculatedFinancialData = ProgressCalculationResult & {
  overdueAmount: number;
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  student,
  feeStructure,
  paymentEngineBreakdown,
}) => {
  const [totalScholarshipPercentage, setTotalScholarshipPercentage] =
    useState<number>(0);
  const [scholarshipAmount, setScholarshipAmount] = useState<number>(0);
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

        // Try to fetch payment engine breakdown if student has a payment plan
        let paymentEngineScholarshipAmount = 0;
        if (
          student.payment_plan &&
          student.payment_plan !== 'not_selected' &&
          student.student?.cohort_id
        ) {
          try {
            console.log(
              '🔍 [FinancialSummary] Fetching payment engine breakdown for student:',
              {
                student_id: student.student_id,
                cohort_id: student.student.cohort_id,
                payment_plan: student.payment_plan,
              }
            );

            // Get additional discount percentage - payment engine needs this explicitly
            let additionalDiscountPercentage = 0;

            // First get the scholarship_id from student_payments (payment engine will do this too)
            const { data: sp } = await supabase
              .from('student_payments')
              .select('scholarship_id')
              .eq('student_id', student.student_id)
              .eq('cohort_id', student.student.cohort_id)
              .maybeSingle();

            const scholarshipId = sp?.scholarship_id;

            // Get additional discount from student_scholarships if scholarship exists
            if (scholarshipId) {
              const { data: scholarship } = await supabase
                .from('student_scholarships')
                .select('additional_discount_percentage')
                .eq('student_id', student.student_id)
                .eq('scholarship_id', scholarshipId)
                .maybeSingle();

              if (scholarship?.additional_discount_percentage) {
                additionalDiscountPercentage =
                  scholarship.additional_discount_percentage;
              }
            }

            console.log('🔍 [FinancialSummary] Scholarship parameters:', {
              student_id: student.student_id,
              scholarshipId,
              additionalDiscountPercentage,
            });

            // Let the payment engine handle everything automatically:
            // - Custom fee structures (if student has one)
            // - Cohort fee structures (as fallback)
            // - Base scholarships (automatic via scholarshipId lookup)
            // - Need-based scholarships (via additionalDiscountPercentage)
            const { breakdown } = await getFullPaymentView({
              studentId: student.student_id,
              cohortId: student.student.cohort_id,
              paymentPlan: student.payment_plan as
                | 'one_shot'
                | 'sem_wise'
                | 'instalment_wise',
              additionalDiscountPercentage, // ✅ Need to pass this explicitly
              // Don't pass feeStructureData - let payment engine load the correct structure
              // Don't pass scholarshipId - payment engine will fetch it automatically
            });

            if (breakdown?.overallSummary?.totalScholarship) {
              paymentEngineScholarshipAmount =
                breakdown.overallSummary.totalScholarship;
              const totalProgramFee =
                breakdown.overallSummary.totalProgramFee || 0;
              const scholarshipPercentage =
                totalProgramFee > 0
                  ? (paymentEngineScholarshipAmount / totalProgramFee) * 100
                  : 0;

              setScholarshipAmount(paymentEngineScholarshipAmount);
              setTotalScholarshipPercentage(scholarshipPercentage);

              console.log(
                '🔍 [FinancialSummary] Using payment engine scholarship data:',
                {
                  student_id: student.student_id,
                  scholarshipAmount: paymentEngineScholarshipAmount,
                  totalProgramFee,
                  scholarshipPercentage,
                  breakdown_summary: breakdown.overallSummary,
                }
              );
            } else {
              console.log(
                '🔍 [FinancialSummary] No scholarship data in payment engine response'
              );
            }
          } catch (error) {
            console.warn(
              '🔍 [FinancialSummary] Failed to fetch payment engine breakdown:',
              error
            );
          }
        }

        // Use payment engine breakdown data if available (prop-based - for future use)
        if (paymentEngineBreakdown?.overallSummary?.totalScholarship) {
          const scholarshipAmount =
            paymentEngineBreakdown.overallSummary.totalScholarship;
          const totalProgramFee =
            paymentEngineBreakdown.overallSummary.totalProgramFee || 0;
          const scholarshipPercentage =
            totalProgramFee > 0
              ? (scholarshipAmount / totalProgramFee) * 100
              : 0;

          setScholarshipAmount(scholarshipAmount);
          setTotalScholarshipPercentage(scholarshipPercentage);

          console.log(
            '🔍 [FinancialSummary] Using payment engine scholarship data (prop):',
            {
              student_id: student.student_id,
              scholarshipAmount,
              totalProgramFee,
              scholarshipPercentage,
            }
          );
        } else if (
          paymentEngineScholarshipAmount === 0 &&
          student.scholarship_id &&
          feeStructure
        ) {
          // Only fallback to client-side calculation if payment engine failed AND we have the necessary data
          console.log(
            '🔍 [FinancialSummary] Falling back to client-side calculation'
          );

          const totalPercentage = await getTotalDiscountPercentage(
            student.student_id,
            student.scholarship_id
          );
          setTotalScholarshipPercentage(totalPercentage);

          // Calculate scholarship amount from percentage using cohort fee structure
          const totalProgramFee = feeStructure.total_program_fee || 0;
          const calculatedScholarshipAmount =
            (totalProgramFee * totalPercentage) / 100;
          setScholarshipAmount(calculatedScholarshipAmount);

          console.log(
            '🔍 [FinancialSummary] Using calculated scholarship data (fallback):',
            {
              student_id: student.student_id,
              totalPercentage,
              totalProgramFee,
              calculatedScholarshipAmount,
              note: 'This might not account for custom fee structures',
            }
          );
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
  }, [student, feeStructure, paymentEngineBreakdown, calculateFinancialData]);

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
            <div className='space-y-1'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Scholarship:
                </span>
                <span className='font-medium text-blue-400'>
                  {student.scholarship_name} (
                  {totalScholarshipPercentage.toFixed(1)}%)
                </span>
              </div>
              {scholarshipAmount > 0 && (
                <div className='flex justify-between items-center'>
                  <span className='text-xs text-muted-foreground pl-2'>
                    Amount:
                  </span>
                  <span className='text-xs font-medium text-green-400'>
                    {formatCurrency(scholarshipAmount)}
                  </span>
                </div>
              )}
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
