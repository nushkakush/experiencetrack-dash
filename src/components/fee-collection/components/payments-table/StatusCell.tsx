import React, { useEffect, useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { CreditCard } from 'lucide-react';
import { PaymentStatus } from '@/types/payments/PaymentStatus';
import { StudentPaymentSummary } from '@/types/fee';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';

interface StatusCellProps {
  student: StudentPaymentSummary;
  feeStructure?: any;
}

export const StatusCell: React.FC<StatusCellProps> = ({ student, feeStructure }) => {
  const [partialPaymentInfo, setPartialPaymentInfo] = useState<{
    hasPartialPayments: boolean;
    latestSequence: number;
    totalAmount: number;
    paidAmount: number;
    expectedAmount: number;
  }>({
    hasPartialPayments: false,
    latestSequence: 0,
    totalAmount: 0,
    paidAmount: 0,
    expectedAmount: 0,
  });

  // Calculate expected amount based on payment plan and fee structure
  const calculateExpectedAmount = async (): Promise<number> => {
    try {
      console.log('🔍 [StatusCell] Calculating expected amount with data:', {
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        hasFeeStructure: !!feeStructure,
        feeStructureKeys: feeStructure ? Object.keys(feeStructure) : []
      });

      if (student.student_id && student.student?.cohort_id && student.payment_plan && feeStructure) {
        try {
          // Import the payment engine client
          const { getFullPaymentView } = await import('@/services/payments/paymentEngineClient');
          
          // Get payment breakdown from payment engine
          const { breakdown } = await getFullPaymentView({
            studentId: String(student.student_id),
            cohortId: String(student.student?.cohort_id),
            paymentPlan: student.payment_plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
            feeStructureData: {
              total_program_fee: feeStructure.total_program_fee,
              admission_fee: feeStructure.admission_fee,
              number_of_semesters: feeStructure.number_of_semesters,
              instalments_per_semester: feeStructure.instalments_per_semester,
              one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
              one_shot_dates: feeStructure.one_shot_dates,
              sem_wise_dates: feeStructure.sem_wise_dates,
              instalment_wise_dates: feeStructure.instalment_wise_dates,
            }
          });

          console.log('🔍 [StatusCell] Payment engine breakdown:', breakdown);

          // Extract the expected amount based on payment plan
          if (student.payment_plan === 'one_shot' && breakdown.oneShotPayment) {
            const amount = breakdown.oneShotPayment.amountPayable;
            console.log('🔍 [StatusCell] One-shot payment amount:', amount);
            return amount;
          } else if (student.payment_plan === 'sem_wise' && breakdown.semesters?.length > 0) {
            // For semester-wise, get the first semester's amount as they're typically equal
            const amount = breakdown.semesters[0].total.totalPayable;
            console.log('🔍 [StatusCell] Semester-wise payment amount:', amount);
            return amount;
          } else if (student.payment_plan === 'instalment_wise' && breakdown.semesters?.length > 0) {
            // For installment-wise, get the first installment amount
            const firstInstallment = breakdown.semesters[0]?.instalments?.[0];
            if (firstInstallment) {
              const amount = firstInstallment.amountPayable;
              console.log('🔍 [StatusCell] Installment-wise payment amount:', amount);
              return amount;
            }
          }
        } catch (paymentEngineError) {
          console.warn('Failed to get amount from payment engine, falling back to calculation:', paymentEngineError);
        }
      }

      // Fallback: Simple calculation if payment engine fails
      if (feeStructure && student.payment_plan) {
        let calculatedAmount = 0;
        
        if (student.payment_plan === 'one_shot') {
          calculatedAmount = (feeStructure.total_program_fee - feeStructure.admission_fee) * 
                 (1 - feeStructure.one_shot_discount_percentage / 100);
        } else if (student.payment_plan === 'sem_wise') {
          calculatedAmount = (feeStructure.total_program_fee - feeStructure.admission_fee) / 
                 feeStructure.number_of_semesters;
        } else if (student.payment_plan === 'instalment_wise') {
          const totalInstallments = feeStructure.number_of_semesters * feeStructure.instalments_per_semester;
          calculatedAmount = (feeStructure.total_program_fee - feeStructure.admission_fee) / totalInstallments;
        }
        
        console.log('🔍 [StatusCell] Fallback calculation amount:', calculatedAmount);
        return calculatedAmount;
      }
      
      // If we still don't have an amount, try to use a reasonable fallback
      // Don't use the first payment amount as it might be a partial payment
      // Instead, look for a standard installment amount pattern
      if (student.payments && student.payments.length > 0) {
        // For installment-wise payments, try to estimate the expected amount
        // Look for the largest single payment as it's likely closer to the full installment
        const paymentAmounts = student.payments
          .map(p => (p as any).amount)
          .filter(amount => amount && Number.isFinite(amount))
          .sort((a, b) => b - a); // Sort descending
        
        if (paymentAmounts.length > 0) {
          const largestPayment = paymentAmounts[0];
          console.log('🔍 [StatusCell] Using largest payment amount as fallback:', largestPayment);
          return largestPayment;
        }
      }
      
      console.warn('🔍 [StatusCell] Could not calculate expected amount, returning 0');
      return 0;
    } catch (error) {
      console.error('Error calculating expected amount:', error);
      return 0;
    }
  };

  // Fetch partial payment information when component mounts
  useEffect(() => {
    const fetchPartialPaymentInfo = async () => {
      if (!student.student_id || !(student as any).student_payment_id) return;

      try {
        console.log('🔍 [StatusCell] Fetching partial payment info for student:', {
          studentId: student.student_id,
          studentPaymentId: (student as any).student_payment_id
        });

        const result = await paymentTransactionService.getByPaymentId(
          (student as any).student_payment_id
        );

        if (result.success && result.data) {
          const transactions = result.data as PaymentTransactionRow[];
          
          console.log('🔍 [StatusCell] Retrieved transactions:', transactions.map(t => ({
            id: t.id,
            amount: t.amount,
            status: t.verification_status,
            partial_sequence: t.partial_payment_sequence
          })));
          
          // Look for transactions with partial_payment_sequence
          const partialTransactions = transactions.filter(t => 
            t.partial_payment_sequence &&
            t.partial_payment_sequence > 0
          );

          console.log('🔍 [StatusCell] Transactions with partial sequence found:', partialTransactions.length);

          // Calculate expected amount
          const expectedAmount = await calculateExpectedAmount();
          console.log('🔍 [StatusCell] Calculated expected amount:', expectedAmount);

          if (partialTransactions.length > 0) {
            // Find the latest partial payment sequence
            const latestPartial = partialTransactions.reduce((latest, current) => 
              current.partial_payment_sequence! > latest.partial_payment_sequence! ? current : latest
            );

            // Calculate total amounts
            const totalAmount = partialTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            const paidAmount = partialTransactions
              .filter(t => t.verification_status === 'approved' || t.verification_status === 'partially_approved')
              .reduce((sum, t) => sum + (t.amount || 0), 0);

            console.log('🔍 [StatusCell] Partial payment calculations:', {
              totalAmount,
              paidAmount,
              expectedAmount,
              latestSequence: latestPartial.partial_payment_sequence,
              partialTransactionsCount: partialTransactions.length
            });

            setPartialPaymentInfo({
              hasPartialPayments: true,
              latestSequence: latestPartial.partial_payment_sequence!,
              totalAmount,
              paidAmount,
              expectedAmount,
            });
          } else {
            console.log('🔍 [StatusCell] No partial transactions found');
            setPartialPaymentInfo({
              hasPartialPayments: false,
              latestSequence: 0,
              totalAmount: 0,
              paidAmount: 0,
              expectedAmount,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching partial payment info:', error);
      }
    };

    fetchPartialPaymentInfo();
  }, [student.student_id, (student as any).student_payment_id, feeStructure]);

  const getPaymentTypeLabel = (paymentType: string, paymentPlan: string) => {
    // For one-shot payments
    if (paymentPlan === 'one_shot') {
      return 'One Shot Payment';
    }

    // For semester-wise payments
    if (paymentPlan === 'sem_wise') {
      return 'Semester Fee';
    }

    // Default cases
    switch (paymentType) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'program_fee':
        return 'Program Fee';
      default:
        return 'Payment';
    }
  };

  const getOverallStatus = (): { status: PaymentStatus; text: string } => {
    console.log('🔍 [StatusCell] getOverallStatus called with student data:', {
      studentId: student.student_id,
      paymentPlan: student.payment_plan,
      aggregateStatus: (student as any).aggregate_status,
      paymentsCount: student.payments?.length || 0,
      payments: student.payments?.map(p => ({
        status: p.status,
        amount: (p as any).amount
      }))
    });

    // Check if student has selected a payment plan
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      console.log('🔍 [StatusCell] No payment plan selected, returning pending');
      return { status: 'pending', text: 'Payment Setup Required' };
    }

    // FIXED: Payment engine now correctly calculates status
    // No override logic needed - payment engine handles partial payment logic correctly
    console.log('🔍 [StatusCell] Using payment engine status (fixed):', {
      aggregateStatus: (student as any).aggregate_status
    });

    // Use the aggregate status from payment engine if available
    if ((student as any).aggregate_status) {
      const aggregateStatus = (student as any).aggregate_status as string;
      console.log('🔍 [StatusCell] Using aggregate status from payment engine:', aggregateStatus);
      return getOverallStatusDisplay(aggregateStatus);
    }

    // Fallback to old logic if aggregate_status is not available
    const actualPayments = student.payments || [];
    
    console.log('🔍 [StatusCell] Using fallback logic with payments:', actualPayments);
    
    // If no payments exist yet, show pending
    if (actualPayments.length === 0) {
      console.log('🔍 [StatusCell] No payments exist, returning pending');
      return { status: 'pending', text: 'Payments Pending' };
    }

    // Check for overdue payments first (highest priority)
    const hasOverdue = actualPayments.some(p => {
      const status = p.status as unknown as string;
      return status === 'overdue' || status.endsWith('_overdue');
    });

    if (hasOverdue) {
      console.log('🔍 [StatusCell] Has overdue payments, returning overdue');
      return { status: 'overdue' as const, text: 'Payments Overdue' };
    }

    // Check for verification pending
    const hasVerificationPending = actualPayments.some(p => {
      const status = p.status as unknown as string;
      return status === 'verification_pending' || status.includes('verification_pending');
    });

    if (hasVerificationPending) {
      console.log('🔍 [StatusCell] Has verification pending, returning verification_pending');
      return { status: 'verification_pending' as const, text: 'Verification Pending' };
    }

    // Check for paid payments
            const paidPayments = actualPayments.filter(p => p.status === 'paid' || p.status === 'waived');
    console.log('🔍 [StatusCell] Payment status analysis:', {
      totalPayments: actualPayments.length,
      paidPayments: paidPayments.length,
      allPaid: paidPayments.length === actualPayments.length
    });

    if (paidPayments.length === actualPayments.length) {
      console.log('🔍 [StatusCell] All payments are paid, returning paid');
      return { status: 'paid' as const, text: 'All Payments Complete' };
    }

    // Check for partially paid
    if (paidPayments.length > 0) {
      console.log('🔍 [StatusCell] Some payments are paid, returning partially_paid');
      return { status: 'pending' as const, text: 'Partially Paid' };
    }

    // Default to pending
    console.log('🔍 [StatusCell] Default case, returning pending');
    return { status: 'pending' as const, text: 'Payments Pending' };
  };

  const getOverallStatusDisplay = (status: string): { status: PaymentStatus; text: string } => {
    console.log('🔍 [StatusCell] getOverallStatusDisplay called with status:', status);
    
    switch (status) {
      case 'pending':
        console.log('🔍 [StatusCell] Returning pending status');
        return { status: 'pending', text: 'Payments Pending' };
      case 'verification_pending':
        console.log('🔍 [StatusCell] Returning verification_pending status');
        return { status: 'verification_pending', text: 'Verification Pending' };
      case 'paid':
        console.log('🔍 [StatusCell] Returning paid status');
        return { status: 'paid', text: 'All Payments Complete' };
      case 'overdue':
        console.log('🔍 [StatusCell] Returning overdue status');
        return { status: 'overdue', text: 'Payments Overdue' };
      case 'partially_paid_verification_pending':
        console.log('🔍 [StatusCell] Returning partially_paid_verification_pending status');
        return { status: 'partially_paid_verification_pending', text: 'Partial Payment Under Review' };
      case 'partially_paid_days_left':
        console.log('🔍 [StatusCell] Returning partially_paid_days_left status');
        return { status: 'partially_paid_days_left', text: 'Partially Paid' };
      case 'partially_paid_overdue':
        console.log('🔍 [StatusCell] Returning partially_paid_overdue status');
        return { status: 'partially_paid_overdue', text: 'Partial Payment Overdue' };
      case 'pending_10_plus_days':
        console.log('🔍 [StatusCell] Returning pending_10_plus_days status');
        return { status: 'pending_10_plus_days', text: 'Payments Upcoming' };
      default:
        console.log('🔍 [StatusCell] Returning default pending status for unknown status:', status);
        return { status: 'pending', text: 'Payments Pending' };
    }
  };

  // Helper function to determine if payments are actually partial
  const isActuallyPartialPayment = () => {
    if (!partialPaymentInfo.hasPartialPayments) {
      console.log('🔍 [StatusCell] No partial payments detected');
      return false;
    }

    // If we have an expected amount, use it to determine if the payment is actually partial
    if (partialPaymentInfo.expectedAmount > 0) {
      // If the total amount equals or exceeds the expected amount, it's not actually partial
      if (partialPaymentInfo.totalAmount >= partialPaymentInfo.expectedAmount) {
        console.log('🔍 [StatusCell] Payment is complete (total >= expected):', {
          totalAmount: partialPaymentInfo.totalAmount,
          expectedAmount: partialPaymentInfo.expectedAmount,
          isComplete: partialPaymentInfo.totalAmount >= partialPaymentInfo.expectedAmount
        });
        return false;
      }
      
      // If the paid amount equals or exceeds the expected amount, it's not actually partial
      if (partialPaymentInfo.paidAmount >= partialPaymentInfo.expectedAmount) {
        console.log('🔍 [StatusCell] Payment is complete (paid >= expected):', {
          paidAmount: partialPaymentInfo.paidAmount,
          expectedAmount: partialPaymentInfo.expectedAmount,
          isComplete: partialPaymentInfo.paidAmount >= partialPaymentInfo.expectedAmount
        });
        return false;
      }
    } else {
      // Fallback: If expected amount is 0, use a simple heuristic
      // If there's only one transaction and it's a round number (like 117000), 
      // it's probably a complete payment
      const isRoundAmount = partialPaymentInfo.totalAmount % 1000 === 0 || 
                           partialPaymentInfo.totalAmount % 500 === 0;
      const isSingleTransaction = partialPaymentInfo.totalAmount === partialPaymentInfo.paidAmount || 
                                 partialPaymentInfo.paidAmount === 0;
      
      if (isRoundAmount && isSingleTransaction && partialPaymentInfo.totalAmount > 0) {
        console.log('🔍 [StatusCell] Payment appears to be complete (round amount, single transaction):', {
          totalAmount: partialPaymentInfo.totalAmount,
          isRoundAmount,
          isSingleTransaction
        });
        return false;
      }
    }

    // If the paid amount equals or exceeds the total amount, it's not actually partial
    if (partialPaymentInfo.paidAmount >= partialPaymentInfo.totalAmount) {
      console.log('🔍 [StatusCell] Payment is complete (paid >= total):', {
        paidAmount: partialPaymentInfo.paidAmount,
        totalAmount: partialPaymentInfo.totalAmount,
        isComplete: partialPaymentInfo.paidAmount >= partialPaymentInfo.totalAmount
      });
      return false;
    }

    // Check if there are multiple transactions and the total paid is less than expected
    const isPartial = partialPaymentInfo.paidAmount < partialPaymentInfo.totalAmount;
    console.log('🔍 [StatusCell] Payment analysis:', {
      paidAmount: partialPaymentInfo.paidAmount,
      totalAmount: partialPaymentInfo.totalAmount,
      expectedAmount: partialPaymentInfo.expectedAmount,
      isPartial,
      hasPartialPayments: partialPaymentInfo.hasPartialPayments,
      latestSequence: partialPaymentInfo.latestSequence
    });
    return isPartial;
  };

  const overallStatus = getOverallStatus();

  console.log('🔍 [StatusCell] Final overall status:', {
    status: overallStatus.status,
    text: overallStatus.text,
    hasPartialPayments: partialPaymentInfo.hasPartialPayments,
    isActuallyPartial: isActuallyPartialPayment()
  });

  return (
    <TableCell>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <PaymentStatusBadge status={overallStatus.status} />
        </div>
        
        {/* Show partial payment info if available and actually partial */}
        {partialPaymentInfo.hasPartialPayments && isActuallyPartialPayment() && (
          <div className='flex items-center gap-1'>
            <Badge
              variant='outline'
              className='text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50'
            >
              <CreditCard className='h-3 w-3 mr-1' />
              Partial Payment {partialPaymentInfo.latestSequence}
            </Badge>
          </div>
        )}
      </div>
    </TableCell>
  );
};
