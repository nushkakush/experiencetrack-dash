import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary, PaymentType } from '@/types/fee';

interface FeeStructureData {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  start_date?: string;
}

interface NextDuePayment {
  payment_type: PaymentType;
  due_date: string;
  amount_payable: number;
  isFirstPayment?: boolean;
}

interface NextDueCellProps {
  student: StudentPaymentSummary;
  feeStructure?: FeeStructureData;
}

export const NextDueCell: React.FC<NextDueCellProps> = ({
  student,
  feeStructure,
}) => {
  console.log('🔍 [NextDueCell] Component rendered with:', {
    student_id: student.student_id,
    payment_plan: student.payment_plan,
    total_amount: student.total_amount,
    paid_amount: student.paid_amount,
    has_payment_engine_breakdown: !!(
      student as { payment_engine_breakdown?: unknown }
    ).payment_engine_breakdown,
    payment_engine_breakdown: (
      student as { payment_engine_breakdown?: unknown }
    ).payment_engine_breakdown,
  });
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPaymentTypeDisplay = (
    paymentType: PaymentType,
    paymentPlan?: string,
    nextDue?: NextDuePayment
  ) => {
    // For one-shot payments, show "Program Fee"
    if (paymentPlan === 'one_shot') {
      return 'Program Fee';
    }

    // For installment-wise payments, try to show installment number
    if (paymentPlan === 'instalment_wise') {
      // If we have installment information in the payment object, use it
      if (
        nextDue &&
        'installment_number' in nextDue &&
        nextDue.installment_number
      ) {
        return `Installment ${nextDue.installment_number}`;
      }
      return 'Installment';
    }

    // For semester-wise payments, try to show semester number
    if (paymentPlan === 'sem_wise') {
      if (nextDue && 'semester_number' in nextDue && nextDue.semester_number) {
        return `Semester ${nextDue.semester_number}`;
      }
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

  const getNextDuePayment = (student: StudentPaymentSummary) => {
    // If student hasn't selected a payment plan, show the first payment date from fee structure
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      if (feeStructure && feeStructure.start_date) {
        return {
          payment_type: 'admission_fee' as PaymentType,
          due_date: feeStructure.start_date,
          amount_payable: feeStructure.admission_fee || 0,
          isFirstPayment: true,
        } as NextDuePayment; // Type assertion to handle the additional property
      }
      return null;
    }

    // FIXED: Use payment engine breakdown if available (more accurate)
    if (
      (student as { payment_engine_breakdown?: unknown })
        .payment_engine_breakdown
    ) {
      const paymentEngineData = (
        student as { payment_engine_breakdown?: unknown }
      ).payment_engine_breakdown as { breakdown?: any; aggregate?: any };

      // Extract the actual breakdown from the payment engine data
      const breakdown = paymentEngineData?.breakdown;

      console.log('🔍 [NextDueCell] Using payment engine breakdown:', {
        student_id: student.student_id,
        payment_plan: student.payment_plan,
        has_payment_engine_data: !!paymentEngineData,
        has_breakdown: !!breakdown,
        has_semesters: !!(
          breakdown?.semesters && Array.isArray(breakdown.semesters)
        ),
        semesters_count: breakdown?.semesters?.length || 0,
        paymentEngineData,
        breakdown: breakdown,
      });

      // Find the next pending installment from the breakdown
      if (breakdown?.semesters && Array.isArray(breakdown.semesters)) {
        for (const semester of breakdown.semesters) {
          if (semester.instalments && Array.isArray(semester.instalments)) {
            for (const installment of semester.instalments) {
              console.log('🔍 [NextDueCell] Checking installment:', {
                semester_number: semester.semesterNumber,
                installment_number: installment.installmentNumber,
                status: installment.status,
                amountPayable: installment.amountPayable,
                amountPending: installment.amountPending,
                amountPaid: installment.amountPaid,
              });

              // Check if this installment is pending (not paid) and has pending amount
              if (
                installment.status !== 'paid' &&
                (installment.amountPending > 0 || installment.amountPayable > 0)
              ) {
                console.log('🔍 [NextDueCell] Found next due installment:', {
                  semester_number: semester.semesterNumber,
                  installment_number: installment.installmentNumber,
                  amount_payable: installment.amountPayable,
                  due_date: installment.paymentDate,
                });

                return {
                  payment_type: 'program_fee' as PaymentType,
                  due_date:
                    installment.paymentDate ||
                    new Date().toISOString().split('T')[0],
                  amount_payable:
                    installment.amountPayable || installment.amountPending,
                  installment_number: installment.installmentNumber,
                  semester_number: semester.semesterNumber,
                };
              }
            }
          }
        }
      }
    }

    // For installment-wise payments, we need to determine which installment is next
    if (student.payment_plan === 'instalment_wise') {
      console.log(
        '🔍 [NextDueCell] Using fallback logic for installment-wise:',
        {
          student_id: student.student_id,
          payment_plan: student.payment_plan,
          total_paid: student.paid_amount,
          total_amount: student.total_amount,
          has_payment_schedule: !!student.payment_schedule,
          payment_schedule: student.payment_schedule,
        }
      );

      // Calculate which installment should be next based on total paid amount
      const totalPaid = Number(student.paid_amount) || 0;
      const totalPayable = Number(student.total_amount) || 0;
      const scheduleInstallments = Array.isArray(
        student.payment_schedule?.installments
      )
        ? student.payment_schedule!.installments.length
        : 12; // default to 12 when unknown
      const totalInstallments = Math.max(1, scheduleInstallments);
      const installmentAmount =
        totalInstallments > 0 ? totalPayable / totalInstallments : 0;

      console.log('🔍 [NextDueCell] Fallback calculation:', {
        totalPaid,
        totalPayable,
        totalInstallments,
        installmentAmount,
        scheduleInstallments,
      });

      if (!isFinite(installmentAmount) || installmentAmount <= 0) {
        const today = new Date();
        return {
          payment_type: 'program_fee' as PaymentType,
          due_date: today.toISOString().split('T')[0],
          amount_payable: 0,
          installment_number: 1,
        };
      }

      const completedInstallments = Math.floor(totalPaid / installmentAmount);
      const nextInstallmentNumber = Math.min(
        totalInstallments,
        Math.max(1, completedInstallments + 1)
      );

      // Use payment schedule if available
      if (Array.isArray(student.payment_schedule?.installments)) {
        const nextInstallment =
          student.payment_schedule!.installments[nextInstallmentNumber - 1];
        if (nextInstallment && nextInstallment.due_date) {
          return {
            payment_type: 'program_fee' as PaymentType,
            due_date: nextInstallment.due_date,
            amount_payable: Number(nextInstallment.amount) || installmentAmount,
            installment_number:
              nextInstallment.installment_number || nextInstallmentNumber,
          };
        }
      }

      // Fallback calculation with guard against invalid dates
      const nextDueDate = new Date();
      if (isFinite(nextInstallmentNumber)) {
        nextDueDate.setMonth(
          nextDueDate.getMonth() + (nextInstallmentNumber - 1)
        );
      }
      const dueDateStr = isNaN(nextDueDate.getTime())
        ? new Date().toISOString().split('T')[0]
        : nextDueDate.toISOString().split('T')[0];

      return {
        payment_type: 'program_fee' as PaymentType,
        due_date: dueDateStr,
        amount_payable: installmentAmount,
        installment_number: nextInstallmentNumber,
      };
    }

    // Find the next pending payment for other payment plans
    const pendingPayments = student.payments?.filter(p => {
      if (
        p.status !== 'pending' &&
        p.status !== 'overdue' &&
        p.status !== 'partially_paid_overdue'
      )
        return false;
      if (!p.due_date) return false;
      const t = new Date(p.due_date).getTime();
      return !isNaN(t);
    });

    if (!pendingPayments || pendingPayments.length === 0) return null;

    return pendingPayments.sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0];
  };

  const nextDue = getNextDuePayment(student);

  // Show "-" if payment setup is still required (no payment plan selected)
  if (!student.payment_plan || student.payment_plan === 'not_selected') {
    return (
      <TableCell>
        <span className='text-muted-foreground'>-</span>
      </TableCell>
    );
  }

  return (
    <TableCell>
      {nextDue ? (
        <div>
          <div className='font-medium'>
            {getPaymentTypeDisplay(
              nextDue.payment_type,
              student.payment_plan,
              nextDue
            )}
            {nextDue.isFirstPayment && (
              <span className='text-xs text-muted-foreground ml-1'>
                (First Payment)
              </span>
            )}
          </div>
          <div className='text-sm text-muted-foreground'>
            {formatDate(nextDue.due_date)}
          </div>
          <div className='text-sm font-medium'>
            {formatCurrency(nextDue.amount_payable)}
          </div>
        </div>
      ) : (
        <span className='text-muted-foreground'>No pending payments</span>
      )}
    </TableCell>
  );
};
