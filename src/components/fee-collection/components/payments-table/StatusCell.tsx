import React from 'react';
import { TableCell } from '@/components/ui/table';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { StudentPaymentSummary, PaymentType, PaymentStatus } from '@/types/fee';

interface StatusCellProps {
  student: StudentPaymentSummary;
}

export const StatusCell: React.FC<StatusCellProps> = ({ student }) => {
  const getPaymentTypeDisplay = (
    paymentType: PaymentType,
    paymentPlan?: string
  ) => {
    // For one-shot payments, show "Program Fee"
    if (paymentPlan === 'one_shot') {
      return 'Program Fee';
    }

    // For installment-wise payments
    if (paymentPlan === 'instalment_wise') {
      return 'Installment';
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
    // Check if student has selected a payment plan
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return { status: 'pending', text: 'Payment Setup Required' };
    }

    // Calculate expected number of payments based on payment plan
    // Note: This is a simplified calculation - the actual payment engine has more complex logic
    const getExpectedPaymentCount = () => {
      if (student.payment_plan === 'one_shot') {
        return 1;
      } else if (student.payment_plan === 'sem_wise') {
        // Assuming 4 semesters (should ideally get from fee structure)
        return 4;
      } else if (student.payment_plan === 'instalment_wise') {
        // Assuming 4 semesters × 3 installments = 12 (should ideally get from fee structure)
        return 12;
      }
      // Fallback to actual payments count if plan is unknown
      return student.payments?.length || 0;
    };

    const expectedPayments = getExpectedPaymentCount();
    const actualPayments = student.payments || [];
    const completedPayments = actualPayments.filter(
      p => p.status === 'paid'
    ).length;
    const pendingPayments = actualPayments.filter(
      p => p.status === 'pending'
    ).length;

    // If no payments exist yet, show pending
    if (actualPayments.length === 0) {
      return { status: 'pending', text: 'Payments Pending' };
    }

    // Calculate status based on expected vs completed payments
    if (completedPayments >= expectedPayments) {
      return { status: 'paid' as const, text: 'All Payments Complete' };
    } else if (completedPayments > 0) {
      // Partially paid: show pending badge with progress text
      return {
        status: 'pending' as const,
        text: `${completedPayments}/${expectedPayments} Paid`,
      };
    } else {
      return { status: 'pending' as const, text: `${pendingPayments} Pending` };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <TableCell>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <PaymentStatusBadge status={overallStatus.status} />
          <span className='text-xs text-muted-foreground'>
            {overallStatus.text}
          </span>
        </div>
      </div>
    </TableCell>
  );
};
