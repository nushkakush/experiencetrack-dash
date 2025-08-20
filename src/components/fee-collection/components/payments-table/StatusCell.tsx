import React from 'react';
import { TableCell } from '@/components/ui/table';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { StudentPaymentSummary, PaymentType, PaymentStatus } from '@/types/fee';
import { getOverallStatusDisplay } from '@/utils/paymentStatusUtils';

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

    // Use the aggregate status from payment engine if available
    if ((student as any).aggregate_status) {
      const aggregateStatus = (student as any).aggregate_status as string;
      return getOverallStatusDisplay(aggregateStatus);
    }

    // Fallback to old logic if aggregate_status is not available
    const actualPayments = student.payments || [];
    
    // If no payments exist yet, show pending
    if (actualPayments.length === 0) {
      return { status: 'pending', text: 'Payments Pending' };
    }

    // Check for overdue payments first (highest priority)
    const hasOverdue = actualPayments.some(p => {
      const status = p.status as unknown as string;
      return status === 'overdue' || status.endsWith('_overdue');
    });

    if (hasOverdue) {
      return { status: 'overdue' as const, text: 'Payments Overdue' };
    }

    // Check for verification pending
    const hasVerificationPending = actualPayments.some(p => {
      const status = p.status as unknown as string;
      return status === 'verification_pending' || status.includes('verification_pending');
    });

    if (hasVerificationPending) {
      return { status: 'verification_pending' as const, text: 'Verification Pending' };
    }

    // Check for paid payments
    const paidPayments = actualPayments.filter(p => p.status === 'paid');
    if (paidPayments.length === actualPayments.length) {
      return { status: 'paid' as const, text: 'All Payments Complete' };
    }

    // Check for partially paid
    if (paidPayments.length > 0) {
      return { status: 'pending' as const, text: 'Partially Paid' };
    }

    // Default to pending
    return { status: 'pending' as const, text: 'Payments Pending' };
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
