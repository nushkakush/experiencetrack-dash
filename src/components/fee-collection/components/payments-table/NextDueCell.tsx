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

    // For installment-wise payments, we need to determine which installment is next
    if (student.payment_plan === 'instalment_wise') {
      // Calculate which installment should be next based on total paid amount
      const totalPaid = student.paid_amount;
      const totalPayable = student.total_amount;
      const installmentAmount = totalPayable / 12; // Assuming 12 installments
      const completedInstallments = Math.floor(totalPaid / installmentAmount);
      const nextInstallmentNumber = completedInstallments + 1;

      // Use payment schedule if available
      if (student.payment_schedule && student.payment_schedule.installments) {
        const nextInstallment =
          student.payment_schedule.installments[nextInstallmentNumber - 1];
        if (nextInstallment) {
          return {
            payment_type: 'program_fee' as PaymentType,
            due_date: nextInstallment.due_date,
            amount_payable: nextInstallment.amount,
            installment_number: nextInstallment.installment_number,
          };
        }
      }

      // Fallback calculation
      const nextInstallmentAmount = installmentAmount;
      const nextDueDate = new Date();
      nextDueDate.setMonth(
        nextDueDate.getMonth() + (nextInstallmentNumber - 1)
      );

      return {
        payment_type: 'program_fee' as PaymentType,
        due_date: nextDueDate.toISOString().split('T')[0],
        amount_payable: nextInstallmentAmount,
        installment_number: nextInstallmentNumber,
      };
    }

    // Find the next pending payment for other payment plans
    const pendingPayments = student.payments?.filter(
      p =>
        p.status === 'pending' ||
        p.status === 'overdue' ||
        p.status === 'partially_paid_overdue'
    );

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
